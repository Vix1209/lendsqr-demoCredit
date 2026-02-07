import { Controller, Post, Body } from '@nestjs/common';
import { Idempotent } from 'src/common/decorators/idempotent.decorator';
import { WithdrawalsService } from './withdrawals.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { CreateWithdrawalDocs } from './docs/withdrawal.docs';
import { IdempotencyId } from 'src/common/decorators/idempotency-id.decorator';

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
}
