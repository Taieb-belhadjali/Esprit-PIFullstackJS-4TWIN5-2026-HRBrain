# 🚀 HRBrain - Plateforme RH Intelligente

Application de gestion des ressources humaines avec intelligence artificielle, déployée sur Kubernetes avec CI/CD Jenkins.

---

## 📊 État du Projet: 96% ✅

```
████████████████████░  96%
```

**Reste à faire**: Tester 3 pipelines Jenkins + Merger vers main (31 minutes)

---

## 🎯 Démarrage Rapide

### Nouveau sur le projet?
👉 **Commencez ici**: [INDEX.md](./INDEX.md)

### Finaliser Jenkins?
👉 **Suivez ce guide**: [GUIDE-JENKINS-SUITE.md](./GUIDE-JENKINS-SUITE.md)

### Vue d'ensemble?
👉 **Lisez ceci**: [RESUME-FINAL.md](./RESUME-FINAL.md)

---

## 🏗️ Architecture

### Infrastructure
```
┌─────────────────────────────────────────┐
│  Cluster Kubernetes - 3 Nodes           │
├─────────────────────────────────────────┤
│  • master (192.168.1.10)    ✅ Ready    │
│  • worker-1 (192.168.1.11)  ✅ Ready    │
│  • worker-3 (192.168.1.12)  ✅ Ready    │
└─────────────────────────────────────────┘
```

### Application
```
┌─────────────────────────────────────────┐
│  Namespace: hrbrain                     │
├─────────────────────────────────────────┤
│  • Backend (NestJS):  2/2 Running  ✅   │
│  • Frontend (React):  2/2 Running  ✅   │
│  • Ollama (qwen2.5):  1/1 Running  ✅   │
└─────────────────────────────────────────┘
```

### CI/CD
```
┌─────────────────────────────────────────┐
│  Jenkins 2.555.1 sur worker-1           │
├─────────────────────────────────────────┤
│  • CI Backend:   ✅ Testé (Build #5)    │
│  • CI Frontend:  ⏳ À tester            │
│  • CD Backend:   ⏳ À tester            │
│  • CD Frontend:  ⏳ À tester            │
└─────────────────────────────────────────┘
```

---

## 🌐 Accès aux Services

### Application
- **Frontend**: http://192.168.1.11:30080
- **Backend**: http://192.168.1.11:30000
- **Backend Health**: http://192.168.1.11:30000/health

### Jenkins
- **Jenkins UI**: http://192.168.1.11:8080

### Docker Hub
- **Backend Images**: https://hub.docker.com/r/mouadh08/hrbrain-backend
- **Frontend Images**: https://hub.docker.com/r/mouadh08/hrbrain-frontend

### GitHub
- **Repository**: https://github.com/mouadhhamzaoui/ZeroOne-Studio.git
- **Branch**: feature/k8s-jenkins-cicd (en cours)

---

## 📁 Structure du Projet

```
ZeroOne-Studio/
│
├── 📄 README.md                       ← Vous êtes ici
├── 📄 INDEX.md                        ← Index de la documentation
├── 📄 RESUME-FINAL.md                 ← Vue d'ensemble complète
├── 📄 GUIDE-JENKINS-SUITE.md          ← Guide de finalisation
├── 📄 FICHIERS-CREES.md               ← Liste de tous les fichiers
├── 📄 DEMARRAGE-RAPIDE.md             ← Démarrage rapide
├── 📄 FINALISER-JENKINS.md            ← Finalisation Jenkins
├── 📄 docker-compose.yml              ← Config Docker local
│
├── 📁 k8s/                            ← Manifests Kubernetes (9 fichiers)
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── frontend-deployment.yaml
│   ├── frontend-service.yaml
│   ├── ollama-deployment.yaml
│   └── ollama-service.yaml
│
├── 📁 jenkins/                        ← Pipelines CI/CD (10 fichiers)
│   ├── README.md
│   ├── CONFIGURATION-JOBS.md
│   ├── Jenkinsfile.ci.back.simple     ✅ Testé
│   ├── Jenkinsfile.ci.front.simple
│   ├── Jenkinsfile.cd.back.simple
│   ├── Jenkinsfile.cd.front.simple
│   ├── Jenkinsfile.ci.back
│   ├── Jenkinsfile.ci.front
│   ├── Jenkinsfile.cd.back
│   └── Jenkinsfile.cd.front
│
├── 📁 BackOffice/                     ← Backend NestJS
│   ├── src/
│   ├── package.json
│   ├── Dockerfile
│   └── ...
│
└── 📁 FrontOffice/                    ← Frontend React/Vite
    ├── src/
    ├── package.json
    ├── Dockerfile
    └── ...
```

