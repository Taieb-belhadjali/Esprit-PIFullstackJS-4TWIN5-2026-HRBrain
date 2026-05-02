# 🚀 Guide de Configuration Jenkins pour HRBrain

## ✅ Prérequis (déjà fait)
- [x] Jenkins installé sur worker-1
- [x] Docker installé
- [x] Node.js 20.18.1 configuré dans PATH
- [x] npm 10.8.2 disponible

---

## 📦 1. Installation des Plugins Jenkins (5 min)

### Via l'interface web (http://192.168.1.11:8080)

1. **Aller dans** : `Manage Jenkins` → `Manage Plugins` → `Available`

2. **Installer ces plugins** :
   - ✅ **Pipeline** (déjà installé par défaut)
   - ✅ **Git** (déjà installé par défaut)
   - 🔧 **Docker Pipeline**
   - 🔧 **Kubernetes CLI**
   - 🔧 **SonarQube Scanner**
   - 🔧 **GitHub Integration**

3. **Cocher** : "Restart Jenkins when installation is complete"

### Via CLI (alternative)
```bash
# Sur worker-1
JENKINS_URL="http://localhost:8080"
JENKINS_USER="admin"
JENKINS_TOKEN="votre-token"  # À générer dans Jenkins

# Installer les plugins
jenkins-cli -s $JENKINS_URL -auth $JENKINS_USER:$JENKINS_TOKEN install-plugin \
  docker-workflow \
  kubernetes-cli \
  sonar \
  github

# Redémarrer Jenkins
jenkins-cli -s $JENKINS_URL -auth $JENKINS_USER:$JENKINS_TOKEN safe-restart
```

---

## 🔐 2. Configuration des Credentials (10 min)

### A. DockerHub Credentials

1. **Aller dans** : `Manage Jenkins` → `Manage Credentials` → `(global)` → `Add Credentials`

2. **Remplir** :
   - **Kind** : `Username with password`
   - **Scope** : `Global`
   - **Username** : `mouadh08`
   - **Password** : `[votre mot de passe DockerHub]`
   - **ID** : `dockerhub-credentials`
   - **Description** : `DockerHub credentials for HRBrain`

3. **Cliquer** : `Create`

### B. Kubeconfig Credentials

1. **Sur master node, récupérer le kubeconfig** :
```bash
# Sur master
cat ~/.kube/config
```

