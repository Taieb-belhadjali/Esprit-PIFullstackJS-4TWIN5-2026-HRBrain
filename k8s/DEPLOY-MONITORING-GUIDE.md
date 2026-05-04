# 📊 Guide de Déploiement - Stack Monitoring

## 🎯 Objectif
Déployer Prometheus + Grafana pour monitorer le cluster K8s HRBrain et les applications.

---

## 📋 Prérequis

✅ Cluster K8s opérationnel avec 4 nodes:
- **master**: 192.168.1.10
- **worker-1**: 192.168.1.11 (Ahmed)
- **worker-2**: 192.168.1.12 (Taieb)
- **worker-3**: 192.168.1.13 (Ollama)

✅ kubectl configuré sur le master

✅ Applications HRBrain déployées dans namespace `hrbrain`:
- Backend (2 replicas)
- Frontend (2 replicas)
- Jenkins
- SonarQube

---

## 🚀 Étape 1: Récupérer les fichiers

### Sur le master (192.168.1.10)

```bash
# Se connecter au master
ssh mouadh@192.168.1.10

# Aller dans le répertoire du projet
cd ~/ZeroOne-Studio

# Pull les derniers changements
git pull origin main

# Vérifier que les fichiers monitoring sont présents
ls -la k8s/*monitoring* k8s/prometheus* k8s/grafana* k8s/node-exporter* k8s/kube-state*
```

**Résultat attendu:**
```
k8s/MONITORING-QUICKSTART.md
k8s/README-monitoring.md
k8s/check-monitoring.sh
k8s/deploy-monitoring.sh
k8s/grafana-configmap.yaml
k8s/grafana-deployment.yaml
k8s/kube-state-metrics.yaml
k8s/monitoring-namespace.yaml
k8s/node-exporter.yaml
k8s/prometheus-configmap.yaml
k8s/prometheus-deployment.yaml
k8s/prometheus-rbac.yaml
k8s/prometheus-rules.yaml
k8s/undeploy-monitoring.sh
```

---

## 🚀 Étape 2: Rendre les scripts exécutables

```bash
cd k8s
chmod +x deploy-monitoring.sh check-monitoring.sh undeploy-monitoring.sh
```

---

## 🚀 Étape 3: Déployer le stack

```bash
./deploy-monitoring.sh
```

**Ce que fait le script:**
1. ✅ Crée le namespace `monitoring`
2. ✅ Déploie Node Exporter (DaemonSet sur les 4 nodes)
3. ✅ Déploie kube-state-metrics
4. ✅ Déploie Prometheus avec RBAC + Config + Rules
5. ✅ Déploie Grafana avec datasource + dashboard
6. ✅ Attend que tous les pods soient Ready
7. ✅ Affiche les informations d'accès

**Sortie attendue:**
```
🚀 Déploiement du stack de monitoring...

📦 Création du namespace monitoring...
namespace/monitoring created

📊 Déploiement de Node Exporter...
daemonset.apps/node-exporter created
service/node-exporter created

📊 Déploiement de kube-state-metrics...
serviceaccount/kube-state-metrics created
clusterrole.rbac.authorization.k8s.io/kube-state-metrics created
clusterrolebinding.rbac.authorization.k8s.io/kube-state-metrics created
deployment.apps/kube-state-metrics created
service/kube-state-metrics created

🔍 Déploiement de Prometheus...
serviceaccount/prometheus created
clusterrole.rbac.authorization.k8s.io/prometheus created
clusterrolebinding.rbac.authorization.k8s.io/prometheus created
configmap/prometheus-rules created
configmap/prometheus-config created
deployment.apps/prometheus created
service/prometheus created

📈 Déploiement de Grafana...
configmap/grafana-datasources created
configmap/grafana-dashboards-config created
configmap/grafana-dashboard-k8s-cluster created
deployment.apps/grafana created
service/grafana created

⏳ Attente du démarrage des pods...
Cela peut prendre 1-2 minutes...

pod/node-exporter-xxx condition met
pod/node-exporter-yyy condition met
pod/node-exporter-zzz condition met
pod/node-exporter-www condition met
pod/kube-state-metrics-xxx condition met
pod/prometheus-xxx condition met
pod/grafana-xxx condition met

✅ Déploiement terminé !

═══════════════════════════════════════════════════════════════════
📊 INFORMATIONS D'ACCÈS
═══════════════════════════════════════════════════════════════════

Prometheus:
  URL: http://192.168.1.12:30090
  URL: http://192.168.1.11:30090

Grafana:
  URL: http://192.168.1.12:30300
  URL: http://192.168.1.11:30300
  Username: admin
  Password: hrbrain2026

═══════════════════════════════════════════════════════════════════
```

