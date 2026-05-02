#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# Script interactif de configuration Jenkins pour HRBrain
# Usage : ./start-configuration.sh
# ─────────────────────────────────────────────────────────────────

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Fonction pour afficher un titre
print_title() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  $1${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Fonction pour afficher une étape
print_step() {
    echo -e "${CYAN}▶ $1${NC}"
}

# Fonction pour afficher un succès
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Fonction pour afficher un avertissement
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Fonction pour afficher une erreur
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Fonction pour demander confirmation
ask_confirmation() {
    echo -e "${YELLOW}$1 (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        return 0
    else
        return 1
    fi
}

# Fonction pour attendre l'utilisateur
wait_user() {
    echo ""
    echo -e "${MAGENTA}Appuyez sur Entrée pour continuer...${NC}"
    read -r
}

# ══════════════════════════════════════════════════════════════════
# DÉBUT DU SCRIPT
# ══════════════════════════════════════════════════════════════════

clear

print_title "Configuration Jenkins pour HRBrain"

echo -e "${CYAN}Ce script va vous guider pas à pas pour configurer Jenkins.${NC}"
echo -e "${CYAN}Temps estimé : 15 minutes${NC}"
echo ""

if ! ask_confirmation "Voulez-vous commencer ?"; then
    echo "Configuration annulée."
    exit 0
fi

# ══════════════════════════════════════════════════════════════════
# ÉTAPE 1 : Vérification des prérequis
# ══════════════════════════════════════════════════════════════════

print_title "Étape 1/5 : Vérification des prérequis"

print_step "Vérification de Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js $NODE_VERSION"
else
    print_error "Node.js non trouvé"
    exit 1
fi

print_step "Vérification de npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm v$NPM_VERSION"
else
    print_error "npm non trouvé"
    exit 1
fi

print_step "Vérification de Docker..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | tr -d ',')
    print_success "Docker $DOCKER_VERSION"
else
    print_error "Docker non trouvé"
    exit 1
fi

print_step "Vérification de kubectl..."
if command -v kubectl &> /dev/null; then
    print_success "kubectl installé"
else
    print_error "kubectl non trouvé"
    exit 1
fi

print_step "Vérification de Jenkins..."
if systemctl is-active --quiet jenkins; then
    print_success "Jenkins actif"
else
    print_error "Jenkins inactif"
    exit 1
fi

print_success "Tous les prérequis sont OK !"
wait_user

# ══════════════════════════════════════════════════════════════════
# ÉTAPE 2 : Configuration Docker pour Jenkins
# ══════════════════════════════════════════════════════════════════

print_title "Étape 2/5 : Configuration Docker pour Jenkins"

print_step "Vérification si jenkins est dans le groupe docker..."
if groups jenkins 2>/dev/null | grep -q docker; then
    print_success "jenkins est déjà dans le groupe docker"
else
    print_warning "jenkins n'est pas dans le groupe docker"
    
    if ask_confirmation "Voulez-vous ajouter jenkins au groupe docker ?"; then
        print_step "Ajout de jenkins au groupe docker..."
        sudo usermod -aG docker jenkins
        print_success "jenkins ajouté au groupe docker"
        
        print_step "Redémarrage de Jenkins..."
        sudo systemctl restart jenkins
        print_success "Jenkins redémarré"
        
        print_step "Attente de 30 secondes..."
        sleep 30
        
        print_success "Configuration Docker terminée"
    else
        print_warning "Configuration Docker ignorée"
    fi
fi

wait_user

# ══════════════════════════════════════════════════════════════════
# ÉTAPE 3 : Vérification du kubeconfig
# ══════════════════════════════════════════════════════════════════

print_title "Étape 3/5 : Vérification du kubeconfig"

print_step "Vérification du fichier kubeconfig..."
if [ -f ~/.kube/config ]; then
    print_success "Fichier kubeconfig trouvé : ~/.kube/config"
    
    print_step "Test de connexion au cluster..."
    if kubectl get nodes &> /dev/null; then
        print_success "Connexion au cluster OK"
        kubectl get nodes
    else
        print_error "Impossible de se connecter au cluster"
    fi
else
    print_warning "Fichier kubeconfig non trouvé"
    
    if ask_confirmation "Voulez-vous copier le kubeconfig depuis master (192.168.1.10) ?"; then
        print_step "Copie du kubeconfig depuis master..."
        scp ahmed@192.168.1.10:~/.kube/config ~/.kube/config
        print_success "Kubeconfig copié"
    else
        print_warning "Kubeconfig non copié - vous devrez le faire manuellement"
    fi
fi

wait_user

# ══════════════════════════════════════════════════════════════════
# ÉTAPE 4 : Instructions pour l'interface web
# ══════════════════════════════════════════════════════════════════

print_title "Étape 4/5 : Configuration via l'interface web"

echo -e "${CYAN}Les étapes suivantes doivent être effectuées via l'interface web Jenkins.${NC}"
echo ""

print_step "1. Installer les plugins Jenkins"
echo ""
echo "   a. Ouvrir : http://192.168.1.11:8080"
echo "   b. Aller dans : Manage Jenkins → Manage Plugins → Available"
echo "   c. Rechercher et installer :"
echo "      - Docker Pipeline"
echo "      - Kubernetes CLI"
echo "      - GitHub Integration"
echo "   d. Cocher : 'Restart Jenkins when installation is complete'"
echo ""

wait_user

print_step "2. Créer les credentials"
echo ""
echo "   A. DockerHub Credentials"
echo "      URL : http://192.168.1.11:8080/credentials/store/system/domain/_/newCredentials"
echo ""
echo "      Kind: Username with password"
echo "      Username: mouadh08"
echo "      Password: [votre mot de passe DockerHub]"
echo "      ID: dockerhub-credentials"
echo ""

wait_user

echo "   B. Kubeconfig Credential"
echo "      URL : http://192.168.1.11:8080/credentials/store/system/domain/_/newCredentials"
echo ""
echo "      Kind: Secret file"
echo "      File: ~/.kube/config"
echo "      ID: kubeconfig"
echo ""

wait_user

print_step "3. Créer les 4 jobs Jenkins"
echo ""
echo "   Pour CHAQUE job :"
echo "   a. New Item → [Nom du job] → Pipeline → OK"
echo "   b. Pipeline → Definition : Pipeline script from SCM"
echo "   c. SCM : Git"
echo "   d. Repository URL : https://github.com/VOTRE_USER/hrbrain.git"
echo "   e. Branch : */main"
echo "   f. Script Path : [voir ci-dessous]"
echo ""
echo "   Jobs à créer :"
echo "   1. hrbrain-ci-backend  → jenkins/Jenkinsfile.ci.back"
echo "   2. hrbrain-cd-backend  → jenkins/Jenkinsfile.cd.back"
echo "   3. hrbrain-ci-frontend → jenkins/Jenkinsfile.ci.front"
echo "   4. hrbrain-cd-frontend → jenkins/Jenkinsfile.cd.front"
echo ""

wait_user

# ══════════════════════════════════════════════════════════════════
# ÉTAPE 5 : Test et vérification
# ══════════════════════════════════════════════════════════════════

print_title "Étape 5/5 : Test et vérification"

echo -e "${CYAN}Une fois les jobs créés, testez le pipeline :${NC}"
echo ""
echo "1. Aller sur : http://192.168.1.11:8080/job/hrbrain-ci-backend/"
echo "2. Cliquer : Build Now"
echo "3. Surveiller : Console Output"
echo ""

if ask_confirmation "Avez-vous lancé le build ?"; then
    print_step "Attente de 30 secondes..."
    sleep 30
    
    print_step "Vérification des pods..."
    kubectl get pods -n hrbrain
    
    echo ""
    print_step "Test du backend..."
    if curl -s -o /dev/null -w "%{http_code}" http://192.168.1.11:30000/health | grep -q "200"; then
        print_success "Backend accessible : http://192.168.1.11:30000/health"
    else
        print_warning "Backend non accessible"
    fi
    
    print_step "Test du frontend..."
    if curl -s -o /dev/null -w "%{http_code}" http://192.168.1.11:30080 | grep -q "200"; then
        print_success "Frontend accessible : http://192.168.1.11:30080"
    else
        print_warning "Frontend non accessible"
    fi
fi

# ══════════════════════════════════════════════════════════════════
# RÉSUMÉ FINAL
# ══════════════════════════════════════════════════════════════════

print_title "Configuration terminée !"

echo -e "${GREEN}✅ Prérequis vérifiés${NC}"
echo -e "${GREEN}✅ Docker configuré pour Jenkins${NC}"
echo -e "${GREEN}✅ Kubeconfig vérifié${NC}"
echo ""
echo -e "${CYAN}📋 Prochaines étapes manuelles :${NC}"
echo ""
echo "1. Installer les plugins Jenkins"
echo "2. Créer les credentials (dockerhub-credentials, kubeconfig)"
echo "3. Créer les 4 jobs Jenkins"
echo "4. Tester le pipeline"
echo ""
echo -e "${CYAN}📚 Documentation :${NC}"
echo ""
echo "  • Guide complet : jenkins/GUIDE-WORKER1.md"
echo "  • Guide visuel  : jenkins/VISUAL-GUIDE.md"
echo "  • Commandes     : jenkins/COMMANDES.sh"
echo ""
echo -e "${CYAN}🔗 Accès :${NC}"
echo ""
echo "  • Jenkins   : http://192.168.1.11:8080"
echo "  • Frontend  : http://192.168.1.11:30080"
echo "  • Backend   : http://192.168.1.11:30000"
echo ""
echo -e "${GREEN}🎉 Projet HRBrain : Presque terminé ! 🚀${NC}"
echo ""
