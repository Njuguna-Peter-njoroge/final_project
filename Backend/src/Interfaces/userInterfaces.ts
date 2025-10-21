import {UserRole} from "@prisma/client";

export interface User {
    id:string,
    name:string,
    email:string,
    phone:string,
    password:string,
    isVerified?:boolean,
    location:string,
    createdAt:Date,
    updatedAt:Date,
    goodType:string,
    licensenumber:string,
    vehicleType:string,
    verificationToken?: string;
    role:UserRole,
}