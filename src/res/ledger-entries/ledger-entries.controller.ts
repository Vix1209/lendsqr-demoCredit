import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { LedgerEntriesService } from './ledger-entries.service';
import { CreateLedgerEntryDto } from './dto/create-ledger-entry.dto';
import { UpdateLedgerEntryDto } from './dto/update-ledger-entry.dto';

@Controller('ledger-entries')
export class LedgerEntriesController {
  constructor(private readonly ledgerEntriesService: LedgerEntriesService) {}

  @Post()
  create(@Body() createLedgerEntryDto: CreateLedgerEntryDto) {
    return this.ledgerEntriesService.create(createLedgerEntryDto);
  }

  @Get()
  findAll() {
    return this.ledgerEntriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ledgerEntriesService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateLedgerEntryDto: UpdateLedgerEntryDto,
  ) {
    return this.ledgerEntriesService.update(+id, updateLedgerEntryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ledgerEntriesService.remove(+id);
  }
}