---

## 🚀 Étape 4: Vérifier l'installation

```bash
./check-monitoring.sh
```

**Vérifications effectuées:**
- ✅ Namespace `monitoring` existe
- ✅ Tous les pods sont Running
- ✅ Node Exporter déployé sur les 4 nodes
- ✅ Prometheus accessible et healthy
- ✅ Grafana accessible et healthy
- ✅ Targets Prometheus UP

**Sortie attendue:**
```
═══════════════════════════════════════════════════════════════════
🔍 VÉRIFICATION DU STACK DE MONITORING
═══════════════════════════════════════════════════════════════════

📦 Namespace monitoring:
✅ Namespace 'monitoring' existe

📦 État des pods:
NAME                                  READY   STATUS    RESTARTS   AGE
grafana-xxx                           1/1     Running   0          2m
kube-state-metrics-xxx                1/1     Running   0          2m
node-exporter-aaa                     1/1     Running   0          2m
node-exporter-bbb                     1/1     Running   0          2m
node-exporter-ccc                     1/1     Running   0          2m
node-exporter-ddd                     1/1     Running   0          2m
prometheus-xxx                        1/1     Running   0          2m

📊 Node Exporter (DaemonSet):
Nodes dans le cluster: 4
Pods Node Exporter: 4
✅ Node Exporter déployé sur tous les nodes

🔍 Test de connexion à Prometheus:
✅ Prometheus est accessible et healthy

📈 Test de connexion à Grafana:
✅ Grafana est accessible et healthy

📊 RÉSUMÉ:
Pods total: 7
Pods Running: 7
✅ Tous les pods sont Running
```

---

## 🚀 Étape 5: Accéder à Prometheus

### Ouvrir dans le navigateur:
```
http://192.168.1.12:30090
```

### Vérifier les targets:
1. Cliquer sur **Status** → **Targets**
2. Vérifier que tous les targets sont **UP**:
   - ✅ prometheus (1/1 up)
   - ✅ kubernetes-apiservers (1/1 up)
   - ✅ kubernetes-nodes (4/4 up)
   - ✅ node-exporter (4/4 up)
   - ✅ kube-state-metrics (1/1 up)
   - ✅ hrbrain-backend (2/2 up)
   - ✅ hrbrain-frontend (2/2 up)

### Tester une requête PromQL:
1. Aller dans **Graph**
2. Entrer la requête:
```promql
100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
```
3. Cliquer sur **Execute**
4. Voir le graphique du CPU usage par node

---

## 🚀 Étape 6: Accéder à Grafana

### Ouvrir dans le navigateur:
```
http://192.168.1.12:30300
```

### Se connecter:
- **Username**: `admin`
- **Password**: `hrbrain2026`

### Voir le dashboard:
1. Cliquer sur **Dashboards** (icône 4 carrés)
2. Sélectionner **Kubernetes Cluster Overview**
3. Voir les graphiques:
   - 📊 Node CPU Usage (4 nodes)
   - 📊 Node Memory Usage (4 nodes)
   - 📊 Node Disk Usage (4 nodes)
   - 📊 HRBrain Running Pods

### Importer des dashboards communautaires (optionnel):
1. Cliquer sur **Dashboards** → **Import**
2. Entrer l'ID du dashboard:
   - **1860**: Node Exporter Full
   - **7249**: Kubernetes Cluster Monitoring
   - **6417**: Kubernetes Pod Monitoring
3. Sélectionner la datasource **Prometheus**
4. Cliquer sur **Import**

---

## 🚀 Étape 7: Tester les alertes (optionnel)

