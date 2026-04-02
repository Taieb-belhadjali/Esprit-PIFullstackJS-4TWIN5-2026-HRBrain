// Parseur intelligent de commandes vocales
// Détecte l'intention et extrait les entités dynamiquement

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
  confidence: number;
  originalText: string;
}

// Mots-clés pour détecter l'intention
const INTENT_KEYWORDS: Record<Intent, string[]> = {
  create: ['créer', 'crée', 'ajouter', 'ajouté', 'nouveau', 'nouvelle', 'ajoute', 'ajoutée', 'faire', 'faite'],
  modify: ['modifier', 'modifié', 'éditer', 'édité', 'changer', 'changé', 'mettre', 'mise', 'mettre à jour', 'mise à jour', 'update', 'change'],
  delete: ['supprimer', 'supprimé', 'effacer', 'effacé', 'retirer', 'retiré', 'enlever', 'enlevé', 'delete', 'remove'],
  open: ['ouvrir', 'ouvert', 'montrer', 'montré', 'afficher', 'affiché', 'voir', 'vu', 'visualiser', 'visualisé', 'open', 'show', 'display'],
  close: ['fermer', 'fermé', 'cacher', 'caché', 'masquer', 'masqué', 'close', 'hide'],
  navigate: ['aller', 'allé', 'naviguer', 'navigué', 'va', 'vas', 'go', 'navigate'],
  search: ['chercher', 'cherché', 'rechercher', 'recherché', 'trouver', 'trouvé', 'où', 'qui', 'search', 'find'],
  filter: ['filtrer', 'filtré', 'filter', 'filtre'],
  sort: ['trier', 'trié', 'sort', 'sortir'],
  view: ['voir', 'vu', 'visualiser', 'visualisé', 'afficher', 'affiché', 'view', 'show'],
  help: ['aide', 'help', 'assistance', 'commandes', 'que puis-je faire', 'what can I do'],
  greeting: ['bonjour', 'salut', 'hello', 'hi', 'hey', 'coucou'],
  thanks: ['merci', 'thanks', 'thank you', 'merci beaucoup'],
  logout: ['déconnexion', 'déconnecter', 'logout', 'log out', 'se déconnecter'],
  unknown: [],
};

// Mots-clés pour détecter l'entité
const ENTITY_KEYWORDS: Record<EntityType, string[]> = {
  skill: ['skill', 'compétence', 'compétences', 'savoir-faire', 'expertise'],
  employee: ['employé', 'employés', 'employee', 'employees', 'personnel', 'collaborateur', 'collaborateurs'],
  department: ['département', 'départements', 'department', 'departments', 'service', 'services'],
  activity: ['activité', 'activités', 'activity', 'activities', 'formation', 'formations', 'training'],
  profile: ['profil', 'profile', 'compte', 'account'],
  settings: ['paramètres', 'settings', 'configuration', 'config'],
  notifications: ['notification', 'notifications', 'alerte', 'alertes', 'message', 'messages'],
  analytics: ['analytique', 'analytics', 'statistiques', 'stats', 'rapport', 'rapports'],
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

/**
 * Détecte l'intention à partir du texte
 */
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

/**
 * Détecte l'entité à partir du texte
 */
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

/**
 * Extrait le nom de l'entité à partir du texte
 * Ex: "créer un skill React" → "React"
 * Ex: "modifier le profil de Jean" → "Jean"
 */
function extractName(text: string, intent: Intent, entity: EntityType): string | null {
  const lowerText = text.toLowerCase();

  // Si "par" est présent, on ignore tout ce qui vient après
  // ex: "modifier skill Hiba par test" → on traite seulement "modifier skill Hiba"
  const parIndex = lowerText.indexOf(' par ');
  let cleanedText = parIndex !== -1 ? lowerText.substring(0, parIndex) : lowerText;

  // Supprimer les mots d'intention
  for (const keywords of Object.values(INTENT_KEYWORDS)) {
    for (const keyword of keywords) {
      cleanedText = cleanedText.replace(new RegExp(`\\b${keyword}\\b`, 'gi'), '');
    }
  }
  
  // Supprimer les mots d'entité
  for (const keywords of Object.values(ENTITY_KEYWORDS)) {
    for (const keyword of keywords) {
      cleanedText = cleanedText.replace(new RegExp(`\\b${keyword}\\b`, 'gi'), '');
    }
  }
  
  // Supprimer les stop words
  for (const stopWord of STOP_WORDS) {
    cleanedText = cleanedText.replace(new RegExp(`\\b${stopWord}\\b`, 'gi'), '');
  }
  
  // Nettoyer les espaces multiples
  cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
  
  // Si le texte nettoyé n'est pas vide, c'est le nom
  if (cleanedText.length > 0) {
    // Capitaliser la première lettre
    return cleanedText.charAt(0).toUpperCase() + cleanedText.slice(1);
  }
  
  return null;
}

/**
 * Parse une commande vocale et retourne l'intention, l'entité et le nom
 */
export function parseCommand(text: string): ParsedCommand {
  const lowerText = text.toLowerCase().trim();
  
  // Détecter l'intention
  const { intent, confidence: intentConfidence } = detectIntent(lowerText);
  
  // Détecter l'entité
  const { entity, confidence: entityConfidence } = detectEntity(lowerText);
  
  // Extraire le nom
  const name = extractName(lowerText, intent, entity);
  
  // Calculer la confiance globale
  const overallConfidence = (intentConfidence + entityConfidence) / 2;
  
  return {
    intent,
    entity,
    name,
    confidence: overallConfidence,
    originalText: text,
  };
}

/**
 * Vérifie si la commande est valide (intention et entité détectées)
 */
export function isValidCommand(parsed: ParsedCommand): boolean {
  return parsed.intent !== 'unknown' && parsed.entity !== 'unknown';
}

/**
 * Retourne un message d'erreur si la commande n'est pas valide
 */
export function getErrorMessage(parsed: ParsedCommand): string {
  if (parsed.intent === 'unknown') {
    return `🤔 Je n'ai pas compris l'intention de "${parsed.originalText}". Essayez "aide" pour voir les commandes disponibles.`;
  }
  
  if (parsed.entity === 'unknown') {
    return `🤔 Je n'ai pas compris ce que vous voulez ${parsed.intent}. Essayez "aide" pour voir les commandes disponibles.`;
  }
  
  return `🤔 Je n'ai pas compris "${parsed.originalText}". Essayez "aide" pour voir les commandes disponibles.`;
}
