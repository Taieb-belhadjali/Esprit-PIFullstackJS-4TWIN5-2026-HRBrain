import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../../api/translations';

/**
 * Hook qui combine useLanguage (contexte global) + useTranslation
 * Tous les composants qui utilisent ce hook se mettent à jour automatiquement
 * quand la langue change dans Settings.
 */
export function useAppTranslation() {
  const { language } = useLanguage();
  return useTranslation(language);
}
