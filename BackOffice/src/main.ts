import './load-env';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ── Gzip compression ───────────────────────────────────────────────────────
  // Compresses all HTTP responses, reducing payload size by 60-80%.
  // Direct impact on TTFB: a 200KB JSON response becomes ~20KB over the wire.
  // threshold: 1KB — don't compress tiny responses (overhead not worth it)
  app.use(compression({ threshold: 1024 }));

  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
    // Static assets: cache for 7 days in browser, 1 day shared cache
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'public, max-age=604800, s-maxage=86400');
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
