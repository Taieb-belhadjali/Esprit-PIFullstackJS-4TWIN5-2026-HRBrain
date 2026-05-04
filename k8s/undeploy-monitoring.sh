#!/bin/bash

# ═══════════════════════════════════════════════════════════════════
# HRBrain - Désinstallation du stack de monitoring
# ═══════════════════════════════════════════════════════════════════

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "═══════════════════════════════════════════════════════════════════"
echo -e "${RED}🗑️  DÉSINSTALLATION DU STACK DE MONITORING${NC}"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Confirmation
read -p "Êtes-vous sûr de vouloir supprimer le stack de monitoring ? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Annulation de la désinstallation."
    exit 0
fi
echo ""

echo -e "${YELLOW}🗑️  Suppression du namespace monitoring...${NC}"
kubectl delete namespace monitoring

echo ""
echo -e "${GREEN}✅ Stack de monitoring supprimé !${NC}"
echo ""
