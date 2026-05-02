#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# Script d'automatisation de la configuration Jenkins pour HRBrain
# Usage : ./setup-jenkins.sh
# ─────────────────────────────────────────────────────────────────

set -e

JENKINS_URL="http://localhost:8080"
JENKINS_USER="admin"
JENKINS_HOME="/var/lib/jenkins"

echo "🚀 Configuration automatique de Jenkins pour HRBrain"
echo "=================================================="

# ── 1. Vérification des prérequis ────────────────────────────────
echo ""
echo "📋 1. Vérification des prérequis..."

# Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js non trouvé"
    exit 1
fi
echo "✅ Node.js $(node --version)"

# npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm non trouvé"
    exit 1
fi
echo "✅ npm $(npm --version)"

# Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker non trouvé"
    exit 1
fi
echo "✅ Docker $(docker --version | cut -d' ' -f3 | tr -d ',')"

# kubectl
if ! command -v kubectl &> /dev/null; then
    echo "⚠️  kubectl non trouvé - installation..."
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
    sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
    rm kubectl
    echo "✅ kubectl installé"
else
    echo "✅ kubectl $(kubectl version --client --short 2>/dev/null | cut -d' ' -f3)"
fi

# Jenkins
if ! systemctl is-active --quiet jenkins; then
    echo "❌ Jenkins n'est pas actif"
    exit 1
fi
echo "✅ Jenkins actif"

# ── 2. Ajouter jenkins au groupe docker ──────────────────────────
echo ""
echo "🔧 2. Configuration des permissions Docker..."
if groups jenkins | grep -q docker; then
    echo "✅ jenkins déjà dans le groupe docker"
else
    sudo usermod -aG docker jenkins
    echo "✅ jenkins ajouté au groupe docker"
    echo "⚠️  Redémarrage de Jenkins nécessaire..."
    sudo systemctl restart jenkins
    echo "⏳ Attente du redémarrage (30s)..."
    sleep 30
fi

# ── 3. Installation des plugins Jenkins ──────────────────────────
echo ""
echo "📦 3. Installation des plugins Jenkins..."
echo "⚠️  Cette étape nécessite l'API Token Jenkins"
echo ""
echo "Pour générer un token :"
echo "  1. Aller sur http://192.168.1.11:8080"
echo "  2. Cliquer sur votre nom (en haut à droite) → Configure"
echo "  3. API Token → Add new Token → Generate"
echo "  4. Copier le token"
echo ""
read -p "Entrez votre Jenkins API Token : " JENKINS_TOKEN

if [ -z "$JENKINS_TOKEN" ]; then
    echo "❌ Token vide - installation manuelle des plugins requise"
    echo "   Voir jenkins/SETUP-JENKINS.md section 1"
else
    # Télécharger jenkins-cli.jar
    if [ ! -f jenkins-cli.jar ]; then
        wget ${JENKINS_URL}/jnlpJars/jenkins-cli.jar
    fi

    # Installer les plugins
    PLUGINS=(
        "docker-workflow"
        "kubernetes-cli"
        "sonar"
        "github"
    )

    for plugin in "${PLUGINS[@]}"; do
        echo "  📥 Installation de $plugin..."
        java -jar jenkins-cli.jar -s ${JENKINS_URL} -auth ${JENKINS_USER}:${JENKINS_TOKEN} \
            install-plugin $plugin || echo "  ⚠️  $plugin déjà installé ou erreur"
    done

    echo "✅ Plugins installés"
    echo "🔄 Redémarrage de Jenkins..."
    java -jar jenkins-cli.jar -s ${JENKINS_URL} -auth ${JENKINS_USER}:${JENKINS_TOKEN} safe-restart
    echo "⏳ Attente du redémarrage (60s)..."
    sleep 60
fi

# ── 4. Configuration des credentials ─────────────────────────────
echo ""
echo "🔐 4. Configuration des credentials..."

