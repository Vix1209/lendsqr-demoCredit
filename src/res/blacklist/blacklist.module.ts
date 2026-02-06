import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BlacklistService } from './blacklist.service';

@Module({
  imports: [HttpModule],
  providers: [BlacklistService],
  exports: [BlacklistService],
})
export class BlacklistModule {}
