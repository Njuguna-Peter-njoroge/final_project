import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ParcelService } from './parcel.service';
import { CreateParcelDto } from 'src/Dtos/createparcel.dto';
import { UpdateParcelDto } from 'src/Dtos/updateparcel.dto';
import { OrderStatus } from '@prisma/client';
import { UsersService } from 'src/users/users.service';

@Controller('parcels')
export class ParcelController {
  constructor(
    private readonly parcelService: ParcelService,
    private readonly usersService: UsersService, // <-- Inject here
  ) {}

  @Post()
  async create(@Body() dto: CreateParcelDto) {
    return this.parcelService.create(dto);
  }

  @Get('track/:trackingNumber')
  async track(@Param('trackingNumber') trackingNumber: string) {
    return this.parcelService.track(trackingNumber);
  }

  @Get()
  async findAll() {
    return this.parcelService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.parcelService.findById(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateParcelDto) {
    return this.parcelService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.parcelService.delete(id);
  }

  @Get('sender/:senderId')
  async findBySender(@Param('senderId') senderId: string) {
    return this.parcelService.findBySenderId(senderId);
  }

  @Get('status/:status')
  async findByStatus(@Param('status') status: OrderStatus) {
    return this.parcelService.findByStatus(status);
  }
  // users.controller.ts
  @Get('by-email/:email')
  getUserByEmail(@Param('email') email: string) {
    return this.usersService.getUserByEmail(email);
  }
}
