import { Injectable } from '@nestjs/common'

@Injectable()
export class SessionResolutionService {
  resolveSessionKey(sessionId: string): string {
    return sessionId
  }
}
