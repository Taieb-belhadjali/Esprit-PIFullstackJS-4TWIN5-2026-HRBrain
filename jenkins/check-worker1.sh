#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# Script de vérification rapide pour worker-1
# Usage : ./check-worker1.sh
# ─────────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🔍 Vérification Worker-1 (Laptop) - HRBrain              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ── 1. Informations système ──────────────────────────────────────
echo -e "${BLUE}📋 1. Informations système${NC}"
echo "  Hostname : $(hostname)"
echo "  IP       : $(hostname -I | awk '{print $1}')"
echo "  OS       : $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
echo ""

# ── 2. Prérequis ─────────────────────────────────────────────────
echo -e "${BLUE}🔧 2. Prérequis${NC}"

# Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    if [[ "$NODE_VERSION" == "v20."* ]]; then
        echo -e "  ${GREEN}✅${NC} Node.js : $NODE_VERSION"
    else
        echo -e "  ${YELLOW}⚠️${NC}  Node.js : $NODE_VERSION (attendu v20.x)"
    fi
else
    echo -e "  ${RED}❌${NC} Node.js : non trouvé"
fi

# npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "  ${GREEN}✅${NC} npm     : v$NPM_VERSION"
else
    echo -e "  ${RED}❌${NC} npm     : non trouvé"
fi

# Docker
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | tr -d ',')
    echo -e "  ${GREEN}✅${NC} Docker  : $DOCKER_VERSION"
    
    # Vérifier que Docker fonctionne
    if docker ps &> /dev/null; then
        echo -e "  ${GREEN}✅${NC} Docker daemon actif"
    else
        echo -e "  ${RED}❌${NC} Docker daemon non accessible"
    fi
else
    echo -e "  ${RED}❌${NC} Docker  : non trouvé"
fi

# kubectl
if command -v kubectl &> /dev/null; then
    KUBECTL_VERSION=$(kubectl version --client --short 2>/dev/null | cut -d' ' -f3)
    echo -e "  ${GREEN}✅${NC} kubectl : $KUBECTL_VERSION"
    
    # Vérifier la connexion au cluster
    if kubectl cluster-info &> /dev/null; then
        echo -e "  ${GREEN}✅${NC} Connexion au cluster K8s OK"
    else
        echo -e "  ${RED}❌${NC} Impossible de se connecter au cluster K8s"
    fi
else
    echo -e "  ${RED}❌${NC} kubectl : non trouvé"
fi

echo ""

# ── 3. Jenkins ───────────────────────────────────────────────────
echo -e "${BLUE}🏗️  3. Jenkins${NC}"

if systemctl is-active --quiet jenkins; then
    echo -e "  ${GREEN}✅${NC} Service Jenkins : actif"
    
    # Vérifier l'accès web
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 | grep -q "200\|403"; then
        echo -e "  ${GREEN}✅${NC} Interface web accessible : http://localhost:8080"
    else
        echo -e "  ${YELLOW}⚠️${NC}  Interface web non accessible"
    fi
    
    # Vérifier jenkins dans groupe docker
    if groups jenkins 2>/dev/null | grep -q docker; then
        echo -e "  ${GREEN}✅${NC} jenkins dans groupe docker"
    else
        echo -e "  ${YELLOW}⚠️${NC}  jenkins PAS dans groupe docker"
        echo -e "      ${YELLOW}→${NC} sudo usermod -aG docker jenkins && sudo systemctl restart jenkins"
    fi
else
    echo -e "  ${RED}❌${NC} Service Jenkins : inactif"
    echo -e "      ${YELLOW}→${NC} sudo systemctl start jenkins"
fi

echo ""

# ── 4. Cluster Kubernetes ────────────────────────────────────────
echo -e "${BLUE}☸️  4. Cluster Kubernetes${NC}"

if kubectl get nodes &> /dev/null; then
    echo ""
    kubectl get nodes --no-headers | while read line; do
        node=$(echo $line | awk '{print $1}')
        status=$(echo $line | awk '{print $2}')
        ip=$(echo $line | awk '{print $6}')
        
        if [ "$status" = "Ready" ]; then
            echo -e "  ${GREEN}✅${NC} $node : $status ($ip)"
        else
            echo -e "  ${RED}❌${NC} $node : $status ($ip)"
        fi
    done
else
    echo -e "  ${RED}❌${NC} Impossible d'accéder au cluster"
fi

echo ""

# ── 5. Application HRBrain ───────────────────────────────────────
echo -e "${BLUE}🚀 5. Application HRBrain${NC}"

