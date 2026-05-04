import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metricsService: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Ignorer l'endpoint /metrics lui-même
    if (req.path === '/metrics') {
      return next();
    }

    const start = Date.now();
    const method = req.method;
    const route = req.route?.path || req.path;

    // Incrémenter les requêtes en cours
    this.metricsService.incrementRequestsInProgress(method, route);

    // Capturer la fin de la requête
    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000; // en secondes
      const status = res.statusCode;

      // Enregistrer les métriques
      this.metricsService.incrementHttpRequests(method, route, status);
      this.metricsService.observeHttpRequestDuration(method, route, status, duration);
      this.metricsService.decrementRequestsInProgress(method, route);
    });

    next();
  }
}
