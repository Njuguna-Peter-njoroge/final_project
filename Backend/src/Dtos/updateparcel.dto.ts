/* eslint-disable @typescript-eslint/no-unsafe-call */
import { PartialType } from '@nestjs/mapped-types';
import { CreateParcelDto } from './createparcel.dto';

export class UpdateParcelDto extends PartialType(CreateParcelDto) {}
