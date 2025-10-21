// src/auth/decorators/roles.decorator.ts

import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import {UserRole} from "@prisma/client";

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

export const User = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request.user;
    },
);
