import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, ListUsersQueryDto } from './dto/create-user.dto';
import { CreateUserDocs, GetUserDocs, ListUsersDocs } from './docs/user.docs';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @CreateUserDocs()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ListUsersDocs()
  list(@Query() query: ListUsersQueryDto) {
    return this.usersService.list(query);
  }

  @Get(':id')
  @GetUserDocs()
  get(@Param('id') id: string) {
    return this.usersService.get(id);
  }
}
