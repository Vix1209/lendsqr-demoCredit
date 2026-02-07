import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { LedgerEntriesService } from './ledger-entries.service';
import {
  GetLedgerEntryDocs,
  ListLedgerEntriesDocs,
} from './docs/ledger-entries.docs';

@Controller('ledger-entries')
export class LedgerEntriesController {
  constructor(private readonly ledgerEntriesService: LedgerEntriesService) {}

  @Get()
  @ListLedgerEntriesDocs()
  list(
    @Query('wallet_id') walletId?: string,
    @Query('user_id') userId?: string,
    @Query('txn_intent_id') txnIntentId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('from_date') fromDate?: string,
    @Query('to_date') toDate?: string,
  ) {
    const parsedLimit = limit ? Number(limit) : 50;
    const parsedOffset = offset ? Number(offset) : 0;

    if (Number.isNaN(parsedLimit) || parsedLimit <= 0) {
      throw new BadRequestException('limit must be a positive number');
    }

    if (Number.isNaN(parsedOffset) || parsedOffset < 0) {
      throw new BadRequestException('offset must be a non-negative number');
    }

    const parsedFromDate = fromDate
      ? this.parseDate(fromDate, 'from_date')
      : undefined;
    const parsedToDate = toDate ? this.parseDate(toDate, 'to_date') : undefined;

    const filters = [walletId, userId, txnIntentId].filter(Boolean);
    if (filters.length > 1) {
      throw new BadRequestException(
        'Provide only one of wallet_id, user_id, txn_intent_id',
      );
    }

    if (walletId) {
      return this.ledgerEntriesService.findByWallet(walletId, {
        limit: parsedLimit,
        offset: parsedOffset,
        fromDate: parsedFromDate,
        toDate: parsedToDate,
      });
    }

    if (userId) {
      return this.ledgerEntriesService.findByUser(userId, {
        limit: parsedLimit,
        offset: parsedOffset,
        fromDate: parsedFromDate,
        toDate: parsedToDate,
      });
    }

    if (txnIntentId) {
      return this.ledgerEntriesService.findByTxnIntent(txnIntentId, {
        limit: parsedLimit,
        offset: parsedOffset,
        fromDate: parsedFromDate,
        toDate: parsedToDate,
      });
    }

    return this.ledgerEntriesService.listAll({
      limit: parsedLimit,
      offset: parsedOffset,
    });
  }

  @Get(':ledger_id')
  @GetLedgerEntryDocs()
  get(@Param('ledger_id') ledgerId: string) {
    return this.ledgerEntriesService.findById(ledgerId);
  }

  private parseDate(value: string, label: string) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`${label} must be a valid date`);
    }
    return parsed;
  }
}
