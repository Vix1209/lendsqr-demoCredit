import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { Idempotent } from 'src/common/decorators/idempotent.decorator';
import { TransfersService } from './transfers.service';
import {
  CreateTransferDto,
  TransferHistoryQueryDto,
} from './dto/create-transfer.dto';
import { CreateTransferDocs, TransferHistoryDocs } from './docs/transfer.docs';

@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Post()
  @CreateTransferDocs()
  @Idempotent()
  create(@Body() createTransferDto: CreateTransferDto) {
    return this.transfersService.create(createTransferDto);
  }

  @Get()
  @TransferHistoryDocs()
  history(@Query() query: TransferHistoryQueryDto) {
    return this.transfersService.history(query);
  }
}
