import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/knex.module';
import { LedgerEntriesController } from './ledger-entries.controller';
import { LedgerEntriesService } from './ledger-entries.service';

@Module({
  imports: [DatabaseModule],
  controllers: [LedgerEntriesController],
  providers: [LedgerEntriesService],
  exports: [LedgerEntriesService],
})
export class LedgerEntriesModule {}
