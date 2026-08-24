import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from '../../common/guard';
import { getTypeOrmOptions } from '../../common/utils/db.helper';
import { jwtSecret } from '../../config';
import jwtConfig from '../auth/config/jwt.config';
import refreshJwtConfig from '../auth/config/refresh-jwt.config';
import { RefreshJwtStrategy } from '../auth/strategies/refreshJwt.strategy';
import { CoreModule } from '../core/core.module';
import { UtilitiesService } from '../core/services/utilities.service';
import { AccessTypesController } from './controllers/access-types.controller';
import { FunctionalBlocksController } from './controllers/functional-blocks.controller';
import { PermissionsController } from './controllers/permissions.controller';
import { RolesController } from './controllers/roles.controller';
import { PermissionGuard } from './guards/permission-guard';
import { AccessType, AccessTypeSchema } from './models/access-type';
import { FunctionalBlock, FunctionalBlockSchema } from './models/functional-block';
import { Permission, PermissionSchema } from './models/permission';
import { Role, RoleSchema } from './models/role';
import { AccessTypesService } from './services/access-types.service';
import { FunctionalBlocksService } from './services/functional-blocks.service';
import { PermissionsService } from './services/permissions.service';
import { RolesService } from './services/roles.service';

@Module({
    imports: [
        CoreModule,
        ConfigModule.forRoot({
            load: [jwtConfig, refreshJwtConfig],
            isGlobal: true,
        }),
        PassportModule,
        HttpModule,
        CoreModule,
        JwtModule.registerAsync({
            useFactory: () => ({
                secret: jwtSecret,
                signOptions: {
                    expiresIn: '3600s'
                },
            }),
        }),
        TypeOrmModule.forFeature([
            FunctionalBlock, AccessType, Role, Permission
        ]),
        MongooseModule.forFeature([
            {
                name: AccessType.name, schema: AccessTypeSchema
            },
            {
                name: FunctionalBlock.name, schema: FunctionalBlockSchema
            },
            {
                name: Role.name, schema: RoleSchema
            },
            {
                name: Permission.name, schema: PermissionSchema
            },
        ])
    ],
    controllers: [RolesController, PermissionsController, FunctionalBlocksController, AccessTypesController],
    providers: [
        JwtStrategy,
        JwtService,
        RolesService,
        AccessTypesService,
        FunctionalBlocksService,
        PermissionsService,
        RefreshJwtStrategy,
        UtilitiesService,
        PermissionGuard
    ],
    exports: [
        JwtStrategy,
        JwtService,
        RolesService,
        AccessTypesService,
        FunctionalBlocksService,
        PermissionsService,
        RefreshJwtStrategy,
        UtilitiesService,
        PermissionGuard,
        MongooseModule,
        TypeOrmModule
    ],
})
export class PermissionsModule { }
