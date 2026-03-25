import { TrackingEventType } from '../../domain/tracking-event-type.enum'

export class TrackEventItemDto {
  type: TrackingEventType
  eventName?: string
  occurredAt: string

  pageUrl?: string
  pagePath?: string
  referrer?: string

  elementId?: string
  elementText?: string

  properties?: Record<string, any>
}

export class TrackEventsDto {
  siteKey: string
  visitorId: string
  sessionId: string
  events: TrackEventItemDto[]
}
