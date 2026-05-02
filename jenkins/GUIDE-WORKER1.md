# 🚀 Guide Jenkins sur Worker-1 (Laptop)

**Configuration** : Tout sur worker-1 (192.168.1.11)  
**Temps estimé** : 15 minutes  
**Prérequis** : ✅ Node.js et npm déjà configurés

---

## 📋 Étape 1 : Vérification initiale (2 min)

Connectez-vous sur **worker-1** et vérifiez l'état actuel :

```bash
# SSH sur worker-1
ssh ahmed@192.168.1.11

# Vérifier Node.js et npm
node --version    # Doit afficher v20.18.1
npm --version     # Doit afficher 10.8.2

# Vérifier Jenkins
systemctl status jenkins

# Vérifier Docker
docker --version
docker ps

# Vérifier kubectl
kubectl get nodes
```

**Résultat attendu** :
- ✅ Node.js v20.18.1
- ✅ npm 10.8.2
- ✅ Jenkins actif
- ✅ Docker fonctionnel
- ✅ kubectl peut accéder au cluster

---

## 🔐 Étape 2 : Ajouter jenkins au groupe docker (2 min)

```bash
# Vérifier si jenkins est dans le groupe docker
groups jenkins

# Si "docker" n'apparaît pas, l'ajouter
sudo usermod -aG docker jenkins

# Redémarrer Jenkins pour appliquer les changements
sudo systemctl restart jenkins

# Attendre 30 secondes
sleep 30

# Vérifier que Jenkins est bien redémarré
systemctl status jenkins
```

**Vérification** :
```bash
# Tester que jenkins peut utiliser docker
sudo -u jenkins docker ps
```

Si ça fonctionne → ✅ Passez à l'étape suivante

---

## 🌐 Étape 3 : Accéder à Jenkins (1 min)

Ouvrez votre navigateur sur **worker-1** ou depuis votre réseau local :

```
http://192.168.1.11:8080
```

ou depuis worker-1 directement :

```
http://localhost:8080
```

**Si c'est la première connexion** :
```bash
# Récupérer le mot de passe initial
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

---

## 📦 Étape 4 : Installer les plugins Jenkins (3 min)

### Via l'interface web (recommandé)

1. **Aller dans** : `Manage Jenkins` → `Manage Plugins` → `Available plugins`

2. **Rechercher et installer** :
   - ✅ `Docker Pipeline`
   - ✅ `Kubernetes CLI`
   - ✅ `GitHub Integration`

3. **Cocher** : "Restart Jenkins when installation is complete and no jobs are running"

4. **Attendre le redémarrage** (1-2 min)

### Via CLI (alternative)

```bash
# Sur worker-1
cd ~

# Télécharger jenkins-cli.jar
wget http://localhost:8080/jnlpJars/jenkins-cli.jar

# Générer un API Token dans Jenkins :
# Jenkins → Votre nom (en haut à droite) → Configure → API Token → Add new Token

# Remplacer YOUR_TOKEN par votre token
JENKINS_TOKEN="YOUR_TOKEN"

# Installer les plugins
java -jar jenkins-cli.jar -s http://localhost:8080 -auth admin:${JENKINS_TOKEN} \
  install-plugin docker-workflow kubernetes-cli github

# Redémarrer Jenkins
java -jar jenkins-cli.jar -s http://localhost:8080 -auth admin:${JENKINS_TOKEN} safe-restart

# Attendre 60 secondes
sleep 60
```

---

## 🔐 Étape 5 : Créer les Credentials (5 min)

### A. DockerHub Credentials

1. **Aller sur** : http://192.168.1.11:8080/credentials/store/system/domain/_/newCredentials

2. **Remplir** :
   ```
   Kind: Username with password
   Scope: Global (Jenkins, nodes, items, all child items, etc)
   Username: mouadh08
   Password: [votre mot de passe DockerHub]
   ID: dockerhub-credentials
   Description: DockerHub credentials for HRBrain
   ```

3. **Cliquer** : `Create`

### B. Kubeconfig Credential

**Sur worker-1**, le kubeconfig est probablement déjà présent :

```bash
# Vérifier si kubeconfig existe
ls -la ~/.kube/config

