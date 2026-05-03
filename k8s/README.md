# ☸️ HRBrain — Guide Setup Kubernetes (4 VMs / 4 Laptops)

## 🖥️ Infrastructure

| Machine | Rôle | IP (exemple) |
|---------|------|--------------|
| Laptop 1 | Master (Control Plane) | 192.168.1.10 |
| Laptop 2 | Worker 1 | 192.168.1.11 |
| Laptop 3 | Worker 2 | 192.168.1.12 |
| Laptop 4 | Worker 3 | 192.168.1.13 |

---

## 1️⃣ Prérequis (sur TOUTES les machines)

```bash
# Désactiver le swap (obligatoire pour Kubernetes)
sudo swapoff -a
sudo sed -i '/ swap / s/^/#/' /etc/fstab

# Installer Docker
sudo apt update && sudo apt install -y docker.io
sudo systemctl enable docker && sudo systemctl start docker
sudo usermod -aG docker $USER

# Installer kubeadm, kubelet, kubectl
sudo apt install -y apt-transport-https curl
curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
echo "deb https://apt.kubernetes.io/ kubernetes-xenial main" | sudo tee /etc/apt/sources.list.d/kubernetes.list
sudo apt update
sudo apt install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl
```

---

## 2️⃣ Initialiser le Master (Laptop 1 uniquement)

```bash
# Initialiser le cluster
sudo kubeadm init --pod-network-cidr=10.244.0.0/16 --apiserver-advertise-address=192.168.1.10

# Configurer kubectl pour l'utilisateur courant
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

# Installer Flannel (réseau entre pods)
kubectl apply -f https://raw.githubusercontent.com/flannel-io/flannel/master/Documentation/kube-flannel.yml

# Récupérer la commande join (à copier pour les workers)
kubeadm token create --print-join-command
```

---

## 3️⃣ Joindre les Workers (Laptops 2, 3, 4)

```bash
# Coller la commande générée par le master, exemple :
sudo kubeadm join 192.168.1.10:6443 \
  --token <token> \
  --discovery-token-ca-cert-hash sha256:<hash>
```

---

## 4️⃣ Vérifier le cluster (sur le Master)

```bash
kubectl get nodes
# NAME       STATUS   ROLES           AGE   VERSION
# laptop-1   Ready    control-plane   5m    v1.28.x
# laptop-2   Ready    <none>          3m    v1.28.x
# laptop-3   Ready    <none>          3m    v1.28.x
# laptop-4   Ready    <none>          3m    v1.28.x
```

---

## 5️⃣ Labeler les nodes (OBLIGATOIRE avant le déploiement)

```bash
# Worker 1 et 2 → apps (frontend + backend)
kubectl label node laptop-2 role=app-worker
kubectl label node laptop-3 role=app-worker

# Worker 3 → IA (Ollama)
kubectl label node laptop-4 role=ai-worker

# Vérifier les labels
kubectl get nodes --show-labels
```

---

## 6️⃣ Déployer HRBrain

```bash
# Depuis la racine du projet
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml

# Backend + Frontend (sur Workers 1 et 2)
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml

# Ollama IA (sur Worker 3)
kubectl apply -f k8s/ollama-deployment.yaml
kubectl apply -f k8s/ollama-service.yaml

# Télécharger le modèle (une seule fois, ~4.7 GB)
kubectl apply -f k8s/ollama-init-job.yaml
kubectl logs -f job/ollama-pull-model -n hrbrain

# HPA (auto-scaling)
kubectl apply -f k8s/hpa.yaml

# Vérifier tout
kubectl get all -n hrbrain
```

---

## 7️⃣ Répartition des pods sur les workers

```
Master  (laptop-1) → Control Plane uniquement
Worker1 (laptop-2) → frontend pod #1 + backend pod #1
Worker2 (laptop-3) → frontend pod #2 + backend pod #2
Worker3 (laptop-4) → ollama pod (dédié IA)
```

---

## 8️⃣ Accéder à l'application

```
Frontend : http://192.168.1.11:30080   (ou n'importe quel worker IP)
Backend  : http://192.168.1.11:30000
Ollama   : interne uniquement (ClusterIP — pas accessible depuis l'extérieur)
```

---

## 9️⃣ Commandes utiles

```bash
# Voir les pods et leur node
kubectl get pods -n hrbrain -o wide

# Logs d'un pod
kubectl logs -f <pod-name> -n hrbrain

# Décrire un pod (debug)
kubectl describe pod <pod-name> -n hrbrain

# Rollback manuel
kubectl rollout undo deployment/backend -n hrbrain
kubectl rollout undo deployment/frontend -n hrbrain

# Scaler manuellement
kubectl scale deployment/backend --replicas=3 -n hrbrain
```
