"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const config = app.get((config_1.ConfigService));
    app.setGlobalPrefix('api/v1');
    app.enableCors({
        origin: config.get('corsOrigins', { infer: true }),
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    const swagger = new swagger_1.DocumentBuilder()
        .setTitle('Talemistry API')
        .setDescription('Full-cycle talent acquisition ecosystem — REST + WebSocket contract.')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    swagger_1.SwaggerModule.setup('api/docs', app, swagger_1.SwaggerModule.createDocument(app, swagger));
    const port = config.get('port', { infer: true });
    await app.listen(port);
    common_1.Logger.log(`Talemistry API ready on http://localhost:${port}/api/v1`, 'Bootstrap');
    common_1.Logger.log(`Swagger docs on http://localhost:${port}/api/docs`, 'Bootstrap');
}
void bootstrap();
//# sourceMappingURL=main.js.map