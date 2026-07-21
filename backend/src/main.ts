import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Controller, Get } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import helmet from 'helmet';

@Controller('health')
class HealthController {
  @Get()
  check() { return { status: 'ok', timestamp: new Date().toISOString() }; }
}

async function bootstrap() {
  // rawBody: true — nécessaire à la vérification de signature HMAC des webhooks
  // de paiement (le corps brut doit être disponible via req.rawBody).
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.use(helmet());

  app.setGlobalPrefix('api/v1');

  // Register health controller without global prefix interference
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/api/v1/health', (_req: any, res: any) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  const corsOrigins = [
    'http://localhost:3000',
    'http://localhost:3003',
    'https://santarex.ibigsoft.com',
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('SANTAREX ERP API')
    .setDescription('API de gestion hospitalière SANTAREX ERP — IBIG SOFT')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.BACKEND_PORT || 3001;
  await app.listen(port);
  console.log(`SANTAREX ERP Backend démarré sur le port ${port}`);
  console.log(`Documentation Swagger : http://localhost:${port}/api/docs`);
}
bootstrap();
