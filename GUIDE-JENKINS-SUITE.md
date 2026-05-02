# Guide Jenkins - Suite et Finalisation

## ✅ Ce qui est fait

1. **Cluster Kubernetes** - 3 nodes configurés et opérationnels
2. **Jenkins installé** sur worker-1 (192.168.1.11:8080)
3. **Credentials configurés** dans Jenkins:
   - dockerhub-credentials ✅
   - github-credentials ✅
   - kubeconfig ✅
4. **Job CI Backend créé et testé** - Build #5 réussi ✅
5. **4 Jenkinsfiles simplifiés créés** ✅

## 📋 Fichiers créés

```
jenkins/
├── README.md                          # Documentation complète
├── CONFIGURATION-JOBS.md              # Guide de configuration détaillé
├── Jenkinsfile.ci.back.simple         # ✅ CI Backend (TESTÉ)
├── Jenkinsfile.ci.front.simple        # ✅ CI Frontend (CRÉÉ)
├── Jenkinsfile.cd.back.simple         # ✅ CD Backend (CRÉÉ)
└── Jenkinsfile.cd.front.simple        # ✅ CD Frontend (CRÉÉ)
```

## 🎯 Prochaines étapes - À FAIRE MAINTENANT

### Étape 1: Créer les 3 jobs manquants dans Jenkins

#### 1.1 Créer le job **hrbrain-ci-frontend**

1. Aller sur Jenkins: http://192.168.1.11:8080
2. Cliquer sur **"New Item"**
3. Nom: `hrbrain-ci-frontend`
4. Type: **Pipeline**
5. Cliquer **OK**

**Configuration:**
- **General**:
  - Description: `CI Pipeline pour le Frontend React/Vite - Build, Test, Docker Push`
  - ☑️ Discard old builds → Strategy: Log Rotation → Max # of builds to keep: `10`

- **Pipeline**:
  - Definition: `Pipeline script from SCM`
  - SCM: `Git`
  - Repository URL: `https://github.com/mouadhhamzaoui/ZeroOne-Studio.git`
  - Credentials: `github-credentials`
  - Branch Specifier: `*/feature/k8s-jenkins-cicd`
  - Script Path: `jenkins/Jenkinsfile.ci.front.simple`

6. Cliquer **Save**

#### 1.2 Créer le job **hrbrain-cd-backend**

1. Cliquer sur **"New Item"**
2. Nom: `hrbrain-cd-backend`
3. Type: **Pipeline**
4. Cliquer **OK**

**Configuration:**
- **General**:
  - Description: `CD Pipeline pour le Backend - Déploiement Kubernetes`
  - ☑️ Discard old builds → Strategy: Log Rotation → Max # of builds to keep: `10`
  - ☑️ **This project is parameterized**
    - Cliquer **Add Parameter** → **String Parameter**
    - Name: `IMAGE_TAG`
    - Default Value: `latest`
    - Description: `Tag de l'image Docker à déployer (ex: 5, 42, latest)`

- **Pipeline**:
  - Definition: `Pipeline script from SCM`
  - SCM: `Git`
  - Repository URL: `https://github.com/mouadhhamzaoui/ZeroOne-Studio.git`
  - Credentials: `github-credentials`
  - Branch Specifier: `*/feature/k8s-jenkins-cicd`
  - Script Path: `jenkins/Jenkinsfile.cd.back.simple`

5. Cliquer **Save**

#### 1.3 Créer le job **hrbrain-cd-frontend**

1. Cliquer sur **"New Item"**
2. Nom: `hrbrain-cd-frontend`
3. Type: **Pipeline**
4. Cliquer **OK**

**Configuration:**
- **General**:
  - Description: `CD Pipeline pour le Frontend - Déploiement Kubernetes`
  - ☑️ Discard old builds → Strategy: Log Rotation → Max # of builds to keep: `10`
  - ☑️ **This project is parameterized**
    - Cliquer **Add Parameter** → **String Parameter**
    - Name: `IMAGE_TAG`
    - Default Value: `latest`
    - Description: `Tag de l'image Docker à déployer (ex: 5, 42, latest)`

