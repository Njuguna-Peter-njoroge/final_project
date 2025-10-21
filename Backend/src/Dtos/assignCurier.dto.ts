import { IsString } from 'class-validator';

export class AssignCourierDto {
    @IsString()
    orderId: string;

    @IsString()
    courierId: string;

    @IsString()
    assignedBy: string;
}
