#!/bin/bash

# ═══════════════════════════════════════════════════════════════════
# HRBrain - Déploiement Monitoring Stack (Prometheus + Grafana)
# ═══════════════════════════════════════════════════════════════════

set -e

echo "🚀 Déploiement du stack de monitoring..."
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Créer le namespace monitoring
echo -e "${YELLOW}📦 Création du namespace monitoring...${NC}"
kubectl apply -f monitoring-namespace.yaml
echo ""

# 2. Déployer Node Exporter (DaemonSet sur tous les nodes)
echo -e "${YELLOW}📊 Déploiement de Node Exporter...${NC}"
kubectl apply -f node-exporter.yaml
echo ""

# 3. Déployer kube-state-metrics
echo -e "${YELLOW}📊 Déploiement de kube-state-metrics...${NC}"
kubectl apply -f kube-state-metrics.yaml
echo ""

# 4. Déployer Prometheus
echo -e "${YELLOW}🔍 Déploiement de Prometheus...${NC}"
kubectl apply -f prometheus-rbac.yaml
kubectl apply -f prometheus-rules.yaml
kubectl apply -f prometheus-configmap.yaml
kubectl apply -f prometheus-deployment.yaml
echo ""

# 5. Déployer Grafana
echo -e "${YELLOW}📈 Déploiement de Grafana...${NC}"
kubectl apply -f grafana-configmap.yaml
kubectl apply -f grafana-deployment.yaml
echo ""

# 6. Attendre que les pods soient prêts
echo -e "${YELLOW}⏳ Attente du démarrage des pods...${NC}"
echo "Cela peut prendre 1-2 minutes..."
echo ""

kubectl wait --for=condition=ready pod -l app=node-exporter -n monitoring --timeout=120s || true
kubectl wait --for=condition=ready pod -l app=kube-state-metrics -n monitoring --timeout=120s || true
kubectl wait --for=condition=ready pod -l app=prometheus -n monitoring --timeout=120s || true
kubectl wait --for=condition=ready pod -l app=grafana -n monitoring --timeout=120s || true

echo ""
echo -e "${GREEN}✅ Déploiement terminé !${NC}"
echo ""

# 7. Afficher les informations d'accès
echo "═══════════════════════════════════════════════════════════════════"
echo -e "${GREEN}📊 INFORMATIONS D'ACCÈS${NC}"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo -e "${YELLOW}Prometheus:${NC}"
echo "  URL: http://192.168.1.12:30090"
echo "  URL: http://192.168.1.11:30090"
echo ""
echo -e "${YELLOW}Grafana:${NC}"
echo "  URL: http://192.168.1.12:30300"
echo "  URL: http://192.168.1.11:30300"
echo "  Username: admin"
echo "  Password: hrbrain2026"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# 8. Afficher l'état des pods
echo -e "${YELLOW}📦 État des pods monitoring:${NC}"
kubectl get pods -n monitoring -o wide
echo ""

# 9. Afficher les services
echo -e "${YELLOW}🌐 Services monitoring:${NC}"
kubectl get svc -n monitoring
echo ""

echo -e "${GREEN}✅ Stack de monitoring opérationnel !${NC}"
echo ""
echo "Prochaines étapes:"
echo "1. Accéder à Grafana: http://192.168.1.12:30300"
echo "2. Se connecter avec admin/hrbrain2026"
echo "3. Le dashboard 'Kubernetes Cluster Overview' est déjà configuré"
echo "4. Prometheus est accessible sur: http://192.168.1.12:30090"
echo ""
