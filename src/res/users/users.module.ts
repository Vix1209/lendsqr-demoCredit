import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { BlacklistModule } from '../blacklist/blacklist.module';
import { DatabaseModule } from 'src/db/knex.module';

@Module({
  imports: [BlacklistModule, DatabaseModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