2. **Copier le contenu complet** (de `apiVersion:` jusqu'à la fin)

3. **Dans Jenkins** : `Manage Jenkins` → `Manage Credentials` → `(global)` → `Add Credentials`

4. **Remplir** :
   - **Kind** : `Secret file`
   - **Scope** : `Global`
   - **File** : Créer un fichier temporaire avec le contenu du kubeconfig et l'uploader
   - **ID** : `kubeconfig`
   - **Description** : `Kubernetes config for HRBrain cluster`

5. **Cliquer** : `Create`

### Alternative CLI pour kubeconfig
```bash
# Sur worker-1
# Copier le kubeconfig depuis master
scp ahmed@192.168.1.10:~/.kube/config /tmp/kubeconfig

# Créer le credential via CLI
cat <<EOF | jenkins-cli -s http://localhost:8080 -auth admin:token create-credentials-by-xml system::system::jenkins "(global)"
<com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl>
  <scope>GLOBAL</scope>
  <id>dockerhub-credentials</id>
  <username>mouadh08</username>
  <password>VOTRE_PASSWORD</password>
  <description>DockerHub credentials</description>
</com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl>
EOF
```

---

## 🎯 3. Configuration SonarQube (optionnel, 10 min)

### Option 1 : Installer SonarQube localement
```bash
# Sur worker-1
docker run -d --name sonarqube \
  -p 9000:9000 \
  -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true \
  sonarqube:lts-community

# Attendre le démarrage (2-3 min)
# Accéder à http://192.168.1.11:9000
# Login par défaut : admin / admin
```

### Option 2 : Désactiver SonarQube temporairement
Si vous voulez tester sans SonarQube, commentez ces stages dans les Jenkinsfiles :
- `SonarQube Analysis`
- `Quality Gate`

### Configuration dans Jenkins
1. **Aller dans** : `Manage Jenkins` → `Configure System`
2. **Chercher** : `SonarQube servers`
3. **Ajouter** :
   - **Name** : `SonarQube`
   - **Server URL** : `http://192.168.1.11:9000`
   - **Server authentication token** : Générer dans SonarQube → My Account → Security → Generate Token

---

## 🔨 4. Création des 4 Jobs Jenkins (10 min)

### Job 1 : CI Backend

1. **Aller dans** : `New Item`
2. **Remplir** :
   - **Name** : `hrbrain-ci-backend`
   - **Type** : `Pipeline`
3. **Configuration** :
   - **Pipeline** → **Definition** : `Pipeline script from SCM`
   - **SCM** : `Git`
   - **Repository URL** : `https://github.com/VOTRE_USER/hrbrain.git`
   - **Branch** : `*/main`
   - **Script Path** : `jenkins/Jenkinsfile.ci.back`
4. **Build Triggers** :
   - ✅ Cocher `GitHub hook trigger for GITScm polling`
5. **Save**

### Job 2 : CD Backend

1. **New Item** → `hrbrain-cd-backend` → `Pipeline`
2. **Configuration** :
   - **Pipeline** → **Definition** : `Pipeline script from SCM`
   - **Repository URL** : `https://github.com/VOTRE_USER/hrbrain.git`
   - **Branch** : `*/main`
   - **Script Path** : `jenkins/Jenkinsfile.cd.back`
3. **Build Triggers** :
   - ✅ Cocher `Build after other projects are built`
   - **Projects to watch** : `hrbrain-ci-backend`
   - **Trigger only if build is stable**
4. **Save**

### Job 3 : CI Frontend

1. **New Item** → `hrbrain-ci-frontend` → `Pipeline`
2. **Configuration** :
   - **Pipeline** → **Definition** : `Pipeline script from SCM`
   - **Repository URL** : `https://github.com/VOTRE_USER/hrbrain.git`
   - **Branch** : `*/main`
   - **Script Path** : `jenkins/Jenkinsfile.ci.front`
3. **Build Triggers** :
   - ✅ Cocher `GitHub hook trigger for GITScm polling`
4. **Save**

### Job 4 : CD Frontend

1. **New Item** → `hrbrain-cd-frontend` → `Pipeline`
2. **Configuration** :
   - **Pipeline** → **Definition** : `Pipeline script from SCM`
   - **Repository URL** : `https://github.com/VOTRE_USER/hrbrain.git`
   - **Branch** : `*/main`
   - **Script Path** : `jenkins/Jenkinsfile.cd.front`
3. **Build Triggers** :
   - ✅ Cocher `Build after other projects are built`
   - **Projects to watch** : `hrbrain-ci-frontend`
   - **Trigger only if build is stable**
4. **Save**

---

## 🧪 5. Test Pipeline Complet (5 min)

### Test manuel (sans GitHub)

1. **Lancer CI Backend** :
   - Aller dans `hrbrain-ci-backend`
   - Cliquer `Build Now`
   - Surveiller la console output

2. **Vérifier le déclenchement automatique** :
   - Si CI Backend réussit → CD Backend doit se lancer automatiquement
   - Vérifier dans `hrbrain-cd-backend` → `Build History`

3. **Répéter pour Frontend** :
   - Lancer `hrbrain-ci-frontend`
   - Vérifier que `hrbrain-cd-frontend` se lance automatiquement

### Test avec GitHub (optionnel)

1. **Configurer le webhook GitHub** :
   - Aller dans votre repo GitHub → `Settings` → `Webhooks` → `Add webhook`
   - **Payload URL** : `http://192.168.1.11:8080/github-webhook/`
   - **Content type** : `application/json`
   - **Events** : `Just the push event`

2. **Faire un commit** :
```bash
git add .
git commit -m "test: trigger Jenkins CI/CD"
git push origin main
```

3. **Vérifier dans Jenkins** :
   - Les jobs CI doivent se lancer automatiquement
   - Puis les jobs CD doivent suivre

---

## 🎯 Workflow Final

```
┌─────────────────────────────────────────────────────────────┐
│                    Push sur GitHub (main)                    │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│  CI Backend     │     │  CI Frontend    │
│  (Build + Test) │     │  (Build + Test) │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │ ✅ Success            │ ✅ Success
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│  CD Backend     │     │  CD Frontend    │
│  (Deploy K8s)   │     │  (Deploy K8s)   │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     ▼
         ┌─────────────────────┐
         │  Application Live   │
         │  http://192.168.1.11│
         │  :30080             │
         └─────────────────────┘
```

---

## 🔍 Vérification Post-Configuration

### Checklist
- [ ] Plugins installés et Jenkins redémarré
- [ ] Credential `dockerhub-credentials` créé
- [ ] Credential `kubeconfig` créé
- [ ] 4 jobs Jenkins créés
- [ ] Build triggers configurés
- [ ] Test manuel réussi (CI Backend → CD Backend)
- [ ] Test manuel réussi (CI Frontend → CD Frontend)
- [ ] Application accessible sur http://192.168.1.11:30080

### Commandes de vérification
```bash
# Vérifier les pods après déploiement
kubectl get pods -n hrbrain

# Vérifier les services
kubectl get svc -n hrbrain

# Tester le backend
curl http://192.168.1.11:30000/health

# Tester le frontend
curl http://192.168.1.11:30080
```

---

## 🐛 Troubleshooting

### Erreur : "npm: command not found"
```bash
# Sur worker-1
sudo ln -sf /usr/local/bin/node /usr/bin/node
sudo ln -sf /usr/local/bin/npm /usr/bin/npm
sudo systemctl restart jenkins
```

### Erreur : "docker: permission denied"
```bash
# Ajouter jenkins au groupe docker
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

### Erreur : "kubectl: command not found"
```bash
# Installer kubectl sur worker-1
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
```

### Erreur : "Unable to connect to the server"
- Vérifier que le kubeconfig credential est correct
- Vérifier que worker-1 peut accéder au master (192.168.1.10:6443)

---

## 📊 Résultat Final

Une fois tout configuré, vous aurez :

✅ **CI/CD automatisé** : Push → Build → Test → Deploy  
✅ **Haute disponibilité** : 2 replicas backend + 2 replicas frontend  
✅ **Rollback automatique** : En cas d'échec de déploiement  
✅ **Smoke tests** : Vérification post-déploiement  
✅ **Garde de cohérence** : Backend et Frontend synchronisés  

**Projet HRBrain : 100% opérationnel ! 🎉**
