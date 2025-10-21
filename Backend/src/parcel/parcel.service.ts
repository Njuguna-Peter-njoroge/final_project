// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// /* eslint-disable @typescript-eslint/no-unsafe-call */
// import { Injectable, NotFoundException } from '@nestjs/common';
// import { PrismaService } from 'src/prisma/prismaservice';
// import { CreateParcelDto } from 'src/Dtos/createparcel.dto';
// import { UpdateParcelDto } from 'src/Dtos/updateparcel.dto';
// import { v4 as uuidv4 } from 'uuid';
// import { OrderStatus } from '@prisma/client';
// import { CustomMailerService } from 'shared/mailer/mailer/mailer.service';

// @Injectable()
// export class ParcelService {
//   constructor(
//     private readonly prisma: PrismaService,
//     private readonly mailerService: CustomMailerService,
//   ) {}

//   async create(dto: CreateParcelDto) {
//     const trackingNumber = `PRC-${uuidv4().split('-')[0].toUpperCase()}`;
//     const parcel = await this.prisma.parcel.create({
//       data: {
//         ...dto,
//         trackingNumber,
//       },
//     });

//     // Send email to recipient
//     const emailHtml = `
//       <p>Hello ${dto.recipientName},</p>
//       <p>You have received a new parcel with tracking number <strong>${trackingNumber}</strong>.</p>
//       <p>Pickup Address: ${dto.recipientAddress}</p>
//       <p>Thank you for using our courier service.</p>
//     `;

//     await this.mailerService.sendEmail({
//       to: dto.recipientEmail,
//       subject: 'New Parcel Notification',
//       html: emailHtml,
//     });

//     return parcel;
//   }

//   async track(trackingNumber: string) {
//     const parcel = await this.prisma.parcel.findUnique({
//       where: { trackingNumber },
//       include: { statusHistory: true },
//     });

//     if (!parcel) {
//       throw new NotFoundException(
//         `Parcel with tracking number ${trackingNumber} not found`,
//       );
//     }

//     return parcel;
//   }

//   async findAll() {
//     return this.prisma.parcel.findMany({
//       include: { statusHistory: true },
//     });
//   }

//   async findById(id: string) {
//     const parcel = await this.prisma.parcel.findUnique({
//       where: { id },
//       include: { statusHistory: true },
//     });

//     if (!parcel) {
//       throw new NotFoundException(`Parcel with ID ${id} not found`);
//     }

//     return parcel;
//   }

//   async update(id: string, dto: UpdateParcelDto) {
//     const existing = await this.prisma.parcel.findUnique({ where: { id } });

//     if (!existing) {
//       throw new NotFoundException(
//         `Cannot update. Parcel with ID ${id} not found`,
//       );
//     }

//     return this.prisma.parcel.update({
//       where: { id },
//       data: dto,
//     });
//   }

//   async delete(id: string) {
//     const existing = await this.prisma.parcel.findUnique({ where: { id } });

//     if (!existing) {
//       throw new NotFoundException(
//         `Cannot delete. Parcel with ID ${id} not found`,
//       );
//     }

//     return this.prisma.parcel.delete({
//       where: { id },
//     });
//   }

//   async findBySenderId(senderId: string) {
//     return this.prisma.parcel.findMany({
//       where: { senderId },
//       include: { statusHistory: true },
//     });
//   }

//   async findByStatus(status: OrderStatus) {
//     return this.prisma.parcel.findMany({
//       where: { status },
//       include: { statusHistory: true },
//     });
//   }
// }

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prismaservice';
import { CreateParcelDto } from 'src/Dtos/createparcel.dto';
import { UpdateParcelDto } from 'src/Dtos/updateparcel.dto';
import { v4 as uuidv4 } from 'uuid';
import { OrderStatus } from '@prisma/client';
import { CustomMailerService } from 'shared/mailer/mailer/mailer.service';
import { User } from '@prisma/client';

@Injectable()
export class ParcelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailerService: CustomMailerService,
  ) {}

  async create(dto: CreateParcelDto) {
    const trackingNumber = `PRC-${uuidv4().split('-')[0].toUpperCase()}`;

    // First, ensure the sender exists or create them
    let senderId = dto.senderId;
    
    // If no senderId provided or it's a default value, generate a new one
    if (!senderId || senderId === 'default-sender-id') {
      senderId = uuidv4();
    }
    
    // Check if sender exists
    const existingSender = await this.prisma.user.findUnique({
      where: { id: senderId },
    });

    if (!existingSender) {
      // Create a new user for the sender if they don't exist
      const newSender = await this.prisma.user.create({
        data: {
          id: senderId,
          name: dto.recipientName || 'Unknown Sender', // Use recipient name as fallback
          email: dto.recipientEmail || 'sender@example.com', // Use recipient email as fallback
          phone: dto.recipientPhone || '',
          password: 'defaultPassword123', // Default password for parcel senders
          role: 'USER',
          status: 'ACTIVE',
        },
      });
      senderId = newSender.id;
    }

    const parcel = await this.prisma.parcel.create({
      data: {
        ...dto,
        senderId,
        trackingNumber,
      },
    });

    // Send email to recipient
    const emailHtml = `
      <p>Hello ${dto.recipientName},</p>
      <p>You have received a new parcel with tracking number <strong>${trackingNumber}</strong>.</p>
      <p>Pickup Address: ${dto.recipientAddress}</p>
      <p>Thank you for using our courier service.</p>
    `;

    await this.mailerService.sendEmail({
      to: dto.recipientEmail,
      subject: 'New Parcel Notification',
      html: emailHtml,
    });

    return parcel;
  }

  async track(trackingNumber: string) {
    const parcel = await this.prisma.parcel.findUnique({
      where: { trackingNumber },
      include: {
        statusHistory: true,
      },
    });

    if (!parcel) {
      throw new NotFoundException(
        `Parcel with tracking number ${trackingNumber} not found`,
      );
    }

    return parcel;
  }

  async findAll() {
    return this.prisma.parcel.findMany({
      include: {
        statusHistory: true,
      },
    });
  }

  async findById(id: string) {
    const parcel = await this.prisma.parcel.findUnique({
      where: { id },
      include: {
        statusHistory: true,
      },
    });

    if (!parcel) {
      throw new NotFoundException(`Parcel with ID ${id} not found`);
    }

    return parcel;
  }

  async update(id: string, dto: UpdateParcelDto) {
    const existing = await this.prisma.parcel.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException(
        `Cannot update. Parcel with ID ${id} not found`,
      );
    }

    return this.prisma.parcel.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    const existing = await this.prisma.parcel.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException(
        `Cannot delete. Parcel with ID ${id} not found`,
      );
    }

    return this.prisma.parcel.delete({
      where: { id },
    });
  }

  async findBySenderId(senderId: string) {
    return this.prisma.parcel.findMany({
      where: { senderId },
      include: {
        statusHistory: true,
      },
    });
  }

  async findByStatus(status: OrderStatus) {
    return this.prisma.parcel.findMany({
      where: { status },
      include: {
        statusHistory: true,
      },
    });
  }
  async getUserByEmail(email: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return user;
  }
}
