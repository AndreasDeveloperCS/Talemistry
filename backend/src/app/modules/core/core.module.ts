import { Module } from '@nestjs/common';
import { UtilitiesService } from './services/utilities.service';
import { JwtModule } from '@nestjs/jwt';
import { jwtSecret } from '../../config';
import { PassportModule } from '@nestjs/passport';
import jwtConfig from '../auth/config/jwt.config';
import refreshJwtConfig from '../auth/config/refresh-jwt.config';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        ConfigModule.forRoot({
            load: [jwtConfig, refreshJwtConfig],
            isGlobal: true,
        }),
        PassportModule,
        CoreModule,
        JwtModule.registerAsync({
            useFactory: () => ({
                secret: jwtSecret,
                signOptions: {
                    expiresIn: '3600s'
                },
            }),
        }),
    ],
    providers: [
        UtilitiesService,
    ],
    exports: [
        UtilitiesService,
    ],
})
export class CoreModule { }
