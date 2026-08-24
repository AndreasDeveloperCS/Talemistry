import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { jwtSecret } from '../../config';
import { BaseModule } from '../base/base.module';
import { CompaniesModule } from '../companies/companies.module';
import { CoreModule } from '../core/core.module';
import { UserModule } from '../users/user.module';
import { OpportunitiesManagerController } from './controllers/hiring-managers.controller';
import { Manager, ManagerSchema } from './models/manager';
import { OpportunitiesManagersService } from './services/opportunities-managers.service';

@Module({
  imports: [
    BaseModule,
    CompaniesModule,
    UserModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: jwtSecret,
        signOptions: {
          expiresIn: '7200s'
        },
      }),
    }),
    TypeOrmModule.forFeature([Manager]),
    MongooseModule.forFeature([
      {
        name: Manager.name, schema: ManagerSchema
      }
    ]),
    CoreModule,
  ],
  controllers: [OpportunitiesManagerController],
  providers: [OpportunitiesManagersService],
  exports: [OpportunitiesManagersService],
})
export class OpportunitiesManagersModule { }
