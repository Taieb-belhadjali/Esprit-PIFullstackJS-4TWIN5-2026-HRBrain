# Jenkins CI/CD Pipelines - HRBrain

## 📁 Structure des fichiers

```
jenkins/
├── README.md                          # Ce fichier
├── CONFIGURATION-JOBS.md              # Guide de configuration des 4 jobs Jenkins
│
├── Jenkinsfile.ci.back.simple         # ✅ CI Backend (version simplifiée - TESTÉ)
├── Jenkinsfile.ci.front.simple        # ⏳ CI Frontend (version simplifiée)
├── Jenkinsfile.cd.back.simple         # ⏳ CD Backend (version simplifiée)
├── Jenkinsfile.cd.front.simple        # ⏳ CD Frontend (version simplifiée)
│
├── Jenkinsfile.ci.back                # CI Backend (avec SonarQube)
├── Jenkinsfile.ci.front               # CI Frontend (avec SonarQube)
├── Jenkinsfile.cd.back                # CD Backend (avec garde CI Frontend)
└── Jenkinsfile.cd.front               # CD Frontend (avec garde CI Backend)
```

## 🎯 Versions Simplifiées vs Complètes

### Versions Simplifiées (*.simple)
- **Sans SonarQube** - Pas d'analyse de code statique
- **Sans Quality Gate** - Pas de vérification de qualité
- **Sans Tests Unitaires** - Pas d'exécution de tests
- **Sans Gardes CI** - Les CD ne vérifient pas l'état des CI opposés
- **Push sur feature/k8s-jenkins-cicd** - Pour les tests

✅ **Utilisées actuellement** pour valider le pipeline rapidement

### Versions Complètes
- **Avec SonarQube** - Analyse de code statique
- **Avec Quality Gate** - Vérification de qualité obligatoire
- **Avec Tests Unitaires** - Exécution des tests Jest
- **Avec Gardes CI** - CD Backend vérifie CI Frontend, et vice-versa
- **Push sur main/develop** - Pour la production

⏳ **À utiliser plus tard** après installation de SonarQube

## 🚀 Utilisation

### 1. Configuration des Jobs Jenkins

Suivre le guide détaillé: **[CONFIGURATION-JOBS.md](./CONFIGURATION-JOBS.md)**

### 2. Ordre de création des jobs

1. **hrbrain-ci-backend** ✅ FAIT
   - Script Path: `jenkins/Jenkinsfile.ci.back.simple`
   - Status: Build #5 réussi

2. **hrbrain-ci-frontend** ⏳ À CRÉER
   - Script Path: `jenkins/Jenkinsfile.ci.front.simple`

3. **hrbrain-cd-backend** ⏳ À CRÉER
   - Script Path: `jenkins/Jenkinsfile.cd.back.simple`
   - Paramètre: IMAGE_TAG (default: latest)

4. **hrbrain-cd-frontend** ⏳ À CRÉER
   - Script Path: `jenkins/Jenkinsfile.cd.front.simple`
   - Paramètre: IMAGE_TAG (default: latest)

### 3. Tests des pipelines

```bash
# 1. Tester CI Backend (déjà fait)
# Jenkins: Build Now sur hrbrain-ci-backend
# Résultat: Image mouadh08/hrbrain-backend:5 créée ✅

# 2. Tester CI Frontend
# Jenkins: Build Now sur hrbrain-ci-frontend
# Résultat attendu: Image mouadh08/hrbrain-frontend:X créée

# 3. Tester CD Backend
# Jenkins: Build with Parameters sur hrbrain-cd-backend
# IMAGE_TAG: 5 (ou le numéro du build CI)
# Vérification:
kubectl get pods -n hrbrain -l app=backend
curl http://192.168.1.11:30000/health

# 4. Tester CD Frontend
# Jenkins: Build with Parameters sur hrbrain-cd-frontend
# IMAGE_TAG: X (ou le numéro du build CI)
# Vérification:
kubectl get pods -n hrbrain -l app=frontend
curl http://192.168.1.11:30080
```

## 📊 Workflow CI/CD

