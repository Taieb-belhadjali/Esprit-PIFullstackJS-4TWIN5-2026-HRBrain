# 🚀 Configuration Jenkins - HRBrain

**Projet** : HRBrain - Système de gestion RH avec IA  
**État** : 92% → 100% (Jenkins à finaliser)  
**Temps restant** : 15 minutes  
**Localisation** : Worker-1 (192.168.1.11)

---

## 🎯 Action immédiate

```bash
# Sur worker-1
cd jenkins
cat START-HERE.md
./check-worker1.sh
```

---

## 📚 Documentation disponible

Tous les guides sont dans le dossier `jenkins/` :

### 🚀 Démarrage rapide
- **jenkins/START-HERE.md** - Point de départ (2 min)
- **jenkins/check-worker1.sh** - Vérification automatique
- **jenkins/COMMANDES.sh** - Toutes les commandes

### 📖 Guides complets
- **jenkins/GUIDE-WORKER1.md** - Guide étape par étape (15 min)
- **jenkins/QUICK-START.md** - Guide rapide
- **jenkins/SETUP-JENKINS.md** - Documentation détaillée

### 🔧 Scripts
- **jenkins/check-worker1.sh** - Vérification de l'état
- **jenkins/setup-jenkins.sh** - Configuration automatique
- **jenkins/verify-jenkins.sh** - Vérification générale

### 📋 Référence
- **jenkins/README.md** - Vue d'ensemble Jenkins
- **jenkins/INDEX.md** - Index de toute la documentation

---

## ✅ Ce qui est déjà fait

- ✅ Cluster Kubernetes opérationnel (3 nodes)
- ✅ Application HRBrain déployée (Backend + Frontend)
- ✅ Ollama IA fonctionnel (modèle qwen2.5:7b)
- ✅ Haute disponibilité configurée
- ✅ Node.js 20.18.1 installé sur worker-1
- ✅ npm 10.8.2 disponible
- ✅ Jenkins installé et actif
- ✅ Docker installé

---

## ⏳ Ce qui reste à faire (15 min)

1. **Ajouter jenkins au groupe docker** (2 min)
2. **Installer les plugins Jenkins** (3 min)
3. **Créer les credentials** (5 min)
4. **Créer les 4 jobs Jenkins** (5 min)

---

## 🎯 Résultat final

Une fois terminé, vous aurez un pipeline CI/CD complet :

```
Push GitHub
    ↓
┌───────────────┐
│  CI Backend   │ → Build + Test + Docker Push
└───────┬───────┘
        ↓
┌───────────────┐
│  CD Backend   │ → Deploy to Kubernetes
└───────────────┘

┌───────────────┐
│  CI Frontend  │ → Build + Test + Docker Push
└───────┬───────┘
        ↓
┌───────────────┐
│  CD Frontend  │ → Deploy to Kubernetes
└───────────────┘
```

**Fonctionnalités** :
- ✅ Build automatique sur push GitHub
- ✅ Tests automatiques (lint + unit tests)
- ✅ Analyse de qualité (SonarQube optionnel)
- ✅ Build et push Docker automatique
- ✅ Déploiement Kubernetes automatique
- ✅ Rollback automatique en cas d'échec
- ✅ Smoke tests post-déploiement
- ✅ Garde de cohérence Backend/Frontend

---

## 🔗 Accès

| Service | URL |
|---------|-----|
| Jenkins | http://192.168.1.11:8080 |
| Frontend | http://192.168.1.11:30080 |
| Backend API | http://192.168.1.11:30000 |
| Ollama API | http://192.168.1.13:11434 |

---

## 📊 Architecture du projet

```
HRBrain/
├── BackOffice/              # Backend NestJS
│   ├── src/
│   ├── Dockerfile
│   └── package.json
│
├── FrontOffice/             # Frontend React + Vite
│   ├── src/
│   ├── Dockerfile
│   └── package.json
│
├── k8s/                     # Manifests Kubernetes
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
├── jenkins/                 # Configuration Jenkins
│   ├── START-HERE.md       👈 Commencez ici
│   ├── GUIDE-WORKER1.md    📖 Guide complet
│   ├── check-worker1.sh    🔍 Vérification
│   ├── Jenkinsfile.ci.back
│   ├── Jenkinsfile.cd.back
│   ├── Jenkinsfile.ci.front
│   └── Jenkinsfile.cd.front
│
├── PROJET-STATUS.md         # État du projet (92%)
├── FINALISER-JENKINS.md     # Guide de finalisation
└── README-JENKINS.md        # Ce fichier
```

---

## 🎓 Workflow recommandé

### Étape 1 : Vérification (2 min)
```bash
cd jenkins
chmod +x check-worker1.sh
./check-worker1.sh
```

### Étape 2 : Lecture du guide (3 min)
```bash
cat START-HERE.md
```

### Étape 3 : Configuration (10 min)
Suivre `jenkins/GUIDE-WORKER1.md` étape par étape

### Étape 4 : Test (5 min)
Lancer un build test dans Jenkins

---

## 🆘 Aide rapide

### Problème : jenkins ne peut pas utiliser Docker
```bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

### Problème : kubectl ne fonctionne pas
```bash
scp ahmed@192.168.1.10:~/.kube/config ~/.kube/config
kubectl get nodes
```

### Problème : SonarQube échoue
Voir section "Désactiver SonarQube" dans `jenkins/GUIDE-WORKER1.md`

---

## 📈 Progression

```
Infrastructure K8s     ████████████████████ 100%
Application            ████████████████████ 100%
Ollama IA              ████████████████████ 100%
Haute disponibilité    ████████████████████ 100%
Sécurité               ████████████████████ 100%
Jenkins CI/CD          ████████████░░░░░░░░  60%
                       ─────────────────────
TOTAL                  ██████████████████░░  92%
```

**Objectif** : Passer de 92% à 100% en 15 minutes ! 🎯

---

## 🎉 Une fois terminé

Vous aurez un projet **100% opérationnel** avec :

✅ Infrastructure Kubernetes haute disponibilité  
✅ Application web moderne (React + NestJS)  
✅ Intelligence artificielle intégrée (Ollama)  
✅ Pipeline CI/CD automatisé (Jenkins)  
✅ Déploiement automatique sur Kubernetes  
✅ Rollback automatique en cas d'échec  
✅ Tests automatiques  
✅ Monitoring ready  

**Un projet professionnel de niveau production ! 🚀**

---

## 📞 Support

- **Documentation complète** : `jenkins/INDEX.md`
- **Guide étape par étape** : `jenkins/GUIDE-WORKER1.md`
- **Vérification** : `./jenkins/check-worker1.sh`
- **État du projet** : `PROJET-STATUS.md`

---

**🚀 Prêt à finaliser ? Commencez par : `cd jenkins && cat START-HERE.md`**
