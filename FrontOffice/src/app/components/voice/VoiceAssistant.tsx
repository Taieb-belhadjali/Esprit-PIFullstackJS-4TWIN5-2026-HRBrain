// Assistant vocal : écoute, parse la commande et exécute l’action (CRUD, navigation, recherche)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../../../api/api';
import { useVoiceCommand } from './VoiceCommandContext';
import { parseCommand, isValidCommand, getErrorMessage, Intent, EntityType } from './CommandParser';


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

interface PendingConfirmation {
  type: 'delete';
  entity: EntityType;
  id: string;
  name: string;
}

interface PendingModify {
  entity: EntityType;
  id: string;
  currentName: string;
  currentUserId?: string;    // conserve le user_id du département
  currentDeptId?: string;    // conserve le departmentId du skill
  step: 'awaiting-new-name'; // une seule étape : juste demander le nouveau nom
}

interface PendingCreate {
  entity: 'skill' | 'department';
  name: string;
  step: 'awaiting-department' | 'awaiting-manager';
  departments?: { _id: string; name: string }[];
}

// Fuzzy match : trouve le meilleur nom même si mal prononcé
function similarity(a: string, b: string): number {
  const s = a.toLowerCase(); const t = b.toLowerCase();
  if (s === t) return 1;
  if (s.includes(t) || t.includes(s)) return 0.9;
  // Levenshtein simplifié
  const dp = Array.from({ length: s.length + 1 }, (_, i) =>
    Array.from({ length: t.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= s.length; i++)
    for (let j = 1; j <= t.length; j++)
      dp[i][j] = s[i-1] === t[j-1] ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  const maxLen = Math.max(s.length, t.length);
  return maxLen === 0 ? 1 : 1 - dp[s.length][t.length] / maxLen;
}

function fuzzyFind(items: any[], query: string): any | null {
  const candidates = items.map(item => ({
    item,
    score: similarity(item.name || item.email || '', query),
  }));
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.score >= 0.4 ? candidates[0].item : null;
}

// Animation de barres sonores pendant l’écoute/réponse
const WaveBars: React.FC<{ color: string }> = ({ color }) => (
  <div className="flex items-end justify-center gap-0.5 h-6" aria-hidden="true">
    {[3, 5, 8, 6, 4, 7, 5, 3].map((h, i) => (
      <div
        key={i}
        className={`w-1 rounded-full animate-pulse ${color}`}
        style={{ height: `${h * 3}px`, animationDelay: `${i * 0.1}s`, animationDuration: '0.8s' }}
      />
    ))}
  </div>
);

// Composant principal
export const VoiceAssistant: React.FC<{}> = () => {
  const [listening, setListening]               = useState(false);
  const [speaking, setSpeaking]                 = useState(false);
  const [transcript, setTranscript]             = useState('');
  const transcriptRef                           = useRef('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [lastResponse, setLastResponse]         = useState('');
  const [history, setHistory]                   = useState<{cmd: string; res: string}[]>([]);
  const [error, setError]                       = useState('');
  const [isOpen, setIsOpen]                     = useState(false);
  const [continuous, setContinuous]             = useState(false);
  const [alwaysOn, setAlwaysOn]                 = useState(false);
  const [noSpeechRetries, setNoSpeechRetries]   = useState(0);
  const [pendingConfirmation, setPendingConfirmationState] = useState<PendingConfirmation | null>(null);
  const [pendingModify,       setPendingModifyState]       = useState<PendingModify | null>(null);
  const [pendingCreate,       setPendingCreateState]       = useState<PendingCreate | null>(null);
  // Refs pour accès synchrone dans les callbacks (pas de stale-closure)
  const pendingConfirmRef = useRef<PendingConfirmation | null>(null);
  const pendingModifyRef  = useRef<PendingModify | null>(null);
  const pendingCreateRef  = useRef<PendingCreate | null>(null);
  // Setters stables : mettent à jour ref ET state en même temps
  const setPendingConfirmation = useCallback((v: PendingConfirmation | null) => {
    pendingConfirmRef.current = v; setPendingConfirmationState(v);
  }, []);
  const setPendingModify = useCallback((v: PendingModify | null) => {
    pendingModifyRef.current = v; setPendingModifyState(v);
  }, []);
  const setPendingCreate = useCallback((v: PendingCreate | null) => {
    pendingCreateRef.current = v; setPendingCreateState(v);
  }, []);
  const panelRef = useRef<HTMLDivElement>(null);

  const navigate              = useNavigate();
  const location              = useLocation();
  const recognitionRef        = useRef<any>(null);
  const continuousRef         = useRef(false);
  const alwaysOnRef           = useRef(false);
  const processCommandRef     = useRef<(text: string) => void>(() => {});
  const { setPendingCommand } = useVoiceCommand();

  // Keep refs in sync
  useEffect(() => { continuousRef.current = continuous; }, [continuous]);
  useEffect(() => { alwaysOnRef.current = alwaysOn; }, [alwaysOn]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const inferEntityFromRoute = useCallback((): EntityType => {
    const path = location.pathname;
    if (path.includes('employees'))   return 'employee';
    if (path.includes('skills'))      return 'skill';
    if (path.includes('departments')) return 'department';
    if (path.includes('activities'))  return 'activity';
    return 'unknown';
  }, [location.pathname]);

  const getLanguage = useCallback(() => {
    const browserLang = navigator.language || 'fr-FR';
    return browserLang.startsWith('fr') ? 'fr-FR' : 'en-US';
  }, []);

  // ── speak ─────────────────────────────────────────────────────────────────

  const speak = useCallback((text: string, autoListen = false) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setLastResponse(text);
    setHistory(h => [{ cmd: transcriptRef.current, res: text }, ...h].slice(0, 5));
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang  = 'fr-FR';
    utterance.rate  = 1.05;
    utterance.pitch = 1;
    utterance.onstart = () => setSpeaking(true);
    utterance.onerror = () => setSpeaking(false);
    utterance.onend   = () => {
      setSpeaking(false);
      const shouldListen = continuousRef.current || autoListen || alwaysOnRef.current;
      if (shouldListen && recognitionRef.current) {
        setTranscript('');
        setInterimTranscript('');
        setError('');
        setListening(true);
        try { recognitionRef.current.start(); } catch { setListening(false); }
      }
    };
    window.speechSynthesis.speak(utterance);
  }, [getLanguage]);

  // ── startListening ────────────────────────────────────────────────────────

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError("La reconnaissance vocale n'est pas disponible sur ce navigateur.");
      return;
    }
    setTranscript('');
    setInterimTranscript('');
    setError('');
    setListening(true);
    try {
      recognitionRef.current.start();
    } catch {
      setError('Erreur lors du démarrage. Veuillez réessayer.');
      setListening(false);
    }
  }, []);

  // Raccourci Alt+M pour ouvrir l’assistant et démarrer l’écoute
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.code === 'KeyM') {
        e.preventDefault();
        if (!listening && !speaking && recognitionRef.current) {
          setIsOpen(true);
          startListening();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [listening, speaking, startListening]);

  // ── Focus panel when opened ───────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.focus();
    }
  }, [isOpen]);

  const getRouteForEntity = (entity: EntityType): string => {
    const routes: Record<EntityType, string> = {
      skill: '/dashboard/skills', employee: '/dashboard/employees',
      department: '/dashboard/departments', activity: '/dashboard/activities',
      profile: '/dashboard/profile', settings: '/dashboard/settings',
      notifications: '/dashboard/notifications', analytics: '/dashboard/analytics',
      recommendations: '/dashboard/recommendations', home: '/dashboard/home',
      unknown: '/dashboard/home',
    };
    return routes[entity] || '/dashboard/home';
  };

  // Labels en français pour la voix
  const entityLabel = (entity: EntityType): string => {
    const labels: Partial<Record<EntityType, string>> = {
      skill: 'skill', employee: 'employé', department: 'département',
      activity: 'activité', profile: 'profil', settings: 'paramètres',
    };
    return labels[entity] || entity;
  };

  const getCommandTypeForEntity = (entity: EntityType, intent: Intent): string => {
    const map: Record<string, string> = {
      'create-skill': 'create-skill', 'create-employee': 'create-employee',
      'create-department': 'create-department', 'create-activity': 'create-activity',
      'modify-skill': 'modify-skill', 'modify-employee': 'modify-employee',
      'modify-department': 'modify-department',
      'delete-skill': 'delete-skill', 'delete-employee': 'delete-employee',
      'delete-department': 'delete-department',
    };
    return map[`${intent}-${entity}`] || '';
  };

  // ── Intent handlers ───────────────────────────────────────────────────────

  const handleNavigation = useCallback((entity: EntityType, name: string | null) => {
    navigate(getRouteForEntity(entity));
    speak(name ? `Navigation vers ${entityLabel(entity)} ${name}` : `Navigation vers ${entityLabel(entity)}`);
  }, [navigate, speak]);

  // Création directe via API
  const handleCreate = useCallback(async (entity: EntityType, name: string | null) => {
    // Employé : nécessite email + mot de passe → formulaire obligatoire
    if (entity === 'employee') {
      setPendingCommand('create-employee' as any, name ? { name } : undefined);
      navigate('/dashboard/employees');
      speak(name ? `Remplissez le formulaire pour ${name}` : "Ouverture du formulaire employé");
      return;
    }
    if (!name) {
      speak(`Quel nom voulez-vous donner au ${entityLabel(entity)} ?`, true);
      return;
    }
    try {
      if (entity === 'department') {
        // Dialogue : demander le manager
        setPendingCreate({ entity: 'department', name, step: 'awaiting-manager' });
        speak(`Département ${name}. Quel est l'identifiant du manager ?`, true);
      } else if (entity === 'skill') {
        const depts = (await API.get(`/departments`)).data;
        if (depts.length > 0) {
          const deptList = depts.slice(0, 6).map((d: any) => d.name).join(', ');
          setPendingCreate({ entity: 'skill', name, step: 'awaiting-department', departments: depts });
          speak(`Skill ${name}. Dans quel département ? Disponibles : ${deptList}. Dites le nom du département.`, true);
        } else {
          // Aucun département — créer sans departmentId
          await API.post(`/skills`, { name, description: '' });
          setPendingCommand('create-skill' as any, { name });
          navigate('/dashboard/skills');
          speak(`Skill ${name} créé`);
        }
      } else {
        speak(`Création de ${entityLabel(entity)} non supportée`);
      }
    } catch {
      speak(`Erreur lors de la création du ${entityLabel(entity)} ${name}`);
    }
  }, [navigate, setPendingCommand, speak]);

  // Finalise la création après collecte audio de toutes les informations
  const applyCreate = useCallback(async (pc: PendingCreate, extra?: string) => {
    try {
      if (pc.entity === 'skill') {
        const body: any = { name: pc.name, description: '' };
        if (extra) body.departmentId = extra;
        await API.post(`/skills`, body);
        setPendingCommand('create-skill' as any, { name: pc.name });
        navigate('/dashboard/skills');
        speak(`Skill ${pc.name} créé avec succès`);
      } else if (pc.entity === 'department') {
        await API.post(`/departments`, { name: pc.name, user_id: extra || 'default-manager' });
        setPendingCommand('create-department' as any, { name: pc.name });
        navigate('/dashboard/departments');
        speak(`Département ${pc.name} créé avec succès`);
      }
    } catch {
      speak(`Erreur lors de la création. Vérifiez les informations et réessayez.`);
    } finally {
      setPendingCreate(null);
    }
  }, [navigate, setPendingCommand, speak]);

  // Finalise la modification : juste le nom, tout le reste conservé
  const applyModify = useCallback(async (pm: PendingModify, newName: string) => {
    if (!newName.trim()) { speak('Le nouveau nom est vide. Modification annulée.'); setPendingModify(null); return; }
    try {
      if (pm.entity === 'skill') {
        const body: any = { name: newName };
        if (pm.currentDeptId) body.departmentId = pm.currentDeptId;
        await API.patch(`/skills/${pm.id}`, body);
        setPendingCommand('modify-skill' as any, { name: newName });
        navigate('/dashboard/skills');
        speak(`Skill renommé en ${newName} avec succès`);
      } else if (pm.entity === 'department') {
        await API.patch(`/departments/${pm.id}`, {
          name: newName,
          user_id: pm.currentUserId || 'default-manager',
        });
        setPendingCommand('modify-department' as any, { name: newName });
        navigate('/dashboard/departments');
        speak(`Département renommé en ${newName} avec succès`);
      } else if (pm.entity === 'employee') {
        await API.patch(`/users/${pm.id}`, { name: newName });
        setPendingCommand('modify-employee' as any, { name: newName });
        navigate('/dashboard/employees');
        speak(`Employé renommé en ${newName} avec succès`);
      }
    } catch {
      speak(`Erreur lors de la mise à jour. Vérifiez la connexion et réessayez.`);
    } finally {
      setPendingModify(null);
    }
  }, [navigate, setPendingCommand, setPendingModify, speak]);

  // Modification directe par nom : "modifier département X par Y" ou dialogue à 1 étape
  const handleModify = useCallback(async (entity: EntityType, name: string | null, newName?: string | null) => {
    if (entity !== 'skill' && entity !== 'department' && entity !== 'employee') {
      speak(`Modification de ${entityLabel(entity)} non supportée`); return;
    }
    if (!name) {
      speak(`Quel ${entityLabel(entity)} voulez-vous modifier ?`, true);
      return;
    }
    try {
      let items: any[] = [];
      if (entity === 'skill')           items = (await API.get(`/skills`)).data;
      else if (entity === 'employee')   items = (await API.get(`/users`)).data;
      else if (entity === 'department') items = (await API.get(`/departments`)).data;

      const found = fuzzyFind(items, name);
      if (!found) { speak(`${entityLabel(entity)} "${name}" introuvable. Vérifiez le nom.`); return; }

      const pm: PendingModify = {
        entity,
        id: found._id || found.id,
        currentName: found.name || found.email,
        currentUserId: found.user_id,
        currentDeptId: found.departmentId,
        step: 'awaiting-new-name',
      };

      if (newName) {
        await applyModify(pm, newName);
      } else {
        setPendingModify(pm);
        speak(`Modification de ${entityLabel(entity)} ${pm.currentName}. Quel est le nouveau nom ?`, true);
      }
    } catch {
      speak(`Impossible de trouver le ${entityLabel(entity)} pour le moment`);
    }
  }, [applyModify, speak]);

  // Delete with direct API confirmation when name is given
  const handleDelete = useCallback(async (entity: EntityType, name: string | null) => {
    if (!name) {
      const commandType = getCommandTypeForEntity(entity, 'delete');
      if (commandType) {
        navigate(getRouteForEntity(entity));
        setPendingCommand(commandType as any);
        speak(`Précisez le nom du ${entityLabel(entity)} à supprimer`);
      }
      return;
    }
    try {
      let items: any[] = [];
      if (entity === 'skill')          { items = (await API.get(`/skills`)).data; }
      else if (entity === 'employee')  { items = (await API.get(`/users`)).data; }
      else if (entity === 'department') { items = (await API.get(`/departments`)).data; }

      const found = fuzzyFind(items, name);

      if (!found) { speak(`${entityLabel(entity)} ${name} introuvable. Vérifiez le nom et réessayez.`); return; }

      const displayName = found.name || found.email;
      setPendingConfirmation({ type: 'delete', entity, id: found._id || found.id, name: displayName });
      speak(`Voulez-vous vraiment supprimer le ${entityLabel(entity)} ${displayName} ? Dites oui pour confirmer, ou non pour annuler.`, true);
    } catch {
      speak(`Impossible de rechercher le ${entity} pour le moment`);
    }
  }, [navigate, setPendingCommand, speak]);

  const handleConfirm = useCallback(async () => {
    const pConf = pendingConfirmRef.current;
    if (!pConf) { speak('Aucune action en attente de confirmation'); return; }
    if (pConf.type === 'delete') {
      try {
        const endpoints: Record<string, string> = {
          skill: `/skills`, employee: `/users`, department: `/departments`,
        };
        const endpoint = endpoints[pConf.entity as string];
        if (endpoint) {
          await API.delete(`${endpoint}/${pConf.id}`);
          const entity = pConf.entity;
          const cmd = getCommandTypeForEntity(entity, 'delete');
          if (cmd) setPendingCommand(cmd as any, { name: pConf.name });
          navigate(getRouteForEntity(entity));
          speak(`Le ${entityLabel(entity)} ${pConf.name} a été supprimé avec succès`);
        }
      } catch {
        speak('Erreur lors de la suppression. Veuillez réessayer.');
      } finally {
        setPendingConfirmation(null);
      }
    }
  }, [navigate, setPendingCommand, setPendingConfirmation, speak]);

  const handleCancel = useCallback(() => {
    if (pendingCreateRef.current) {
      setPendingCreate(null);
      speak('Création annulée');
    } else if (pendingModifyRef.current) {
      setPendingModify(null);
      speak('Modification annulée');
    } else if (pendingConfirmRef.current) {
      const { entity, name } = pendingConfirmRef.current;
      setPendingConfirmation(null);
      speak(`Suppression du ${entityLabel(entity)} ${name} annulée`);
    } else speak('Opération annulée');
  }, [setPendingCreate, setPendingModify, setPendingConfirmation, speak]);

  const handleStats = useCallback(async (entity: EntityType) => {
    const target = entity === 'unknown' ? inferEntityFromRoute() : entity;
    try {
      if (target === 'skill') {
        const { data } = await API.get(`/skills`);
        speak(`Il y a ${data.length} skill${data.length > 1 ? 's' : ''} dans la plateforme`);
      } else if (target === 'employee') {
        const { data } = await API.get(`/users`);
        speak(`Il y a ${data.length} employé${data.length > 1 ? 's' : ''} dans la plateforme`);
      } else if (target === 'department') {
        const { data } = await API.get(`/departments`);
        speak(`Il y a ${data.length} département${data.length > 1 ? 's' : ''} dans la plateforme`);
      } else {
        const [skills, users, depts] = await Promise.all([
          API.get(`/skills`),
          API.get(`/users`),
          API.get(`/departments`),
        ]);
        speak(`La plateforme contient ${skills.data.length} skills, ${users.data.length} employés et ${depts.data.length} départements`);
      }
    } catch {
      speak('Impossible de récupérer les statistiques pour le moment');
    }
  }, [inferEntityFromRoute, speak]);

  const handleList = useCallback(async (entity: EntityType) => {
    const target = entity === 'unknown' ? inferEntityFromRoute() : entity;
    const limit = 8;
    try {
      if (target === 'skill') {
        const { data } = await API.get(`/skills`);
        if (!data.length) { speak('Aucun skill dans la plateforme'); return; }
        const names = data.slice(0, limit).map((s: any) => s.name).join(', ');
        const extra = data.length > limit ? ` et ${data.length - limit} autres` : '';
        speak(`Les skills sont : ${names}${extra}`);
      } else if (target === 'department') {
        const { data } = await API.get(`/departments`);
        if (!data.length) { speak('Aucun département dans la plateforme'); return; }
        const names = data.slice(0, limit).map((d: any) => d.name).join(', ');
        const extra = data.length > limit ? ` et ${data.length - limit} autres` : '';
        speak(`Les départements sont : ${names}${extra}`);
      } else if (target === 'employee') {
        const { data } = await API.get(`/users`);
        if (!data.length) { speak('Aucun employé dans la plateforme'); return; }
        const names = data.slice(0, limit).map((e: any) => e.name || e.email).join(', ');
        const extra = data.length > limit ? ` et ${data.length - limit} autres` : '';
        speak(`Les employés sont : ${names}${extra}`);
      } else {
        speak('Précisez ce que vous voulez lister : skills, employés ou départements');
      }
    } catch {
      speak('Impossible de récupérer la liste pour le moment');
    }
  }, [inferEntityFromRoute, speak]);

  const handleView = useCallback(async (entity: EntityType, name: string | null) => {
    if (!name) {
      speak(`Quel ${entityLabel(entity)} voulez-vous afficher ?`, true);
      return;
    }
    try {
      let items: any[] = [];
      if (entity === 'skill')           items = (await API.get(`/skills`)).data;
      else if (entity === 'employee')   items = (await API.get(`/users`)).data;
      else if (entity === 'department') items = (await API.get(`/departments`)).data;
      else { speak(`Affichage de ${entityLabel(entity)} non supporté`); return; }

      const found = fuzzyFind(items, name);
      if (!found) { speak(`${entityLabel(entity)} "${name}" introuvable. Vérifiez le nom.`); return; }

      // Lire les détails à voix haute
      let details = '';
      if (entity === 'skill') {
        const desc = found.description?.trim() || 'aucune description';
        details = `Skill ${found.name}. Description : ${desc}.`;
      } else if (entity === 'employee') {
        const skills = Array.isArray(found.skills) ? found.skills : [];
        const skillNames = skills.map((s: any) => s.name || s).join(', ') || 'aucun';
        details = `Employé ${found.name}. Email : ${found.email}. Rôle : ${found.role || 'non défini'}. Skills : ${skillNames}.`;
      } else if (entity === 'department') {
        const manager = found.user_id || 'non défini';
        details = `Département ${found.name}. Manager : ${manager}.`;
      }
      speak(details);

      const targetRoute = getRouteForEntity(entity);
      const alreadyOnPage = location.pathname.startsWith(targetRoute);
      navigate(targetRoute);
      const delay = alreadyOnPage ? 0 : 300;
      setTimeout(() => setPendingCommand(`view-${entity}` as any, { name: found.name }), delay);
    } catch {
      speak(`Impossible d'afficher le ${entityLabel(entity)} pour le moment`);
    }
  }, [location.pathname, navigate, setPendingCommand, speak]);

  const handleSearch = useCallback((entity: EntityType, name: string | null) => {
    const supported = ['employee', 'skill', 'department'];
    if (!supported.includes(entity)) { speak(`Recherche non supportée pour ${entityLabel(entity)}`); return; }
    const targetRoute = getRouteForEntity(entity);
    const alreadyOnPage = location.pathname.startsWith(targetRoute);
    navigate(targetRoute);
    if (name) {
      // Immédiat si déjà sur la page, sinon délai pour laisser le composant se monter
      const delay = alreadyOnPage ? 0 : 300;
      setTimeout(() => setPendingCommand(`search-${entity}` as any, { name }), delay);
      speak(`Recherche de ${name} dans les ${entityLabel(entity)}s`);
    } else {
      speak(`Navigation vers les ${entityLabel(entity)}s`);
    }
  }, [location.pathname, navigate, setPendingCommand, speak]);

  const handleFilter = useCallback((entity: EntityType, name: string | null) => {
    const supported = ['employee', 'skill', 'department'];
    if (!supported.includes(entity)) { speak(`Filtrage non supporté pour ${entityLabel(entity)}`); return; }
    const targetRoute = getRouteForEntity(entity);
    const alreadyOnPage = location.pathname.startsWith(targetRoute);
    navigate(targetRoute);
    if (name) {
      const delay = alreadyOnPage ? 0 : 300;
      setTimeout(() => setPendingCommand(`filter-${entity}` as any, { name }), delay);
      speak(`Filtrage par ${name} dans les ${entityLabel(entity)}s`);
    } else {
      speak(`Navigation vers les ${entityLabel(entity)}s`);
    }
  }, [location.pathname, navigate, setPendingCommand, speak]);

  const handleHelp = useCallback(() => {
    speak(
      'Exemples de commandes : créer un skill React, supprimer employé Jean, ' +
      'combien de départements, liste les skills, aller aux employés, ' +
      'chercher Marie, modifier département IT, bonjour.'
    );
  }, [speak]);

  // ── processCommand ────────────────────────────────────────────────────────

  const processCommand = useCallback((text: string) => {
    const lower = text.toLowerCase().trim();
    // Lire depuis les refs pour éviter tout stale-closure dans les dialogues
    const pendingCreate       = pendingCreateRef.current;
    const pendingModify       = pendingModifyRef.current;
    const pendingConfirmation = pendingConfirmRef.current;

    // ── Pending creation dialogue ─────────────────────────────────────────
    if (pendingCreate) {
      const cancel = ['annuler', 'annule', 'stop', 'non', 'abandonner', 'abandonne'];
      if (cancel.some(w => lower.includes(w))) {
        setPendingCreate(null);
        speak('Création annulée');
        return;
      }
      if (pendingCreate.step === 'awaiting-department') {
        const depts = pendingCreate.departments || [];
        const foundDept = fuzzyFind(depts, text.trim());
        if (!foundDept) {
          const deptList = depts.slice(0, 6).map(d => d.name).join(', ');
          speak(`Département introuvable. Choisissez parmi : ${deptList}. Répétez ou dites annuler.`, true);
          return;
        }
        applyCreate(pendingCreate, foundDept._id);
        return;
      }
      if (pendingCreate.step === 'awaiting-manager') {
        applyCreate(pendingCreate, text.trim());
        return;
      }
      return;
    }

    // ── Pending modification dialogue ─────────────────────────────────────
    if (pendingModify) {
      const cancel = ['annuler', 'annule', 'stop', 'non', 'abandonner', 'abandonne'];
      if (cancel.some(w => lower.includes(w))) {
        setPendingModify(null);
        speak('Modification annulée');
        return;
      }
      // Une seule étape : l'utilisateur donne le nouveau nom
      const newName = text.trim();
      if (newName) {
        applyModify(pendingModify, newName);
      } else {
        speak('Je n\'ai pas compris. Quel est le nouveau nom ?', true);
      }
      return;
    }

    // Pending confirmation takes priority
    if (pendingConfirmation) {
      const yes = ['oui', "d'accord", 'ok', 'yes', 'ouais', 'confirme', 'valide', 'absolument'];
      const no  = ['non', 'annule', 'annuler', 'stop', 'no', 'pas question', 'abandonne'];
      if (yes.some(w => lower.includes(w))) { handleConfirm(); return; }
      if (no.some(w => lower.includes(w)))  { handleCancel(); return; }
    }

    const parsed = parseCommand(text);

    // Context-aware: infer entity from current route if unknown
    if (parsed.entity === 'unknown') {
      const inferred = inferEntityFromRoute();
      if (inferred !== 'unknown') parsed.entity = inferred;
    }

    if (!isValidCommand(parsed)) {
      speak(getErrorMessage(parsed));
      return;
    }

    switch (parsed.intent) {
      case 'navigate':
        handleNavigation(parsed.entity, parsed.name);
        break;
      case 'open':
        if (parsed.name) handleView(parsed.entity, parsed.name);
        else handleNavigation(parsed.entity, parsed.name);
        break;
      case 'create':
        handleCreate(parsed.entity, parsed.name);
        break;
      case 'modify':
        handleModify(parsed.entity, parsed.name, parsed.newName);
        break;
      case 'delete':
        handleDelete(parsed.entity, parsed.name);
        break;
      case 'confirm':
        handleConfirm();
        break;
      case 'cancel':
        handleCancel();
        break;
      case 'stats':
        handleStats(parsed.entity);
        break;
      case 'list':
        handleList(parsed.entity);
        break;
      case 'search':
        handleSearch(parsed.entity, parsed.name);
        break;
      case 'filter':
        handleFilter(parsed.entity, parsed.name);
        break;
      case 'sort':
        speak(parsed.name ? `Tri par ${parsed.name}` : 'Tri appliqué');
        break;
      case 'view':
        if (parsed.name) handleView(parsed.entity, parsed.name);
        else { navigate(getRouteForEntity(parsed.entity)); speak(`Navigation vers ${entityLabel(parsed.entity)}`); }
        break;
      case 'help':
        handleHelp();
        break;
      case 'greeting':
        speak('Bonjour ! Comment puis-je vous aider ?', true);
        break;
      case 'thanks':
        speak("De rien ! N'hésitez pas si vous avez besoin d'aide.");
        break;
      case 'logout':
        speak('Déconnexion en cours');
        break;
      default:
        speak("Je n'ai pas compris. Dites aide pour voir les commandes disponibles.");
    }
  // Pas besoin des états dans les dépendances : on lit depuis les refs
  }, [
    inferEntityFromRoute, speak,
    applyCreate, applyModify,
    handleNavigation, handleHelp,
    handleCreate, handleModify, handleDelete, handleConfirm, handleCancel, handleStats, handleList,
    handleSearch, handleFilter, handleView,
    setPendingCreate, setPendingModify, setPendingConfirmation,
    navigate, setPendingCommand,
  ]);

  // Keep processCommandRef always fresh
  useEffect(() => { processCommandRef.current = processCommand; });

  // ── SpeechRecognition init ────────────────────────────────────────────────

  useEffect(() => {
    if (isSpeechRecognitionSupported && SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = getLanguage();
      recognitionRef.current.interimResults = true;
      recognitionRef.current.maxAlternatives = 3;
    }
    return () => { if (recognitionRef.current) recognitionRef.current.abort(); };
  }, [getLanguage]);

  useEffect(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.onresult = (event: any) => {
      const results = event.results[event.resultIndex];
      if (results.isFinal) {
        // Choisir la meilleure alternative (la plus longue et confiante)
        const best = Array.from(results as any[])
          .sort((a: any, b: any) => b.confidence - a.confidence)[0] as any;
        const text = best.transcript.trim();
        setTranscript(text);
        transcriptRef.current = text;
        setInterimTranscript('');
        setListening(false);
        setNoSpeechRetries(0);
        processCommandRef.current(text);
      } else {
        setInterimTranscript(results[0].transcript);
      }
    };
    recognitionRef.current.onerror = (event: any) => {
      if (event.error === 'no-speech') {
        setListening(false);
        // Pendant un dialogue, ne jamais afficher "je n'ai rien entendu" — juste réessayer
        const inDialogue = pendingModifyRef.current || pendingCreateRef.current || pendingConfirmRef.current;
        if (inDialogue) {
          setTimeout(() => {
            setListening(true);
            try { recognitionRef.current.start(); } catch { setListening(false); }
          }, 400);
          return;
        }
        setNoSpeechRetries(r => {
          if (r < 2) {
            // Retry silencieusement
            setTimeout(() => {
              setTranscript('');
              setInterimTranscript('');
              setListening(true);
              try { recognitionRef.current.start(); } catch { setListening(false); }
            }, 300);
            return r + 1;
          } else {
            // Après 3 échecs : message vocal
            speak("Je n'ai rien entendu. Appuyez sur le bouton ou dites quelque chose.");
            return 0;
          }
        });
        return;
      }
      const msgs: Record<string, string> = {
        'audio-capture': 'Microphone non disponible.',
        'not-allowed': 'Permission microphone refusée.',
        'network': 'Erreur réseau — vérifiez votre connexion internet (la reconnaissance vocale nécessite internet).',
        'aborted': '',
        'service-not-allowed': 'Service vocal non autorisé — utilisez Chrome avec HTTPS.',
        'bad-grammar': 'Erreur de configuration vocale.',
        'language-not-supported': 'Langue non supportée.',
      };
      const msg = msgs[event.error] ?? `Erreur : ${event.error}`;
      if (msg) setError(msg);
      setListening(false);
    };
    recognitionRef.current.onend = () => {
      setListening(false);
      // Ne pas redémarrer si : dialogue actif OU TTS en cours / en attente
      const inDialogue = pendingModifyRef.current || pendingCreateRef.current || pendingConfirmRef.current;
      const ttsActive  = window.speechSynthesis.speaking || window.speechSynthesis.pending;
      if (alwaysOnRef.current && !inDialogue && !ttsActive) {
        setTimeout(() => {
          // Double-vérifier au moment du démarrage
          if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
            setTranscript('');
            setInterimTranscript('');
            setListening(true);
            try { recognitionRef.current.start(); } catch { setListening(false); }
          }
        }, 250);
      }
    };
  }, [speak]);

  // ── Status ────────────────────────────────────────────────────────────────

  const status =
    pendingCreate     ? 'create'        :
    pendingModify     ? 'modify'        :
    pendingConfirmation ? 'confirmation' :
    listening           ? 'listening'    :
    speaking            ? 'speaking'     :
    'idle';

  const statusConfig = {
    idle:         { label: 'Prêt',              dot: 'bg-gray-400',                hint: 'Alt+M pour parler' },
    listening:    { label: 'Écoute...',          dot: 'bg-red-500 animate-pulse',   hint: 'Parlez maintenant' },
    speaking:     { label: 'Répond...',          dot: 'bg-green-500 animate-pulse', hint: 'Réponse en cours' },
    confirmation: { label: 'Confirmation ?',     dot: 'bg-amber-500 animate-pulse', hint: 'Dites oui ou non' },
    modify:       { label: 'Modification...',    dot: 'bg-purple-500 animate-pulse', hint: 'Dites le nouveau nom' },
    create:       { label: 'Création...',       dot: 'bg-teal-500 animate-pulse',   hint: pendingCreate?.step === 'awaiting-department' ? 'Dites le département' : 'Dites le manager' },
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          listening         ? 'bg-red-500 scale-110'
          : speaking        ? 'bg-green-500 scale-105'
          : pendingConfirmation ? 'bg-amber-500'
          : 'bg-blue-600 hover:bg-blue-700 hover:scale-110'
        }`}
        title="Assistant vocal"
        aria-label="Assistant vocal"
        aria-expanded={isOpen}
      >
        {speaking ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m-3.536-9.536a5 5 0 000 7.072M6.343 6.343a8 8 0 000 11.314" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          className="absolute bottom-20 right-0 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="va-title"
          aria-live="polite"
          tabIndex={-1}
          ref={panelRef}
        >
          {/* Header */}
          <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span className="font-semibold" id="va-title">Assistant vocal</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200 transition-colors" aria-label="Fermer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-4 space-y-3">
            {isSpeechRecognitionSupported ? (
              <>
                {/* Status bar + toggles */}
                <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${statusConfig[status].dot}`} />
                    <div>
                      <span className="text-xs font-medium text-gray-600">{statusConfig[status].label}</span>
                      <span className="ml-1.5 text-xs text-gray-400">{statusConfig[status].hint}</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {/* Always-On toggle */}
                    <button
                      onClick={() => {
                        const next = !alwaysOn;
                        setAlwaysOn(next);
                        if (next && !listening && !speaking && recognitionRef.current) {
                          setTranscript('');
                          setInterimTranscript('');
                          setListening(true);
                          try { recognitionRef.current.start(); } catch { setListening(false); }
                        } else if (!next && recognitionRef.current) {
                          try { recognitionRef.current.abort(); } catch {}
                          setListening(false);
                        }
                      }}
                      className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-colors ${
                        alwaysOn ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-500'
                      }`}
                      title="Mode toujours à l'écoute (sans bouton)"
                      aria-pressed={alwaysOn}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${alwaysOn ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
                      Auto
                    </button>
                    {/* Continu toggle */}
                    <button
                      onClick={() => setContinuous(c => !c)}
                      className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-colors ${
                        continuous ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'
                      }`}
                      title="Réécoute après chaque réponse"
                      aria-pressed={continuous}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${continuous ? 'bg-blue-500' : 'bg-gray-400'}`} />
                      Continu
                    </button>
                  </div>
                </div>

                {/* Wave animation */}
                {(listening || speaking) && (
                  <div className="flex flex-col items-center py-1">
                    <WaveBars color={listening ? 'bg-red-400' : 'bg-green-400'} />
                    <p className="mt-1 text-xs text-gray-500">
                      {listening ? 'Parlez maintenant...' : 'Réponse en cours...'}
                    </p>
                  </div>
                )}

                {/* Main listen button */}
                <button
                  onClick={startListening}
                  disabled={listening || speaking}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
                  aria-label={listening ? 'Écoute en cours' : 'Parler'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  {listening ? 'Écoute en cours...' : speaking ? 'Réponse en cours...' : 'Parler'}
                </button>

                {/* Interim (live) transcript */}
                {interimTranscript && listening && (
                  <div className="rounded-lg bg-gray-50 border border-dashed border-gray-300 px-3 py-2" aria-live="off">
                    <p className="text-xs text-gray-400 italic">{interimTranscript}...</p>
                  </div>
                )}

                {/* Final transcript */}
                {transcript && (
                  <div className="rounded-lg bg-gray-100 px-3 py-2" role="status" aria-live="polite">
                    <p className="text-xs text-gray-500 mb-0.5">Vous avez dit :</p>
                    <p className="text-sm text-gray-800">{transcript}</p>
                  </div>
                )}

                {/* Last response + replay */}
                {lastResponse && !listening && !speaking && (
                  <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs text-blue-500 mb-0.5">Dernière réponse :</p>
                        <p className="text-sm text-blue-800 line-clamp-3" aria-live="assertive">{lastResponse}</p>
                      </div>
                      <button
                        onClick={() => speak(lastResponse)}
                        className="mt-0.5 flex-shrink-0 rounded-lg p-1.5 text-blue-500 hover:bg-blue-100 transition-colors"
                        title="Réécouter"
                        aria-label="Réécouter la dernière réponse"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m-3.536-9.536a5 5 0 000 7.072" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {/* History */}
                {history.length > 1 && (
                  <details className="rounded-lg border border-gray-100">
                    <summary className="cursor-pointer px-3 py-2 text-xs text-gray-400 hover:text-gray-600 select-none">
                      Historique ({history.length - 1} précédentes)
                    </summary>
                    <div className="divide-y divide-gray-50 px-3 pb-2">
                      {history.slice(1).map((h, i) => (
                        <div key={i} className="py-1.5">
                          {h.cmd && <p className="text-xs text-gray-400">➤ {h.cmd}</p>}
                          <p className="text-xs text-gray-600">{h.res}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {/* Error */}
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2" role="alert">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Quick command chips */}
                <div className="border-t border-gray-100 pt-2">
                  <p className="text-xs text-gray-400 mb-2">Exemples rapides :</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Combien de skills',
                      'Liste les départements',
                      'Créer un skill',
                      'Supprimer employé',
                      'Aller aux employés',
                      'Aide',
                    ].map(cmd => (
                      <button
                        key={cmd}
                        onClick={() => { setTranscript(cmd); processCommandRef.current(cmd); }}
                        className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
                      >
                        {cmd}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                <p className="text-sm text-gray-600">La reconnaissance vocale n'est pas disponible sur ce navigateur.</p>
                <p className="text-xs text-gray-500 mt-2">Utilisez Chrome, Edge ou Safari.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};