```
┌─────────────────────────────────────────────────────────────┐
│  Developer Push to feature/k8s-jenkins-cicd                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  CI Backend (Jenkinsfile.ci.back.simple)                     │
│  • Checkout                                                  │
│  • npm ci                                                    │
│  • Lint                                                      │
│  • Build                                                     │
│  • Docker Build                                              │
│  • Docker Push → mouadh08/hrbrain-backend:X                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  CD Backend (Jenkinsfile.cd.back.simple)                     │
│  • Verify Image                                              │
│  • kubectl apply manifests                                   │
│  • kubectl set image                                         │
│  • kubectl rollout status                                    │
│  • Smoke Test (curl health endpoint)                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend Deployed on Kubernetes                              │
│  • 2 replicas running                                        │
│  • Accessible at http://192.168.1.11:30000                   │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Configuration Jenkins

### Credentials requis
- `dockerhub-credentials` - Username + PAT pour DockerHub
- `github-credentials` - Username + Token pour GitHub
- `kubeconfig` - Secret file pour kubectl

### Plugins requis
- git
- workflow-job
- workflow-cps
- workflow-basic-steps
- workflow-durable-task-step
- workflow-scm-step
- credentials-binding
- kubernetes-cli
- docker-workflow
- junit

## 📝 Différences clés entre les versions

### CI Backend

| Feature | Simple | Complete |
|---------|--------|----------|
| Checkout | ✅ | ✅ |
| Install Dependencies | ✅ | ✅ |
| Lint | ✅ (|| true) | ✅ |
| Build | ✅ | ✅ |
| Unit Tests | ❌ | ✅ |
| SonarQube Analysis | ❌ | ✅ |
| Quality Gate | ❌ | ✅ |
| Docker Build | ✅ | ✅ |
| Docker Push | ✅ (feature branch) | ✅ (main/develop) |

### CD Backend

| Feature | Simple | Complete |
|---------|--------|----------|
| Checkout | ✅ | ✅ |
| Check Frontend CI | ❌ | ✅ |
| Verify Image | ✅ | ✅ |
| Deploy to K8s | ✅ | ✅ |
| Verify Deployment | ✅ | ✅ |
| Smoke Test | ✅ | ✅ |
| Rollback on Failure | ✅ | ✅ |

## 🎯 Migration vers les versions complètes

Une fois SonarQube installé et configuré:

1. **Installer SonarQube** sur le cluster K8s ou sur worker-1
2. **Configurer SonarQube** dans Jenkins (Manage Jenkins → Configure System)
3. **Mettre à jour les jobs** pour utiliser les Jenkinsfiles complets:
   - `jenkins/Jenkinsfile.ci.back`
   - `jenkins/Jenkinsfile.ci.front`
   - `jenkins/Jenkinsfile.cd.back`
   - `jenkins/Jenkinsfile.cd.front`
4. **Tester** les pipelines avec SonarQube

## 📞 Troubleshooting

### Build échoue au stage "Docker Push"
```bash
# Vérifier les credentials DockerHub
docker login -u mouadh08
# Vérifier que le token est valide
```

### CD échoue au stage "Deploy to Kubernetes"
```bash
# Vérifier la connexion kubectl
kubectl get nodes
kubectl get pods -n hrbrain
# Vérifier le kubeconfig dans Jenkins
```

### Image Docker non trouvée
```bash
# Vérifier que le CI a bien pushé l'image
docker pull mouadh08/hrbrain-backend:X
# Vérifier sur DockerHub
# https://hub.docker.com/u/mouadh08
```

## 📈 Métriques de succès

- ✅ CI Backend: Build #5 réussi (2 min 30s)
- ⏳ CI Frontend: À tester
- ⏳ CD Backend: À tester
- ⏳ CD Frontend: À tester

## 🔄 Prochaines étapes

1. ✅ Créer les 4 Jenkinsfiles simplifiés
2. ⏳ Créer les 3 jobs manquants dans Jenkins
3. ⏳ Tester les 4 pipelines
4. ⏳ Merger feature/k8s-jenkins-cicd vers main
5. ⏳ Mettre à jour les jobs pour pointer vers main
6. ⏳ Installer SonarQube (optionnel)
7. ⏳ Migrer vers les Jenkinsfiles complets (optionnel)

---

**Projet HRBrain - CI/CD avec Jenkins et Kubernetes**
**Progression: 95% - Reste: Tests des 3 pipelines**
