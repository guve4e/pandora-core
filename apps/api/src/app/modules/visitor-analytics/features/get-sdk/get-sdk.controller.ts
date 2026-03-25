import { Controller, Get, Header } from '@nestjs/common'

import { Public } from '../../../../core/common/lib/decorators/public.decorator'
import { GetSdkService } from './get-sdk.service'

@Controller('public/analytics')
export class GetSdkController {
  constructor(private readonly service: GetSdkService) {}

  @Public()
  @Get('sdk.js')
  @Header('Content-Type', 'application/javascript; charset=utf-8')
  getSdk() {
    return this.service.getSdk()
  }
}
