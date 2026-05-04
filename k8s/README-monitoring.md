# 📊 HRBrain - Stack de Monitoring (Prometheus + Grafana)

## 🎯 Vue d'ensemble

Ce stack de monitoring permet de surveiller:
- **Infrastructure K8s**: CPU, RAM, Disk des nodes (master, worker-1, worker-2, worker-3)
- **État du cluster**: Pods, Deployments, Services
- **Applications**: Backend, Frontend, Jenkins, SonarQube
- **Alertes**: DiskPressure, Pod crashes, High CPU/Memory, Application down

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Grafana (UI)                      │
│            http://192.168.1.12:30300                │
│         Dashboards + Visualisations                 │
└─────────────────────────────────────────────────────┘
                         ↓ (query)
┌─────────────────────────────────────────────────────┐
│                  Prometheus                         │
│            http://192.168.1.12:30090                │
│  Collecte et stocke les métriques (15 jours)       │
└─────────────────────────────────────────────────────┘
         ↓              ↓              ↓
┌────────────────┐ ┌────────────┐ ┌──────────────────┐
│ Node Exporter  │ │ kube-state │ │ App Metrics      │
│ (métriques OS) │ │ -metrics   │ │ (backend/front)  │
│ DaemonSet      │ │ (K8s état) │ │                  │
└────────────────┘ └────────────┘ └──────────────────┘
```

## 📦 Composants

### 1. **Prometheus** (Port 30090)
- Collecte les métriques toutes les 15 secondes
- Rétention: 15 jours
- Scrape automatique des pods avec annotation `prometheus.io/scrape: "true"`
- Règles d'alertes configurées

### 2. **Grafana** (Port 30300)
- Interface de visualisation
- Dashboard K8s pré-configuré
- Datasource Prometheus auto-configurée
- Credentials: `admin` / `hrbrain2026`

### 3. **Node Exporter** (DaemonSet)
- Déployé sur **tous les nodes** (master + workers)
- Collecte les métriques système: CPU, RAM, Disk, Network
- Port: 9100

### 4. **kube-state-metrics**
- Métriques sur l'état du cluster K8s
- Pods, Deployments, Services, etc.
- Port: 8080

## 🚀 Déploiement

### Option 1: Script automatique (recommandé)

```bash
cd k8s
chmod +x deploy-monitoring.sh
./deploy-monitoring.sh
```

### Option 2: Déploiement manuel

```bash
# 1. Namespace
kubectl apply -f monitoring-namespace.yaml

# 2. Node Exporter
kubectl apply -f node-exporter.yaml

# 3. kube-state-metrics
kubectl apply -f kube-state-metrics.yaml

# 4. Prometheus
kubectl apply -f prometheus-rbac.yaml
kubectl apply -f prometheus-rules.yaml
kubectl apply -f prometheus-configmap.yaml
kubectl apply -f prometheus-deployment.yaml

# 5. Grafana
kubectl apply -f grafana-configmap.yaml
kubectl apply -f grafana-deployment.yaml

# 6. Vérifier
kubectl get pods -n monitoring -o wide
```

## 🔍 Accès aux interfaces

### Prometheus
- **URL**: http://192.168.1.12:30090 ou http://192.168.1.11:30090
- **Usage**: 
  - Requêtes PromQL
  - Vérifier les targets: Status → Targets
  - Voir les alertes: Alerts

### Grafana
- **URL**: http://192.168.1.12:30300 ou http://192.168.1.11:30300
- **Username**: `admin`
- **Password**: `hrbrain2026`
- **Dashboard**: "Kubernetes Cluster Overview" (déjà configuré)

## 📊 Métriques collectées

### Infrastructure (Node Exporter)
```promql
# CPU Usage par node
100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory Usage par node
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# Disk Usage par node
(1 - (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"})) * 100
```

### Kubernetes (kube-state-metrics)
```promql
# Nombre de pods Running
count(kube_pod_status_phase{phase="Running", namespace="hrbrain"})

# Pods en crash loop
rate(kube_pod_container_status_restarts_total[15m]) > 0

# Pods non-ready
kube_pod_status_phase{phase!="Running",phase!="Succeeded"} == 1
```

### Applications
```promql
# Backend disponibilité
up{job="hrbrain-backend"}

# Frontend disponibilité
up{job="hrbrain-frontend"}
```

## 🚨 Alertes configurées

### Alertes critiques (severity: critical)
- **NodeDown**: Node indisponible pendant 5 minutes
- **NodeDiskPressure**: Disk > 85% pendant 5 minutes
- **BackendDown**: Backend indisponible pendant 2 minutes
- **FrontendDown**: Frontend indisponible pendant 2 minutes

### Alertes warning (severity: warning)
- **NodeHighCPU**: CPU > 80% pendant 10 minutes
- **NodeHighMemory**: Memory > 85% pendant 10 minutes
- **PodCrashLooping**: Pod redémarre en boucle
- **PodNotReady**: Pod non-ready pendant 10 minutes
- **JenkinsDown**: Jenkins indisponible pendant 5 minutes

## 🔧 Configuration avancée

### Ajouter des métriques custom pour le Backend NestJS

1. Installer le package Prometheus dans le backend:
```bash
cd BackOffice
npm install prom-client
```

2. Créer un fichier `src/metrics/metrics.service.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { register, Counter, Histogram } from 'prom-client';

@Injectable()
export class MetricsService {
  private httpRequestCounter: Counter;
  private httpRequestDuration: Histogram;

  constructor() {
    this.httpRequestCounter = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status'],
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status'],
    });
  }

  getMetrics() {
    return register.metrics();
  }
}
```

3. Ajouter l'endpoint `/metrics` dans le backend

4. Ajouter l'annotation dans `backend-deployment.yaml`:
```yaml
metadata:
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "3000"
    prometheus.io/path: "/metrics"
