import { Controller, Post, Body } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { ExecuteTransactionDto } from './dto/execute-transaction.dto';

@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post('execute')
  execute(@Body() executeTransactionDto: ExecuteTransactionDto) {
    return this.transactionService.execute(executeTransactionDto);
  }
}
