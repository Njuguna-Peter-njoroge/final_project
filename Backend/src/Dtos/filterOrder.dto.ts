import { IsOptional, IsEnum, IsString } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class FilterOrdersDto {
    fromDate?: string; // ISO string
    toDate?: string;
    @IsOptional()
    @IsEnum(OrderStatus)
    status?: OrderStatus;

    @IsOptional()
    @IsString()
    customerId?: string;

    @IsOptional()
    @IsString()
    dateFrom?: string; // ISO string

    @IsOptional()
    @IsString()
    dateTo?: string; // ISO string
}
