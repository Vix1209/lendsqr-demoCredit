import { Controller, Post, Body } from '@nestjs/common';
import { Idempotent } from 'src/common/decorators/idempotent.decorator';
import { FundingService } from './funding.service';
import { CreateFundingDto } from './dto/create-funding.dto';
import { CreateFundingDocs } from './docs/funding.docs';

@Controller('funding')
export class FundingController {
  constructor(private readonly fundingService: FundingService) {}

  @Post()
  @CreateFundingDocs()
  @Idempotent()
  create(@Body() createFundingDto: CreateFundingDto) {
    return this.fundingService.create(createFundingDto);
  }
}
