import { Injectable } from '@nestjs/common';
import { register, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

@Injectable()
export class MetricsService {
  private httpRequestCounter: Counter;
  private httpRequestDuration: Histogram;
  private httpRequestsInProgress: Gauge;

  constructor() {
    // Collecter les métriques par défaut (CPU, RAM, etc.)
    collectDefaultMetrics({ prefix: 'hrbrain_backend_' });

    // Compteur de requêtes HTTP
    this.httpRequestCounter = new Counter({
      name: 'hrbrain_backend_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status'],
    });

    // Durée des requêtes HTTP
    this.httpRequestDuration = new Histogram({
      name: 'hrbrain_backend_http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    });

    // Requêtes HTTP en cours
    this.httpRequestsInProgress = new Gauge({
      name: 'hrbrain_backend_http_requests_in_progress',
      help: 'Number of HTTP requests currently being processed',
      labelNames: ['method', 'route'],
    });
  }

  // Incrémenter le compteur de requêtes
  incrementHttpRequests(method: string, route: string, status: number) {
    this.httpRequestCounter.inc({ method, route, status });
  }

  // Enregistrer la durée d'une requête
  observeHttpRequestDuration(method: string, route: string, status: number, duration: number) {
    this.httpRequestDuration.observe({ method, route, status }, duration);
  }

  // Incrémenter les requêtes en cours
  incrementRequestsInProgress(method: string, route: string) {
    this.httpRequestsInProgress.inc({ method, route });
  }

  // Décrémenter les requêtes en cours
  decrementRequestsInProgress(method: string, route: string) {
    this.httpRequestsInProgress.dec({ method, route });
  }

  // Obtenir toutes les métriques
  getMetrics(): Promise<string> {
    return register.metrics();
  }

  // Réinitialiser les métriques (pour les tests)
  resetMetrics() {
    register.clear();
  }
}
