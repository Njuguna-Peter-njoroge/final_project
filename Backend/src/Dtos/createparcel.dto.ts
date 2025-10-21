/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDate,
} from 'class-validator';
import { GoodType, Priority, OrderStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateParcelDto {
  @IsEnum(GoodType)
  goodType: GoodType;

  @IsString()
  goodDescription: string;

  @IsNumber()
  goodWeight: number;

  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsString()
  senderId: string;

  @IsString()
  recipientName: string;

  @IsString()
  recipientEmail: string;

  @IsString()
  recipientPhone: string;

  @IsString()
  recipientAddress: string;

  @IsOptional()
  @IsString()
  deliveryDetails?: string;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsString()
  dimensions?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  estimatedDelivery?: Date;

  @IsOptional()
  @IsString()
  assignedCourierId?: string;
}
