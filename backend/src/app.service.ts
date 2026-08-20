import { DiscoveryService, Reflector } from '@nestjs/core';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { GATEWAY_METADATA } from '@nestjs/websockets/constants';

@Injectable()
export class GatewayInspector implements OnModuleInit {
    constructor(
        private readonly discovery: DiscoveryService,
        private readonly reflector: Reflector,
    ) { }

    onModuleInit() {
        console.log('🔍 Inspecting registered WebSocket Gateways...');

        const allProviders = this.discovery.getProviders();
        const gateways = allProviders.filter(
            (wrapper) =>
                wrapper?.metatype &&
                this.reflector.get(GATEWAY_METADATA, wrapper.metatype),
        );

        if (gateways.length === 0) {
            console.log('⚠️  No gateways detected. Make sure @WebSocketGateway is used.');
            return;
        }

        console.log(`🚀 Found ${gateways.length} gateways:`);
        for (const gw of gateways) {
            const meta = this.reflector.get(GATEWAY_METADATA, gw.metatype);
            const name = gw.metatype?.name || '(anonymous)';
            console.log(`   → ${name} @ namespace "${meta?.namespace ?? '/'}"`);
        }
    }
}