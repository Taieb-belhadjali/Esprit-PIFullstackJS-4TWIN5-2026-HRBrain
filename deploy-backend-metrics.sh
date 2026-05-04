#!/bin/bash

# ═══════════════════════════════════════════════════════════════════
# Script de déploiement des métriques Backend
# ═══════════════════════════════════════════════════════════════════

echo "🚀 Déploiement des métriques Backend..."
echo ""

# 1. Installer prom-client
echo "📦 Installation de prom-client..."
cd BackOffice
npm install
cd ..
echo ""

# 2. Build de la nouvelle image Docker
echo "🐳 Build de l'image Docker avec métriques..."
cd BackOffice
docker build -t mouadh08/hrbrain-backend:metrics .
docker tag mouadh08/hrbrain-backend:metrics mouadh08/hrbrain-backend:latest
cd ..
echo ""

# 3. Push de l'image
echo "📤 Push de l'image sur Docker Hub..."
docker push mouadh08/hrbrain-backend:metrics
docker push mouadh08/hrbrain-backend:latest
echo ""

# 4. Mettre à jour la config Prometheus
echo "🔧 Mise à jour de la configuration Prometheus..."
kubectl apply -f k8s/prometheus-configmap.yaml
kubectl apply -f k8s/prometheus-rules.yaml
echo ""

# 5. Redémarrer Prometheus
echo "🔄 Redémarrage de Prometheus..."
kubectl rollout restart deployment prometheus -n monitoring
kubectl wait --for=condition=ready pod -l app=prometheus -n monitoring --timeout=60s
echo ""

# 6. Mettre à jour le deployment backend
echo "🔧 Mise à jour du deployment backend..."
kubectl apply -f k8s/backend-deployment.yaml
echo ""

# 7. Redémarrer le backend
echo "🔄 Redémarrage du backend..."
kubectl rollout restart deployment backend -n hrbrain
kubectl wait --for=condition=ready pod -l app=backend -n hrbrain --timeout=120s
echo ""

echo "✅ Déploiement terminé !"
echo ""
echo "Vérifications:"
echo "1. Backend /metrics: kubectl exec -n hrbrain -it deployment/backend -- wget -O- http://localhost:3000/metrics"
echo "2. Prometheus targets: http://192.168.1.12:30090/targets"
echo ""
