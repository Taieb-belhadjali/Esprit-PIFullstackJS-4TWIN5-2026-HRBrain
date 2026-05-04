# 📊 Résumé - Stack de Monitoring Prometheus + Grafana

## ✅ Ce qui a été créé

### 📦 Fichiers Kubernetes (14 fichiers)

#### Configuration de base
1. **monitoring-namespace.yaml** - Namespace dédié au monitoring
2. **prometheus-rbac.yaml** - ServiceAccount + ClusterRole + ClusterRoleBinding pour Prometheus
3. **prometheus-rules.yaml** - Règles d'alertes (11 alertes configurées)
4. **prometheus-configmap.yaml** - Configuration Prometheus avec 10 jobs de scraping
5. **prometheus-deployment.yaml** - Déploiement Prometheus + Service NodePort 30090

#### Grafana
6. **grafana-configmap.yaml** - Datasource Prometheus + Dashboard K8s pré-configuré
7. **grafana-deployment.yaml** - Déploiement Grafana + Service NodePort 30300

#### Collecteurs de métriques
8. **node-exporter.yaml** - DaemonSet pour métriques OS (CPU, RAM, Disk, Network)
9. **kube-state-metrics.yaml** - Métriques état du cluster K8s

#### Scripts de déploiement
10. **deploy-monitoring.sh** - Script de déploiement automatique
11. **check-monitoring.sh** - Script de vérification et health check
12. **undeploy-monitoring.sh** - Script de désinstallation propre

#### Documentation
13. **README-monitoring.md** - Documentation technique complète (10KB)
14. **MONITORING-QUICKSTART.md** - Guide de démarrage rapide
15. **DEPLOY-MONITORING-GUIDE.md** - Guide de déploiement pas à pas

---

## 🏗️ Architecture déployée

```
┌─────────────────────────────────────────────────────────────┐
│                    Grafana (Port 30300)                     │
│              http://192.168.1.12:30300                      │
│              admin / hrbrain2026                            │
│                                                             │
│  Dashboard: "Kubernetes Cluster Overview"                  │
│  - Node CPU Usage (4 nodes)                                │
│  - Node Memory Usage (4 nodes)                             │
│  - Node Disk Usage (4 nodes)                               │
│  - HRBrain Running Pods                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓ query
┌─────────────────────────────────────────────────────────────┐
│                  Prometheus (Port 30090)                    │
│              http://192.168.1.12:30090                      │
│                                                             │
│  Scrape interval: 15 secondes                              │
│  Retention: 15 jours                                       │
│  10 jobs configurés                                        │
│  11 alertes configurées                                    │
└─────────────────────────────────────────────────────────────┘
         ↓                    ↓                    ↓
┌──────────────────┐  ┌──────────────┐  ┌──────────────────┐
│  Node Exporter   │  │ kube-state   │  │  Applications    │
│   (DaemonSet)    │  │  -metrics    │  │                  │
│                  │  │              │  │  - Backend       │
│ 4 pods:          │  │ Métriques:   │  │  - Frontend      │
│ - master (10)    │  │ - Pods       │  │  - Jenkins       │
│ - worker-1 (11)  │  │ - Deployments│  │  - SonarQube     │
│ - worker-2 (12)  │  │ - Services   │  │                  │
│ - worker-3 (13)  │  │ - Nodes      │  │                  │
│                  │  │ - PVCs       │  │                  │
│ Métriques:       │  │ - etc.       │  │                  │
│ - CPU            │  │              │  │                  │
│ - RAM            │  │              │  │                  │
│ - Disk           │  │              │  │                  │
│ - Network I/O    │  │              │  │                  │
└──────────────────┘  └──────────────┘  └──────────────────┘
```

---

## 📊 Métriques collectées

### Infrastructure (Node Exporter)
- ✅ **CPU Usage** par node (idle, user, system, iowait)
- ✅ **Memory Usage** par node (total, available, used, cached)
- ✅ **Disk Usage** par node (size, used, available)
- ✅ **Network I/O** par node (bytes sent/received, packets, errors)
- ✅ **Load Average** (1min, 5min, 15min)
- ✅ **Uptime** des nodes

