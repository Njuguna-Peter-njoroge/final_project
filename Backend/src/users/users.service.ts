/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prismaservice';
import { CreateUserDto } from '../Dtos/createUser.dto';
import { ApiResponse } from '../../shared/apiResponse';
import { UserResponseDto } from '../Dtos/userResponse';
import { AccountStatus, UserRole } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { UpdateUserDto } from '../Dtos/updateUser.dto';
import { UserFiltersDto } from '../Dtos/useefilter.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}
  private sanitizeUser(user): UserResponseDto {
    const { password, verificationToken, ...rest } = user;
    return rest as UserResponseDto;
  }
  async create(data: CreateUserDto): Promise<ApiResponse<UserResponseDto>> {
    let hashedPassword: string | undefined = undefined;
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 10);
    }
    try {
      // Check if a user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      // Set verification status based on a role
      const isVerified = data.role === UserRole.ADMIN ? true : false;

      // Generate OTP for non-admin users
      let verificationToken = null;
      if (data.role !== UserRole.ADMIN) {
        const { randomInt } = require('crypto');
        verificationToken = randomInt(100000, 999999).toString();
      }

      const user = await this.prisma.user.create({
        data: {
          name: data.name,
          email: data.email.toLowerCase(),
          password: hashedPassword || '',
          role: (data.role as UserRole) || UserRole.USER,
          isVerified,
          verificationToken,
        },
      });

      return {
        success: true,
        message: 'User created successfully',
        data: this.sanitizeUser(user),
      };
    } catch (error) {
      console.error('Error in UsersService.create:', error);
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('Email already exists');
        }
        throw new BadRequestException(`Database error: ${error.message}`);
      }
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }
  async createOrGetUserByEmail(data: CreateUserDto): Promise<UserResponseDto> {
    try {
      const email = data.email.toLowerCase();

      // Step 1: Check if user with the email exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return this.sanitizeUser(existingUser);
      }

      // Step 2: If not, create the user
      const hashedPassword = data.password
        ? await bcrypt.hash(data.password, 10)
        : '';

      const newUser = await this.prisma.user.create({
        data: {
          name: data.name,
          email,
          password: hashedPassword,
          phone: data.phone,
          role: data.role || UserRole.USER,
          location: data.location,
          latitude: data.latitude,
          longitude: data.longitude,
          zipcode: data.zipcode,
          isVerified: true, // optional: set to false if OTP verification is needed
        },
      });

      return this.sanitizeUser(newUser);
    } catch (error) {
      console.error('Error in createOrGetUserByEmail:', error);
      throw new InternalServerErrorException(
        'Failed to create or retrieve user',
      );
    }
  }

  async findAll(): Promise<ApiResponse<UserResponseDto[]>> {
    const users = await this.prisma.user.findMany({
      where: { status: AccountStatus.ACTIVE },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      message: 'Users retrieved successfully',
      data: users.map((user) => this.sanitizeUser(user)),
    };
  }
  async findWithFilters(
    filters: UserFiltersDto,
  ): Promise<ApiResponse<UserResponseDto[]>> {
    const where: any = {};

    if (filters.status) where.status = filters.status;
    if (filters.role) where.role = filters.role;
    if (filters.isVerified !== undefined) where.isVerified = filters.isVerified;
    if (filters.search) {
      where.OR = [
        { fullName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      message: 'Users retrieved successfully',
      data: users.map((user) => this.sanitizeUser(user)),
    };
  }
  async findOne(id: string): Promise<ApiResponse<UserResponseDto>> {
    if (!id) throw new BadRequestException('User ID is required');

    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user || user.status !== AccountStatus.ACTIVE) {
      throw new NotFoundException('User not found or not active');
    }

    return {
      success: true,
      message: 'User retrieved successfully',
      data: this.sanitizeUser(user),
    };
  }
  async findWithPagination(page: number, limit: number): Promise<any> {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { status: AccountStatus.ACTIVE },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({
        where: { status: AccountStatus.ACTIVE },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      message: 'Users retrieved successfully',
      data: users.map((user) => this.sanitizeUser(user)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }
  async findByEmail(email: string): Promise<ApiResponse<UserResponseDto>> {
    if (!email) throw new BadRequestException('Email is required');

    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.status) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      message: 'User retrieved successfully',
      data: this.sanitizeUser(user),
    };
  }
  async setStatus(
    id: string,
    status: AccountStatus,
  ): Promise<ApiResponse<any>> {
    if (!id) throw new BadRequestException('User ID is required');

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { status },
    });

    return {
      success: true,
      message: `User status updated to ${status} successfully`,
      data: this.sanitizeUser(updatedUser),
    };
  }

  async update(
    id: string,
    data: UpdateUserDto,
  ): Promise<ApiResponse<UserResponseDto>> {
    if (!id) throw new BadRequestException('User ID is required');

    const existingUser = await this.prisma.user.findUnique({ where: { id } });
    if (!existingUser || existingUser.status !== AccountStatus.ACTIVE) {
      throw new NotFoundException('User not found or not active');
    }

    const updateData: any = {};

    // Update name if provided
    if (data.name) updateData.fullName = data.name;

    // Update email if provided
    if (data.email) {
      // Check if email is already taken by another user
      const emailExists = await this.prisma.user.findFirst({
        where: {
          email: data.email.toLowerCase(),
          id: { not: id },
        },
      });
      if (emailExists) {
        throw new BadRequestException('Email already exists');
      }
      updateData.email = { set: data.email.toLowerCase() };
    }

    // Update password if provided
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 12);
    }

    // Update role if provided
    if (data.role) updateData.role = data.role;

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: updateData,
      });

      return {
        success: true,
        message: 'User updated successfully',
        data: this.sanitizeUser(updatedUser),
      };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('Email already exists');
        }
        if (error.code === 'P2025') {
          throw new NotFoundException('User not found');
        }
      }
      throw new BadRequestException('Failed to update user');
    }
  }
  async deleteUser(id: string): Promise<ApiResponse<{ message: string }>> {
    if (!id) throw new BadRequestException('User ID is required');

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id },
      data: { status: AccountStatus.INACTIVE },
    });

    return {
      success: true,
      message: 'User deactivated successfully',
      data: { message: 'User deactivated successfully' },
    };
  }
  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException(`User with id ${id} not found`);
      }

      // Verify the current password
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password,
      );
      if (!isCurrentPasswordValid) {
        throw new ConflictException('Current password is incorrect');
      }

      // Hash new password
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      await this.prisma.user.update({
        where: { id },
        data: { password: hashedNewPassword },
      });

      return { message: 'Password changed successfully' };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to change password');
    }
  }
  async getUserByEmail(email: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async getAllUsers(): Promise<UserResponseDto[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return users.map(user => this.sanitizeUser(user));
  }
}
