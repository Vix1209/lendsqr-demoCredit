import { Module } from '@nestjs/common';
import { LedgerEntriesService } from './ledger-entries.service';
import { LedgerEntriesController } from './ledger-entries.controller';

@Module({
  controllers: [LedgerEntriesController],
  providers: [LedgerEntriesService],
})
export class LedgerEntriesModule {}