# Si non, copier depuis master
scp ahmed@192.168.1.10:~/.kube/config ~/.kube/config

# Vérifier que kubectl fonctionne
kubectl get nodes
```

**Créer le credential dans Jenkins** :

1. **Aller sur** : http://192.168.1.11:8080/credentials/store/system/domain/_/newCredentials

2. **Remplir** :
   ```
   Kind: Secret file
   Scope: Global
   File: [Cliquer "Choose File" et sélectionner ~/.kube/config]
   ID: kubeconfig
   Description: Kubernetes config for HRBrain cluster
   ```

3. **Cliquer** : `Create`

**Alternative - Copier le fichier manuellement** :

```bash
# Copier le kubeconfig dans Jenkins
sudo mkdir -p /var/lib/jenkins/credentials
sudo cp ~/.kube/config /var/lib/jenkins/credentials/kubeconfig
sudo chown jenkins:jenkins /var/lib/jenkins/credentials/kubeconfig
sudo chmod 600 /var/lib/jenkins/credentials/kubeconfig

# Puis créer le credential via l'interface web en pointant vers ce fichier
```

---

## 🔨 Étape 6 : Créer les 4 Jobs Jenkins (5 min)

### Configuration du repository Git

**Important** : Vous devez d'abord avoir votre code sur GitHub.

```bash
# Sur worker-1, dans votre projet
cd /path/to/hrbrain

# Initialiser git si pas déjà fait
git init
git add .
git commit -m "Initial commit"

# Créer un repo sur GitHub et le lier
git remote add origin https://github.com/VOTRE_USER/hrbrain.git
git branch -M main
git push -u origin main
```

### Créer les jobs

Pour **chaque job** ci-dessous, suivre ces étapes :

#### Job 1 : hrbrain-ci-backend

1. **Aller sur** : http://192.168.1.11:8080/view/all/newJob

2. **Remplir** :
   - **Enter an item name** : `hrbrain-ci-backend`
   - **Type** : `Pipeline`
   - Cliquer **OK**

3. **Configuration** :
   - **General** :
     - ✅ Cocher `GitHub project`
     - **Project url** : `https://github.com/VOTRE_USER/hrbrain/`
   
   - **Build Triggers** :
     - ✅ Cocher `GitHub hook trigger for GITScm polling`
   
   - **Pipeline** :
     - **Definition** : `Pipeline script from SCM`
     - **SCM** : `Git`
     - **Repository URL** : `https://github.com/VOTRE_USER/hrbrain.git`
     - **Credentials** : `- none -` (si repo public)
     - **Branch Specifier** : `*/main`
     - **Script Path** : `jenkins/Jenkinsfile.ci.back`

4. **Cliquer** : `Save`

#### Job 2 : hrbrain-cd-backend

1. **New Item** → `hrbrain-cd-backend` → `Pipeline` → **OK**

2. **Configuration** :
   - **General** :
     - ✅ Cocher `This project is parameterized`
     - **Add Parameter** → `String Parameter`
       - **Name** : `IMAGE_TAG`
       - **Default Value** : `latest`
       - **Description** : `Tag de l'image Docker à déployer`
   
   - **Build Triggers** :
     - ✅ Cocher `Build after other projects are built`
     - **Projects to watch** : `hrbrain-ci-backend`
     - ✅ Cocher `Trigger only if build is stable`
   
   - **Pipeline** :
     - **Definition** : `Pipeline script from SCM`
     - **SCM** : `Git`
     - **Repository URL** : `https://github.com/VOTRE_USER/hrbrain.git`
     - **Branch Specifier** : `*/main`
     - **Script Path** : `jenkins/Jenkinsfile.cd.back`

3. **Cliquer** : `Save`

#### Job 3 : hrbrain-ci-frontend

1. **New Item** → `hrbrain-ci-frontend` → `Pipeline` → **OK**