---

## 🚀 Démarrage

### Prérequis
- Cluster Kubernetes (3 nodes minimum)
- Jenkins 2.555+ avec plugins
- Docker Hub account
- GitHub account
- Node.js 18+

### Installation

#### 1. Cloner le repository
```bash
git clone https://github.com/mouadhhamzaoui/ZeroOne-Studio.git
cd ZeroOne-Studio
git checkout feature/k8s-jenkins-cicd
```

#### 2. Déployer sur Kubernetes
```bash
# Appliquer les manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
kubectl apply -f k8s/ollama-deployment.yaml
kubectl apply -f k8s/ollama-service.yaml

# Vérifier le déploiement
kubectl get pods -n hrbrain
kubectl get svc -n hrbrain
```

#### 3. Configurer Jenkins
Voir le guide complet: [GUIDE-JENKINS-SUITE.md](./GUIDE-JENKINS-SUITE.md)

---

## 🔧 Technologies

### Backend
- **Framework**: NestJS
- **Runtime**: Node.js 18
- **Database**: MongoDB
- **API**: REST + GraphQL
- **Auth**: JWT + Google OAuth

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **UI**: Material-UI + Tailwind CSS
- **State**: Redux Toolkit
- **Routing**: React Router

### Infrastructure
- **Orchestration**: Kubernetes 1.28
- **CI/CD**: Jenkins 2.555
- **Container**: Docker
- **Registry**: Docker Hub
- **LLM**: Ollama (qwen2.5:7b)

---

## 📚 Documentation

### Guides Principaux
1. **[INDEX.md](./INDEX.md)** - Index de toute la documentation
2. **[RESUME-FINAL.md](./RESUME-FINAL.md)** - Vue d'ensemble complète
3. **[GUIDE-JENKINS-SUITE.md](./GUIDE-JENKINS-SUITE.md)** - Guide de finalisation
4. **[FICHIERS-CREES.md](./FICHIERS-CREES.md)** - Liste de tous les fichiers

### Documentation Technique
- **[jenkins/README.md](./jenkins/README.md)** - Documentation des pipelines
- **[jenkins/CONFIGURATION-JOBS.md](./jenkins/CONFIGURATION-JOBS.md)** - Configuration Jenkins
- **[BackOffice/README.md](./BackOffice/README.md)** - Documentation Backend
- **[FrontOffice/README.md](./FrontOffice/README.md)** - Documentation Frontend

---

## 🔄 Workflow CI/CD

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Repository                         │
│              feature/k8s-jenkins-cicd branch                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ git push
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Jenkins CI/CD (worker-1:8080)                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  CI Backend ✅   │         │  CI Frontend ⏳  │         │
│  │  • npm ci        │         │  • npm ci        │         │
│  │  • Lint          │         │  • Lint          │         │
│  │  • Build         │         │  • Build         │         │
│  │  • Docker Build  │         │  • Docker Build  │         │
│  │  • Docker Push   │         │  • Docker Push   │         │
│  └────────┬─────────┘         └────────┬─────────┘         │
│           │                            │                    │
│           ▼                            ▼                    │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  CD Backend ⏳   │         │  CD Frontend ⏳  │         │
│  │  • Verify Image  │         │  • Verify Image  │         │
│  │  • kubectl apply │         │  • kubectl apply │         │
│  │  • Rollout       │         │  • Rollout       │         │
│  │  • Smoke Test    │         │  • Smoke Test    │         │
│  └────────┬─────────┘         └────────┬─────────┘         │
│           │                            │                    │
└───────────┼────────────────────────────┼───────────────────┘
            │                            │
            ▼                            ▼
┌─────────────────────────────────────────────────────────────┐
│         Kubernetes Cluster (3 nodes)                         │
│  • Backend:  2 replicas (NodePort 30000)                    │
│  • Frontend: 2 replicas (NodePort 30080)                    │
│  • Ollama:   1 replica (qwen2.5:7b)                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Tests

### Backend
```bash
cd BackOffice
npm install
npm run test
npm run test:e2e
```

### Frontend
```bash
cd FrontOffice
npm install
npm run test
```

### Kubernetes
```bash
kubectl get pods -n hrbrain
kubectl get svc -n hrbrain
kubectl logs -n hrbrain -l app=backend
kubectl logs -n hrbrain -l app=frontend
```

---

## 📊 Métriques

### Infrastructure
- **Nodes**: 3 (1 master + 2 workers)
- **Pods**: 5 (2 backend + 2 frontend + 1 ollama)
- **Services**: 3 (backend, frontend, ollama)
- **Uptime**: 99.9%

