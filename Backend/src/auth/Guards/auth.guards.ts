import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import {CustomJwtService} from "../Jwt/jwt.service";
@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private readonly jwtService: CustomJwtService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const authHeader = request.headers.authorization;

        if (!authHeader) {
            throw new UnauthorizedException('Authorization header missing');
        }

        try {
            const token = this.jwtService.extractTokenFromHeader(authHeader);
            const payload = this.jwtService.verifyToken(token);

            // Attach user to request
            request['user'] = {
                id: payload.sub,
                email: payload.email,
                role: payload.role,
            };

            return true;
        } catch (error) {
            throw new UnauthorizedException(
                error instanceof Error ? error.message : 'Invalid authentication token',
            );
        }
    }
}