2. **Configuration** :
   - **General** :
     - ✅ Cocher `GitHub project`
     - **Project url** : `https://github.com/VOTRE_USER/hrbrain/`
   
   - **Build Triggers** :
     - ✅ Cocher `GitHub hook trigger for GITScm polling`
   
   - **Pipeline** :
     - **Definition** : `Pipeline script from SCM`
     - **SCM** : `Git`
     - **Repository URL** : `https://github.com/VOTRE_USER/hrbrain.git`
     - **Branch Specifier** : `*/main`
     - **Script Path** : `jenkins/Jenkinsfile.ci.front`

3. **Cliquer** : `Save`

#### Job 4 : hrbrain-cd-frontend

1. **New Item** → `hrbrain-cd-frontend` → `Pipeline` → **OK**

2. **Configuration** :
   - **General** :
     - ✅ Cocher `This project is parameterized`
     - **Add Parameter** → `String Parameter`
       - **Name** : `IMAGE_TAG`
       - **Default Value** : `latest`
   
   - **Build Triggers** :
     - ✅ Cocher `Build after other projects are built`
     - **Projects to watch** : `hrbrain-ci-frontend`
     - ✅ Cocher `Trigger only if build is stable`
   
   - **Pipeline** :
     - **Definition** : `Pipeline script from SCM`
     - **SCM** : `Git`
     - **Repository URL** : `https://github.com/VOTRE_USER/hrbrain.git`
     - **Branch Specifier** : `*/main`
     - **Script Path** : `jenkins/Jenkinsfile.cd.front`

3. **Cliquer** : `Save`

---

## 🧪 Étape 7 : Test du Pipeline (5 min)

### Test 1 : CI Backend

1. **Aller sur** : http://192.168.1.11:8080/job/hrbrain-ci-backend/

2. **Cliquer** : `Build Now`

3. **Surveiller** : Cliquer sur le build #1 → `Console Output`

4. **Attendre** : Le build devrait prendre 5-10 minutes

**Résultat attendu** :
```
✅ Checkout
✅ Install Dependencies
✅ Lint
✅ Build
✅ Unit Tests
⚠️  SonarQube Analysis (peut échouer si SonarQube pas installé)
⚠️  Quality Gate (peut échouer si SonarQube pas installé)
✅ Docker Build
✅ Docker Push
```

**Si SonarQube échoue** : C'est normal, voir section "Désactiver SonarQube" ci-dessous

### Test 2 : CD Backend (automatique)

Si CI Backend réussit, CD Backend devrait se lancer automatiquement.

1. **Aller sur** : http://192.168.1.11:8080/job/hrbrain-cd-backend/

2. **Vérifier** : Un build devrait être en cours

3. **Surveiller** : Console Output

**Résultat attendu** :
```
✅ Checkout
✅ Check Frontend CI Status (peut échouer si frontend pas encore buildé)
✅ Verify Image
✅ Deploy to Kubernetes
✅ Verify Deployment
✅ Smoke Test
```

### Test 3 : CI Frontend

1. **Aller sur** : http://192.168.1.11:8080/job/hrbrain-ci-frontend/

2. **Cliquer** : `Build Now`

3. **Surveiller** : Console Output

### Test 4 : CD Frontend (automatique)

Devrait se lancer automatiquement après CI Frontend.

---

## 🔧 Désactiver SonarQube temporairement

Si vous n'avez pas SonarQube installé, les pipelines vont échouer. Voici comment désactiver temporairement :

### Option 1 : Commenter dans les Jenkinsfiles

```bash
# Sur worker-1
cd /path/to/hrbrain

# Éditer les Jenkinsfiles
nano jenkins/Jenkinsfile.ci.back
nano jenkins/Jenkinsfile.ci.front
```

**Commenter ces stages** :
```groovy
// ── 6. SonarQube Analysis ────────────────────────────────
/*
stage('SonarQube Analysis') {
    steps {
        withSonarQubeEnv('SonarQube') {
            // ...
        }
    }
}
*/

// ── 7. Quality Gate ──────────────────────────────────────
/*
stage('Quality Gate') {
    steps {
        timeout(time: 5, unit: 'MINUTES') {
            waitForQualityGate abortPipeline: true
        }
    }
}
*/
```