# DockerHub
echo ""
echo "📝 DockerHub Credentials"
read -p "DockerHub Username [mouadh08] : " DOCKER_USER
DOCKER_USER=${DOCKER_USER:-mouadh08}
read -sp "DockerHub Password : " DOCKER_PASS
echo ""

if [ -n "$DOCKER_PASS" ]; then
    # Créer le credential via XML
    cat > /tmp/dockerhub-cred.xml <<EOF
<com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl>
  <scope>GLOBAL</scope>
  <id>dockerhub-credentials</id>
  <username>${DOCKER_USER}</username>
  <password>${DOCKER_PASS}</password>
  <description>DockerHub credentials for HRBrain</description>
</com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl>
EOF

    if [ -n "$JENKINS_TOKEN" ]; then
        java -jar jenkins-cli.jar -s ${JENKINS_URL} -auth ${JENKINS_USER}:${JENKINS_TOKEN} \
            create-credentials-by-xml system::system::jenkins "(global)" < /tmp/dockerhub-cred.xml \
            && echo "✅ DockerHub credential créé" \
            || echo "⚠️  Erreur - création manuelle requise"
        rm /tmp/dockerhub-cred.xml
    else
        echo "⚠️  Création manuelle requise (pas de token)"
    fi
else
    echo "⚠️  Password vide - création manuelle requise"
fi

# Kubeconfig
echo ""
echo "📝 Kubeconfig Credential"
echo "Copie du kubeconfig depuis master..."

# Essayer de copier depuis master
if [ -f ~/.kube/config ]; then
    KUBECONFIG_PATH=~/.kube/config
    echo "✅ Kubeconfig trouvé localement"
elif ssh -o ConnectTimeout=5 ahmed@192.168.1.10 "test -f ~/.kube/config" 2>/dev/null; then
    scp ahmed@192.168.1.10:~/.kube/config /tmp/kubeconfig
    KUBECONFIG_PATH=/tmp/kubeconfig
    echo "✅ Kubeconfig copié depuis master"
else
    echo "⚠️  Kubeconfig non trouvé - configuration manuelle requise"
    echo "   Voir jenkins/SETUP-JENKINS.md section 2.B"
    KUBECONFIG_PATH=""
fi

if [ -n "$KUBECONFIG_PATH" ] && [ -n "$JENKINS_TOKEN" ]; then
    # Copier le kubeconfig dans Jenkins credentials
    sudo mkdir -p ${JENKINS_HOME}/credentials
    sudo cp ${KUBECONFIG_PATH} ${JENKINS_HOME}/credentials/kubeconfig
    sudo chown jenkins:jenkins ${JENKINS_HOME}/credentials/kubeconfig
    echo "✅ Kubeconfig copié dans Jenkins"
    echo "⚠️  Création du credential 'kubeconfig' via l'interface web requise"
    echo "   Voir jenkins/SETUP-JENKINS.md section 2.B"
fi

# ── 5. Résumé ────────────────────────────────────────────────────
echo ""
echo "=================================================="
echo "✅ Configuration automatique terminée !"
echo ""
echo "📋 Prochaines étapes manuelles :"
echo ""
echo "1. Vérifier les plugins installés :"
echo "   http://192.168.1.11:8080/pluginManager/installed"
echo ""
echo "2. Créer le credential 'kubeconfig' (Secret file) :"
echo "   http://192.168.1.11:8080/credentials/"
echo "   - Kind: Secret file"
echo "   - ID: kubeconfig"
echo "   - File: ${JENKINS_HOME}/credentials/kubeconfig"
echo ""
echo "3. Créer les 4 jobs Jenkins :"
echo "   - hrbrain-ci-backend"
echo "   - hrbrain-cd-backend"
echo "   - hrbrain-ci-frontend"
echo "   - hrbrain-cd-frontend"
echo ""
echo "4. Tester le pipeline :"
echo "   Build Now sur hrbrain-ci-backend"
echo ""
echo "📖 Guide complet : jenkins/SETUP-JENKINS.md"
echo "=================================================="
