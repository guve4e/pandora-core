import { Module } from '@nestjs/common';
import { LeadCaptureService } from './lead-capture.service';

@Module({
  providers: [LeadCaptureService],
  exports: [LeadCaptureService],
})
export class LeadCaptureModule {}
