import { Module, Global } from '@nestjs/common';
import { PrismaService} from "./prismaservice";

@Global()
@Module({
    providers: [PrismaService],
    exports: [PrismaService],
})
export class PrismaModule {}