# 🎨 Guide Visuel - Configuration Jenkins

Guide visuel étape par étape avec captures d'écran textuelles.

---

## 📊 Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                    État Actuel du Projet                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Infrastructure K8s     ████████████████████ 100%          │
│  Application            ████████████████████ 100%          │
│  Ollama IA              ████████████████████ 100%          │
│  Haute disponibilité    ████████████████████ 100%          │
│  Sécurité               ████████████████████ 100%          │
│  Jenkins CI/CD          ████████████░░░░░░░░  60%          │
│                         ─────────────────────              │
│  TOTAL                  ██████████████████░░  92%          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Objectif : Passer de 92% à 100%

```
┌──────────────────────────────────────────────────────────────┐
│  Étape 1: Prérequis Docker        [████████████████████] ✅  │
│  Étape 2: Plugins Jenkins         [░░░░░░░░░░░░░░░░░░░░] ⏳  │
│  Étape 3: Credentials             [░░░░░░░░░░░░░░░░░░░░] ⏳  │
│  Étape 4: Jobs Jenkins            [░░░░░░░░░░░░░░░░░░░░] ⏳  │
│  Étape 5: Test Pipeline           [░░░░░░░░░░░░░░░░░░░░] ⏳  │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔧 Étape 1 : Prérequis Docker (2 min)

### Terminal sur worker-1

```bash
┌─────────────────────────────────────────────────────────────┐
│ ahmed@worker-1:~$                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ $ sudo usermod -aG docker jenkins                          │
│ [sudo] password for ahmed: ********                        │
│                                                             │
│ $ sudo systemctl restart jenkins                           │
│                                                             │
│ $ sleep 30                                                 │
│                                                             │
│ $ systemctl status jenkins                                 │
│ ● jenkins.service - Jenkins Continuous Integration Server │
│    Loaded: loaded (/lib/systemd/system/jenkins.service)   │
│    Active: active (running) since Sat 2026-05-02 10:30:00 │
│                                                             │
│ ✅ Jenkins redémarré avec succès                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Étape 2 : Plugins Jenkins (3 min)

### Interface Jenkins - Manage Plugins

```
┌─────────────────────────────────────────────────────────────┐
│ Jenkins > Manage Jenkins > Manage Plugins                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Installed] [Available] [Updates]                         │
│                                                             │
│  Search: [docker                              ] [🔍]       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☑ Docker Pipeline                                   │   │
│  │   Build and publish Docker images from Jenkins      │   │
│  │   Version: 572.v950f58993843                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Search: [kubernetes                          ] [🔍]       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☑ Kubernetes CLI                                    │   │
│  │   Configure kubectl to interact with Kubernetes     │   │
│  │   Version: 1.12.1                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Search: [github                              ] [🔍]       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☑ GitHub Integration                                │   │
│  │   Integrate Jenkins with GitHub                     │   │
│  │   Version: 1.37.3.1                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ☑ Restart Jenkins when installation is complete           │
│                                                             │
│  [Install without restart] [Download now and install...]   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Action** : Cliquer sur "Download now and install after restart"

---

## 🔐 Étape 3A : Credential DockerHub (2 min)

### Interface Jenkins - New Credentials

```
┌─────────────────────────────────────────────────────────────┐
│ Jenkins > Credentials > System > Global credentials        │
│ > Add Credentials                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Kind: [Username with password            ▼]               │
│                                                             │
│  Scope: [Global (Jenkins, nodes, items...) ▼]              │
│                                                             │
│  Username: [mouadh08                          ]            │
│                                                             │
│  Password: [••••••••••••••••••••••••••••••••••]            │
│                                                             │
│  ID: [dockerhub-credentials                   ]            │
│                                                             │
│  Description: [DockerHub credentials for HRBrain]          │
│                                                             │
│                                                             │
│  [Create]  [Cancel]                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Action** : Cliquer sur "Create"

---

## 🔐 Étape 3B : Credential Kubeconfig (3 min)

### Préparer le fichier sur worker-1

