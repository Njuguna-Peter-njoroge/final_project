/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prismaservice';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { CustomMailerService } from '../../shared/mailer/mailer/mailer.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailerService: CustomMailerService,
  ) {}

  private generateOTP(): string {
    return randomInt(100000, 999999).toString();
  }

  private generateToken(payload: any): string {
    return this.jwtService.sign(payload); // Centralized JWT creation
  }

  async register(email: string, password: string, name: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otpCode = this.generateOTP();

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'USER',
        isVerified: false,
        verificationToken: otpCode,
      },
    });

    try {
      await this.mailerService.sendWelcomeEmail(email, name, otpCode);
      this.logger.log(`Welcome email sent to ${email}`);
    } catch (error) {
      this.logger.warn(
        `Failed to send welcome email to ${email}: ${error.message}`,
      );
      // In development mode, we can still proceed with registration
      this.logger.log(`[DEV MODE] Registration proceeding without email verification`);
    }

    // Generate token for the new user (even if not verified yet)
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return {
      message:
        'Registration successful! Please check your email for verification code.',
      access_token: this.generateToken(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
      },
    };
  }

  async verifyEmail(email: string, otpCode: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) throw new NotFoundException('User not found');
    if (user.isVerified)
      throw new BadRequestException('Email is already verified');
    if (!user.verificationToken || user.verificationToken !== otpCode) {
      throw new BadRequestException('Invalid OTP code');
    }

    const updated = await this.prisma.user.update({
      where: { email },
      data: { isVerified: true, verificationToken: null },
    });

    // Optionally, return a token for immediate login after verification
    const payload = {
      sub: updated.id,
      email: updated.email,
      role: updated.role,
    };
    return {
      message: 'Email verified successfully! You can now login.',
      access_token: this.generateToken(payload),
      user: {
        id: updated.id,
        email: updated.email,
        fullName: updated.name,
        role: updated.role,
        isVerified: updated.isVerified,
        status: updated.status,
      },
    };
  }

  async manuallyVerifyEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    if (user.isVerified) {
      return {
        message: 'User is already verified',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.name,
          role: user.role,
          isVerified: user.isVerified,
        },
      };
    }

    const updatedUser = await this.prisma.user.update({
      where: { email },
      data: { isVerified: true, verificationToken: null },
    });

    return {
      message: 'Email manually verified successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.name,
        role: updatedUser.role,
        isVerified: updatedUser.isVerified,
      },
    };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) throw new NotFoundException('User not found');
    if (user.isVerified)
      throw new BadRequestException('Email is already verified');

    const otpCode = this.generateOTP();

    await this.prisma.user.update({
      where: { email },
      data: { verificationToken: otpCode },
    });

    try {
      await this.mailerService.sendEmailVerification(email, user.name, otpCode);
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.warn(
        `Failed to send verification email to ${email}: ${error.message}`,
      );
    }

    return { message: 'Verification code sent to your email' };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (!user.isVerified && user.role !== 'ADMIN') {
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid credentials');

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      message: 'Login successful',
      access_token: this.generateToken(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.name,
        role: user.role,
        isVerified: user.isVerified,
        status: user.status,
      },
    };
  }

  async forgotPassword(email: string | { email: string }) {
    // Defensive check to extract email string if an object is passed
    let emailStr: string;
    if (typeof email === 'string') {
      emailStr = email;
    } else if (email && typeof email === 'object' && 'email' in email) {
      emailStr = email.email;
    } else {
      throw new BadRequestException('Invalid email parameter');
    }

    const user = await this.prisma.user.findUnique({ 
      where: { email: emailStr } 
    });
    if (!user) throw new NotFoundException('User not found');

    const otpCode = this.generateOTP();

    await this.prisma.user.update({
      where: { email: emailStr },
      data: { verificationToken: otpCode },
    });

    try {
      await this.mailerService.sendPasswordResetEmail(
        emailStr,
        user.name,
        otpCode,
      );
      this.logger.log(`Password reset email sent to ${emailStr}`);
    } catch (error) {
      this.logger.warn(
        `Failed to send password reset email to ${emailStr}: ${error.message}`,
      );
    }

    return { message: 'Password reset code sent to your email' };
  }

  async resetPassword(email: string, otpCode: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.verificationToken || user.verificationToken !== otpCode) {
      throw new BadRequestException('Invalid OTP code');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { email },
      data: { password: hashedPassword, verificationToken: null },
    });

    return { message: 'Password reset successfully' };
  }

  async resetPasswordManually(email: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await this.prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    return {
      message: 'Password reset successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.name,
        role: updatedUser.role,
        isVerified: updatedUser.isVerified,
      },
    };
  }

  async testEmail(email: string, name: string) {
    try {
      const otpCode = this.generateOTP();
      await this.mailerService.sendWelcomeEmail(email, name, otpCode);
      this.logger.log(`Test email sent successfully to ${email}`);
      return {
        message: 'Test email sent successfully',
        otpCode: otpCode, // For testing purposes
        email: email
      };
    } catch (error) {
      this.logger.error(`Failed to send test email to ${email}: ${error.message}`);
      throw new BadRequestException(`Failed to send test email: ${error.message}`);
    }
  }
}
