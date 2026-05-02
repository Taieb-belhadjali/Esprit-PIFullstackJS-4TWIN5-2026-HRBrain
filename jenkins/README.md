# 🔧 Jenkins CI/CD pour HRBrain

Configuration complète du pipeline CI/CD automatisé pour le projet HRBrain.

---

## 📁 Structure

```
jenkins/
├── README.md                    # Ce fichier
├── QUICK-START.md              # Guide rapide (15 min)
├── SETUP-JENKINS.md            # Guide complet et détaillé
├── setup-jenkins.sh            # Script d'automatisation
├── verify-jenkins.sh           # Script de vérification
├── Jenkinsfile.ci.back         # Pipeline CI Backend
├── Jenkinsfile.cd.back         # Pipeline CD Backend
├── Jenkinsfile.ci.front        # Pipeline CI Frontend
└── Jenkinsfile.cd.front        # Pipeline CD Frontend
```

---

## 🚀 Démarrage rapide

### Option 1 : Guide rapide (recommandé)
```bash
# Lire le guide rapide
cat jenkins/QUICK-START.md

# Vérifier la configuration actuelle
cd jenkins
chmod +x verify-jenkins.sh
./verify-jenkins.sh
```

### Option 2 : Script automatisé
```bash
cd jenkins
chmod +x setup-jenkins.sh
./setup-jenkins.sh
```

### Option 3 : Guide complet
```bash
# Lire le guide détaillé
cat jenkins/SETUP-JENKINS.md
```

---

## 📊 Architecture du Pipeline

### Workflow CI/CD

```
┌─────────────────────────────────────────────────────────────┐
│                    Push sur GitHub (main)                    │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│  CI Backend     │     │  CI Frontend    │
│  ─────────────  │     │  ─────────────  │
│  1. Checkout    │     │  1. Checkout    │
│  2. npm ci      │     │  2. npm ci      │
│  3. Lint        │     │  3. TypeCheck   │
│  4. Build       │     │  4. Build       │
│  5. Test        │     │  5. SonarQube   │
│  6. SonarQube   │     │  6. Docker Build│
│  7. Quality Gate│     │  7. Docker Push │
│  8. Docker Build│     └────────┬────────┘
│  9. Docker Push │              │
└────────┬────────┘              │
         │                       │
         │ ✅ Success            │ ✅ Success
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│  CD Backend     │     │  CD Frontend    │
│  ─────────────  │     │  ─────────────  │
│  1. Check Front │     │  1. Check Back  │
│     CI Status   │     │     CI Status   │
│  2. Pull Image  │     │  2. Pull Image  │
│  3. Deploy K8s  │     │  3. Deploy K8s  │
│  4. Rollout     │     │  4. Rollout     │
│  5. Verify      │     │  5. Verify      │
│  6. Smoke Test  │     │  6. Smoke Test  │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     ▼
         ┌─────────────────────┐
         │  Application Live   │
         │  ─────────────────  │
         │  Backend:  :30000   │
         │  Frontend: :30080   │
         └─────────────────────┘
```

### Garde de cohérence

Les pipelines CD incluent une **garde de cohérence** :

- **CD Backend** vérifie que **CI Frontend** est en succès avant de déployer
- **CD Frontend** vérifie que **CI Backend** est en succès avant de déployer

Cela évite un état incohérent où une partie de l'application est cassée.

---

## 🔐 Credentials requis

| ID | Type | Description |
|----|------|-------------|
| `dockerhub-credentials` | Username/Password | Accès DockerHub pour push/pull images |
| `kubeconfig` | Secret file | Configuration kubectl pour déploiement K8s |

---

## 📦 Plugins Jenkins requis

- ✅ **Pipeline** (core)
- ✅ **Git** (core)
- 🔧 **Docker Pipeline**
- 🔧 **Kubernetes CLI**
- 🔧 **SonarQube Scanner** (optionnel)
- 🔧 **GitHub Integration**

---

## 🔨 Jobs Jenkins

| Job | Type | Trigger | Description |
|-----|------|---------|-------------|
| `hrbrain-ci-backend` | Pipeline | GitHub push | Build + Test Backend |
| `hrbrain-cd-backend` | Pipeline | After CI Backend | Deploy Backend to K8s |
| `hrbrain-ci-frontend` | Pipeline | GitHub push | Build + Test Frontend |
| `hrbrain-cd-frontend` | Pipeline | After CI Frontend | Deploy Frontend to K8s |

