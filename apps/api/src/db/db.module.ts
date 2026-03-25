import { Module } from '@nestjs/common'

import { pgPoolProvider } from './pg.pool'

@Module({
  providers: [pgPoolProvider],
  exports: [pgPoolProvider],
})
export class DbModule {}
