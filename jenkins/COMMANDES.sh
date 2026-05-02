#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# Commandes à exécuter sur worker-1 pour finaliser Jenkins
# Copiez-collez ces commandes une par une
# ─────────────────────────────────────────────────────────────────

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Configuration Jenkins sur Worker-1                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "⚠️  Exécutez ces commandes UNE PAR UNE sur worker-1"
echo ""

# ══════════════════════════════════════════════════════════════════
# ÉTAPE 1 : Vérification initiale
# ══════════════════════════════════════════════════════════════════
cat << 'EOF'

┌────────────────────────────────────────────────────────────────┐
│ ÉTAPE 1 : Vérification initiale                                │
└────────────────────────────────────────────────────────────────┘

# Vérifier Node.js
node --version

# Vérifier npm
npm --version

# Vérifier Docker
docker --version
docker ps

# Vérifier kubectl
kubectl get nodes

# Vérifier Jenkins
systemctl status jenkins

EOF

# ══════════════════════════════════════════════════════════════════
# ÉTAPE 2 : Ajouter jenkins au groupe docker
# ══════════════════════════════════════════════════════════════════
cat << 'EOF'

┌────────────────────────────────────────────────────────────────┐
│ ÉTAPE 2 : Ajouter jenkins au groupe docker                     │
└────────────────────────────────────────────────────────────────┘

# Vérifier si jenkins est dans le groupe docker
groups jenkins

# Si "docker" n'apparaît pas, exécuter :
sudo usermod -aG docker jenkins

# Redémarrer Jenkins
sudo systemctl restart jenkins

# Attendre 30 secondes
sleep 30

# Vérifier que Jenkins est redémarré
systemctl status jenkins

# Tester que jenkins peut utiliser docker
sudo -u jenkins docker ps

EOF

# ══════════════════════════════════════════════════════════════════
# ÉTAPE 3 : Vérifier le kubeconfig
# ══════════════════════════════════════════════════════════════════
cat << 'EOF'

┌────────────────────────────────────────────────────────────────┐
│ ÉTAPE 3 : Vérifier le kubeconfig                               │
└────────────────────────────────────────────────────────────────┘

# Vérifier si kubeconfig existe
ls -la ~/.kube/config

# Si le fichier n'existe pas, copier depuis master :
scp ahmed@192.168.1.10:~/.kube/config ~/.kube/config

# Tester kubectl
kubectl get nodes

# Copier le kubeconfig pour Jenkins (optionnel)
sudo mkdir -p /var/lib/jenkins/credentials
sudo cp ~/.kube/config /var/lib/jenkins/credentials/kubeconfig
sudo chown jenkins:jenkins /var/lib/jenkins/credentials/kubeconfig
sudo chmod 600 /var/lib/jenkins/credentials/kubeconfig

EOF

# ══════════════════════════════════════════════════════════════════
# ÉTAPE 4 : Lancer le script de vérification
# ══════════════════════════════════════════════════════════════════
cat << 'EOF'

┌────────────────────────────────────────────────────────────────┐
│ ÉTAPE 4 : Lancer le script de vérification                     │
└────────────────────────────────────────────────────────────────┘

# Aller dans le dossier jenkins
cd /path/to/hrbrain/jenkins

# Rendre le script exécutable
chmod +x check-worker1.sh

# Lancer le script
./check-worker1.sh

EOF

# ══════════════════════════════════════════════════════════════════
# ÉTAPE 5 : Accéder à Jenkins
# ══════════════════════════════════════════════════════════════════
cat << 'EOF'

┌────────────────────────────────────────────────────────────────┐
│ ÉTAPE 5 : Accéder à Jenkins                                    │
└────────────────────────────────────────────────────────────────┘

# Ouvrir Jenkins dans le navigateur :
# http://192.168.1.11:8080

# Si c'est la première connexion, récupérer le mot de passe :
sudo cat /var/lib/jenkins/secrets/initialAdminPassword

EOF

# ══════════════════════════════════════════════════════════════════
# ÉTAPE 6 : Installer les plugins (via l'interface web)
# ══════════════════════════════════════════════════════════════════
cat << 'EOF'

┌────────────────────────────────────────────────────────────────┐
│ ÉTAPE 6 : Installer les plugins Jenkins                        │
└────────────────────────────────────────────────────────────────┘

Via l'interface web Jenkins :

1. Aller dans : Manage Jenkins → Manage Plugins → Available plugins

2. Rechercher et installer :
   ✅ Docker Pipeline
   ✅ Kubernetes CLI
   ✅ GitHub Integration

3. Cocher : "Restart Jenkins when installation is complete"

4. Attendre le redémarrage (1-2 min)

EOF

