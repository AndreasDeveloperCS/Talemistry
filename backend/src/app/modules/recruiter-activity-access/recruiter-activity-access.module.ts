import { Module } from '@nestjs/common';
import { RecruiterActivityAccessService } from './services/recruiter-activity-access.service';
import { UserModule } from '../users/user.module';
import { RecruiterActivityAccess, RecruiterActivityAccessSchema } from './models/recruiter-activity-access.model';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { RecruiterActivityAccessController } from './controllers/recruiter-activity-access.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RecruiterActivityAccess
    ]),
    MongooseModule.forFeature([
      {
        name: RecruiterActivityAccess.name, schema: RecruiterActivityAccessSchema
      },
    ]),
    UserModule
  ],
  controllers: [
    RecruiterActivityAccessController,
  ],
  providers: [
    RecruiterActivityAccessService
  ]
})
export class RecruiterActivityAccessModule {}
