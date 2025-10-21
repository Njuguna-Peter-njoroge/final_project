import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaModule } from '../prisma/prismamodule';
import { UsersController } from './users.controller';
import { CustomJwtModule } from '../auth/custom-jwt/custom-jwt.module';

@Module({
  imports: [PrismaModule, CustomJwtModule],
  controllers: [UsersController],

  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