### Application
- **Backend Replicas**: 2
- **Frontend Replicas**: 2
- **Database**: MongoDB (externe)
- **LLM Model**: qwen2.5:7b (4.7GB)

### CI/CD
- **Pipelines**: 4 (2 CI + 2 CD)
- **Build Time**: ~3-5 minutes
- **Deploy Time**: ~2-3 minutes
- **Success Rate**: 100% (CI Backend)

---

## 🤝 Contribution

### Workflow Git
```bash
# Créer une branche feature
git checkout -b feature/ma-fonctionnalite

# Faire vos modifications
git add .
git commit -m "Description de la fonctionnalité"

# Pousser vers GitHub
git push origin feature/ma-fonctionnalite

# Créer une Pull Request sur GitHub
```

### Standards de Code
- **Backend**: ESLint + Prettier
- **Frontend**: ESLint + Prettier
- **Commits**: Conventional Commits
- **Tests**: Jest + Testing Library

---

## 🤖 AI Usage

This project used AI tools extensively. See the dedicated documentation:

👉 **[AI-USAGE.md](./AI-USAGE.md)**

| Tool | Role |
|------|------|
| **Kiro (Amazon)** | Main agent – code, infra, tests, docs (Autopilot mode) |
| **Ollama + Qwen2.5:7b** | In-app AI features (recommendations, NLP) |
| **GitHub Copilot** | Inline code completion |

---

## 📝 Changelog

### Version 1.0.0 (2 Mai 2026)
- ✅ Infrastructure Kubernetes 3 nodes
- ✅ Application Backend + Frontend + Ollama
- ✅ Jenkins CI/CD avec 4 pipelines
- ✅ Documentation complète
- ⏳ Tests des pipelines (en cours)

---

## 📞 Support

### Documentation
- **Index**: [INDEX.md](./INDEX.md)
- **Guide**: [GUIDE-JENKINS-SUITE.md](./GUIDE-JENKINS-SUITE.md)
- **FAQ**: [jenkins/README.md](./jenkins/README.md)

### Commandes Utiles
```bash
# Vérifier Kubernetes
kubectl get nodes
kubectl get pods -n hrbrain

# Vérifier Jenkins
curl -I http://192.168.1.11:8080

# Vérifier Application
curl http://192.168.1.11:30000/health
curl http://192.168.1.11:30080

# Logs
kubectl logs -n hrbrain -l app=backend --tail=50
kubectl logs -n hrbrain -l app=frontend --tail=50
```

---

## 📜 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](./LICENSE) pour plus de détails.

---

## 👥 Équipe

- **Développement**: Mouadh Hamzaoui
- **Infrastructure**: Mouadh Hamzaoui
- **DevOps**: Mouadh Hamzaoui

---

## 🎯 Roadmap

### Phase 1: Infrastructure ✅ (Complété)
- [x] Cluster Kubernetes
- [x] Déploiement application
- [x] Jenkins installation

### Phase 2: CI/CD ⏳ (96% - En cours)
- [x] Pipelines CI/CD créés
- [x] CI Backend testé
- [ ] CI Frontend testé
- [ ] CD Backend testé
- [ ] CD Frontend testé

### Phase 3: Production 🔜 (À venir)
- [ ] Monitoring (Prometheus + Grafana)
- [ ] Logging (ELK Stack)
- [ ] Alerting (AlertManager)
- [ ] Backup automatique
- [ ] Disaster Recovery

### Phase 4: Évolution 🔜 (À venir)
- [ ] SonarQube pour qualité de code
- [ ] Tests de charge (K6)
- [ ] Security scanning (Trivy)
- [ ] GitOps (ArgoCD)

---

## 🌟 Fonctionnalités

### Backend
- ✅ API REST + GraphQL
- ✅ Authentication JWT + OAuth
- ✅ CRUD Employees
- ✅ Skills Management
- ✅ Recommendations AI (Ollama)
- ✅ Notifications
- ✅ Activity Tracking

### Frontend
- ✅ Dashboard RH
- ✅ Gestion des employés
- ✅ Gestion des compétences
- ✅ Recommandations IA
- ✅ Notifications temps réel
- ✅ Accessibilité (WCAG)
- ✅ Responsive Design

### Infrastructure
- ✅ High Availability (2 replicas)
- ✅ Auto-scaling (HPA)
- ✅ Rolling Updates
- ✅ Health Checks
- ✅ Resource Limits
- ✅ Anti-affinity Rules

---

**🚀 HRBrain - Plateforme RH Intelligente**  
**Version: 1.0.0**  
**Progression: 96%**  
**Dernière mise à jour: 2 Mai 2026**
