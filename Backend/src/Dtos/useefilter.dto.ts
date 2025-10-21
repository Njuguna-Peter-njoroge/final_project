import { IsOptional, IsEnum, IsBoolean, IsString } from 'class-validator';
import { UserRole, AccountStatus } from '@prisma/client';

export class UserFiltersDto {
    @IsOptional()
    @IsEnum(AccountStatus)
    status?: AccountStatus;

    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @IsOptional()
    @IsBoolean()
    isVerified?: boolean;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    page?: number;

    @IsOptional()
    limit?: number;
}