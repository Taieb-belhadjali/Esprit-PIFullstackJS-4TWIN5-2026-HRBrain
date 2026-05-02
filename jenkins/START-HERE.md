# 🎯 COMMENCEZ ICI - Configuration Jenkins sur Worker-1

**Temps total** : 15 minutes  
**Localisation** : Tout sur worker-1 (192.168.1.11)

---

## 🚀 Étape par étape

### 1️⃣ Connectez-vous sur worker-1

```bash
ssh ahmed@192.168.1.11
```

### 2️⃣ Allez dans le dossier du projet

```bash
cd /path/to/hrbrain/jenkins
```

### 3️⃣ Lancez le script de vérification

```bash
chmod +x check-worker1.sh
./check-worker1.sh
```

**Ce script va vérifier** :
- ✅ Node.js et npm
- ✅ Docker
- ✅ kubectl
- ✅ Jenkins
- ✅ Cluster Kubernetes
- ✅ Application HRBrain

### 4️⃣ Suivez le guide complet

```bash
cat GUIDE-WORKER1.md
```

ou ouvrez le fichier dans votre éditeur préféré.

---

## 📋 Checklist rapide

Cochez au fur et à mesure :

- [ ] **Prérequis vérifiés** (script check-worker1.sh)
- [ ] **jenkins ajouté au groupe docker**
  ```bash
  sudo usermod -aG docker jenkins
  sudo systemctl restart jenkins
  ```

- [ ] **Plugins Jenkins installés**
  - [ ] Docker Pipeline
  - [ ] Kubernetes CLI
  - [ ] GitHub Integration

- [ ] **Credentials créés**
  - [ ] dockerhub-credentials (Username/Password)
  - [ ] kubeconfig (Secret file)

- [ ] **Jobs Jenkins créés**
  - [ ] hrbrain-ci-backend
  - [ ] hrbrain-cd-backend
  - [ ] hrbrain-ci-frontend
  - [ ] hrbrain-cd-frontend

- [ ] **Test réussi**
  - [ ] Build hrbrain-ci-backend → Succès
  - [ ] Build hrbrain-cd-backend → Succès (automatique)
  - [ ] Build hrbrain-ci-frontend → Succès
  - [ ] Build hrbrain-cd-frontend → Succès (automatique)

- [ ] **Application accessible**
  - [ ] Frontend : http://192.168.1.11:30080
  - [ ] Backend : http://192.168.1.11:30000/health

---

## 🔗 Liens utiles

| Ressource | URL |
|-----------|-----|
| Jenkins | http://192.168.1.11:8080 |
| Frontend | http://192.168.1.11:30080 |
| Backend API | http://192.168.1.11:30000 |
| Ollama API | http://192.168.1.13:11434 |

---

## 📚 Documentation

| Fichier | Description |
|---------|-------------|
| `START-HERE.md` | 👈 Vous êtes ici |
| `GUIDE-WORKER1.md` | Guide complet étape par étape |
| `check-worker1.sh` | Script de vérification |
| `SETUP-JENKINS.md` | Documentation détaillée |
| `README.md` | Vue d'ensemble Jenkins |

---

## 🆘 Besoin d'aide ?

### Problème : jenkins pas dans groupe docker
```bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
sleep 30
```

### Problème : Jenkins ne démarre pas
```bash
sudo systemctl status jenkins
sudo journalctl -u jenkins -n 50
```

### Problème : kubectl ne fonctionne pas
```bash
# Copier le kubeconfig depuis master
scp ahmed@192.168.1.10:~/.kube/config ~/.kube/config
kubectl get nodes
```

### Problème : SonarQube échoue
Voir section "Désactiver SonarQube" dans `GUIDE-WORKER1.md`

---

## ✅ Une fois terminé

Vous aurez un pipeline CI/CD complet :

```
┌─────────────────────────────────────────────────────────┐
│  Push GitHub                                            │
└────────────┬────────────────────────────────────────────┘
             │
    ┌────────┴────────┐
    ▼                 ▼
┌─────────┐      ┌─────────┐
│ CI Back │      │ CI Front│
└────┬────┘      └────┬────┘
     │                │
     ▼                ▼
┌─────────┐      ┌─────────┐
│ CD Back │      │ CD Front│
└────┬────┘      └────┬────┘
     │                │
     └────────┬───────┘
              ▼
      ┌──────────────┐
      │ K8s Deployed │
      └──────────────┘
```

---

**🚀 Allons-y ! Commencez par lancer `./check-worker1.sh`**
