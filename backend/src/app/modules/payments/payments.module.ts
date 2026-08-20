import { Module } from '@nestjs/common';
import { CompaniesModule } from '../companies/companies.module';
import { CoreModule } from '../core/core.module';
import { UserModule } from '../users/user.module';
import { PaymentsController } from './controllers/payments.controller';
import { GoCardlessPaymentsController } from './controllers/gocardless-payments.controller';
import { StripePaymentsController } from './controllers/stripe-payments.controller';
import { PaymentsCatalogService } from './services/payments-catalog.service';
import { PaymentsStateService } from './services/payments-state.service';
import { GoCardlessPaymentsService } from './services/gocardless-payments.service';
import { StripePaymentsService } from './services/stripe-payments.service';
import { BaseModule } from '../base/base.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
    imports: [
        TypeOrmModule.forFeature([]),
        MongooseModule.forFeature([]),
        BaseModule,
        UserModule, 
        CompaniesModule, 
        CoreModule
    ],
    controllers: [
        PaymentsController, 
        StripePaymentsController, 
        GoCardlessPaymentsController
    ],
    providers: [
        PaymentsCatalogService,
        PaymentsStateService,
        StripePaymentsService,
        GoCardlessPaymentsService,
    ],
    exports: [
        PaymentsCatalogService, 
        PaymentsStateService, 
        StripePaymentsService, 
        GoCardlessPaymentsService
    ],
})
export class PaymentsModule { }