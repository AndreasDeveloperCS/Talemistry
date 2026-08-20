import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { UtilitiesService } from '../../core/services/utilities.service';
import { PaymentsCatalogService } from '../services/payments-catalog.service';
import { PaymentsStateService } from '../services/payments-state.service';

@Controller('payments')
export class PaymentsController {
    constructor(
        private readonly paymentsCatalogService: PaymentsCatalogService,
        private readonly paymentsStateService: PaymentsStateService,
        private readonly utilitiesService: UtilitiesService,
    ) { }

    @Get('catalog')
    getCatalog() {
        return this.paymentsCatalogService.getCatalog();
    }

    @Get('subscription-state')
    async getSubscriptionState(@Req() request: Request) {
        const user = this.utilitiesService.getUser(request);
        if (!user?._id) {
            return { subscription: null };
        }

        return {
            subscription: await this.paymentsStateService.getCurrentSubscriptionState(String(user._id)),
        };
    }
}