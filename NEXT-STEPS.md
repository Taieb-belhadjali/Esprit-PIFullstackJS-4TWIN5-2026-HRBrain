# 🎯 Prochaines Étapes - HRBrain

**État actuel** : 92% opérationnel  
**Objectif** : 100% avec Jenkins CI/CD  
**Temps** : 15 minutes  
**Localisation** : Worker-1 (192.168.1.11)

---

## 🚀 Action immédiate (sur worker-1)

```bash
# 1. Aller dans le dossier jenkins
cd /path/to/hrbrain/jenkins

# 2. Lancer la vérification
chmod +x check-worker1.sh
./check-worker1.sh

# 3. Lire le guide de démarrage
cat START-HERE.md
```

---

## 📋 Checklist des 5 étapes

### ✅ Étape 1 : Vérification (2 min)
```bash
./check-worker1.sh
```
**Résultat attendu** : Liste des prérequis OK et manquants

### ⏳ Étape 2 : Prérequis Docker (2 min)
```bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
sleep 30
```
**Résultat attendu** : jenkins peut utiliser Docker

### ⏳ Étape 3 : Plugins Jenkins (3 min)
**Via l'interface web** : http://192.168.1.11:8080
- Manage Jenkins → Manage Plugins → Available
- Installer : Docker Pipeline, Kubernetes CLI, GitHub Integration
- Redémarrer Jenkins

**Résultat attendu** : 3 plugins installés

### ⏳ Étape 4 : Credentials (5 min)
**Via l'interface web** : http://192.168.1.11:8080/credentials/

**A. dockerhub-credentials**
- Kind: Username with password
- Username: mouadh08
- Password: [votre mot de passe]
- ID: dockerhub-credentials

**B. kubeconfig**
- Kind: Secret file
- File: ~/.kube/config
- ID: kubeconfig

**Résultat attendu** : 2 credentials créés

### ⏳ Étape 5 : Jobs Jenkins (5 min)
**Via l'interface web** : http://192.168.1.11:8080

Créer 4 jobs (voir détails dans `jenkins/GUIDE-WORKER1.md`) :
1. hrbrain-ci-backend
2. hrbrain-cd-backend
3. hrbrain-ci-frontend
4. hrbrain-cd-frontend

**Résultat attendu** : 4 jobs créés

---

## 🧪 Test final (5 min)

```bash
# 1. Lancer CI Backend dans Jenkins
# http://192.168.1.11:8080/job/hrbrain-ci-backend/ → Build Now

# 2. Vérifier que CD Backend se lance automatiquement

# 3. Vérifier les pods
kubectl get pods -n hrbrain

# 4. Tester l'application
curl http://192.168.1.11:30000/health
curl http://192.168.1.11:30080
```

---

## 📚 Documentation disponible

| Fichier | Quand l'utiliser |
|---------|------------------|
| **jenkins/START-HERE.md** | 👈 Commencez ici |
| **jenkins/GUIDE-WORKER1.md** | Guide complet étape par étape |
| **jenkins/COMMANDES.sh** | Toutes les commandes |
| **jenkins/check-worker1.sh** | Vérification automatique |
| **README-JENKINS.md** | Vue d'ensemble |
| **PROJET-STATUS.md** | État du projet |

---

## 🎯 Objectif

```
Avant                          Après
──────                         ─────

92% ████████████████████░░     100% ████████████████████

Infrastructure ✅              Infrastructure ✅
Application    ✅              Application    ✅
Ollama IA      ✅              Ollama IA      ✅
Haute dispo    ✅              Haute dispo    ✅
Jenkins CI/CD  ⏳ 60%          Jenkins CI/CD  ✅ 100%
```

---

## 🎉 Une fois terminé

Vous aurez :

✅ Pipeline CI/CD automatisé  
✅ Build automatique sur push GitHub  
✅ Tests automatiques  
✅ Déploiement automatique sur K8s  
✅ Rollback automatique en cas d'échec  
✅ Smoke tests post-déploiement  

**Projet HRBrain : 100% opérationnel ! 🚀**

---

## 🆘 Besoin d'aide ?

**Problème** : Je ne sais pas par où commencer  
→ `cat jenkins/START-HERE.md`

**Problème** : jenkins ne peut pas utiliser Docker  
→ `sudo usermod -aG docker jenkins && sudo systemctl restart jenkins`

**Problème** : kubectl ne fonctionne pas  
→ `scp ahmed@192.168.1.10:~/.kube/config ~/.kube/config`

**Problème** : SonarQube échoue  
→ Voir `jenkins/GUIDE-WORKER1.md` section "Désactiver SonarQube"

---

**🚀 Prêt ? Exécutez : `cd jenkins && ./check-worker1.sh`**