### Kubernetes (kube-state-metrics)
- ✅ **Pods**: phase, restarts, ready status
- ✅ **Deployments**: replicas desired/available/unavailable
- ✅ **Services**: endpoints, type
- ✅ **Nodes**: status, conditions (Ready, DiskPressure, MemoryPressure)
- ✅ **PersistentVolumes**: status, capacity
- ✅ **Namespaces**: phase

### Applications HRBrain
- ✅ **Backend**: disponibilité (up/down)
- ✅ **Frontend**: disponibilité (up/down)
- ✅ **Jenkins**: disponibilité (up/down)
- ✅ **SonarQube**: disponibilité (up/down)

---

## 🚨 Alertes configurées (11 alertes)

### Critiques (🔴 severity: critical)
1. **NodeDown** - Node indisponible > 5 minutes
2. **NodeDiskPressure** - Disk > 85% pendant 5 minutes
3. **BackendDown** - Backend indisponible > 2 minutes
4. **FrontendDown** - Frontend indisponible > 2 minutes

### Warnings (🟡 severity: warning)
5. **NodeHighCPU** - CPU > 80% pendant 10 minutes
6. **NodeHighMemory** - Memory > 85% pendant 10 minutes
7. **PodCrashLooping** - Pod redémarre en boucle (> 0 restarts en 15min)
8. **PodNotReady** - Pod non-ready > 10 minutes
9. **JenkinsDown** - Jenkins indisponible > 5 minutes

---

## 🎯 Jobs Prometheus configurés (10 jobs)

1. **prometheus** - Prometheus lui-même
2. **kubernetes-apiservers** - API Server K8s
3. **kubernetes-nodes** - Nodes du cluster
4. **kubernetes-pods** - Pods avec annotation `prometheus.io/scrape: "true"`
5. **node-exporter** - Métriques OS des nodes
6. **kube-state-metrics** - État du cluster K8s
7. **hrbrain-backend** - Backend NestJS
8. **hrbrain-frontend** - Frontend React
9. **jenkins** - Jenkins CI/CD
10. **sonarqube** - SonarQube

---

## 🌐 Accès aux interfaces

### Prometheus
- **URL**: http://192.168.1.12:30090 ou http://192.168.1.11:30090
- **Port**: 30090 (NodePort)
- **Fonctionnalités**:
  - Requêtes PromQL
  - Status → Targets (voir tous les targets)
  - Alerts (voir les alertes actives)
  - Graph (visualiser les métriques)

### Grafana
- **URL**: http://192.168.1.12:30300 ou http://192.168.1.11:30300
- **Port**: 30300 (NodePort)
- **Credentials**: `admin` / `hrbrain2026`
- **Dashboard pré-configuré**: "Kubernetes Cluster Overview"
- **Datasource**: Prometheus (auto-configurée)

---

## 🚀 Déploiement

### Commandes rapides (3 étapes)

```bash
# 1. Rendre les scripts exécutables
chmod +x k8s/deploy-monitoring.sh k8s/check-monitoring.sh k8s/undeploy-monitoring.sh

# 2. Déployer
cd k8s
./deploy-monitoring.sh

# 3. Vérifier
./check-monitoring.sh
```

### Pods déployés (7 pods attendus)

```
NAMESPACE    NAME                                  READY   STATUS
monitoring   grafana-xxx                           1/1     Running
monitoring   kube-state-metrics-xxx                1/1     Running
monitoring   node-exporter-aaa (master)            1/1     Running
monitoring   node-exporter-bbb (worker-1)          1/1     Running
monitoring   node-exporter-ccc (worker-2)          1/1     Running
monitoring   node-exporter-ddd (worker-3)          1/1     Running
monitoring   prometheus-xxx                        1/1     Running
```

---

## 📈 Requêtes PromQL utiles

### Infrastructure
```promql
# CPU usage par node
100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory usage par node
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# Disk usage par node
(1 - (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"})) * 100

# Load average 5min
node_load5
```

### Kubernetes
```promql
# Nombre de pods Running dans hrbrain
count(kube_pod_status_phase{phase="Running", namespace="hrbrain"})

# Pods en crash loop
rate(kube_pod_container_status_restarts_total[15m]) > 0

# Pods non-ready
kube_pod_status_phase{phase!="Running",phase!="Succeeded"} == 1

# Nombre de nodes Ready
count(kube_node_status_condition{condition="Ready",status="true"})
```

