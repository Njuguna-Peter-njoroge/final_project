export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  isVerified: boolean;
  location: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  goodType: string;
  goodWeight: string;
  goodPrice: string;
  goodDescription: string;
  zipcode: string;
}
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  COURIER = 'COURIER'
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}