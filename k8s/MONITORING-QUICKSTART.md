# 🚀 Quick Start - Monitoring Stack

## 📋 Fichiers créés

```
k8s/
├── monitoring-namespace.yaml       # Namespace monitoring
├── prometheus-rbac.yaml            # RBAC pour Prometheus
├── prometheus-rules.yaml           # Règles d'alertes
├── prometheus-configmap.yaml       # Configuration Prometheus
├── prometheus-deployment.yaml      # Déploiement Prometheus
├── grafana-configmap.yaml          # Configuration Grafana + Dashboards
├── grafana-deployment.yaml         # Déploiement Grafana
├── node-exporter.yaml              # DaemonSet Node Exporter
├── kube-state-metrics.yaml         # Métriques K8s
├── deploy-monitoring.sh            # Script de déploiement
├── check-monitoring.sh             # Script de vérification
├── undeploy-monitoring.sh          # Script de désinstallation
├── README-monitoring.md            # Documentation complète
└── MONITORING-QUICKSTART.md        # Ce fichier
```

## ⚡ Déploiement rapide (3 commandes)

### Sur le master (192.168.1.10)

```bash
# 1. Rendre les scripts exécutables
chmod +x k8s/deploy-monitoring.sh k8s/check-monitoring.sh k8s/undeploy-monitoring.sh

# 2. Déployer le stack
cd k8s
./deploy-monitoring.sh

# 3. Vérifier l'installation
./check-monitoring.sh
```

## 🌐 Accès aux interfaces

### Prometheus
- **URL**: http://192.168.1.12:30090 ou http://192.168.1.11:30090
- **Port**: 30090 (NodePort)
- **Usage**: Requêtes PromQL, vérifier les targets, voir les alertes

### Grafana
- **URL**: http://192.168.1.12:30300 ou http://192.168.1.11:30300
- **Port**: 30300 (NodePort)
- **Username**: `admin`
- **Password**: `hrbrain2026`
- **Dashboard**: "Kubernetes Cluster Overview" (pré-configuré)

## 📊 Ce qui est surveillé

### ✅ Infrastructure
- **4 nodes**: master (192.168.1.10), worker-1 (192.168.1.11), worker-2 (192.168.1.12), worker-3 (192.168.1.13)
- **Métriques**: CPU, RAM, Disk, Network I/O
- **Node Exporter**: DaemonSet déployé sur tous les nodes

### ✅ Kubernetes
- **Pods**: État, restarts, crash loops
- **Deployments**: Replicas, disponibilité
- **Services**: Endpoints
- **kube-state-metrics**: Métriques complètes du cluster

### ✅ Applications HRBrain
- **Backend** (namespace: hrbrain)
- **Frontend** (namespace: hrbrain)
- **Jenkins** (namespace: hrbrain)
- **SonarQube** (namespace: hrbrain)

## 🚨 Alertes configurées

### Critiques (🔴)
- Node down > 5 min
- Disk > 85% pendant 5 min
- Backend down > 2 min
- Frontend down > 2 min

### Warnings (🟡)
- CPU > 80% pendant 10 min
- Memory > 85% pendant 10 min
- Pod crash looping
- Pod not ready > 10 min
- Jenkins down > 5 min

## 🧪 Test rapide

```bash
# 1. Vérifier que tous les pods sont Running
kubectl get pods -n monitoring

# Résultat attendu:
# NAME                                  READY   STATUS    RESTARTS   AGE
# grafana-xxx                           1/1     Running   0          2m
# kube-state-metrics-xxx                1/1     Running   0          2m
# node-exporter-xxx (x4 pods)           1/1     Running   0          2m
# prometheus-xxx                        1/1     Running   0          2m

# 2. Accéder à Prometheus
# Ouvrir: http://192.168.1.12:30090
# Aller dans: Status → Targets
# Tous les targets doivent être "UP"

# 3. Accéder à Grafana
# Ouvrir: http://192.168.1.12:30300
# Login: admin / hrbrain2026
# Dashboard: "Kubernetes Cluster Overview"
```

## 📈 Requêtes PromQL utiles

### Dans Prometheus (http://192.168.1.12:30090)

```promql
# CPU usage par node
100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory usage par node
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# Disk usage par node
(1 - (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"})) * 100

# Pods Running dans hrbrain
count(kube_pod_status_phase{phase="Running", namespace="hrbrain"})

# Backend disponibilité
up{job="hrbrain-backend"}

# Frontend disponibilité
up{job="hrbrain-frontend"}
```

## 🔧 Commandes utiles

```bash
# Voir les logs Prometheus
kubectl logs -n monitoring -l app=prometheus -f

# Voir les logs Grafana
kubectl logs -n monitoring -l app=grafana -f

# Redémarrer Prometheus
kubectl rollout restart deployment prometheus -n monitoring

# Redémarrer Grafana
kubectl rollout restart deployment grafana -n monitoring

# Vérifier les métriques Node Exporter
kubectl exec -n monitoring -it daemonset/node-exporter -- wget -O- http://localhost:9100/metrics

# Vérifier les métriques kube-state-metrics
kubectl exec -n monitoring -it deployment/kube-state-metrics -- wget -O- http://localhost:8080/metrics
```

## 🗑️ Désinstallation

```bash
cd k8s
./undeploy-monitoring.sh
```

Ou manuellement:
```bash
kubectl delete namespace monitoring
```

## 📚 Documentation complète

Pour plus de détails, voir: `README-monitoring.md`

## 🆘 Troubleshooting rapide

### Prometheus ne démarre pas
```bash
kubectl describe pod -n monitoring -l app=prometheus
kubectl logs -n monitoring -l app=prometheus
```

### Grafana ne se connecte pas à Prometheus
```bash
# Tester la connexion depuis Grafana
kubectl exec -n monitoring -it deployment/grafana -- wget -O- http://prometheus.monitoring.svc.cluster.local:9090/-/healthy
```

### Node Exporter manquant sur un node
```bash
# Vérifier le DaemonSet
kubectl get ds -n monitoring
kubectl describe ds node-exporter -n monitoring

# Vérifier les nodes
kubectl get nodes
```

### Targets Prometheus "DOWN"
```bash
# Vérifier les logs Prometheus
kubectl logs -n monitoring -l app=prometheus | grep -i error

# Vérifier la config
kubectl get configmap prometheus-config -n monitoring -o yaml
```

## ✅ Checklist de vérification

- [ ] Namespace `monitoring` créé
- [ ] 4 pods Node Exporter (1 par node)
- [ ] 1 pod kube-state-metrics Running
- [ ] 1 pod Prometheus Running
- [ ] 1 pod Grafana Running
- [ ] Prometheus accessible sur port 30090
- [ ] Grafana accessible sur port 30300
- [ ] Tous les targets Prometheus "UP"
- [ ] Dashboard Grafana visible
- [ ] Métriques des 4 nodes visibles

## 🎯 Prochaines étapes

1. **Ajouter des métriques custom au Backend NestJS**
   - Installer `prom-client`
   - Créer endpoint `/metrics`
   - Ajouter annotations Prometheus

2. **Importer des dashboards Grafana**
   - Node Exporter Full (ID: 1860)
   - Kubernetes Cluster Monitoring (ID: 7249)

3. **Configurer Alertmanager** (optionnel)
   - Envoyer des alertes par email
   - Intégration Slack/Discord

4. **Ajouter un PersistentVolume pour Prometheus**
   - Conserver les données après redémarrage
   - Utiliser NFS ou local storage

---

**Créé le**: 2026-05-04  
**Version**: 1.0  
**Auteur**: HRBrain DevOps Team