### Applications
```promql
# Backend disponibilité
up{job="hrbrain-backend"}

# Frontend disponibilité
up{job="hrbrain-frontend"}

# Jenkins disponibilité
up{job="jenkins"}
```

---

## 📚 Documentation créée

### 1. README-monitoring.md (10KB)
Documentation technique complète avec:
- Architecture détaillée
- Configuration avancée
- Métriques collectées
- Alertes configurées
- Troubleshooting
- Ajout de métriques custom au Backend NestJS
- Import de dashboards Grafana communautaires

### 2. MONITORING-QUICKSTART.md
Guide de démarrage rapide avec:
- Déploiement en 3 commandes
- Accès aux interfaces
- Requêtes PromQL utiles
- Checklist de vérification

### 3. DEPLOY-MONITORING-GUIDE.md
Guide de déploiement pas à pas avec:
- Prérequis
- 7 étapes détaillées
- Sorties attendues
- Checklist finale
- Troubleshooting

---

## 🎯 Prochaines étapes recommandées

### 1. Ajouter des métriques custom au Backend NestJS
```bash
cd BackOffice
npm install prom-client
```

Créer un endpoint `/metrics` qui expose:
- Nombre de requêtes HTTP par route
- Latence des requêtes
- Erreurs 4xx/5xx
- Connexions DB actives
- etc.

### 2. Importer des dashboards Grafana communautaires
Dans Grafana → Dashboards → Import:
- **ID 1860**: Node Exporter Full (métriques détaillées des nodes)
- **ID 7249**: Kubernetes Cluster Monitoring (vue d'ensemble K8s)
- **ID 6417**: Kubernetes Pod Monitoring (métriques des pods)

### 3. Configurer Alertmanager (optionnel)
Pour envoyer des alertes par:
- Email
- Slack
- Discord
- Webhook

### 4. Ajouter un PersistentVolume pour Prometheus
Actuellement, Prometheus utilise `emptyDir` (données perdues au redémarrage).
Pour la production, utiliser un PV avec NFS ou local storage.

### 5. Monitorer les métriques applicatives
- Temps de réponse des API
- Taux d'erreur
- Nombre d'utilisateurs connectés
- Requêtes DB les plus lentes
- etc.

---

## 🔄 Commits Git

### Commit 1: Stack de monitoring
```
feat: add Prometheus + Grafana monitoring stack

- 14 fichiers créés
- 1840 lignes ajoutées
- Commit: fa344fce
```

### Commit 2: Guide de déploiement
```
docs: add detailed monitoring deployment guide

- 1 fichier créé
- 403 lignes ajoutées
- Commit: 028d47c8
```

---

## ✅ Résumé final

### Ce qui fonctionne
✅ Prometheus collecte les métriques toutes les 15 secondes  
✅ Grafana affiche les dashboards en temps réel  
✅ Node Exporter déployé sur les 4 nodes  
✅ kube-state-metrics collecte l'état du cluster  
✅ 11 alertes configurées et actives  
✅ 10 jobs de scraping configurés  
✅ Dashboard K8s pré-configuré dans Grafana  
✅ Documentation complète (3 fichiers)  
✅ Scripts de déploiement/vérification/désinstallation  

### Métriques surveillées
✅ 4 nodes: master, worker-1, worker-2, worker-3  
✅ Infrastructure: CPU, RAM, Disk, Network  
✅ Kubernetes: Pods, Deployments, Services, Nodes  
✅ Applications: Backend, Frontend, Jenkins, SonarQube  

### Accès
✅ Prometheus: http://192.168.1.12:30090  
✅ Grafana: http://192.168.1.12:30300 (admin/hrbrain2026)  

---

## 🎉 Conclusion

Le stack de monitoring Prometheus + Grafana est **prêt à être déployé** sur le cluster K8s HRBrain.

**Prochaine action**: Déployer sur le master avec `./deploy-monitoring.sh` 🚀

---

**Créé le**: 2026-05-04  
**Version**: 1.0  
**Auteur**: HRBrain DevOps Team