---

## 🧪 Tests

### Test manuel complet

```bash
# 1. Lancer CI Backend
# Dans Jenkins : hrbrain-ci-backend → Build Now

# 2. Vérifier que CD Backend se lance automatiquement
# Dans Jenkins : hrbrain-cd-backend → Build History

# 3. Lancer CI Frontend
# Dans Jenkins : hrbrain-ci-frontend → Build Now

# 4. Vérifier que CD Frontend se lance automatiquement
# Dans Jenkins : hrbrain-cd-frontend → Build History

# 5. Vérifier l'application
kubectl get pods -n hrbrain
curl http://192.168.1.11:30000/health
curl http://192.168.1.11:30080
```

### Test avec GitHub webhook

```bash
# 1. Configurer le webhook GitHub
# Repo → Settings → Webhooks → Add webhook
# URL: http://192.168.1.11:8080/github-webhook/

# 2. Faire un commit
git add .
git commit -m "test: trigger CI/CD"
git push origin main

# 3. Vérifier dans Jenkins
# Les 4 jobs doivent se lancer automatiquement
```

---

## 🐛 Troubleshooting

### Vérification rapide
```bash
cd jenkins
./verify-jenkins.sh
```

### Problèmes courants

#### 1. "npm: command not found"
```bash
sudo ln -sf /usr/local/bin/node /usr/bin/node
sudo ln -sf /usr/local/bin/npm /usr/bin/npm
sudo systemctl restart jenkins
```

#### 2. "docker: permission denied"
```bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

#### 3. "kubectl: command not found"
```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
```

#### 4. Pipeline bloqué sur SonarQube

**Option A** : Installer SonarQube
```bash
docker run -d --name sonarqube -p 9000:9000 sonarqube:lts-community
```

**Option B** : Désactiver temporairement
Commenter les stages `SonarQube Analysis` et `Quality Gate` dans les Jenkinsfiles

#### 5. "Unable to connect to the server"
- Vérifier le credential `kubeconfig`
- Vérifier la connectivité : `ping 192.168.1.10`
- Tester kubectl : `kubectl cluster-info`

---

## 📈 Monitoring

### Logs Jenkins
```bash
# Logs Jenkins
sudo journalctl -u jenkins -f

# Logs d'un job spécifique
# Via l'interface web : Job → Build #X → Console Output
```

### Logs Kubernetes
```bash
# Pods
kubectl get pods -n hrbrain

# Logs backend
kubectl logs -n hrbrain -l app=backend --tail=100

# Logs frontend
kubectl logs -n hrbrain -l app=frontend --tail=100

# Events
kubectl get events -n hrbrain --sort-by='.lastTimestamp'
```

---

## 🔄 Rollback

### Rollback automatique

Les pipelines CD incluent un rollback automatique en cas d'échec :

```groovy
post {
    failure {
        withKubeConfig([credentialsId: 'kubeconfig']) {
            sh "kubectl rollout undo deployment/backend -n hrbrain"
        }
    }
}
```

### Rollback manuel

```bash
# Voir l'historique des déploiements
kubectl rollout history deployment/backend -n hrbrain

# Rollback à la version précédente
kubectl rollout undo deployment/backend -n hrbrain

# Rollback à une version spécifique
kubectl rollout undo deployment/backend -n hrbrain --to-revision=2
```

---

## 📚 Ressources

- **Jenkins** : http://192.168.1.11:8080
- **Application** : http://192.168.1.11:30080
- **Backend API** : http://192.168.1.11:30000
- **Kubernetes Dashboard** : `kubectl proxy` puis http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/

---

## 🎯 Checklist de finalisation

- [ ] Node.js et npm configurés dans PATH
- [ ] jenkins dans le groupe docker
- [ ] Plugins Jenkins installés
- [ ] Credential `dockerhub-credentials` créé
- [ ] Credential `kubeconfig` créé
- [ ] Job `hrbrain-ci-backend` créé
- [ ] Job `hrbrain-cd-backend` créé
- [ ] Job `hrbrain-ci-frontend` créé
- [ ] Job `hrbrain-cd-frontend` créé
- [ ] Test manuel réussi (CI → CD)
- [ ] Application accessible

---

**Projet HRBrain : CI/CD 100% opérationnel ! 🎉**
