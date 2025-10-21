// import { Module } from '@nestjs/common';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
// import { ConfigModule } from '@nestjs/config';

// import { OrdersService } from './orders/orders.service';
// import { OrdersController } from './orders/orders.controller';
// import { UsersController } from './users/users.controller';
// import { UsersService } from './users/users.service';
// import { AuthModule } from './auth/auth.module';
// import { CustomMailerService } from '../shared/mailer/mailer/mailer.service';
// import { MailerModule } from '../shared/mailer/mailer/mailermodule';
// import { UsersModule } from './users/user.module';
// import { JwtModule } from '@nestjs/jwt';
// import { CustomJwtModule } from './auth/custom-jwt/custom-jwt.module';
// import { OrderGateway } from './order/order.gateway';

// @Module({
//   imports: [MailerModule, AuthModule, CustomJwtModule, ConfigModule.forRoot()],
//   controllers: [AppController, UsersController, OrdersController],
//   providers: [
//     AppService,
//     UsersService,
//     OrdersService,
//     CustomMailerService,
//     OrderGateway,
//   ],
// })
// export class AppModule {}

// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { CustomMailerService } from '../shared/mailer/mailer/mailer.service';
import { MailerModule } from '../shared/mailer/mailer/mailermodule';
import { UsersModule } from './users/user.module';
import { CustomJwtModule } from './auth/custom-jwt/custom-jwt.module';
import { OrdersModule } from './orders/ordermodule';
import { ParcelService } from './parcel/parcel.service';
import { ParcelController } from './parcel/parcel.controller';
import { ParcelModule } from './parcel/parcel.module';
import { LocationsModule } from './locations/locations.module';

@Module({
  imports: [
    MailerModule,
    AuthModule,
    CustomJwtModule,
    ConfigModule.forRoot(),
    UsersModule,
    OrdersModule,
    ParcelModule,
    LocationsModule,
  ],
  controllers: [AppController, ParcelController],
  providers: [AppService, CustomMailerService, ParcelService],
})
export class AppModule {}
