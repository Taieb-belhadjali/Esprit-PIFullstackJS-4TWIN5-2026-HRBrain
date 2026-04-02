import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useVoiceCommand } from './VoiceCommandContext';
import { parseCommand, isValidCommand, getErrorMessage, Intent, EntityType } from './CommandParser';

// Types pour compatibilité navigateur (évite crash TypeScript)
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

const isSpeechRecognitionSupported =
  typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

const SpeechRecognition =
  typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

export const VoiceAssistant: React.FC<{}> = () => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const recognitionRef = useRef<any>(null);
  const { setPendingCommand } = useVoiceCommand();

  // Inférer l'entité depuis la page courante
  const inferEntityFromRoute = useCallback((): EntityType => {
    const path = location.pathname;
    if (path.includes('employees')) return 'employee';
    if (path.includes('skills')) return 'skill';
    if (path.includes('departments')) return 'department';
    if (path.includes('activities')) return 'activity';
    return 'unknown';
  }, [location.pathname]);

  // Détection de la langue du navigateur
  const getLanguage = useCallback(() => {
    const browserLang = navigator.language || 'fr-FR';
    return browserLang.startsWith('fr') ? 'fr-FR' : 'en-US';
  }, []);

  // Initialisation de SpeechRecognition une seule fois
  useEffect(() => {
    if (isSpeechRecognitionSupported && SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = getLanguage();
      recognitionRef.current.interimResults = false;
      recognitionRef.current.maxAlternatives = 1;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [getLanguage]);

  // Configuration des gestionnaires d'événements une seule fois
  useEffect(() => {
    if (!recognitionRef.current) return;

    recognitionRef.current.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setListening(false);
      processCommand(text);
    };

    recognitionRef.current.onerror = (event: any) => {
      const errorMessages: Record<string, string> = {
        'no-speech': 'Aucune parole détectée. Veuillez réessayer.',
        'audio-capture': 'Microphone non disponible. Vérifiez vos permissions.',
        'not-allowed': 'Permission microphone refusée. Autorisez l\'accès au microphone.',
        'network': 'Erreur réseau. Vérifiez votre connexion.',
        'aborted': 'Reconnaissance vocale interrompue.',
        'service-not-allowed': 'Service de reconnaissance vocale non autorisé.',
      };
      setError(errorMessages[event.error] || `Erreur de reconnaissance vocale: ${event.error}`);
      setListening(false);
    };

    recognitionRef.current.onend = () => {
      setListening(false);
    };
  }, []);

  // Mapper l'entité vers la route
  const getRouteForEntity = (entity: EntityType): string => {
    const routes: Record<EntityType, string> = {
      skill: '/dashboard/skills',
      employee: '/dashboard/employees',
      department: '/dashboard/departments',
      activity: '/dashboard/activities',
      profile: '/dashboard/profile',
      settings: '/dashboard/settings',
      notifications: '/dashboard/notifications',
      analytics: '/dashboard/analytics',
      recommendations: '/dashboard/recommendations',
      home: '/dashboard/home',
      unknown: '/dashboard/home',
    };
    return routes[entity] || '/dashboard/home';
  };

  // Mapper l'entité vers le type de commande
  const getCommandTypeForEntity = (entity: EntityType, intent: Intent): string => {
    const commandTypes: Record<string, string> = {
      'create-skill': 'create-skill',
      'create-employee': 'create-employee',
      'create-department': 'create-department',
      'create-activity': 'create-activity',
      'modify-skill': 'modify-skill',
      'modify-employee': 'modify-employee',
      'modify-department': 'modify-department',
      'delete-skill': 'delete-skill',
      'delete-employee': 'delete-employee',
      'delete-department': 'delete-department',
    };
    return commandTypes[`${intent}-${entity}`] || '';
  };

  // Traiter la commande de manière intelligente
  const processCommand = (text: string) => {
    const parsed = parseCommand(text);

    // Pour search/filter : si entité inconnue, inférer depuis la page courante
    if ((parsed.intent === 'search' || parsed.intent === 'filter') && parsed.entity === 'unknown') {
      const inferredEntity = inferEntityFromRoute();
      if (inferredEntity !== 'unknown') {
        parsed.entity = inferredEntity;
      }
    }

    // Vérifier si la commande est valide
    if (!isValidCommand(parsed)) {
      setFeedback(getErrorMessage(parsed));
      setTimeout(() => setFeedback(''), 5000);
      return;
    }
    
    // Traiter selon l'intention
    switch (parsed.intent) {
      case 'navigate':
      case 'open':
        handleNavigation(parsed);
        break;
        
      case 'create':
        handleCreate(parsed);
        break;
        
      case 'modify':
        handleModify(parsed);
        break;
        
      case 'delete':
        handleDelete(parsed);
        break;
        
      case 'close':
        handleClose(parsed);
        break;
        
      case 'search':
        handleSearch(parsed);
        break;
        
      case 'filter':
        handleFilter(parsed);
        break;
        
      case 'sort':
        handleSort(parsed);
        break;
        
      case 'view':
        handleView(parsed);
        break;
        
      case 'help':
        handleHelp();
        break;
        
      case 'greeting':
        handleGreeting();
        break;
        
      case 'thanks':
        handleThanks();
        break;
        
      case 'logout':
        handleLogout();
        break;
        
      default:
        setFeedback(`🤔 Je n'ai pas compris "${text}". Essayez "aide" pour voir les commandes disponibles.`);
        setTimeout(() => setFeedback(''), 5000);
    }
  };

  // Gérer la navigation
  const handleNavigation = (parsed: { entity: EntityType; name: string | null }) => {
    const route = getRouteForEntity(parsed.entity);
    navigate(route);
    
    if (parsed.name) {
      setFeedback(`✓ Navigation vers ${parsed.entity} "${parsed.name}"`);
    } else {
      setFeedback(`✓ Navigation vers ${parsed.entity}`);
    }
    setTimeout(() => setFeedback(''), 3000);
  };

  // Gérer la création
  const handleCreate = (parsed: { entity: EntityType; name: string | null }) => {
    const route = getRouteForEntity(parsed.entity);
    const commandType = getCommandTypeForEntity(parsed.entity, 'create');
    
    if (!commandType) {
      setFeedback(`⚠️ Création de ${parsed.entity} non supportée`);
      setTimeout(() => setFeedback(''), 5000);
      return;
    }
    
    navigate(route);
    
    if (parsed.name) {
      setPendingCommand(commandType as any, { name: parsed.name });
      setFeedback(`✓ Création de ${parsed.entity} "${parsed.name}" en cours...`);
    } else {
      setPendingCommand(commandType as any);
      setFeedback(`✓ Ouverture du formulaire de création de ${parsed.entity}`);
    }
    setTimeout(() => setFeedback(''), 5000);
  };

  // Gérer la modification
  const handleModify = (parsed: { entity: EntityType; name: string | null }) => {
    const route = getRouteForEntity(parsed.entity);
    const commandType = getCommandTypeForEntity(parsed.entity, 'modify');
    
    if (!commandType) {
      setFeedback(`⚠️ Modification de ${parsed.entity} non supportée`);
      setTimeout(() => setFeedback(''), 5000);
      return;
    }
    
    navigate(route);
    
    if (parsed.name) {
      setPendingCommand(commandType as any, { name: parsed.name });
      setFeedback(`✓ Modification de ${parsed.entity} "${parsed.name}" en cours...`);
    } else {
      setPendingCommand(commandType as any);
      setFeedback(`✓ Ouverture du formulaire de modification de ${parsed.entity}`);
    }
    setTimeout(() => setFeedback(''), 5000);
  };

  // Gérer la suppression
  const handleDelete = (parsed: { entity: EntityType; name: string | null }) => {
    const route = getRouteForEntity(parsed.entity);
    const commandType = getCommandTypeForEntity(parsed.entity, 'delete');
    
    if (!commandType) {
      setFeedback(`⚠️ Suppression de ${parsed.entity} non supportée`);
      setTimeout(() => setFeedback(''), 5000);
      return;
    }
    
    navigate(route);
    
    if (parsed.name) {
      setPendingCommand(commandType as any, { name: parsed.name });
      setFeedback(`✓ Suppression de ${parsed.entity} "${parsed.name}" en cours...`);
    } else {
      setPendingCommand(commandType as any);
      setFeedback(`✓ Sélectionnez le ${parsed.entity} à supprimer`);
    }
    setTimeout(() => setFeedback(''), 5000);
  };

  // Gérer la fermeture
  const handleClose = (parsed: { entity: EntityType; name: string | null }) => {
    setFeedback(`✓ Fermeture de ${parsed.entity} - Fonctionnalité en développement`);
    setTimeout(() => setFeedback(''), 5000);
  };

  // Gérer la recherche
  const handleSearch = (parsed: { entity: EntityType; name: string | null }) => {
    const route = getRouteForEntity(parsed.entity);
    const supportedEntities = ['employee', 'skill', 'department'];

    if (!supportedEntities.includes(parsed.entity)) {
      setFeedback(`⚠️ Recherche non supportée pour "${parsed.entity}"`);
      setTimeout(() => setFeedback(''), 4000);
      return;
    }

    navigate(route);

    if (parsed.name) {
      setPendingCommand(`search-${parsed.entity}` as any, { name: parsed.name });
      setFeedback(`🔍 Recherche de "${parsed.name}" dans ${parsed.entity}s...`);
    } else {
      setFeedback(`🔍 Navigue vers ${parsed.entity}s — précise un nom pour filtrer`);
    }
    setTimeout(() => setFeedback(''), 4000);
  };

  // Gérer le filtrage
  const handleFilter = (parsed: { entity: EntityType; name: string | null }) => {
    const route = getRouteForEntity(parsed.entity);
    const supportedEntities = ['employee', 'skill', 'department'];

    if (!supportedEntities.includes(parsed.entity)) {
      setFeedback(`⚠️ Filtrage non supporté pour "${parsed.entity}"`);
      setTimeout(() => setFeedback(''), 4000);
      return;
    }

    navigate(route);

    if (parsed.name) {
      setPendingCommand(`filter-${parsed.entity}` as any, { name: parsed.name });
      setFeedback(`✓ Filtrage par "${parsed.name}" dans ${parsed.entity}s...`);
    } else {
      setFeedback(`✓ Navigue vers ${parsed.entity}s — précise un terme pour filtrer`);
    }
    setTimeout(() => setFeedback(''), 4000);
  };

  // Gérer le tri
  const handleSort = (parsed: { entity: EntityType; name: string | null }) => {
    if (parsed.name) {
      setFeedback(`✓ Tri par "${parsed.name}" - Fonctionnalité en développement`);
    } else {
      setFeedback(`✓ Tri - Fonctionnalité en développement`);
    }
    setTimeout(() => setFeedback(''), 5000);
  };

  // Gérer la visualisation
  const handleView = (parsed: { entity: EntityType; name: string | null }) => {
    const route = getRouteForEntity(parsed.entity);
    navigate(route);
    
    if (parsed.name) {
      setFeedback(`✓ Visualisation de ${parsed.entity} "${parsed.name}" - Fonctionnalité en développement`);
    } else {
      setFeedback(`✓ Visualisation de ${parsed.entity} - Fonctionnalité en développement`);
    }
    setTimeout(() => setFeedback(''), 5000);
  };

  // Gérer l'aide
  const handleHelp = () => {
    const helpText = `Commandes disponibles:
• Navigation: "aller aux employés", "ouvrir les paramètres"
• Création: "créer un skill React", "ajouter un employé Jean"
• Modification: "modifier le skill React", "changer le profil de Jean"
• Suppression: "supprimer le skill React", "effacer l'employé Jean"
• Recherche: "chercher React", "trouver Jean"
• Filtrage: "filtrer par département IT"
• Tri: "trier par nom"
• Visualisation: "voir le skill React", "afficher le profil de Jean"
• Social: "bonjour", "merci"
• Aide: "aide", "help"`;
    setFeedback(helpText);
  };

  // Gérer la salutation
  const handleGreeting = () => {
    setFeedback('👋 Bonjour ! Comment puis-je vous aider ? Dites "aide" pour voir les commandes disponibles.');
    setTimeout(() => setFeedback(''), 5000);
  };

  // Gérer les remerciements
  const handleThanks = () => {
    setFeedback('😊 De rien ! N\'hésitez pas si vous avez besoin d\'aide.');
    setTimeout(() => setFeedback(''), 3000);
  };

  // Gérer la déconnexion
  const handleLogout = () => {
    setFeedback('✓ Déconnexion en cours...');
    setTimeout(() => setFeedback(''), 3000);
    // Ici vous pouvez ajouter la logique de déconnexion
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      setError('La reconnaissance vocale n\'est pas disponible sur ce navigateur.');
      return;
    }
    
    setTranscript('');
    setError('');
    setFeedback('');
    setListening(true);
    
    try {
      recognitionRef.current.start();
    } catch (err) {
      setError('Erreur lors du démarrage de la reconnaissance vocale. Veuillez réessayer.');
      setListening(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Bouton flottant */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          listening
            ? 'bg-red-500 animate-pulse'
            : 'bg-blue-600 hover:bg-blue-700 hover:scale-110'
        }`}
        title="Assistant vocal"
        aria-label="Assistant vocal"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </svg>
      </button>

      {/* Panneau de l'assistant */}
      {isOpen && (
        <div 
          className="absolute bottom-20 right-0 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="voice-assistant-title"
        >
          {/* En-tête */}
          <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
              <span className="font-semibold" id="voice-assistant-title">Assistant vocal</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Fermer l'assistant vocal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Contenu */}
          <div className="p-4">
            {isSpeechRecognitionSupported ? (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Cliquez sur le bouton ci-dessous pour parler à la plateforme.
                </p>
                <button
                  onClick={startListening}
                  disabled={listening}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  aria-label={listening ? 'Écoute en cours' : 'Parler à la plateforme'}
                  aria-busy={listening}
                >
                  {listening ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Écoute en cours...
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                        />
                      </svg>
                      Parler à la plateforme
                    </>
                  )}
                </button>
                
                {transcript && (
                  <div className="mt-4 p-3 bg-gray-100 rounded-lg" role="status" aria-live="polite">
                    <p className="text-xs text-gray-500 mb-1">Vous avez dit :</p>
                    <p className="text-sm text-gray-800">{transcript}</p>
                  </div>
                )}
                
                {feedback && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg" role="status" aria-live="polite">
                    <p className="text-sm text-blue-800 whitespace-pre-line">{feedback}</p>
                  </div>
                )}
                
                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto text-gray-400 mb-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
                <p className="text-sm text-gray-600">
                  La reconnaissance vocale n'est pas disponible sur ce navigateur.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Essayez Chrome, Edge ou Safari pour utiliser cette fonctionnalité.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
