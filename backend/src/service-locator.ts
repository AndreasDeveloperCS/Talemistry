import { INestApplicationContext } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

export class ServiceLocator {
    private static appContext: INestApplicationContext | NestExpressApplication | ModuleRef;

    static setAppContext(appContext: ModuleRef) {
        this.appContext = appContext;
        //console.log('setAppContext', this.appContext);
    }

    static get<T>(type: any): T {
        console.log('ServiceLocator get', this.appContext);
        return this.appContext?.get(type, { strict: false });
    }
}