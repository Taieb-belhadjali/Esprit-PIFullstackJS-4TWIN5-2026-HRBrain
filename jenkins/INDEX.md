# 📚 Index de la Documentation Jenkins

Tous les fichiers créés pour vous guider dans la configuration Jenkins.

---

## 🎯 Par où commencer ?

### 1. **START-HERE.md** 👈 COMMENCEZ ICI
   - Point de départ
   - Checklist rapide
   - Liens vers tous les autres guides

### 2. **check-worker1.sh** 🔍 VÉRIFICATION
   - Script de vérification automatique
   - Vérifie tous les prérequis
   - Indique ce qui manque

### 3. **GUIDE-WORKER1.md** 📖 GUIDE COMPLET
   - Guide étape par étape
   - Spécifique à votre configuration (worker-1)
   - Toutes les commandes détaillées

---

## 📁 Tous les fichiers disponibles

### Guides de démarrage
| Fichier | Description | Temps |
|---------|-------------|-------|
| **START-HERE.md** | Point de départ, checklist | 2 min |
| **GUIDE-WORKER1.md** | Guide complet pour worker-1 | 15 min |
| **COMMANDES.sh** | Toutes les commandes à copier-coller | 15 min |

### Scripts automatisés
| Fichier | Description | Usage |
|---------|-------------|-------|
| **check-worker1.sh** | Vérification de l'état | `./check-worker1.sh` |
| **setup-jenkins.sh** | Configuration automatique | `./setup-jenkins.sh` |
| **verify-jenkins.sh** | Vérification générale | `./verify-jenkins.sh` |

### Documentation détaillée
| Fichier | Description | Public |
|---------|-------------|--------|
| **README.md** | Vue d'ensemble Jenkins | Tous |
| **SETUP-JENKINS.md** | Guide complet et détaillé | Avancé |
| **QUICK-START.md** | Guide rapide 15 min | Débutant |

### Pipelines Jenkins
| Fichier | Description | Type |
|---------|-------------|------|
| **Jenkinsfile.ci.back** | CI Backend (NestJS) | Pipeline |
| **Jenkinsfile.cd.back** | CD Backend (K8s) | Pipeline |
| **Jenkinsfile.ci.front** | CI Frontend (React) | Pipeline |
| **Jenkinsfile.cd.front** | CD Frontend (K8s) | Pipeline |

### Fichiers de référence
| Fichier | Description |
|---------|-------------|
| **INDEX.md** | Ce fichier - Index de la doc |

---

## 🎯 Workflows recommandés

### Workflow 1 : Débutant (recommandé)
```bash
1. Lire START-HERE.md
2. Exécuter ./check-worker1.sh
3. Suivre GUIDE-WORKER1.md étape par étape
4. Tester le pipeline
```

### Workflow 2 : Rapide
```bash
1. Exécuter ./check-worker1.sh
2. Ouvrir COMMANDES.sh
3. Copier-coller les commandes
4. Tester le pipeline
```

### Workflow 3 : Automatisé
```bash
1. Exécuter ./setup-jenkins.sh
2. Suivre les instructions à l'écran
3. Compléter manuellement les étapes web
4. Tester le pipeline
```

---

## 📊 Matrice de décision

**Quelle documentation utiliser ?**

| Situation | Fichier recommandé |
|-----------|-------------------|
| Je débute avec Jenkins | START-HERE.md |
| Je veux tout comprendre | GUIDE-WORKER1.md |
| Je veux aller vite | COMMANDES.sh |
| Je veux automatiser | setup-jenkins.sh |
| Je veux vérifier l'état | check-worker1.sh |
| Je veux la doc complète | SETUP-JENKINS.md |
| Je veux comprendre les pipelines | README.md |

---

## 🔍 Recherche rapide

### Comment faire pour...

**...vérifier que tout est OK ?**
→ `./check-worker1.sh`

**...installer les plugins Jenkins ?**
→ GUIDE-WORKER1.md, Étape 4

**...créer les credentials ?**
→ GUIDE-WORKER1.md, Étape 5

**...créer les jobs Jenkins ?**
→ GUIDE-WORKER1.md, Étape 6

**...tester le pipeline ?**
→ GUIDE-WORKER1.md, Étape 7

**...désactiver SonarQube ?**
→ GUIDE-WORKER1.md, section "Désactiver SonarQube"

**...comprendre l'architecture du pipeline ?**
→ README.md, section "Architecture du Pipeline"

**...faire un rollback ?**
→ README.md, section "Rollback"

**...voir les logs ?**
→ README.md, section "Monitoring"

---

## 🎓 Niveaux de documentation

### Niveau 1 : Démarrage rapide
- START-HERE.md
- check-worker1.sh
- COMMANDES.sh

### Niveau 2 : Configuration complète
- GUIDE-WORKER1.md
- QUICK-START.md
- setup-jenkins.sh

### Niveau 3 : Compréhension approfondie
- README.md
- SETUP-JENKINS.md
- verify-jenkins.sh

### Niveau 4 : Pipelines et architecture
- Jenkinsfile.ci.back
- Jenkinsfile.cd.back
- Jenkinsfile.ci.front
- Jenkinsfile.cd.front

---

## 📈 Progression recommandée

```
1. START-HERE.md
   ↓
2. check-worker1.sh
   ↓
3. GUIDE-WORKER1.md (Étapes 1-5)
   ↓
4. Créer credentials (web)
   ↓
5. GUIDE-WORKER1.md (Étapes 6-7)
   ↓
6. Créer jobs (web)
   ↓
7. Tester le pipeline
   ↓
8. ✅ Terminé !
```

---

## 🆘 Troubleshooting

**Problème** : Je ne sais pas par où commencer
→ Ouvrir START-HERE.md

**Problème** : Le script check-worker1.sh échoue
→ Lire les messages d'erreur et suivre les recommandations

**Problème** : Jenkins ne peut pas utiliser Docker
→ GUIDE-WORKER1.md, Étape 2

**Problème** : Les pipelines échouent sur SonarQube
→ GUIDE-WORKER1.md, section "Désactiver SonarQube"

**Problème** : kubectl ne fonctionne pas
→ GUIDE-WORKER1.md, Étape 5.B

**Problème** : Je veux comprendre l'architecture
→ README.md, section "Architecture du Pipeline"

---

## 📞 Support

Si vous êtes bloqué :

1. **Vérifier l'état** : `./check-worker1.sh`
2. **Consulter les logs** : `sudo journalctl -u jenkins -f`
3. **Relire la section** correspondante dans GUIDE-WORKER1.md
4. **Chercher dans** SETUP-JENKINS.md pour plus de détails

---

## ✅ Checklist de finalisation

- [ ] START-HERE.md lu
- [ ] check-worker1.sh exécuté
- [ ] GUIDE-WORKER1.md suivi
- [ ] Plugins installés
- [ ] Credentials créés
- [ ] Jobs créés
- [ ] Pipeline testé
- [ ] Application accessible

---

## 🎉 Résultat final

Une fois tous les guides suivis, vous aurez :

✅ Jenkins configuré et opérationnel  
✅ 4 pipelines CI/CD automatisés  
✅ Déploiement automatique sur Kubernetes  
✅ Rollback automatique en cas d'échec  
✅ Smoke tests post-déploiement  
✅ Garde de cohérence Backend/Frontend  

**Projet HRBrain : 100% opérationnel ! 🚀**

---

**🚀 Prêt ? Commencez par : `cat START-HERE.md`**
