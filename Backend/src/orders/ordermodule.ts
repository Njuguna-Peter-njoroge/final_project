import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderGateway } from '../order/order.gateway';
import { PrismaService } from '../prisma/prismaservice';
import { CustomJwtModule } from '../auth/custom-jwt/custom-jwt.module';
import { MailerModule } from '../../shared/mailer/mailer/mailermodule';

@Module({
  imports: [CustomJwtModule, MailerModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderGateway, PrismaService],
  exports: [OrdersService],
})
export class OrdersModule {}
