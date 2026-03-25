import { Injectable } from '@nestjs/common'
import { readFileSync } from 'fs'
import { join } from 'path'

@Injectable()
export class GetSdkService {
  getSdk(): string {
    return readFileSync(
      join(process.cwd(), 'apps/api/src/assets/analytics-sdk.js'),
      'utf-8',
    )
  }
}
