import { VisitorsController } from './features/stats/visitors.controller';
import { VisitorsService } from './features/stats/visitors.service';
import { DailyTrafficService } from './features/stats/daily-traffic.service';
import { DailyTrafficController } from './features/stats/daily-traffic.controller';
import { Module } from '@nestjs/common'

import { DbModule } from '../../../db/db.module'

import { TrackEventsController } from './features/track-events/track-events.controller'
import { TrackEventsService } from './features/track-events/track-events.service'
import { SessionResolutionService } from './shared/session-resolution.service'
import { GetSdkService } from './features/get-sdk/get-sdk.service'
import { GetSdkController } from './features/get-sdk/get-sdk.controller'
import { GetOverviewService } from './features/get-overview/get-overview.service'
import { GetOverviewController } from './features/get-overview/get-overview.controller'
import { StatsController } from './features/stats/stats.controller';
import { StatsService } from './features/stats/stats.service';

@Module({
  imports: [DbModule],
  controllers: [VisitorsController, DailyTrafficController,
    TrackEventsController,
    GetOverviewController,
    GetSdkController,
    StatsController,
  ],
  providers: [VisitorsService, DailyTrafficService,
    TrackEventsService,
    GetOverviewService,
    GetSdkService,
    SessionResolutionService,
    StatsService,
  ],
})
export class VisitorAnalyticsModule {}