if kubectl get namespace hrbrain &> /dev/null; then
    echo -e "  ${GREEN}✅${NC} Namespace hrbrain existe"
    echo ""
    
    # Backend
    if kubectl get deployment backend -n hrbrain &> /dev/null; then
        BACKEND_READY=$(kubectl get deployment backend -n hrbrain -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
        BACKEND_DESIRED=$(kubectl get deployment backend -n hrbrain -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")
        
        if [ "$BACKEND_READY" = "$BACKEND_DESIRED" ] && [ "$BACKEND_READY" != "0" ]; then
            echo -e "  ${GREEN}✅${NC} Backend  : $BACKEND_READY/$BACKEND_DESIRED pods ready"
        else
            echo -e "  ${YELLOW}⚠️${NC}  Backend  : $BACKEND_READY/$BACKEND_DESIRED pods ready"
        fi
    else
        echo -e "  ${RED}❌${NC} Backend  : deployment non trouvé"
    fi
    
    # Frontend
    if kubectl get deployment frontend -n hrbrain &> /dev/null; then
        FRONTEND_READY=$(kubectl get deployment frontend -n hrbrain -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
        FRONTEND_DESIRED=$(kubectl get deployment frontend -n hrbrain -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")
        
        if [ "$FRONTEND_READY" = "$FRONTEND_DESIRED" ] && [ "$FRONTEND_READY" != "0" ]; then
            echo -e "  ${GREEN}✅${NC} Frontend : $FRONTEND_READY/$FRONTEND_DESIRED pods ready"
        else
            echo -e "  ${YELLOW}⚠️${NC}  Frontend : $FRONTEND_READY/$FRONTEND_DESIRED pods ready"
        fi
    else
        echo -e "  ${RED}❌${NC} Frontend : deployment non trouvé"
    fi
    
    # Ollama
    if kubectl get deployment ollama -n hrbrain &> /dev/null; then
        OLLAMA_READY=$(kubectl get deployment ollama -n hrbrain -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
        
        if [ "$OLLAMA_READY" = "1" ]; then
            echo -e "  ${GREEN}✅${NC} Ollama   : 1/1 pod ready"
        else
            echo -e "  ${YELLOW}⚠️${NC}  Ollama   : $OLLAMA_READY/1 pod ready"
        fi
    else
        echo -e "  ${RED}❌${NC} Ollama   : deployment non trouvé"
    fi
else
    echo -e "  ${RED}❌${NC} Namespace hrbrain n'existe pas"
fi

echo ""

# ── 6. Tests de connectivité ─────────────────────────────────────
echo -e "${BLUE}🧪 6. Tests de connectivité${NC}"

NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}' 2>/dev/null || echo "")

if [ -n "$NODE_IP" ]; then
    # Test Backend
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://${NODE_IP}:30000/health 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "  ${GREEN}✅${NC} Backend  : http://${NODE_IP}:30000/health (HTTP $HTTP_CODE)"
    else
        echo -e "  ${YELLOW}⚠️${NC}  Backend  : http://${NODE_IP}:30000/health (HTTP $HTTP_CODE)"
    fi
    
    # Test Frontend
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://${NODE_IP}:30080 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "  ${GREEN}✅${NC} Frontend : http://${NODE_IP}:30080 (HTTP $HTTP_CODE)"
    else
        echo -e "  ${YELLOW}⚠️${NC}  Frontend : http://${NODE_IP}:30080 (HTTP $HTTP_CODE)"
    fi
    
    # Test Ollama
    if curl -s http://192.168.1.13:11434/api/tags &> /dev/null; then
        echo -e "  ${GREEN}✅${NC} Ollama   : http://192.168.1.13:11434/api/tags"
    else
        echo -e "  ${YELLOW}⚠️${NC}  Ollama   : http://192.168.1.13:11434/api/tags (non accessible)"
    fi
else
    echo -e "  ${RED}❌${NC} Impossible de récupérer l'IP du node"
fi

echo ""

# ── 7. Résumé et prochaines étapes ───────────────────────────────
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  📊 Résumé                                                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Compter les problèmes
ISSUES=0

if ! command -v node &> /dev/null; then ((ISSUES++)); fi
if ! command -v npm &> /dev/null; then ((ISSUES++)); fi
if ! command -v docker &> /dev/null; then ((ISSUES++)); fi
if ! command -v kubectl &> /dev/null; then ((ISSUES++)); fi
if ! systemctl is-active --quiet jenkins; then ((ISSUES++)); fi
if ! groups jenkins 2>/dev/null | grep -q docker; then ((ISSUES++)); fi

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ Tous les prérequis sont OK !${NC}"
    echo ""
    echo -e "${BLUE}📖 Prochaines étapes :${NC}"
    echo ""
    echo "  1. Ouvrir Jenkins : http://192.168.1.11:8080"
    echo "  2. Installer les plugins (Docker Pipeline, Kubernetes CLI, GitHub)"
    echo "  3. Créer les credentials (dockerhub-credentials, kubeconfig)"
    echo "  4. Créer les 4 jobs Jenkins"
    echo "  5. Tester le pipeline"
    echo ""
    echo -e "${BLUE}📚 Guide complet : jenkins/GUIDE-WORKER1.md${NC}"
else
    echo -e "${YELLOW}⚠️  $ISSUES problème(s) détecté(s)${NC}"
    echo ""
    echo -e "${BLUE}🔧 Actions recommandées :${NC}"
    echo ""
    
    if ! groups jenkins 2>/dev/null | grep -q docker; then
        echo "  • Ajouter jenkins au groupe docker :"
        echo "    sudo usermod -aG docker jenkins"
        echo "    sudo systemctl restart jenkins"
        echo ""
    fi
    
    if ! systemctl is-active --quiet jenkins; then
        echo "  • Démarrer Jenkins :"
        echo "    sudo systemctl start jenkins"
        echo ""
    fi
fi

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
