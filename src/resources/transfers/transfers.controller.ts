import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { Idempotent } from 'src/common/decorators/idempotent.decorator';
import { TransfersService } from './transfers.service';
import {
  CreateTransferDto,
  TransferHistoryQueryDto,
} from './dto/create-transfer.dto';
import { CreateTransferDocs, TransferHistoryDocs } from './docs/transfer.docs';
import { IdempotencyId } from 'src/common/decorators/idempotency-id.decorator';

@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Post()
  @CreateTransferDocs()
  @Idempotent()
  create(
    @Body() createTransferDto: CreateTransferDto,
    @IdempotencyId() idempotencyId: string,
  ) {
    createTransferDto.idempotency_key = idempotencyId;
    return this.transfersService.create(createTransferDto);
  }

  @Get()
  @TransferHistoryDocs()
  history(@Query() query: TransferHistoryQueryDto) {
    return this.transfersService.history(query);
  }
}
