#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# Script de vérification de la configuration Jenkins
# Usage : ./verify-jenkins.sh
# ─────────────────────────────────────────────────────────────────

set -e

JENKINS_URL="http://localhost:8080"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Vérification de la configuration Jenkins pour HRBrain"
echo "========================================================"

# ── 1. Prérequis système ─────────────────────────────────────────
echo ""
echo "📋 1. Prérequis système"

check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "  ${GREEN}✅${NC} $1 : $(command -v $1)"
        return 0
    else
        echo -e "  ${RED}❌${NC} $1 : non trouvé"
        return 1
    fi
}

check_command node
check_command npm
check_command docker
check_command kubectl

# Jenkins service
if systemctl is-active --quiet jenkins; then
    echo -e "  ${GREEN}✅${NC} Jenkins : actif"
else
    echo -e "  ${RED}❌${NC} Jenkins : inactif"
fi

# Jenkins user in docker group
if groups jenkins | grep -q docker; then
    echo -e "  ${GREEN}✅${NC} jenkins dans groupe docker"
else
    echo -e "  ${YELLOW}⚠️${NC}  jenkins pas dans groupe docker"
    echo "      → sudo usermod -aG docker jenkins && sudo systemctl restart jenkins"
fi

# ── 2. Connectivité Jenkins ──────────────────────────────────────
echo ""
echo "🌐 2. Connectivité Jenkins"

if curl -s -o /dev/null -w "%{http_code}" ${JENKINS_URL} | grep -q "200\|403"; then
    echo -e "  ${GREEN}✅${NC} Jenkins accessible sur ${JENKINS_URL}"
else
    echo -e "  ${RED}❌${NC} Jenkins non accessible sur ${JENKINS_URL}"
fi

# ── 3. Plugins Jenkins ───────────────────────────────────────────
echo ""
echo "📦 3. Plugins Jenkins requis"

REQUIRED_PLUGINS=(
    "workflow-aggregator:Pipeline"
    "git:Git"
    "docker-workflow:Docker Pipeline"
    "kubernetes-cli:Kubernetes CLI"
    "sonar:SonarQube Scanner"
    "github:GitHub Integration"
)

echo "  ⚠️  Vérification manuelle requise :"
echo "      ${JENKINS_URL}/pluginManager/installed"
echo ""
for plugin in "${REQUIRED_PLUGINS[@]}"; do
    echo "    - ${plugin%%:*} (${plugin##*:})"
done

# ── 4. Credentials ───────────────────────────────────────────────
echo ""
echo "🔐 4. Credentials Jenkins"

echo "  ⚠️  Vérification manuelle requise :"
echo "      ${JENKINS_URL}/credentials/"
echo ""
echo "    - dockerhub-credentials (Username with password)"
echo "    - kubeconfig (Secret file)"

# ── 5. Jobs Jenkins ──────────────────────────────────────────────
echo ""
echo "🔨 5. Jobs Jenkins"

REQUIRED_JOBS=(
    "hrbrain-ci-backend"
    "hrbrain-cd-backend"
    "hrbrain-ci-frontend"
    "hrbrain-cd-frontend"
)

echo "  ⚠️  Vérification manuelle requise :"
echo "      ${JENKINS_URL}"
echo ""
for job in "${REQUIRED_JOBS[@]}"; do
    echo "    - $job"
done

# ── 6. Connectivité Kubernetes ───────────────────────────────────
echo ""
echo "☸️  6. Connectivité Kubernetes"

if kubectl cluster-info &> /dev/null; then
    echo -e "  ${GREEN}✅${NC} kubectl peut accéder au cluster"
    kubectl get nodes --no-headers | while read line; do
        node=$(echo $line | awk '{print $1}')
        status=$(echo $line | awk '{print $2}')
        if [ "$status" = "Ready" ]; then
            echo -e "    ${GREEN}✅${NC} $node : $status"
        else
            echo -e "    ${RED}❌${NC} $node : $status"
        fi
    done
