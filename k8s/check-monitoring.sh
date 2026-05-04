#!/bin/bash

# ═══════════════════════════════════════════════════════════════════
# HRBrain - Vérification du stack de monitoring
# ═══════════════════════════════════════════════════════════════════

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "═══════════════════════════════════════════════════════════════════"
echo -e "${YELLOW}🔍 VÉRIFICATION DU STACK DE MONITORING${NC}"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# 1. Vérifier le namespace
echo -e "${YELLOW}📦 Namespace monitoring:${NC}"
if kubectl get namespace monitoring &> /dev/null; then
    echo -e "${GREEN}✅ Namespace 'monitoring' existe${NC}"
else
    echo -e "${RED}❌ Namespace 'monitoring' n'existe pas${NC}"
    exit 1
fi
echo ""

# 2. Vérifier les pods
echo -e "${YELLOW}📦 État des pods:${NC}"
kubectl get pods -n monitoring -o wide
echo ""

# 3. Vérifier les services
echo -e "${YELLOW}🌐 Services:${NC}"
kubectl get svc -n monitoring
echo ""

# 4. Vérifier Node Exporter (DaemonSet)
echo -e "${YELLOW}📊 Node Exporter (DaemonSet):${NC}"
NODE_COUNT=$(kubectl get nodes --no-headers | wc -l)
NODE_EXPORTER_COUNT=$(kubectl get pods -n monitoring -l app=node-exporter --no-headers | wc -l)
echo "Nodes dans le cluster: $NODE_COUNT"
echo "Pods Node Exporter: $NODE_EXPORTER_COUNT"
if [ "$NODE_COUNT" -eq "$NODE_EXPORTER_COUNT" ]; then
    echo -e "${GREEN}✅ Node Exporter déployé sur tous les nodes${NC}"
else
    echo -e "${RED}⚠️  Node Exporter n'est pas déployé sur tous les nodes${NC}"
fi
echo ""

# 5. Tester l'accès à Prometheus
echo -e "${YELLOW}🔍 Test de connexion à Prometheus:${NC}"
PROMETHEUS_POD=$(kubectl get pods -n monitoring -l app=prometheus -o jsonpath='{.items[0].metadata.name}')
if [ -n "$PROMETHEUS_POD" ]; then
    if kubectl exec -n monitoring "$PROMETHEUS_POD" -- wget -q -O- http://localhost:9090/-/healthy &> /dev/null; then
        echo -e "${GREEN}✅ Prometheus est accessible et healthy${NC}"
    else
        echo -e "${RED}❌ Prometheus n'est pas accessible${NC}"
    fi
else
    echo -e "${RED}❌ Pod Prometheus introuvable${NC}"
fi
echo ""

# 6. Tester l'accès à Grafana
echo -e "${YELLOW}📈 Test de connexion à Grafana:${NC}"
GRAFANA_POD=$(kubectl get pods -n monitoring -l app=grafana -o jsonpath='{.items[0].metadata.name}')
if [ -n "$GRAFANA_POD" ]; then
    if kubectl exec -n monitoring "$GRAFANA_POD" -- wget -q -O- http://localhost:3000/api/health &> /dev/null; then
        echo -e "${GREEN}✅ Grafana est accessible et healthy${NC}"
    else
        echo -e "${RED}❌ Grafana n'est pas accessible${NC}"
    fi
else
    echo -e "${RED}❌ Pod Grafana introuvable${NC}"
fi
echo ""

# 7. Vérifier les targets Prometheus
echo -e "${YELLOW}🎯 Targets Prometheus:${NC}"
if [ -n "$PROMETHEUS_POD" ]; then
    echo "Récupération des targets depuis Prometheus..."
    kubectl exec -n monitoring "$PROMETHEUS_POD" -- wget -q -O- http://localhost:9090/api/v1/targets 2>/dev/null | grep -o '"health":"[^"]*"' | sort | uniq -c || echo "Impossible de récupérer les targets"
else
    echo -e "${RED}❌ Pod Prometheus introuvable${NC}"
fi
echo ""

# 8. Afficher les logs récents en cas d'erreur
echo -e "${YELLOW}📋 Logs récents (dernières 5 lignes par pod):${NC}"
for pod in $(kubectl get pods -n monitoring -o jsonpath='{.items[*].metadata.name}'); do
    echo ""
    echo -e "${YELLOW}Pod: $pod${NC}"
    kubectl logs -n monitoring "$pod" --tail=5 2>/dev/null || echo "Pas de logs disponibles"
done
echo ""

# 9. Informations d'accès
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

# 10. Résumé
echo -e "${YELLOW}📊 RÉSUMÉ:${NC}"
TOTAL_PODS=$(kubectl get pods -n monitoring --no-headers | wc -l)
RUNNING_PODS=$(kubectl get pods -n monitoring --field-selector=status.phase=Running --no-headers | wc -l)
echo "Pods total: $TOTAL_PODS"
echo "Pods Running: $RUNNING_PODS"

if [ "$TOTAL_PODS" -eq "$RUNNING_PODS" ]; then
    echo -e "${GREEN}✅ Tous les pods sont Running${NC}"
else
    echo -e "${RED}⚠️  Certains pods ne sont pas Running${NC}"
fi
echo ""
