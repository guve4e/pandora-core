import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../../../../db/pg.pool';

@Injectable()
export class EnrichIpService {
  private readonly logger = new Logger(EnrichIpService.name);

  constructor(
    @Inject(PG_POOL)
    private readonly pool: Pool,
  ) {}

  async enrichMissing(limit = 25) {
    const { rows } = await this.pool.query<{ ip_address: string }>(
      `
        select e.ip_address
        from analytics.tracking_events e
               left join analytics.tracking_ip_enrichments ip
                         on ip.ip_address = e.ip_address
        where e.ip_address is not null
          and ip.ip_address is null
          and e.ip_address <> ''
          and e.ip_address not like '10.%'
          and e.ip_address not like '192.168.%'
          and e.ip_address not like '127.%'
          and e.ip_address not like '::%'
          and e.ip_address <> '::1'
          and e.ip_address <> '0.0.0.0'
        group by e.ip_address
        order by max(e.created_at) desc
          limit $1
      `,
      [limit],
    );

    let enriched = 0;

    for (const row of rows) {
      try {
        await this.enrichIp(row.ip_address);
        enriched++;
      } catch (error) {
        this.logger.warn(
          `Failed to enrich IP ${row.ip_address}: ${String(error)}`,
        );
      }
    }

    return { checked: rows.length, enriched };
  }

  async enrichIp(ipAddress: string) {
    const token = process.env.IPINFO_TOKEN || '';

    const url = token
      ? `https://ipinfo.io/${encodeURIComponent(ipAddress)}?token=${encodeURIComponent(token)}`
      : `https://ipinfo.io/${encodeURIComponent(ipAddress)}/json`;

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`IPinfo failed: ${res.status}`);
    }

    const raw = await res.json();

    const loc = typeof raw.loc === 'string' ? raw.loc.split(',') : [];
    const latitude = loc[0] ? Number(loc[0]) : null;
    const longitude = loc[1] ? Number(loc[1]) : null;

    const isVpn =
      raw.privacy?.vpn === true ||
      raw.privacy?.relay === true ||
      raw.privacy?.tor === true;

    const isProxy =
      raw.privacy?.proxy === true || raw.privacy?.hosting === true;

    const org = raw.org ?? raw.as_name ?? '';

    const classification = this.classifyTraffic({
      org,
      isVpn,
      isProxy,
    });

    await this.pool.query(
      `
        insert into analytics.tracking_ip_enrichments (
          ip_address,
          country,
          region,
          city,
          postal,
          timezone,
          latitude,
          longitude,
          org,
          asn,
          is_vpn,
          is_proxy,
          traffic_type,
          traffic_score,
          traffic_reason,
          source,
          raw,
          enriched_at,
          updated_at
        )
        values (
                 $1, $2, $3, $4, $5, $6, $7, $8,
                 $9, $10, $11, $12, $13, $14, $15, 'ipinfo', $16::jsonb, now(), now()
               )
          on conflict (ip_address)
      do update set
          country = excluded.country,
                     region = excluded.region,
                     city = excluded.city,
                     postal = excluded.postal,
                     timezone = excluded.timezone,
                     latitude = excluded.latitude,
                     longitude = excluded.longitude,
                     org = excluded.org,
                     asn = excluded.asn,
                     is_vpn = excluded.is_vpn,
                     is_proxy = excluded.is_proxy,
                     traffic_type = excluded.traffic_type,
                     traffic_score = excluded.traffic_score,
                     traffic_reason = excluded.traffic_reason,
                     source = excluded.source,
                     raw = excluded.raw,
                     enriched_at = now(),
                     updated_at = now()
      `,
      [
        ipAddress,
        raw.country ?? null,
        raw.region ?? null,
        raw.city ?? null,
        raw.postal ?? null,
        raw.timezone ?? null,
        Number.isFinite(latitude) ? latitude : null,
        Number.isFinite(longitude) ? longitude : null,
        org || null,
        raw.asn ?? null,
        isVpn,
        isProxy,
        classification.type,
        classification.score,
        classification.reason,
        JSON.stringify(raw),
      ],
    );

    this.logger.log(
      `Enriched IP ${ipAddress}: ${raw.country ?? '??'} ${raw.city ?? '??'} ${org || 'unknown org'} -> ${classification.type}`,
    );

    return { success: true };
  }

  private classifyTraffic(input: {
    org: string;
    isVpn: boolean;
    isProxy: boolean;
  }): { type: string; score: number; reason: string } {
    const org = input.org.toLowerCase();

    const socialPreviewMarkers = [
      'facebook',
      'meta',
      'whatsapp',
      'telegram',
      'twitter',
      'x corp',
      'linkedin',
    ];

    const searchBotMarkers = [
      'google',
      'bing',
      'microsoft',
      'yandex',
      'duckduckgo',
      'apple inc',
    ];

    const hostingMarkers = [
      'amazon',
      'aws',
      'google cloud',
      'microsoft azure',
      'azure',
      'hetzner',
      'ovh',
      'digitalocean',
      'linode',
      'vultr',
      'contabo',
      'm247',
      'hostroyale',
      'leaseweb',
      'level 3',
      'cloudflare',
    ];

    const telecomMarkers = [
      'vivacom',
      'btk',
      'bulgarian telecommunications company',
      'a1',
      'a1 bulgaria',
      'mobiltel',
      'yettel',
      't-mobile',
      'vodafone',
      'orange',
      'telefonica',
      'vida optics',
    ];

    if (socialPreviewMarkers.some((marker) => org.includes(marker))) {
      return {
        type: 'social_preview',
        score: 30,
        reason: 'Social/media crawler or preview infrastructure',
      };
    }

    if (searchBotMarkers.some((marker) => org.includes(marker))) {
      return {
        type: 'search_bot',
        score: 35,
        reason: 'Search engine or platform crawler infrastructure',
      };
    }

    if (input.isVpn || input.isProxy) {
      return {
        type: 'suspicious',
        score: 40,
        reason: 'VPN/proxy/privacy network detected',
      };
    }

    if (hostingMarkers.some((marker) => org.includes(marker))) {
      return {
        type: 'datacenter',
        score: 45,
        reason: 'Hosting/datacenter network',
      };
    }

    if (telecomMarkers.some((marker) => org.includes(marker))) {
      return {
        type: 'likely_human',
        score: 85,
        reason: 'Consumer/mobile/ISP network',
      };
    }

    return {
      type: 'unknown',
      score: 60,
      reason: 'No strong classifier match',
    };
  }
}
