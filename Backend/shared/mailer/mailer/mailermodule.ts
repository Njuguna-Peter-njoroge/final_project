
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule as NestMailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import * as path from 'path';
import {CustomMailerService} from "./mailer.service";


@Module({
    imports: [
        ConfigModule,
        NestMailerModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                transport: {
                    host: configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
                    port: parseInt(configService.get<string>('SMTP_PORT', '587')),
                    secure: configService.get<string>('SMTP_SECURE', 'false') === 'true',
                    auth: {
                        user: configService.get<string>('SMTP_USER'),
                        pass: configService.get<string>('SMTP_PASS'),
                    },
                    tls: {
                        rejectUnauthorized: false,
                    },
                },
                defaults: {
                    from: configService.get<string>('SMTP_FROM', 'no-reply@example.com'),
                },
                template: {
                    dir: path.join(process.cwd(), 'templates', 'email'),
                    adapter: new HandlebarsAdapter(),
                    options: {
                        strict: true,
                    },
                },
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [CustomMailerService],
    exports: [CustomMailerService],
})
export class MailerModule {}
