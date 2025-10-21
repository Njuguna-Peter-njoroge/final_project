import { Module } from '@nestjs/common';
import { CustomJwtService } from '../Jwt/jwt.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [CustomJwtService],
  exports: [CustomJwtService],
})
export class CustomJwtModule {}