- **Pipeline**:
  - Definition: `Pipeline script from SCM`
  - SCM: `Git`
  - Repository URL: `https://github.com/mouadhhamzaoui/ZeroOne-Studio.git`
  - Credentials: `github-credentials`
  - Branch Specifier: `*/feature/k8s-jenkins-cicd`
  - Script Path: `jenkins/Jenkinsfile.cd.front.simple`

5. Cliquer **Save**

---

### Étape 2: Pousser les nouveaux fichiers sur GitHub

```bash
# Sur votre machine Windows
cd C:\Users\mouad\OneDrive\Bureau\PI\ZeroOne-Studio

# Vérifier la branche actuelle
git branch

# Si pas sur feature/k8s-jenkins-cicd, basculer dessus
git checkout feature/k8s-jenkins-cicd

# Ajouter les nouveaux fichiers
git add jenkins/Jenkinsfile.ci.front.simple
git add jenkins/Jenkinsfile.cd.back.simple
git add jenkins/Jenkinsfile.cd.front.simple
git add jenkins/README.md
git add jenkins/CONFIGURATION-JOBS.md
git add GUIDE-JENKINS-SUITE.md

# Vérifier les fichiers ajoutés
git status

# Commit
git commit -m "Add simplified Jenkinsfiles for CI/CD pipelines"

# Push vers GitHub
git push origin feature/k8s-jenkins-cicd
```

---

### Étape 3: Tester les pipelines

#### 3.1 Tester CI Frontend

1. Aller sur Jenkins: http://192.168.1.11:8080
2. Cliquer sur **hrbrain-ci-frontend**
3. Cliquer sur **"Build Now"**
4. Attendre la fin du build (environ 3-5 minutes)
5. Vérifier les logs:
   - ✅ Checkout réussi
   - ✅ npm ci réussi
   - ✅ Lint réussi
   - ✅ Build Vite réussi
   - ✅ Docker Build réussi
   - ✅ Docker Push réussi

**Vérification:**
```bash
# Sur worker-1
docker images | grep hrbrain-frontend

# Vérifier sur DockerHub
# https://hub.docker.com/r/mouadh08/hrbrain-frontend
```

#### 3.2 Tester CD Backend

1. Aller sur Jenkins: http://192.168.1.11:8080
2. Cliquer sur **hrbrain-cd-backend**
3. Cliquer sur **"Build with Parameters"**
4. IMAGE_TAG: `5` (ou le numéro du build CI Backend réussi)
5. Cliquer **Build**
6. Attendre la fin du déploiement (environ 2-3 minutes)

**Vérification:**
```bash
# Sur master ou worker-1
kubectl get pods -n hrbrain -l app=backend
# Devrait montrer 2 pods Running

kubectl get deployment backend -n hrbrain
# Devrait montrer 2/2 READY

# Smoke test
curl http://192.168.1.11:30000/health
# Devrait retourner un statut 200
```

#### 3.3 Tester CD Frontend

1. Aller sur Jenkins: http://192.168.1.11:8080
2. Cliquer sur **hrbrain-cd-frontend**
3. Cliquer sur **"Build with Parameters"**
4. IMAGE_TAG: `X` (le numéro du build CI Frontend réussi)
5. Cliquer **Build**
6. Attendre la fin du déploiement (environ 2-3 minutes)

**Vérification:**
```bash
# Sur master ou worker-1
kubectl get pods -n hrbrain -l app=frontend
# Devrait montrer 2 pods Running

kubectl get deployment frontend -n hrbrain
# Devrait montrer 2/2 READY

# Smoke test
curl http://192.168.1.11:30080
# Devrait retourner du HTML

# Tester dans le navigateur
# http://192.168.1.11:30080
```

---

### Étape 4: Validation complète

Une fois les 4 pipelines testés et validés:

#### 4.1 Checklist de validation

