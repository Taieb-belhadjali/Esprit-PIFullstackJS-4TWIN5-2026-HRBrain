# ⚡ Quick Start Jenkins - HRBrain

Guide ultra-rapide pour finaliser Jenkins en **15 minutes**.

---

## 🎯 Étape 1 : Exécuter le script de vérification (2 min)

```bash
cd jenkins
chmod +x verify-jenkins.sh
./verify-jenkins.sh
```

Ce script vous dira exactement ce qui manque.

---

## 🔐 Étape 2 : Créer les Credentials (5 min)

### A. DockerHub Credentials

1. Aller sur : http://192.168.1.11:8080/credentials/store/system/domain/_/newCredentials

2. Remplir :
   ```
   Kind: Username with password
   Username: mouadh08
   Password: [votre mot de passe DockerHub]
   ID: dockerhub-credentials
   ```

3. Cliquer **OK**

### B. Kubeconfig Credential

1. **Sur master**, copier le kubeconfig :
   ```bash
   cat ~/.kube/config
   ```

2. **Sur votre PC**, créer un fichier `kubeconfig` avec ce contenu

3. Aller sur : http://192.168.1.11:8080/credentials/store/system/domain/_/newCredentials

4. Remplir :
   ```
   Kind: Secret file
   File: [uploader le fichier kubeconfig]
   ID: kubeconfig
   ```

5. Cliquer **OK**

---

## 🔨 Étape 3 : Créer les 4 Jobs (5 min)

### Template pour chaque job

Pour **chaque job** ci-dessous, suivre ces étapes :

1. Aller sur : http://192.168.1.11:8080/view/all/newJob

2. Remplir :
   - **Name** : [voir tableau ci-dessous]
   - **Type** : Pipeline
   - Cliquer **OK**

3. Dans la configuration :
   - **Pipeline** → **Definition** : `Pipeline script from SCM`
   - **SCM** : `Git`
   - **Repository URL** : `https://github.com/VOTRE_USER/hrbrain.git`
   - **Branch Specifier** : `*/main`
   - **Script Path** : [voir tableau ci-dessous]

4. **Build Triggers** : [voir tableau ci-dessous]

5. Cliquer **Save**

### Tableau des 4 jobs

| Job Name | Script Path | Build Triggers |
|----------|-------------|----------------|
| `hrbrain-ci-backend` | `jenkins/Jenkinsfile.ci.back` | ✅ GitHub hook trigger for GITScm polling |
| `hrbrain-cd-backend` | `jenkins/Jenkinsfile.cd.back` | ✅ Build after other projects are built<br>→ Projects: `hrbrain-ci-backend`<br>→ Trigger only if build is stable |
| `hrbrain-ci-frontend` | `jenkins/Jenkinsfile.ci.front` | ✅ GitHub hook trigger for GITScm polling |
| `hrbrain-cd-frontend` | `jenkins/Jenkinsfile.cd.front` | ✅ Build after other projects are built<br>→ Projects: `hrbrain-ci-frontend`<br>→ Trigger only if build is stable |

---

## 🧪 Étape 4 : Test (3 min)

### Test Backend

1. Aller sur : http://192.168.1.11:8080/job/hrbrain-ci-backend/

2. Cliquer **Build Now**

3. Surveiller la **Console Output**

4. Si succès → `hrbrain-cd-backend` doit se lancer automatiquement

### Test Frontend

1. Aller sur : http://192.168.1.11:8080/job/hrbrain-ci-frontend/

2. Cliquer **Build Now**

3. Si succès → `hrbrain-cd-frontend` doit se lancer automatiquement

### Vérification finale

```bash
# Vérifier les pods
kubectl get pods -n hrbrain

# Tester l'application
curl http://192.168.1.11:30000/health  # Backend
curl http://192.168.1.11:30080         # Frontend
```

---

## 🎉 C'est terminé !

Votre pipeline CI/CD est maintenant opérationnel :

```
Push GitHub → CI Backend/Frontend → CD Backend/Frontend → K8s
```

---

## 🐛 Problèmes courants

### "npm: command not found"
```bash
sudo ln -sf /usr/local/bin/node /usr/bin/node
sudo ln -sf /usr/local/bin/npm /usr/bin/npm
sudo systemctl restart jenkins
```

### "docker: permission denied"
```bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

### "Unable to connect to the server"
- Vérifier que le credential `kubeconfig` est correct
- Vérifier que worker-1 peut ping 192.168.1.10

### Pipeline bloqué sur "SonarQube Analysis"

**Option 1** : Installer SonarQube
```bash
docker run -d --name sonarqube -p 9000:9000 sonarqube:lts-community
# Puis configurer dans Jenkins → Manage Jenkins → Configure System → SonarQube servers
```

**Option 2** : Désactiver temporairement
Commenter les stages `SonarQube Analysis` et `Quality Gate` dans les Jenkinsfiles

---

## 📚 Ressources

- **Guide complet** : `jenkins/SETUP-JENKINS.md`
- **Script de vérification** : `./verify-jenkins.sh`
- **Jenkinsfiles** : `jenkins/Jenkinsfile.*`

---

**Projet HRBrain : 100% opérationnel ! 🚀**