### Simuler un pod down:
```bash
# Scaler le backend à 0
kubectl scale deployment backend -n hrbrain --replicas=0

# Attendre 2 minutes
sleep 120

# Vérifier l'alerte dans Prometheus
# Ouvrir: http://192.168.1.12:30090
# Aller dans: Alerts
# L'alerte "BackendDown" devrait être FIRING

# Restaurer
kubectl scale deployment backend -n hrbrain --replicas=2
```

---

## 📊 Résumé de l'architecture déployée

```
┌─────────────────────────────────────────────────────────────┐
│                    Grafana (Port 30300)                     │
│              Dashboards + Visualisations                    │
│         http://192.168.1.12:30300 (admin/hrbrain2026)      │
└─────────────────────────────────────────────────────────────┘
                            ↓ query
┌─────────────────────────────────────────────────────────────┐
│                  Prometheus (Port 30090)                    │
│           Collecte métriques toutes les 15s                 │
│              Rétention: 15 jours                            │
│              http://192.168.1.12:30090                      │
└─────────────────────────────────────────────────────────────┘
         ↓                    ↓                    ↓
┌──────────────────┐  ┌──────────────┐  ┌──────────────────┐
│  Node Exporter   │  │ kube-state   │  │  Applications    │
│   (DaemonSet)    │  │  -metrics    │  │                  │
│                  │  │              │  │  - Backend       │
│ master (10)      │  │ Métriques K8s│  │  - Frontend      │
│ worker-1 (11)    │  │ - Pods       │  │  - Jenkins       │
│ worker-2 (12)    │  │ - Deployments│  │  - SonarQube     │
│ worker-3 (13)    │  │ - Services   │  │                  │
│                  │  │              │  │                  │
│ Métriques OS:    │  │              │  │                  │
│ - CPU            │  │              │  │                  │
│ - RAM            │  │              │  │                  │
│ - Disk           │  │              │  │                  │
│ - Network        │  │              │  │                  │
└──────────────────┘  └──────────────┘  └──────────────────┘
```

---

## ✅ Checklist finale

- [ ] Namespace `monitoring` créé
- [ ] 4 pods Node Exporter Running (1 par node)
- [ ] 1 pod kube-state-metrics Running
- [ ] 1 pod Prometheus Running
- [ ] 1 pod Grafana Running
- [ ] Prometheus accessible: http://192.168.1.12:30090
- [ ] Grafana accessible: http://192.168.1.12:30300
- [ ] Tous les targets Prometheus "UP"
- [ ] Dashboard Grafana "Kubernetes Cluster Overview" visible
- [ ] Métriques des 4 nodes visibles dans Grafana

---

## 🆘 En cas de problème

### Pods ne démarrent pas
```bash
# Voir les événements
kubectl get events -n monitoring --sort-by='.lastTimestamp'

# Voir les logs d'un pod
kubectl logs -n monitoring <pod-name>

# Décrire un pod
kubectl describe pod -n monitoring <pod-name>
```

### Targets Prometheus "DOWN"
```bash
# Vérifier les logs Prometheus
kubectl logs -n monitoring -l app=prometheus | grep -i error

# Vérifier la config Prometheus
kubectl get configmap prometheus-config -n monitoring -o yaml
```

### Grafana ne se connecte pas à Prometheus
```bash
# Tester la connexion depuis Grafana
kubectl exec -n monitoring -it deployment/grafana -- wget -O- http://prometheus.monitoring.svc.cluster.local:9090/-/healthy
```

### Redémarrer un composant
```bash
# Redémarrer Prometheus
kubectl rollout restart deployment prometheus -n monitoring

# Redémarrer Grafana
kubectl rollout restart deployment grafana -n monitoring

# Redémarrer Node Exporter
kubectl rollout restart daemonset node-exporter -n monitoring
```

---

## 🗑️ Désinstallation

Si besoin de tout supprimer:
```bash
cd k8s
./undeploy-monitoring.sh
```

Ou manuellement:
```bash
kubectl delete namespace monitoring
```

---

## 📚 Documentation

- **Quick Start**: `MONITORING-QUICKSTART.md`
- **Documentation complète**: `README-monitoring.md`
- **Ce guide**: `DEPLOY-MONITORING-GUIDE.md`

---

**Bon monitoring ! 📊🚀**