# ══════════════════════════════════════════════════════════════════
# ÉTAPE 7 : Créer les credentials (via l'interface web)
# ══════════════════════════════════════════════════════════════════
cat << 'EOF'

┌────────────────────────────────────────────────────────────────┐
│ ÉTAPE 7 : Créer les credentials                                │
└────────────────────────────────────────────────────────────────┘

A. DockerHub Credentials
   URL : http://192.168.1.11:8080/credentials/store/system/domain/_/newCredentials
   
   Kind: Username with password
   Username: mouadh08
   Password: [votre mot de passe DockerHub]
   ID: dockerhub-credentials
   
   Cliquer : Create

B. Kubeconfig Credential
   URL : http://192.168.1.11:8080/credentials/store/system/domain/_/newCredentials
   
   Kind: Secret file
   File: [Uploader ~/.kube/config]
   ID: kubeconfig
   
   Cliquer : Create

EOF

# ══════════════════════════════════════════════════════════════════
# ÉTAPE 8 : Créer les jobs Jenkins (via l'interface web)
# ══════════════════════════════════════════════════════════════════
cat << 'EOF'

┌────────────────────────────────────────────────────────────────┐
│ ÉTAPE 8 : Créer les 4 jobs Jenkins                             │
└────────────────────────────────────────────────────────────────┘

Pour CHAQUE job ci-dessous :

1. New Item → [Nom du job] → Pipeline → OK

2. Configuration :
   - Pipeline → Definition : Pipeline script from SCM
   - SCM : Git
   - Repository URL : https://github.com/VOTRE_USER/hrbrain.git
   - Branch : */main
   - Script Path : [voir ci-dessous]

3. Build Triggers : [voir ci-dessous]

4. Save

─────────────────────────────────────────────────────────────────

Job 1 : hrbrain-ci-backend
  Script Path : jenkins/Jenkinsfile.ci.back
  Build Triggers : ✅ GitHub hook trigger for GITScm polling

Job 2 : hrbrain-cd-backend
  Script Path : jenkins/Jenkinsfile.cd.back
  Build Triggers : ✅ Build after other projects are built
                   → Projects: hrbrain-ci-backend
                   → Trigger only if build is stable

Job 3 : hrbrain-ci-frontend
  Script Path : jenkins/Jenkinsfile.ci.front
  Build Triggers : ✅ GitHub hook trigger for GITScm polling

Job 4 : hrbrain-cd-frontend
  Script Path : jenkins/Jenkinsfile.cd.front
  Build Triggers : ✅ Build after other projects are built
                   → Projects: hrbrain-ci-frontend
                   → Trigger only if build is stable

EOF

# ══════════════════════════════════════════════════════════════════
# ÉTAPE 9 : Tester le pipeline
# ══════════════════════════════════════════════════════════════════
cat << 'EOF'

┌────────────────────────────────────────────────────────────────┐
│ ÉTAPE 9 : Tester le pipeline                                   │
└────────────────────────────────────────────────────────────────┘

1. Aller sur : http://192.168.1.11:8080/job/hrbrain-ci-backend/

2. Cliquer : Build Now

3. Surveiller : Console Output

4. Si succès → hrbrain-cd-backend doit se lancer automatiquement

5. Répéter pour hrbrain-ci-frontend

EOF

# ══════════════════════════════════════════════════════════════════
# ÉTAPE 10 : Vérification finale
# ══════════════════════════════════════════════════════════════════
cat << 'EOF'

┌────────────────────────────────────────────────────────────────┐
│ ÉTAPE 10 : Vérification finale                                 │
└────────────────────────────────────────────────────────────────┘

# Vérifier les pods
kubectl get pods -n hrbrain

# Tester le backend
curl http://192.168.1.11:30000/health

# Tester le frontend
curl http://192.168.1.11:30080

# Tester Ollama
curl http://192.168.1.13:11434/api/tags

EOF

# ══════════════════════════════════════════════════════════════════
# RÉSUMÉ
# ══════════════════════════════════════════════════════════════════
cat << 'EOF'

╔════════════════════════════════════════════════════════════════╗
║  ✅ Configuration terminée !                                   ║
╚════════════════════════════════════════════════════════════════╝

Votre pipeline CI/CD est maintenant opérationnel :

  Push GitHub → CI Backend/Frontend → CD Backend/Frontend → K8s

Accès :
  • Jenkins   : http://192.168.1.11:8080
  • Frontend  : http://192.168.1.11:30080
  • Backend   : http://192.168.1.11:30000

Documentation :
  • Guide complet : jenkins/GUIDE-WORKER1.md
  • README        : jenkins/README.md

🎉 Projet HRBrain : 100% opérationnel !

EOF
