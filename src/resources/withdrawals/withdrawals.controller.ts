import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { Idempotent } from 'src/common/decorators/idempotency/idempotent.decorator';
import { WithdrawalsService } from './withdrawals.service';
import {
  CreateWithdrawalDto,
  WithdrawalHistoryQueryDto,
} from './dto/create-withdrawal.dto';
import {
  CreateWithdrawalDocs,
  WithdrawalHistoryDocs,
} from './docs/withdrawal.docs';
import { IdempotencyId } from 'src/common/decorators/idempotency/idempotency-id.decorator';

@Controller('withdrawals')
export class WithdrawalsController {
  constructor(private readonly withdrawalsService: WithdrawalsService) {}

  @Post()
  @CreateWithdrawalDocs()
  @Idempotent()
  create(
    @Body() createWithdrawalDto: CreateWithdrawalDto,
    @IdempotencyId() idempotencyId: string,
  ) {
    createWithdrawalDto.idempotency_key = idempotencyId;
    return this.withdrawalsService.create(createWithdrawalDto);
  }

  @Get()
  @WithdrawalHistoryDocs()
  history(@Query() query: WithdrawalHistoryQueryDto) {
    return this.withdrawalsService.history(query);
  }
}
