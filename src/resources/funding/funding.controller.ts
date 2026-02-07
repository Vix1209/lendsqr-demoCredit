import { Controller, Post, Body } from '@nestjs/common';
import { Idempotent } from 'src/common/decorators/idempotent.decorator';
import { FundingService } from './funding.service';
import { CreateFundingDto } from './dto/create-funding.dto';
import { CreateFundingDocs } from './docs/funding.docs';
import { IdempotencyId } from 'src/common/decorators/idempotency-id.decorator';

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
}