**Puis commit et push** :
```bash
git add jenkins/
git commit -m "ci: disable SonarQube temporarily"
git push origin main
```

### Option 2 : Installer SonarQube rapidement

```bash
# Sur worker-1
docker run -d --name sonarqube \
  -p 9000:9000 \
  -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true \
  sonarqube:lts-community

# Attendre 2-3 minutes
docker logs -f sonarqube

# Accéder à http://192.168.1.11:9000
# Login : admin / admin
# Changer le mot de passe

# Générer un token :
# My Account → Security → Generate Token

# Configurer dans Jenkins :
# Manage Jenkins → Configure System → SonarQube servers
# Name: SonarQube
# Server URL: http://192.168.1.11:9000
# Server authentication token: [votre token]
```

---

## ✅ Vérification finale

```bash
# Sur worker-1

# 1. Vérifier les pods
kubectl get pods -n hrbrain

# Résultat attendu :
# backend-xxx    2/2  Running
# frontend-xxx   2/2  Running
# ollama-xxx     1/1  Running

# 2. Tester le backend
curl http://192.168.1.11:30000/health

# Résultat attendu : {"status":"ok"}

# 3. Tester le frontend
curl http://192.168.1.11:30080

# Résultat attendu : HTML de la page

# 4. Tester Ollama
curl http://192.168.1.13:11434/api/tags

# Résultat attendu : JSON avec le modèle qwen2.5:7b
```

---

## 🎉 Félicitations !

Votre pipeline CI/CD est maintenant **100% opérationnel** !

### Workflow complet

```
Push GitHub → CI Backend/Frontend → CD Backend/Frontend → K8s
```

### Prochaines actions

1. **Configurer le webhook GitHub** (optionnel) :
   ```
   GitHub → Settings → Webhooks → Add webhook
   URL: http://192.168.1.11:8080/github-webhook/
   Content type: application/json
   Events: Just the push event
   ```

2. **Tester le workflow complet** :
   ```bash
   # Faire un changement
   echo "// test" >> BackOffice/src/main.ts
   git add .
   git commit -m "test: trigger CI/CD"
   git push origin main
   
   # Vérifier dans Jenkins que les 4 jobs se lancent automatiquement
   ```

3. **Monitoring** (optionnel) :
   - Installer Prometheus + Grafana
   - Configurer les alertes
   - Dashboard Kubernetes

---

## 🐛 Troubleshooting

### Erreur : "npm: command not found"
```bash
sudo ln -sf /usr/local/bin/node /usr/bin/node
sudo ln -sf /usr/local/bin/npm /usr/bin/npm
sudo systemctl restart jenkins
```

### Erreur : "docker: permission denied"
```bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

### Erreur : "Unable to connect to the server"
```bash
# Vérifier kubectl
kubectl cluster-info

# Vérifier le kubeconfig
cat ~/.kube/config

# Recréer le credential kubeconfig dans Jenkins
```

### Pipeline bloqué
```bash
# Vérifier les logs Jenkins
sudo journalctl -u jenkins -f

# Vérifier les logs du job
# Via l'interface web : Job → Build #X → Console Output
```

---

## 📊 Checklist finale

- [ ] Node.js et npm dans PATH
- [ ] jenkins dans groupe docker
- [ ] Plugins Jenkins installés
- [ ] Credential dockerhub-credentials créé
- [ ] Credential kubeconfig créé
- [ ] Job hrbrain-ci-backend créé et testé
- [ ] Job hrbrain-cd-backend créé et testé
- [ ] Job hrbrain-ci-frontend créé et testé
- [ ] Job hrbrain-cd-frontend créé et testé
- [ ] Application accessible sur http://192.168.1.11:30080

---

**Projet HRBrain : 100% opérationnel ! 🚀**