else
    echo -e "  ${RED}❌${NC} kubectl ne peut pas accéder au cluster"
    echo "      → Vérifier ~/.kube/config"
fi

# ── 7. Application HRBrain ───────────────────────────────────────
echo ""
echo "🚀 7. Application HRBrain"

if kubectl get namespace hrbrain &> /dev/null; then
    echo -e "  ${GREEN}✅${NC} Namespace hrbrain existe"
    
    # Backend
    BACKEND_READY=$(kubectl get deployment backend -n hrbrain -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
    BACKEND_DESIRED=$(kubectl get deployment backend -n hrbrain -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")
    if [ "$BACKEND_READY" = "$BACKEND_DESIRED" ] && [ "$BACKEND_READY" != "0" ]; then
        echo -e "    ${GREEN}✅${NC} Backend : $BACKEND_READY/$BACKEND_DESIRED pods ready"
    else
        echo -e "    ${YELLOW}⚠️${NC}  Backend : $BACKEND_READY/$BACKEND_DESIRED pods ready"
    fi
    
    # Frontend
    FRONTEND_READY=$(kubectl get deployment frontend -n hrbrain -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
    FRONTEND_DESIRED=$(kubectl get deployment frontend -n hrbrain -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")
    if [ "$FRONTEND_READY" = "$FRONTEND_DESIRED" ] && [ "$FRONTEND_READY" != "0" ]; then
        echo -e "    ${GREEN}✅${NC} Frontend : $FRONTEND_READY/$FRONTEND_DESIRED pods ready"
    else
        echo -e "    ${YELLOW}⚠️${NC}  Frontend : $FRONTEND_READY/$FRONTEND_DESIRED pods ready"
    fi
    
    # Ollama
    OLLAMA_READY=$(kubectl get deployment ollama -n hrbrain -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
    if [ "$OLLAMA_READY" = "1" ]; then
        echo -e "    ${GREEN}✅${NC} Ollama : 1/1 pod ready"
    else
        echo -e "    ${YELLOW}⚠️${NC}  Ollama : $OLLAMA_READY/1 pod ready"
    fi
else
    echo -e "  ${RED}❌${NC} Namespace hrbrain n'existe pas"
fi

# ── 8. Tests de connectivité ─────────────────────────────────────
echo ""
echo "🧪 8. Tests de connectivité"

# Récupérer l'IP du premier node
NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}' 2>/dev/null || echo "")

if [ -n "$NODE_IP" ]; then
    # Test Backend
    if curl -s -o /dev/null -w "%{http_code}" http://${NODE_IP}:30000/health | grep -q "200"; then
        echo -e "  ${GREEN}✅${NC} Backend accessible : http://${NODE_IP}:30000/health"
    else
        echo -e "  ${YELLOW}⚠️${NC}  Backend non accessible : http://${NODE_IP}:30000/health"
    fi
    
    # Test Frontend
    if curl -s -o /dev/null -w "%{http_code}" http://${NODE_IP}:30080 | grep -q "200"; then
        echo -e "  ${GREEN}✅${NC} Frontend accessible : http://${NODE_IP}:30080"
    else
        echo -e "  ${YELLOW}⚠️${NC}  Frontend non accessible : http://${NODE_IP}:30080"
    fi
else
    echo -e "  ${RED}❌${NC} Impossible de récupérer l'IP du node"
fi

# ── 9. Résumé ────────────────────────────────────────────────────
echo ""
echo "========================================================"
echo "📊 Résumé de la vérification"
echo ""
echo "✅ = OK | ⚠️  = Attention | ❌ = Erreur"
echo ""
echo "Pour finaliser la configuration :"
echo "  1. Installer les plugins manquants"
echo "  2. Créer les credentials (dockerhub-credentials, kubeconfig)"
echo "  3. Créer les 4 jobs Jenkins"
echo "  4. Lancer un build test"
echo ""
echo "📖 Guide complet : jenkins/SETUP-JENKINS.md"
echo "========================================================"
