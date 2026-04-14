// Parseur de commandes vocales : détecte l’intention et l’entité dans le texte

export type Intent = 
  | 'create'
  | 'modify'
  | 'delete'
  | 'open'
  | 'close'
  | 'navigate'
  | 'search'
  | 'filter'
  | 'sort'
  | 'view'
  | 'stats'
  | 'list'
  | 'confirm'
  | 'cancel'
  | 'help'
  | 'greeting'
  | 'thanks'
  | 'logout'
  | 'unknown';

export type EntityType = 
  | 'skill'
  | 'employee'
  | 'department'
  | 'activity'
  | 'profile'
  | 'settings'
  | 'notifications'
  | 'analytics'
  | 'recommendations'
  | 'home'
  | 'unknown';

export interface ParsedCommand {
  intent: Intent;
  entity: EntityType;
  name: string | null;
  newName: string | null;  // extrait de "par Y" dans les commandes de modification
  confidence: number;
  originalText: string;
}

// Mots-clés pour détecter l'intention
const INTENT_KEYWORDS: Record<Intent, string[]> = {
  create: ['créer', 'crée', 'ajouter', 'ajouté', 'nouveau', 'nouvelle', 'ajoute', 'ajoutée', 'créez', 'ajoutez', 'insérer', 'enregistrer', 'enregistrez', 'faire', 'faite'],
  modify: ['modifier', 'modifié', 'éditer', 'édité', 'changer', 'changé', 'mettre à jour', 'mise à jour', 'update', 'change', 'renommer', 'renommé', 'corriger', 'corrigé', 'modifiez'],
  delete: ['supprimer', 'supprimé', 'supprime', 'effacer', 'effacé', 'retirer', 'retiré', 'enlever', 'enlevé', 'delete', 'remove', 'supprimez', 'effacez'],
  open: ['ouvrir', 'ouvert', 'montrer', 'montré', 'afficher', 'affiché', 'open', 'show', 'display', 'accéder', 'accédez'],
  close: ['fermer', 'fermé', 'cacher', 'caché', 'masquer', 'masqué', 'close', 'hide'],
  navigate: ['aller', 'allé', 'naviguer', 'navigué', 'va', 'vas', 'go', 'navigate', 'emmène', 'amène', 'direction'],
  search: ['chercher', 'cherché', 'rechercher', 'recherché', 'trouver', 'trouvé', 'search', 'find', 'cherche', 'trouve', 'recherche'],
  filter: ['filtrer', 'filtré', 'filter', 'filtre', 'filtrez'],
  sort: ['trier', 'trié', 'sort', 'classer', 'classé', 'ordonner', 'ordonné'],
  stats: ['combien', 'nombre', 'count', 'total', 'compter', 'compte', 'statistiques', 'chiffres', 'résumé'],
  list: ['liste', 'lister', 'énumérer', 'tous les', 'toutes les', 'quels sont', 'quelles sont'],
  confirm: ['oui', 'confirmer', 'confirme', 'confirmes', 'valider', 'valide', "d'accord", 'ok', 'yes', 'ouais', 'absolument'],
  cancel: ['non', 'annuler', 'annule', 'abandonner', 'abandonne', 'stop', 'arrêter', 'arrête', 'cancel', 'no', 'pas question'],
  view: ['voir', 'vu', 'visualiser', 'visualisé', 'view', 'aperçu'],
  help: ['aide', 'help', 'assistance', 'commandes', 'que puis-je faire', 'instructions'],
  greeting: ['bonjour', 'salut', 'hello', 'hi', 'hey', 'coucou', 'bonsoir'],
  thanks: ['merci', 'thanks', 'thank you', 'merci beaucoup', 'super', 'bravo', 'parfait'],
  logout: ['déconnexion', 'déconnecter', 'logout', 'log out', 'se déconnecter', 'quitter'],
  unknown: [],
};

// Mots-clés pour détecter l'entité
const ENTITY_KEYWORDS: Record<EntityType, string[]> = {
  skill: ['skill', 'skills', 'compétence', 'compétences', 'savoir-faire', 'expertise', 'technologie', 'technologies'],
  employee: ['employé', 'employés', 'employee', 'employees', 'personnel', 'collaborateur', 'collaborateurs', 'utilisateur', 'utilisateurs', 'membre', 'membres', 'personne', 'personnes'],
  department: ['département', 'départements', 'department', 'departments', 'service', 'services', 'équipe', 'équipes', 'division', 'divisions'],
  activity: ['activité', 'activités', 'activity', 'activities', 'formation', 'formations', 'training', 'session', 'sessions', 'cours'],
  profile: ['profil', 'profile', 'compte', 'account', 'mon compte'],
  settings: ['paramètres', 'settings', 'configuration', 'config', 'préférences'],
  notifications: ['notification', 'notifications', 'alerte', 'alertes'],
  analytics: ['analytique', 'analytics', 'rapport', 'rapports', 'données'],
  recommendations: ['recommandation', 'recommandations', 'recommendation', 'recommendations', 'suggestion', 'suggestions'],
  home: ['accueil', 'home', 'tableau de bord', 'dashboard', 'principal'],
  unknown: [],
};

