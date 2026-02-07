import { Controller, Get, Param } from '@nestjs/common';
import { BalancesService } from './balances.service';
import { GetBalanceByUserDocs } from './docs/balance.docs';

@Controller('balances')
export class BalancesController {
  constructor(private readonly balancesService: BalancesService) {}

  @Get(':userId')
  @GetBalanceByUserDocs()
  getByUser(@Param('userId') userId: string) {
    return this.balancesService.getByUserId(userId);
  }
}
