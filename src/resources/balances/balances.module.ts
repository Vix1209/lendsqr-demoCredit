import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/knex.module';
import { BalancesService } from './balances.service';
import { BalancesController } from './balances.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [BalancesController],
  providers: [BalancesService],
})
export class BalancesModule {}
