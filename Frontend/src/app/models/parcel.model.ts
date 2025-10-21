export interface Parcel {
  id: string;
  orderUuid?: string;  // Added optional orderUuid field
  trackingNumber: string;
  status: ParcelStatus;
  sender: UserInfo;
  recipient: UserInfo;
  courier?: CourierInfo;
  createdAt: Date;
  updatedAt: Date;
  statusHistory: StatusChange[];
  deliveryDetails: DeliveryInfo;
  weight: number;
  dimensions: string;
  description: string;
  priority: Priority;
  estimatedDelivery: Date;
  actualDelivery?: Date;
  cost: number;
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: Address;
}

export interface CourierInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicleType: string;
  isAvailable: boolean;
  currentLocation?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface StatusChange {
  status: ParcelStatus;
  timestamp: Date;
  updatedBy: string;
  reason?: string;
  location?: string;
  notes?: string;
}

export interface DeliveryInfo {
  pickupAddress: Address;
  deliveryAddress: Address;
  pickupTime?: Date;
  deliveryTime?: Date;
  specialInstructions?: string;
  signatureRequired: boolean;
}

export enum ParcelStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED',
  FAILED_DELIVERY = 'FAILED_DELIVERY'
}

export enum Priority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface ParcelFilter {
  status?: ParcelStatus;
  priority?: Priority;
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string;
  courierId?: string;
}
