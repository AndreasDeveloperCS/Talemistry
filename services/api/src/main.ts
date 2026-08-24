import { NestFactory } from '@nestjs/core'
import { ValidationPipe, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { AppConfig } from './config/configuration'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const config = app.get(ConfigService<AppConfig, true>)

  app.setGlobalPrefix('api/v1')
  app.enableCors({
    origin: config.get('corsOrigins', { infer: true }),
    credentials: true,
  })
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )

  const swagger = new DocumentBuilder()
    .setTitle('Talemistry API')
    .setDescription('Full-cycle talent acquisition ecosystem — REST + WebSocket contract.')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swagger))

  const port = config.get('port', { infer: true })
  await app.listen(port)
  Logger.log(`Talemistry API ready on http://localhost:${port}/api/v1`, 'Bootstrap')
  Logger.log(`Swagger docs on http://localhost:${port}/api/docs`, 'Bootstrap')
}
void bootstrap()
