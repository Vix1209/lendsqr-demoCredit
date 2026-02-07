import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { Idempotent } from 'src/common/decorators/idempotency/idempotent.decorator';
import { FundingService } from './funding.service';
import {
  CreateFundingDto,
  FundingHistoryQueryDto,
} from './dto/create-funding.dto';
import { CreateFundingDocs, FundingHistoryDocs } from './docs/funding.docs';
import { IdempotencyId } from 'src/common/decorators/idempotency/idempotency-id.decorator';

@Controller('funding')
export class FundingController {
  constructor(private readonly fundingService: FundingService) {}

  @Post()
  @CreateFundingDocs()
  @Idempotent()
  create(
    @Body() createFundingDto: CreateFundingDto,
    @IdempotencyId() idempotencyId: string,
  ) {
    createFundingDto.idempotency_key = idempotencyId;
    return this.fundingService.create(createFundingDto);
  }

  @Get()
  @FundingHistoryDocs()
  history(@Query() query: FundingHistoryQueryDto) {
    return this.fundingService.history(query);
  }
}
