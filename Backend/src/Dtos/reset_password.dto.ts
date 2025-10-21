import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class ResetPasswordDto {
    @IsEmail()
    email: string;

    @IsNotEmpty()
    token: string;

    @MinLength(6)
    newPassword: string;
}
