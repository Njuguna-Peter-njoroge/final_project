import { OrderStatus } from '@prisma/client';

export class OrderResponseDto {
    id: string;
    orderId: string;
    pickupAddress: string;
    deliveryAddress: string;
    courierService: string;
    status: OrderStatus;
    packageWeight: string;
    packageDimensions: string;
    price: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
