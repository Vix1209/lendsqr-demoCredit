import { Injectable } from '@nestjs/common';
import { CreateLedgerEntryDto } from './dto/create-ledger-entry.dto';
import { UpdateLedgerEntryDto } from './dto/update-ledger-entry.dto';

@Injectable()
export class LedgerEntriesService {
  create(_createLedgerEntryDto: CreateLedgerEntryDto) {
    return 'This action adds a new ledgerEntry';
  }

  findAll() {
    return `This action returns all ledgerEntries`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ledgerEntry`;
  }

  update(id: number, _updateLedgerEntryDto: UpdateLedgerEntryDto) {
    return `This action updates a #${id} ledgerEntry`;
  }

  remove(id: number) {
    return `This action removes a #${id} ledgerEntry`;
  }
}
