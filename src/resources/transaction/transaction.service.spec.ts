import { Test, TestingModule } from '@nestjs/testing';
import { TransactionService } from './transaction.service';
import { DatabaseService } from 'src/database/knex.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

describe('TransactionService', () => {
  let service: TransactionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        { provide: DatabaseService, useValue: {} },
        {
          provide: AuditLogsService,
          useValue: {
            createLog: jest.fn(),
            buildSystemLog: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