// Mots à ignorer (articles, prépositions, etc.)
const STOP_WORDS = [
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'au', 'aux',
  'et', 'ou', 'mais', 'donc', 'car', 'ni', 'que', 'qui', 'quoi',
  'est', 'sont', 'être', 'avoir', 'faire', 'aller', 'venir',
  'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles',
  'mon', 'ton', 'son', 'notre', 'votre', 'leur',
  'ce', 'cette', 'ces', 'cet',
  'à', 'avec', 'pour', 'par', 'sur', 'sous', 'dans', 'en',
  'très', 'trop', 'peu', 'beaucoup', 'plus', 'moins',
];

// Détecte l’intention à partir du texte (créer, modifier, supprimer...)
function detectIntent(text: string): { intent: Intent; confidence: number } {
  const lowerText = text.toLowerCase();
  
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        // Calculer la confiance basée sur la position du mot-clé
        const position = lowerText.indexOf(keyword);
        const confidence = position === 0 ? 1.0 : 0.8;
        return { intent: intent as Intent, confidence };
      }
    }
  }
  
  return { intent: 'unknown', confidence: 0 };
}

// Détecte l’entité concernée (skill, employé, département...)
function detectEntity(text: string): { entity: EntityType; confidence: number } {
  const lowerText = text.toLowerCase();
  
  for (const [entity, keywords] of Object.entries(ENTITY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        // Calculer la confiance basée sur la position du mot-clé
        const position = lowerText.indexOf(keyword);
        const confidence = position === 0 ? 1.0 : 0.8;
        return { entity: entity as EntityType, confidence };
      }
    }
  }
  
  return { entity: 'unknown', confidence: 0 };
}

// Extrait le nom de l’entité après retrait des mots-clés et stop words
function extractName(text: string, _intent: Intent, _entity: EntityType): string | null {
  // Tronquer avant "par" pour "modifier X par Y" → traite seulement "modifier X"
  const lowerText = text.toLowerCase();
  const parIndex  = lowerText.indexOf(' par ');
  const searchText = parIndex !== -1 ? text.substring(0, parIndex) : text;

  // Construire l'ensemble des mots / expressions à exclure
  const excluded = new Set<string>();
  for (const kws of Object.values(INTENT_KEYWORDS))  kws.forEach(k => excluded.add(k.toLowerCase()));
  for (const kws of Object.values(ENTITY_KEYWORDS))  kws.forEach(k => excluded.add(k.toLowerCase()));
  STOP_WORDS.forEach(k => excluded.add(k.toLowerCase()));

  // Supprimer les expressions multi-mots (ex: "mettre à jour", "tous les", …)
  let cleaned = searchText;
  for (const k of excluded) {
    if (k.includes(' ')) {
      cleaned = cleaned.replace(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), ' ');
    }
  }

  // Filtrer mot par mot (fonctionne avec les accents car pas de \b)
  const words = cleaned
    .split(/\s+/)
    .map(w => w.replace(/[.,!?;:'"()\-]/g, '').trim())
    .filter(w => w.length > 0 && !excluded.has(w.toLowerCase()));

  const result = words.join(' ').trim();
  if (!result) return null;
  return result.charAt(0).toUpperCase() + result.slice(1);
}

// Parse une commande vocale : retourne intention, entité, nom et confiance
export function parseCommand(text: string): ParsedCommand {
  const lowerText = text.toLowerCase().trim();
  
  // Détecter l'intention
  const { intent, confidence: intentConfidence } = detectIntent(lowerText);
  
  // Détecter l'entité
  const { entity, confidence: entityConfidence } = detectEntity(lowerText);
  
  // Extraire le nom courant (avant "par")
  const name = extractName(lowerText, intent, entity);

  // Extraire le nouveau nom (après "par")
  let newName: string | null = null;
  const parIndex = lowerText.indexOf(' par ');
  if (parIndex !== -1) {
    const afterPar = text.substring(parIndex + 5).trim();
    if (afterPar.length > 0) {
      newName = afterPar.charAt(0).toUpperCase() + afterPar.slice(1);
    }
  }
  
  // Calculer la confiance globale
  const overallConfidence = (intentConfidence + entityConfidence) / 2;
  
  return {
    intent,
    entity,
    name,
    newName,
    confidence: overallConfidence,
    originalText: text,
  };
}

// Vérifie si la commande est valide (intention et entité reconnues)
export function isValidCommand(parsed: ParsedCommand): boolean {
  if (parsed.intent === 'unknown') return false;
  // Ces intents fonctionnent sans entité (inférée depuis la route)
  const entityOptional: Intent[] = ['stats', 'list', 'confirm', 'cancel', 'help', 'greeting', 'thanks', 'logout', 'search', 'filter'];
  if (entityOptional.includes(parsed.intent)) return true;
  return parsed.entity !== 'unknown';
}

// Retourne un message vocal explicatif si la commande n’est pas reconnue
export function getErrorMessage(parsed: ParsedCommand): string {
  if (parsed.intent === 'unknown' && parsed.entity === 'unknown') {
    return "Je n'ai pas compris la commande. Dites aide pour voir les commandes disponibles.";
  }
  if (parsed.intent === 'unknown') {
    return `J'ai compris ${parsed.entity} mais pas l'action. Précisez créer, modifier ou supprimer.`;
  }
  if (parsed.entity === 'unknown') {
    return `Précisez l'entité : skill, employé ou département.`;
  }
  return "Commande non reconnue. Dites aide pour de l'aide.";
}
