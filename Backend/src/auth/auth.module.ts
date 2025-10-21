import { Module } from '@nestjs/common';
import {JwtModule, JwtService} from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './Guards/auth.guards';
import {RolesGuard} from "./Guards/role.guards";
import {JwtStrategy} from "./strategy/jwt.strategy";
import {PrismaModule} from "../prisma/prismamodule";
import { MailerModule } from '../../shared/mailer/mailer/mailermodule';
import {CustomMailerService} from "../../shared/mailer/mailer/mailer.service";
import {CustomJwtService} from "./Jwt/jwt.service";
import { CustomJwtModule } from './custom-jwt/custom-jwt.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
    PrismaModule,
    MailerModule,
    CustomJwtModule,
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, AuthService, JwtAuthGuard, RolesGuard, CustomMailerService,CustomJwtService],
  exports: [JwtModule, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