```bash
┌─────────────────────────────────────────────────────────────┐
│ ahmed@worker-1:~$                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ $ ls -la ~/.kube/config                                    │
│ -rw------- 1 ahmed ahmed 5679 May  1 15:30 .kube/config   │
│                                                             │
│ ✅ Fichier kubeconfig trouvé                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Interface Jenkins - New Credentials

```
┌─────────────────────────────────────────────────────────────┐
│ Jenkins > Credentials > System > Global credentials        │
│ > Add Credentials                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Kind: [Secret file                       ▼]               │
│                                                             │
│  Scope: [Global (Jenkins, nodes, items...) ▼]              │
│                                                             │
│  File: [Choose File] config                                │
│        └─ /home/ahmed/.kube/config                         │
│                                                             │
│  ID: [kubeconfig                              ]            │
│                                                             │
│  Description: [Kubernetes config for HRBrain cluster]      │
│                                                             │
│                                                             │
│  [Create]  [Cancel]                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Action** : Cliquer sur "Create"

---

## 🔨 Étape 4 : Créer les Jobs (5 min)

### Job 1 : hrbrain-ci-backend

```
┌─────────────────────────────────────────────────────────────┐
│ Jenkins > New Item                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Enter an item name:                                       │
│  [hrbrain-ci-backend                          ]            │
│                                                             │
│  ○ Freestyle project                                       │
│  ● Pipeline                                                │
│  ○ Multi-configuration project                             │
│  ○ Folder                                                  │
│  ○ Multibranch Pipeline                                    │
│                                                             │
│  [OK]  [Cancel]                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Configuration du Job

```
┌─────────────────────────────────────────────────────────────┐
│ Configure: hrbrain-ci-backend                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  General                                                   │
│  ☑ GitHub project                                          │
│    Project url: [https://github.com/USER/hrbrain/]        │
│                                                             │
│  Build Triggers                                            │
│  ☑ GitHub hook trigger for GITScm polling                  │
│                                                             │
│  Pipeline                                                  │
│  Definition: [Pipeline script from SCM        ▼]           │
│                                                             │
│  SCM: [Git                                    ▼]           │
│                                                             │
│  Repository URL: [https://github.com/USER/hrbrain.git]    │
│                                                             │
│  Credentials: [- none -                       ▼]           │
│                                                             │
│  Branch Specifier: [*/main                        ]        │
│                                                             │
│  Script Path: [jenkins/Jenkinsfile.ci.back        ]        │
│                                                             │
│  [Save]  [Apply]  [Cancel]                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Répéter pour les 3 autres jobs** :
- hrbrain-cd-backend (avec Build Triggers → Build after other projects)
- hrbrain-ci-frontend
- hrbrain-cd-frontend (avec Build Triggers → Build after other projects)

---

## 🧪 Étape 5 : Test du Pipeline (5 min)

### Lancer le build

```
┌─────────────────────────────────────────────────────────────┐
│ Jenkins > hrbrain-ci-backend                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Build Now]  [Configure]  [Delete Project]                │
│                                                             │
│  Build History                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ #1  May 2, 2026 10:45 AM                           │   │
│  │     [████████████████████░░░░░░░░] 80%             │   │
│  │     Stage: Docker Build                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Console Output

```
┌─────────────────────────────────────────────────────────────┐
│ Console Output - hrbrain-ci-backend #1                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Started by user admin                                      │
│ Running in Durability level: MAX_SURVIVABILITY            │
│ [Pipeline] Start of Pipeline                               │
│ [Pipeline] node                                            │
│ Running on Jenkins in /var/lib/jenkins/workspace/...      │
│                                                             │
│ [Pipeline] stage (Checkout)                                │
│ ✅ Branch: main | Commit: a1b2c3d4                         │
│                                                             │
│ [Pipeline] stage (Install Dependencies)                    │
│ npm ci                                                     │
│ added 847 packages in 23s                                  │
│ ✅ Dependencies installed                                  │
│                                                             │
│ [Pipeline] stage (Lint)                                    │
│ npm run lint                                               │
│ ✅ No linting errors                                       │
│                                                             │
│ [Pipeline] stage (Build)                                   │
│ npm run build                                              │
│ ✅ Build NestJS réussi                                     │
│                                                             │
│ [Pipeline] stage (Unit Tests)                              │
│ npm run test -- --forceExit --passWithNoTests              │
│ ✅ Tests passed                                            │
│                                                             │
│ [Pipeline] stage (Docker Build)                            │
│ docker build -t mouadh08/hrbrain-backend:1 .               │
│ ✅ Image built successfully                                │
│                                                             │
│ [Pipeline] stage (Docker Push)                             │
│ docker push mouadh08/hrbrain-backend:1                     │
│ ✅ Image pushed to DockerHub                               │
│                                                             │
│ [Pipeline] End of Pipeline                                 │
│ ✅ Pipeline CI Backend terminé avec succès                 │
│ Finished: SUCCESS                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Déclenchement automatique du CD

```
┌─────────────────────────────────────────────────────────────┐
│ Jenkins > hrbrain-cd-backend                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Build History                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ #1  May 2, 2026 10:55 AM                           │   │
│  │     Started by upstream project "hrbrain-ci-backend"│   │
│  │     [████████████████████████████] 100%            │   │
│  │     ✅ SUCCESS                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Console Output:                                           │
│  ✅ Check Frontend CI Status                               │
│  ✅ Verify Image                                           │
│  ✅ Deploy to Kubernetes                                   │
│  ✅ Verify Deployment                                      │
│  ✅ Smoke Test                                             │
│  ✅ Déploiement Backend réussi                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Vérification finale

### Terminal sur worker-1

```bash
┌─────────────────────────────────────────────────────────────┐
│ ahmed@worker-1:~$                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ $ kubectl get pods -n hrbrain                              │
│ NAME                        READY   STATUS    RESTARTS     │
│ backend-7d8f9c5b6d-abc12    2/2     Running   0            │
│ backend-7d8f9c5b6d-def34    2/2     Running   0            │
│ frontend-6c7d8e4f5g-ghi56   2/2     Running   0            │
│ frontend-6c7d8e4f5g-jkl78   2/2     Running   0            │
│ ollama-5b6c7d8e9f-mno90     1/1     Running   0            │
│                                                             │
│ ✅ Tous les pods sont Running                              │
│                                                             │
│ $ curl http://192.168.1.11:30000/health                    │
│ {"status":"ok"}                                            │
│                                                             │
│ ✅ Backend accessible                                      │
│                                                             │
│ $ curl -I http://192.168.1.11:30080                        │
│ HTTP/1.1 200 OK                                            │
│                                                             │
│ ✅ Frontend accessible                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎉 Résultat Final

```
┌─────────────────────────────────────────────────────────────┐
│                    Projet HRBrain - 100%                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Infrastructure K8s     ████████████████████ 100% ✅       │
│  Application            ████████████████████ 100% ✅       │
│  Ollama IA              ████████████████████ 100% ✅       │
│  Haute disponibilité    ████████████████████ 100% ✅       │
│  Sécurité               ████████████████████ 100% ✅       │
│  Jenkins CI/CD          ████████████████████ 100% ✅       │
│                         ─────────────────────              │
│  TOTAL                  ████████████████████ 100% ✅       │
│                                                             │
│  🎉 PROJET TERMINÉ ET OPÉRATIONNEL ! 🎉                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Workflow CI/CD Complet

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    Push sur GitHub                          │
│                           │                                 │
│              ┌────────────┴────────────┐                    │
│              ▼                         ▼                    │
│      ┌──────────────┐          ┌──────────────┐            │
│      │  CI Backend  │          │  CI Frontend │            │
│      │  ✅ Build    │          │  ✅ Build    │            │
│      │  ✅ Test     │          │  ✅ Test     │            │
│      │  ✅ Docker   │          │  ✅ Docker   │            │
│      └──────┬───────┘          └──────┬───────┘            │
│             │                         │                    │
│             ▼                         ▼                    │
│      ┌──────────────┐          ┌──────────────┐            │
│      │  CD Backend  │          │  CD Frontend │            │
│      │  ✅ Deploy   │          │  ✅ Deploy   │            │
│      │  ✅ Verify   │          │  ✅ Verify   │            │
│      │  ✅ Test     │          │  ✅ Test     │            │
│      └──────┬───────┘          └──────┬───────┘            │
│             │                         │                    │
│             └────────────┬────────────┘                    │
│                          ▼                                 │
│                 ┌─────────────────┐                        │
│                 │  Application    │                        │
│                 │  Live sur K8s   │                        │
│                 │  ✅ Accessible  │                        │
│                 └─────────────────┘                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔗 Accès

```
┌─────────────────────────────────────────────────────────────┐
│  Service          │  URL                                    │
├───────────────────┼─────────────────────────────────────────┤
│  Jenkins          │  http://192.168.1.11:8080               │
│  Frontend         │  http://192.168.1.11:30080              │
│  Backend API      │  http://192.168.1.11:30000              │
│  Ollama API       │  http://192.168.1.13:11434              │
└─────────────────────────────────────────────────────────────┘
```

---

**🎉 Félicitations ! Votre projet HRBrain est maintenant 100% opérationnel avec CI/CD automatisé ! 🚀**
