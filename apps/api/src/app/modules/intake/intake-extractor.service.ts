import { Injectable } from '@nestjs/common';
import type { IntakeExtractedFields } from './intake.types';

@Injectable()
export class IntakeExtractorService {
  extract(text: string): IntakeExtractedFields {
    const lowered = text.toLowerCase();

    const phoneMatch =
      text.match(/(\+?\d[\d\s-]{7,}\d)/) ||
      text.match(/(08\d[\d\s-]{6,})/);

    const city = this.extractCity(lowered);
    const serviceType = this.extractServiceType(lowered);

    return {
      phone: phoneMatch?.[1]?.trim() ?? null,
      city,
      serviceType,
      summary: text.trim() || null,
    };
  }

  private extractCity(lowered: string): string | null {
    const knownCities = ['vidin', 'sofia', 'plovdiv', 'varna', 'montana'];
    const found = knownCities.find((c) => lowered.includes(c));
    return found ? this.capitalize(found) : null;
  }

  private extractServiceType(lowered: string): string | null {
    if (
      lowered.includes('електро') ||
      lowered.includes('electric') ||
      lowered.includes('wiring') ||
      lowered.includes('окабеляване')
    ) {
      return 'electrical';
    }

    if (
      lowered.includes('automation') ||
      lowered.includes('smart home') ||
      lowered.includes('автоматизация')
    ) {
      return 'automation';
    }

    if (
      lowered.includes('panel') ||
      lowered.includes('табло')
    ) {
      return 'panel';
    }

    return null;
  }

  private capitalize(v: string): string {
    return v.charAt(0).toUpperCase() + v.slice(1);
  }
}
