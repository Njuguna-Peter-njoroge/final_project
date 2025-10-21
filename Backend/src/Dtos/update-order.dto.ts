import { OrderStatus } from '@prisma/client';

export class UpdateOrderDto {
    pickupAddress?: string;
    deliveryAddress?: string;
    pickupLat?: number;
    pickupLng?: number;
    deliveryLat?: number;
    deliveryLng?: number;
    courierLat?: number;
    courierLng?: number;
    courierService?: string;
    packageWeight?: string;
    packageDimensions?: string;
    price?: string;
    notes?: string;
    status?: OrderStatus;
    statusReason?: string;
}
