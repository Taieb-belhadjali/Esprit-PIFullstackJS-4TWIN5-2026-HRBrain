# Configuration des 4 Jobs Jenkins - HRBrain CI/CD

## 📋 Vue d'ensemble

4 jobs Jenkins à configurer pour le pipeline CI/CD complet:

1. **hrbrain-ci-backend** - CI Backend (NestJS)
2. **hrbrain-ci-frontend** - CI Frontend (React/Vite)
3. **hrbrain-cd-backend** - CD Backend (Kubernetes)
4. **hrbrain-cd-frontend** - CD Frontend (Kubernetes)

---

## 🔧 Configuration Commune pour tous les jobs

### Credentials requis (déjà configurés):
- ✅ `dockerhub-credentials` - Username: mouadh08 + PAT
- ✅ `github-credentials` - Username: mouadh08 + GitHub Token
- ✅ `kubeconfig` - Secret file from worker-1

### Repository GitHub:
- URL: `https://github.com/mouadhhamzaoui/ZeroOne-Studio.git`
- Branch: `*/feature/k8s-jenkins-cicd` (pour les tests)
- Credentials: `github-credentials`

---

## 1️⃣ Job: hrbrain-ci-backend

### Type de projet:
**Pipeline**

### Configuration:
- **General**:
  - Description: `CI Pipeline pour le Backend NestJS - Build, Test, Docker Push`
  - ☑️ Discard old builds: Keep last 10 builds

- **Pipeline**:
  - Definition: `Pipeline script from SCM`
  - SCM: `Git`
  - Repository URL: `https://github.com/mouadhhamzaoui/ZeroOne-Studio.git`
  - Credentials: `github-credentials`
  - Branch Specifier: `*/feature/k8s-jenkins-cicd`
  - Script Path: `jenkins/Jenkinsfile.ci.back.simple`

### ✅ Status: TESTÉ ET FONCTIONNEL
- Build #5 réussi
- Image Docker créée: `mouadh08/hrbrain-backend:5` et `:latest`

---

## 2️⃣ Job: hrbrain-ci-frontend

### Type de projet:
**Pipeline**

### Configuration:
- **General**:
  - Description: `CI Pipeline pour le Frontend React/Vite - Build, Test, Docker Push`
  - ☑️ Discard old builds: Keep last 10 builds

- **Pipeline**:
  - Definition: `Pipeline script from SCM`
  - SCM: `Git`
  - Repository URL: `https://github.com/mouadhhamzaoui/ZeroOne-Studio.git`
  - Credentials: `github-credentials`
  - Branch Specifier: `*/feature/k8s-jenkins-cicd`
  - Script Path: `jenkins/Jenkinsfile.ci.front.simple`

---

## 3️⃣ Job: hrbrain-cd-backend

### Type de projet:
**Pipeline**

### Configuration:
- **General**:
  - Description: `CD Pipeline pour le Backend - Déploiement Kubernetes`
  - ☑️ Discard old builds: Keep last 10 builds
  - ☑️ **This project is parameterized**
    - **String Parameter**:
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

---

## 4️⃣ Job: hrbrain-cd-frontend

### Type de projet:
**Pipeline**

### Configuration:
- **General**:
  - Description: `CD Pipeline pour le Frontend - Déploiement Kubernetes`
  - ☑️ Discard old builds: Keep last 10 builds
  - ☑️ **This project is parameterized**
    - **String Parameter**:
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

---

## 🚀 Ordre de test des pipelines

### Phase 1: Tests CI (Build + Docker Push)
1. **Tester hrbrain-ci-backend** ✅ FAIT
   - Build #5 réussi
   - Image: `mouadh08/hrbrain-backend:5`

2. **Tester hrbrain-ci-frontend**
   ```bash
   # Dans Jenkins, cliquer sur "Build Now"
   ```
   - Vérifie que l'image est créée: `mouadh08/hrbrain-frontend:X`

### Phase 2: Tests CD (Déploiement K8s)
3. **Tester hrbrain-cd-backend**
   ```bash
   # Dans Jenkins, cliquer sur "Build with Parameters"
   # IMAGE_TAG: 5 (ou le numéro du build CI réussi)
   ```
   - Vérifie le déploiement: `kubectl get pods -n hrbrain -l app=backend`
   - Smoke test: `curl http://192.168.1.11:30000/health`

4. **Tester hrbrain-cd-frontend**
   ```bash
   # Dans Jenkins, cliquer sur "Build with Parameters"
   # IMAGE_TAG: X (ou le numéro du build CI réussi)
   ```
   - Vérifie le déploiement: `kubectl get pods -n hrbrain -l app=frontend`
   - Smoke test: `curl http://192.168.1.11:30080`

---

## 📝 Checklist de validation