- [ ] **CI Backend** - Build réussi, image pushée ✅ (Build #5)
- [ ] **CI Frontend** - Build réussi, image pushée
- [ ] **CD Backend** - Déploiement réussi, pods Running, smoke test OK
- [ ] **CD Frontend** - Déploiement réussi, pods Running, smoke test OK

#### 4.2 Vérification finale du cluster

```bash
# Sur master
kubectl get all -n hrbrain

# Devrait montrer:
# - 2 pods backend Running
# - 2 pods frontend Running
# - 1 pod ollama Running
# - Services backend, frontend, ollama
# - Deployments backend, frontend, ollama
```

---

### Étape 5: Merger vers main (après validation)

```bash
# Sur votre machine Windows
cd C:\Users\mouad\OneDrive\Bureau\PI\ZeroOne-Studio

# Vérifier que tout est commité
git status

# Basculer sur main
git checkout main

# Merger la branche feature
git merge feature/k8s-jenkins-cicd

# Pousser vers GitHub
git push origin main
```

#### 5.1 Mettre à jour les jobs Jenkins

Pour chaque job (hrbrain-ci-backend, hrbrain-ci-frontend, hrbrain-cd-backend, hrbrain-cd-frontend):

1. Aller sur le job dans Jenkins
2. Cliquer sur **"Configure"**
3. Dans la section **Pipeline** → **Branches to build**:
   - Changer `*/feature/k8s-jenkins-cicd` en `*/main`
4. Cliquer **Save**

#### 5.2 Tester à nouveau sur main

Relancer les 4 pipelines pour confirmer que tout fonctionne sur la branche main.

---

## 🎉 Finalisation

Une fois tout validé:

1. **Documentation complète** ✅
2. **4 pipelines CI/CD fonctionnels** ✅
3. **Cluster Kubernetes opérationnel** ✅
4. **Application déployée et accessible** ✅

### Accès à l'application

- **Frontend**: http://192.168.1.11:30080
- **Backend**: http://192.168.1.11:30000
- **Jenkins**: http://192.168.1.11:8080

### Architecture finale

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Repository                         │
│                      main branch                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ git push
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Jenkins (worker-1:8080)                         │
│                                                              │
│  CI Backend → Docker Push → CD Backend → K8s Deploy         │
│  CI Frontend → Docker Push → CD Frontend → K8s Deploy       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         Kubernetes Cluster (3 nodes)                         │
│                                                              │
│  • master (192.168.1.10) - Control plane                    │
│  • worker-1 (192.168.1.11) - Jenkins + App                  │
│  • worker-3 (192.168.1.12) - Ollama                         │
│                                                              │
│  Namespace: hrbrain                                          │
│  • Backend: 2 replicas (NodePort 30000)                     │
│  • Frontend: 2 replicas (NodePort 30080)                    │
│  • Ollama: 1 replica (qwen2.5:7b)                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Progression du projet

- ✅ Kubernetes Cluster (3 nodes) - 100%
- ✅ Jenkins Installation - 100%
- ✅ Jenkins Configuration - 100%
- ✅ Credentials Setup - 100%
- ✅ Jenkinsfiles Creation - 100%
- ✅ CI Backend Job - 100% (testé)
- ⏳ CI Frontend Job - 80% (créé, à tester)
- ⏳ CD Backend Job - 80% (créé, à tester)
- ⏳ CD Frontend Job - 80% (créé, à tester)
- ⏳ Merge to main - 0%

**Progression globale: 96%**

---

## 🚀 Commandes rapides

### Vérifier Jenkins
```bash
# Sur worker-1
sudo systemctl status jenkins
curl -I http://localhost:8080 | grep X-Jenkins
```

### Vérifier Kubernetes
```bash
# Sur master
kubectl get nodes
kubectl get pods -n hrbrain
kubectl get svc -n hrbrain
```

### Vérifier Docker
```bash
# Sur worker-1
docker images | grep hrbrain
docker ps | grep hrbrain
```

### Logs Jenkins
```bash
# Sur worker-1
sudo journalctl -u jenkins -f
```

### Logs Kubernetes
```bash
# Sur master
kubectl logs -n hrbrain -l app=backend --tail=50
kubectl logs -n hrbrain -l app=frontend --tail=50
```

---

## 📞 En cas de problème

### Jenkins ne démarre pas
```bash
sudo systemctl status jenkins
sudo journalctl -u jenkins -n 100 --no-pager
```

### Build échoue
1. Vérifier les logs du build dans Jenkins
2. Vérifier les credentials
3. Vérifier la connexion GitHub
4. Vérifier Docker

### Déploiement K8s échoue
```bash
kubectl get pods -n hrbrain
kubectl describe pod <pod-name> -n hrbrain
kubectl logs <pod-name> -n hrbrain
```

---

**Bon courage pour la finalisation! 🚀**