```

## 📈 Dashboards Grafana recommandés

### Dashboards communautaires à importer:
1. **Node Exporter Full** (ID: 1860)
2. **Kubernetes Cluster Monitoring** (ID: 7249)
3. **Kubernetes Pod Monitoring** (ID: 6417)

### Import:
1. Aller dans Grafana → Dashboards → Import
2. Entrer l'ID du dashboard
3. Sélectionner la datasource "Prometheus"
4. Cliquer sur "Import"

## 🧪 Vérification

### 1. Vérifier que tous les pods sont Running
```bash
kubectl get pods -n monitoring
```

### 2. Vérifier les targets Prometheus
```bash
# Accéder à Prometheus: http://192.168.1.12:30090
# Aller dans: Status → Targets
# Tous les targets doivent être "UP"
```

### 3. Vérifier Grafana
```bash
# Accéder à Grafana: http://192.168.1.12:30300
# Login: admin / hrbrain2026
# Aller dans: Dashboards → Kubernetes Cluster Overview
```

### 4. Tester une alerte
```bash
# Simuler un pod down
kubectl scale deployment backend -n hrbrain --replicas=0

# Attendre 2 minutes
# Vérifier dans Prometheus: Alerts
# L'alerte "BackendDown" devrait être active

# Restaurer
kubectl scale deployment backend -n hrbrain --replicas=2
```

## 🔄 Mise à jour de la configuration

### Recharger la config Prometheus sans redémarrage:
```bash
kubectl delete configmap prometheus-config -n monitoring
kubectl apply -f prometheus-configmap.yaml
kubectl rollout restart deployment prometheus -n monitoring
```

### Ajouter un nouveau dashboard Grafana:
```bash
# Éditer grafana-configmap.yaml
# Ajouter le nouveau dashboard JSON
kubectl apply -f grafana-configmap.yaml
kubectl rollout restart deployment grafana -n monitoring
```

## 🗑️ Désinstallation

```bash
kubectl delete namespace monitoring
```

## 📝 Notes importantes

- **Stockage**: Prometheus utilise `emptyDir` (données perdues au redémarrage). Pour la production, utiliser un PersistentVolume.
- **Rétention**: 15 jours par défaut. Ajuster avec `--storage.tsdb.retention.time` si besoin.
- **Ressources**: Prometheus peut consommer beaucoup de RAM avec beaucoup de métriques. Ajuster les limites si nécessaire.
- **Sécurité**: Grafana password en clair dans le YAML. Pour la production, utiliser un Secret K8s.

## 🆘 Troubleshooting

### Prometheus ne scrape pas les targets
```bash
# Vérifier les logs
kubectl logs -n monitoring -l app=prometheus

# Vérifier la config
kubectl get configmap prometheus-config -n monitoring -o yaml
```

### Node Exporter ne démarre pas
```bash
# Vérifier les logs
kubectl logs -n monitoring -l app=node-exporter

# Vérifier que le DaemonSet est bien déployé sur tous les nodes
kubectl get ds -n monitoring
```

### Grafana ne se connecte pas à Prometheus
```bash
# Vérifier que Prometheus est accessible
kubectl exec -n monitoring -it deployment/grafana -- wget -O- http://prometheus.monitoring.svc.cluster.local:9090/-/healthy

# Vérifier la datasource dans Grafana: Configuration → Data Sources
```

## 📚 Ressources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Node Exporter](https://github.com/prometheus/node_exporter)
- [kube-state-metrics](https://github.com/kubernetes/kube-state-metrics)
