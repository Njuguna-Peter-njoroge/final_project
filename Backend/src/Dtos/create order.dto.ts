import { IsOptional, IsString, IsNotEmpty, IsEmail, IsNumberString, MinLength } from 'class-validator';

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  // @IsUUID() // Uncomment if using UUIDs
  customerId?: string;

  @IsNotEmpty()
  @IsString()
  pickupAddress: string;

  @IsNotEmpty()
  @IsString()
  deliveryAddress: string;

  @IsNotEmpty()
  @IsString()
  courierService: string;

  @IsNotEmpty()
  @IsString()
  packageWeight: string; // Will be converted to Decimal in service

  @IsNotEmpty()
  @IsString()
  packageDimensions: string;

  @IsNotEmpty()
  @IsString()
  price: string; // Consider changing to number and use @IsNumber()

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  // @IsUUID() // Uncomment if using UUIDs
  orderId?: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  customerPhone?: string;

  @IsOptional()
  @IsString()
  customerZipcode?: string;

  @IsOptional()
  @IsString()
  receiverName?: string;

  @IsOptional()
  @IsEmail()
  receiverEmail?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  receiverPhone?: string;
}