### ✅ Backend CI (hrbrain-ci-backend)
- [x] Job créé dans Jenkins
- [x] Build réussi (Build #5)
- [x] Image Docker pushée sur DockerHub
- [x] Logs sans erreur

### ⏳ Frontend CI (hrbrain-ci-frontend)
- [ ] Job créé dans Jenkins
- [ ] Build réussi
- [ ] Image Docker pushée sur DockerHub
- [ ] Logs sans erreur

### ⏳ Backend CD (hrbrain-cd-backend)
- [ ] Job créé dans Jenkins
- [ ] Paramètre IMAGE_TAG configuré
- [ ] Déploiement K8s réussi
- [ ] Pods backend Running
- [ ] Smoke test réussi

### ⏳ Frontend CD (hrbrain-cd-frontend)
- [ ] Job créé dans Jenkins
- [ ] Paramètre IMAGE_TAG configuré
- [ ] Déploiement K8s réussi
- [ ] Pods frontend Running
- [ ] Smoke test réussi

---

## 🔄 Après validation complète

Une fois les 4 pipelines testés et validés sur `feature/k8s-jenkins-cicd`:

1. **Merger la branche feature vers main**:
   ```bash
   git checkout main
   git merge feature/k8s-jenkins-cicd
   git push origin main
   ```

2. **Mettre à jour les 4 jobs Jenkins**:
   - Changer Branch Specifier de `*/feature/k8s-jenkins-cicd` à `*/main`
   - Sauvegarder chaque job

3. **Tester à nouveau sur main**:
   - Relancer les 4 pipelines pour confirmer que tout fonctionne

---

## 📊 Architecture du Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Repository                         │
│              feature/k8s-jenkins-cicd branch                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ git push
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Jenkins CI/CD                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  CI Backend      │         │  CI Frontend     │         │
│  │  (NestJS)        │         │  (React/Vite)    │         │
│  ├──────────────────┤         ├──────────────────┤         │
│  │ 1. Checkout      │         │ 1. Checkout      │         │
│  │ 2. npm ci        │         │ 2. npm ci        │         │
│  │ 3. Lint          │         │ 3. Lint (tsc)    │         │
│  │ 4. Build         │         │ 4. Build (Vite)  │         │
│  │ 5. Docker Build  │         │ 5. Docker Build  │         │
│  │ 6. Docker Push   │         │ 6. Docker Push   │         │
│  └────────┬─────────┘         └────────┬─────────┘         │
│           │                            │                    │
│           │ Image: mouadh08/           │ Image: mouadh08/  │
│           │ hrbrain-backend:X          │ hrbrain-frontend:X│
│           ▼                            ▼                    │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  CD Backend      │         │  CD Frontend     │         │
│  │  (K8s Deploy)    │         │  (K8s Deploy)    │         │
│  ├──────────────────┤         ├──────────────────┤         │
│  │ 1. Verify Image  │         │ 1. Verify Image  │         │
│  │ 2. kubectl apply │         │ 2. kubectl apply │         │
│  │ 3. kubectl set   │         │ 3. kubectl set   │         │
│  │ 4. Rollout wait  │         │ 4. Rollout wait  │         │
│  │ 5. Smoke Test    │         │ 5. Smoke Test    │         │
│  └────────┬─────────┘         └────────┬─────────┘         │
│           │                            │                    │
└───────────┼────────────────────────────┼───────────────────┘
            │                            │
            ▼                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Kubernetes Cluster (3 nodes)                    │
├─────────────────────────────────────────────────────────────┤
│  Namespace: hrbrain                                          │
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  Backend Pods    │         │  Frontend Pods   │         │
│  │  (2 replicas)    │         │  (2 replicas)    │         │
│  │  Port: 3000      │         │  Port: 80        │         │
│  └────────┬─────────┘         └────────┬─────────┘         │
│           │                            │                    │
│           ▼                            ▼                    │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  NodePort 30000  │         │  NodePort 30080  │         │
│  └──────────────────┘         └──────────────────┘         │
│                                                              │
│  Access:                                                     │
│  • Backend:  http://192.168.1.11:30000                      │
│  • Frontend: http://192.168.1.11:30080                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Prochaines étapes

1. ✅ **Backend CI testé** - Build #5 réussi
2. ⏳ **Créer les 3 autres jobs** dans Jenkins (ci-frontend, cd-backend, cd-frontend)
3. ⏳ **Tester Frontend CI** - Vérifier le build et le push Docker
4. ⏳ **Tester Backend CD** - Déployer l'image backend sur K8s
5. ⏳ **Tester Frontend CD** - Déployer l'image frontend sur K8s
6. ⏳ **Merger vers main** - Une fois tous les tests validés
7. ⏳ **Mettre à jour les jobs** - Pointer vers la branche main

---

## 📞 Support

En cas de problème:
- Vérifier les logs Jenkins: `sudo journalctl -u jenkins -f`
- Vérifier les pods K8s: `kubectl get pods -n hrbrain`
- Vérifier les images Docker: `docker images | grep hrbrain`
- Vérifier DockerHub: https://hub.docker.com/u/mouadh08
