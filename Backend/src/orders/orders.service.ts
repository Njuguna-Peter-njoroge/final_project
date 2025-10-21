/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prismaservice';
import { CreateOrderDto } from '../Dtos/create order.dto';
import { UpdateOrderDto } from '../Dtos/update-order.dto';
import { UpdateOrderStatusDto } from '../Dtos/updateorder.dto';
import { OrderStatus } from '@prisma/client';
import { OrderGateway } from 'src/order/order.gateway';
import { CustomMailerService } from '../../shared/mailer/mailer/mailer.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderGateway: OrderGateway,
    private readonly mailerService: CustomMailerService,
  ) {}

  async createOrder(dto: CreateOrderDto, adminId: string) {
    // Verify admin
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new BadRequestException('Only admins can create orders');
    }

    // Verify customer exists, is active, and has USER role
    const customer = await this.prisma.user.findFirst({
      where: {
        id: dto.customerId,
        role: 'USER',
        status: 'ACTIVE',
      },
    });

    if (!customer) {
      throw new BadRequestException('Customer does not exist or is not active');
    }

    const order = await this.prisma.order.create({
      data: {
        orderId: `ORD-${Date.now()}`,
        pickupAddress: dto.pickupAddress,
        deliveryAddress: dto.deliveryAddress,
        courierService: dto.courierService,
        packageWeight: dto.packageWeight,
        packageDimensions: dto.packageDimensions,
        price: dto.price,
        notes: dto.notes,
        status: OrderStatus.PENDING,
        customer: {
          connect: {
            id: dto.customerId,
          },
        },
      },
    });

    this.orderGateway.sendOrderUpdate(order.id, {
      type: 'created',
      order,
    });

    return {
      message: 'Order created successfully',
      order,
    };
  }

  async createPublicOrder(dto: CreateOrderDto) {
    // For public orders, always handle user creation or finding by email
    let customerId: string;

    if (!dto.customerEmail) {
      throw new BadRequestException('Customer email is required');
    }

    // Try to find existing user by email
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: dto.customerEmail,
        role: 'USER',
      },
    });

    if (existingUser) {
      customerId = existingUser.id;
    } else {
      // Create new user
      const newUser = await this.prisma.user.create({
        data: {
          name: dto.customerName || 'Unknown User',
          email: dto.customerEmail,
          phone: dto.customerPhone || '',
          password: 'defaultPassword123', // Default password for public orders
          role: 'USER',
          status: 'ACTIVE',
          location: dto.pickupAddress || '',
          zipcode: dto.customerZipcode || '',
        },
      });
      customerId = newUser.id;
    }

    // Convert packageWeight string to Decimal
    const weightValue = parseFloat(dto.packageWeight.replace(/[^\d.]/g, ''));

    // Ensure price is a string
    const priceString = dto.price.toString();

    const order = await this.prisma.order.create({
      data: {
        orderId: `ORD-${Date.now()}`,
        pickupAddress: dto.pickupAddress,
        deliveryAddress: dto.deliveryAddress,
        courierService: dto.courierService,
        packageWeight: weightValue,
        packageDimensions: dto.packageDimensions,
        price: priceString,
        notes: dto.notes,
        receiverName: dto.receiverName,
        receiverEmail: dto.receiverEmail,
        receiverPhone: dto.receiverPhone,
        status: OrderStatus.PENDING,
        customer: {
          connect: {
            id: customerId,
          },
        },
      },
      include: {
        customer: true,
      },
    });

    this.orderGateway.sendOrderUpdate(order.id, {
      type: 'created',
      order,
    });

    // Send email notifications
    try {
      // Send confirmation email to sender
      if (order.customer?.email) {
        await this.mailerService.sendOrderConfirmationToSender(
          order.customer.email,
          order.customer.name || 'Customer',
          order.orderId,
          order.pickupAddress,
          order.deliveryAddress,
          order.packageWeight.toString(),
          order.price,
        );
      }
      // Send notification email to recipient
      if (order.receiverEmail) {
        await this.mailerService.sendOrderNotificationToRecipient(
          order.receiverEmail,
          order.receiverName || 'Recipient',
          order.orderId,
          order.pickupAddress,
          order.deliveryAddress,
          order.packageWeight.toString(),
          order.customer?.name || 'Sender',
        );
      }
    } catch (error) {
      console.error('Failed to send email notifications:', error);
      // Don't fail the order creation if email sending fails
    }

    return {
      message: 'Order created successfully',
      order,
    };
  }

  async findAllOrders() {
    return this.prisma.order.findMany({
      include: { customer: true, assignedCourier: true },
    });
  }

  async getParcels() {
    const orders = await this.prisma.order.findMany({
      include: { customer: true, assignedCourier: true },
    });

    return orders.map((order) => {
      // Use recipient fields from database if available, otherwise fall back to parsing notes
      let recipientName = order.receiverName || 'Recipient';
      let recipientEmail = order.receiverEmail || 'recipient@example.com';
      let recipientPhone = order.receiverPhone || '+1987654321';

      // If recipient fields are not set, try to parse from notes (for backward compatibility)
      if (!order.receiverName && order.notes) {
        const patterns = [
          /Receiver:\s*([^()]+)\s*\(([^,]+),\s*([^)]+)\)/i,
          /receiver:\s*([^,]+),\s*([^,]+),\s*([^,\n]+)/i,
          /to:\s*([^,]+),\s*([^,]+),\s*([^,\n]+)/i,
          /recipient:\s*([^,]+),\s*([^,]+),\s*([^,\n]+)/i,
          /for:\s*([^,]+),\s*([^,]+),\s*([^,\n]+)/i,
          /deliver to:\s*([^,]+),\s*([^,]+),\s*([^,\n]+)/i,
        ];

        for (const pattern of patterns) {
          const match = order.notes.match(pattern);
          if (match) {
            recipientName = match[1].trim();
            recipientEmail = match[2].trim();
            recipientPhone = match[3].trim();
            break;
          }
        }

        // If no pattern matched, try to extract any email-like pattern
        if (recipientName === 'Recipient') {
          const emailMatch = order.notes.match(
            /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/,
          );
          if (emailMatch) {
            recipientEmail = emailMatch[1];
            // Try to extract name before the email
            const nameMatch = order.notes.match(
              /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*[a-zA-Z0-9._%+-]+@/,
            );
            if (nameMatch) {
              recipientName = nameMatch[1].trim();
            }
          }
        }
      }

      return {
        id: order.id,
        orderUuid: order.id,
        trackingNumber: order.orderId,
        status: order.status,
        sender: {
          id: order.customer?.id || 'unknown',
          name: order.customer?.name || 'Unknown Sender',
          email: order.customer?.email || 'sender@example.com',
          phone: order.customer?.phone || '+1234567890',
          address: this.parseAddress(order.pickupAddress),
        },
        recipient: {
          id: 'recipient_' + order.orderId,
          name: recipientName,
          email: recipientEmail,
          phone: recipientPhone,
          address: this.parseAddress(order.deliveryAddress),
        },
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        statusHistory: [
          {
            status: order.status,
            timestamp: order.createdAt,
            updatedBy: 'system',
            reason: 'Order converted to parcel',
          },
        ],
        deliveryDetails: {
          pickupAddress: this.parseAddress(order.pickupAddress),
          deliveryAddress: this.parseAddress(order.deliveryAddress),
          specialInstructions: order.notes || '',
          signatureRequired: false,
        },
        weight: parseFloat(order.packageWeight.toString()) || 1.0,
        dimensions: order.packageDimensions || '20x15x10 cm',
        description: order.courierService || 'Standard delivery',
        priority: 'NORMAL',
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        cost: parseFloat(order.price) || 0,
      };
    });
  }

  private parseAddress(addressString: string): any {
    const parts = addressString?.split(',') || ['Unknown Address'];
    return {
      street: parts[0]?.trim() || 'Unknown Street',
      city: parts[1]?.trim() || 'Unknown City',
      state: parts[2]?.trim() || 'Unknown State',
      zipCode: parts[3]?.trim() || '00000',
      country: 'USA',
    };
  }

  async getOrdersByCustomer(customerId: string) {
    return this.prisma.order.findMany({
      where: { customerId },
      include: { statusHistory: true },
    });
  }

  async findOneOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true, assignedCourier: true },
    });

    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async getOrderStatusHistory(orderId: string) {
    const history = await this.prisma.statusHistory.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });

    if (!history.length) {
      throw new NotFoundException('No status history for this order');
    }

    return history;
  }

  async updateOrder(orderId: string, dto: UpdateOrderDto) {
    const existingOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!existingOrder) throw new NotFoundException('Order not found');

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        pickupAddress: dto.pickupAddress ?? existingOrder.pickupAddress,
        deliveryAddress: dto.deliveryAddress ?? existingOrder.deliveryAddress,
        pickupLat: dto.pickupLat ?? existingOrder.pickupLat,
        pickupLng: dto.pickupLng ?? existingOrder.pickupLng,
        deliveryLat: dto.deliveryLat ?? existingOrder.deliveryLat,
        deliveryLng: dto.deliveryLng ?? existingOrder.deliveryLng,
        courierLat: dto.courierLat ?? existingOrder.courierLat,
        courierLng: dto.courierLng ?? existingOrder.courierLng,
        courierService: dto.courierService ?? existingOrder.courierService,
        packageWeight: dto.packageWeight ?? existingOrder.packageWeight,
        packageDimensions:
          dto.packageDimensions ?? existingOrder.packageDimensions,
        price: dto.price ?? existingOrder.price,
        notes: dto.notes ?? existingOrder.notes,
        status: dto.status ?? existingOrder.status,
      },
    });

    if (dto.status && dto.status !== existingOrder.status) {
      await this.prisma.statusHistory.create({
        data: {
          orderId,
          status: dto.status,
          updatedBy: 'system',
          reason: dto.statusReason ?? 'Status updated',
          notes: dto.notes ?? '',
        },
      });
    }

    // Send email notification if delivery location updated
    if (
      (dto.deliveryLat && dto.deliveryLat !== existingOrder.deliveryLat) ||
      (dto.deliveryLng && dto.deliveryLng !== existingOrder.deliveryLng)
    ) {
      try {
        const customer = await this.prisma.user.findUnique({
          where: { id: existingOrder.customerId },
        });
        if (
          customer?.email &&
          dto.deliveryLat != null &&
          dto.deliveryLng != null
        ) {
          await this.mailerService.sendOrderLocationUpdateNotification(
            customer.email,
            customer.name || 'Customer',
            existingOrder.orderId,
            dto.deliveryLat,
            dto.deliveryLng,
          );
        }
        if (
          existingOrder.receiverEmail &&
          dto.deliveryLat != null &&
          dto.deliveryLng != null
        ) {
          await this.mailerService.sendOrderLocationUpdateNotification(
            existingOrder.receiverEmail,
            existingOrder.receiverName || 'Recipient',
            existingOrder.orderId,
            dto.deliveryLat,
            dto.deliveryLng,
          );
        }
      } catch (error) {
        console.error(
          'Failed to send location update email notifications:',
          error,
        );
      }
    }

    this.orderGateway.sendOrderUpdate(updatedOrder.id, {
      type: 'updated',
      order: updatedOrder,
    });

    return { message: 'Order updated successfully', order: updatedOrder };
  }

  async updateOrderStatus(
    orderId: string,
    dto: UpdateOrderStatusDto,
    updatedBy: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Order not found');

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: dto.status },
    });

    await this.prisma.statusHistory.create({
      data: {
        orderId,
        status: dto.status,
        updatedBy,
        reason: dto.reason ?? 'Status changed',
        notes: dto.notes ?? '',
      },
    });

    // Send email notification on status update
    try {
      const customer = await this.prisma.user.findUnique({
        where: { id: updatedOrder.customerId },
      });
      if (customer?.email) {
        await this.mailerService.sendOrderStatusUpdateEmail?.(
          customer.email,
          customer.name || 'Customer',
          updatedOrder.orderId,
          dto.status,
          dto.reason,
        );
      }
      if (updatedOrder.receiverEmail) {
        await this.mailerService.sendOrderStatusUpdateEmail?.(
          updatedOrder.receiverEmail,
          updatedOrder.receiverName || 'Recipient',
          updatedOrder.orderId,
          dto.status,
          dto.reason,
        );
      }
    } catch (error) {
      console.error(
        'Failed to send order status update email notifications:',
        error,
      );
    }

    this.orderGateway.sendOrderUpdate(orderId, {
      type: 'statusChanged',
      status: dto.status,
    });

    return {
      message: `Order status updated to ${dto.status}`,
      order: updatedOrder,
    };
  }

  async deleteOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Order not found');

    await this.prisma.order.delete({ where: { id: orderId } });

    this.orderGateway.sendOrderUpdate(orderId, {
      type: 'deleted',
      orderId,
    });

    return { message: 'Order deleted successfully' };
  }

  async assignCourier(orderId: string, courierId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Order not found');

    const courier = await this.prisma.user.findUnique({
      where: { id: courierId },
    });
    if (!courier || courier.role !== 'COURIER') {
      throw new BadRequestException('Invalid or unauthorized courier');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { assignedCourierId: courierId },
    });

    this.orderGateway.sendOrderUpdate(orderId, {
      type: 'courierAssigned',
      courierId,
    });

    return updatedOrder;
  }

  async filterOrders(status?: OrderStatus, fromDate?: Date, toDate?: Date) {
    return this.prisma.order.findMany({
      where: {
        status,
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteAllOrders() {
    // Delete all orders from the database
    const deleteResult = await this.prisma.order.deleteMany({});

    // Notify through WebSocket that all orders have been deleted
    this.orderGateway.sendOrderUpdate('all', {
      type: 'all_deleted',
      count: deleteResult.count,
    });

    return {
      message: `All orders deleted successfully. ${deleteResult.count} orders were deleted.`,
      deletedCount: deleteResult.count,
    };
  }

  async trackOrder(trackingNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderId: trackingNumber },
      include: {
        customer: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return {
      trackingNumber: order.orderId,
      status: order.status,
      sender: {
        name: order.customer?.name || 'Unknown',
        email: order.customer?.email || 'Unknown',
        phone: order.customer?.phone || 'Unknown',
      },
      recipient: {
        name: order.receiverName || 'Unknown',
        email: order.receiverEmail || 'Unknown',
        phone: order.receiverPhone || 'Unknown',
      },
      pickupAddress: order.pickupAddress,
      deliveryAddress: order.deliveryAddress,
      courierService: order.courierService,
      packageWeight: order.packageWeight,
      packageDimensions: order.packageDimensions,
      price: order.price,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      assignedCourier: null, // Add this field to match frontend interface
      statusHistory: order.statusHistory.map((history) => ({
        status: history.status,
        reason: history.reason,
        notes: history.notes,
        updatedBy: history.updatedBy,
        timestamp: history.createdAt.toISOString(),
      })),
    };
  }

  async trackMyOrder(trackingNumber: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        orderId: trackingNumber,
        customerId: userId, // Only allow tracking if the user owns the order
      },
      include: {
        customer: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(
        'Order not found or you do not have permission to view this order',
      );
    }

    return {
      trackingNumber: order.orderId,
      status: order.status,
      sender: {
        name: order.customer?.name || 'Unknown',
        email: order.customer?.email || 'Unknown',
        phone: order.customer?.phone || 'Unknown',
      },
      recipient: {
        name: order.receiverName || 'Unknown',
        email: order.receiverEmail || 'Unknown',
        phone: order.receiverPhone || 'Unknown',
      },
      pickupAddress: order.pickupAddress,
      deliveryAddress: order.deliveryAddress,
      courierService: order.courierService,
      packageWeight: order.packageWeight,
      packageDimensions: order.packageDimensions,
      price: order.price,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      assignedCourier: null,
      statusHistory: order.statusHistory.map((history) => ({
        status: history.status,
        reason: history.reason,
        notes: history.notes,
        updatedBy: history.updatedBy,
        timestamp: history.createdAt.toISOString(),
      })),
    };
  }

  async getAdminStats() {
    const [
      totalCustomers,
      totalCouriers,
      totalOrders,
      pendingOrders,
      approvedOrders,
    ] = await Promise.all([
      this.prisma.user.count({
        where: { role: 'USER' },
      }),
      this.prisma.user.count({
        where: { role: 'COURIER' },
      }),
      this.prisma.order.count(),
      this.prisma.order.count({
        where: { status: 'PENDING' },
      }),
      this.prisma.order.count({
        where: { status: 'CONFIRMED' },
      }),
    ]);

    return {
      totalCustomers,
      totalCouriers,
      totalOrders,
      pendingOrders,
      approvedOrders,
    };
  }
}
