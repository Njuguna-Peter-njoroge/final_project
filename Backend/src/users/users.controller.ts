import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from '../Dtos/createUser.dto';
import { UserFiltersDto } from '../Dtos/useefilter.dto';
import { ChangePasswordDto } from '../Dtos/changepassword.dto';
import { AccountStatus, UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorators';
import { UserResponseDto } from 'src/Dtos/userResponse';
import { JwtAuthGuard } from '../auth/Guards/auth.guards';
import { RolesGuard } from '../auth/Guards/role.guards';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  findAll(@Query() filters: UserFiltersDto) {
    if (
      filters.status ||
      filters.role ||
      filters.isVerified ||
      filters.search
    ) {
      return this.usersService.findWithFilters(filters);
    }
    return this.usersService.findAll();
  }
  @Get('by-email')
  @Roles('ADMIN')
  findByEmail(@Query('email') email: string) {
    return this.usersService.findByEmail(email);
  }

  @Post('create-or-get')
  async createOrGetUserByEmail(
    @Body() dto: CreateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.createOrGetUserByEmail(dto);
  }

  @Get('paginated')
  @Roles('ADMIN')
  findWithPagination(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    return this.usersService.findWithPagination(pageNum, limitNum);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Get('admin/all/public')
  async getAllUsersPublic() {
    return this.usersService.getAllUsers();
  }

  @Get(':id')
  @Roles('ADMIN')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id/password')
  @Roles(<UserRole>'ADMIN,USER')
  @HttpCode(HttpStatus.OK)
  changePassword(@Param('id') id: string, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(
      id,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Patch(':id/status/active')
  @Roles('ADMIN')
  reactivate(@Param('id') id: string) {
    return this.usersService.setStatus(id, AccountStatus.ACTIVE);
  }

  @Delete(':id')
  @Roles('ADMIN')
  async deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}
