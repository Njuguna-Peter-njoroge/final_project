

import {
    IsEmail,
    IsOptional,
    MinLength,
    IsEnum,
    isPhoneNumber,
    IsPhoneNumber,
    Matches,
    Length,
    IsString, IsLongitude, IsLatitude
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class UpdateUserDto {
    @IsOptional()
    name: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @MinLength(6)
    password: string;

    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @IsLatitude()
    latitude?: number;

    @IsLongitude()
    longitude?: number;

    @IsPhoneNumber('KE')
    phone?: string;


    @IsOptional()
    zipcode: string;

    @IsString()
    @Length(2, 100, { message: 'Location must be between 2 and 100 characters' })
    @Matches(/^[a-zA-Z\s\-,.']+$/, { message: 'Location can only contain letters, spaces, and basic punctuation' })
    location: string;
}