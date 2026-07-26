import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import helmet from 'helmet';

async function bootstrap() {
  // rawBody: true — nécessaire à la vérification de signature HMAC des webhooks
  // de paiement (le corps brut doit être disponible via req.rawBody).
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // En-têtes de sécurité durcis (section 46.3 #8).
  // L'API est servie en HTTPS derrière un reverse proxy.
  //
  // Choix CSP : REPORT-ONLY. L'API renvoie surtout du JSON, mais Swagger UI
  // (/api/docs) charge des scripts/styles inline. Une CSP appliquée risquerait
  // de casser Swagger et d'éventuels contenus servis par l'API. On rapporte
  // sans bloquer pour observer avant tout durcissement définitif.
  app.use(
    helmet({
      // X-Content-Type-Options: nosniff (défaut helmet, explicite ici)
      noSniff: true,
      // X-Frame-Options: protège contre le clickjacking
      frameguard: { action: 'sameorigin' },
      // Referrer-Policy: ne fuite pas l'URL complète vers les tiers
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      // HSTS: force HTTPS pendant 2 ans, sous-domaines inclus, éligible preload
      hsts: {
        maxAge: 63072000,
        includeSubDomains: true,
        preload: true,
      },
      // CSP en mode rapport uniquement (aucun blocage) — voir commentaire ci-dessus
      contentSecurityPolicy: {
        useDefaults: true,
        reportOnly: true,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'https://api.groq.com'],
        },
      },
      // On désactive COEP : trop strict, casse le chargement de ressources cross-origin
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.setGlobalPrefix('api/v1');

  // Le health-check est désormais géré par HealthController (module health/),
  // qui effectue de vraies sondes (DB/SMTP/IA/disque/mémoire) au lieu d'une
  // réponse statique. Route publique : GET /api/v1/health.

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
