import { useState, useEffect } from 'react';
import { Globe, Moon, Bell, Shield, LogOut, Save, MousePointer, BookOpen } from 'lucide-react';
import { useTranslation } from '../../../api/translations';
import { useCursor, type CursorSize } from '../../context/CursorContext';
import { useReadingMask } from '../../context/ReadingMaskContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAppTranslation } from '../../hooks/useAppTranslation';

interface SettingsProps {
  onLogout: () => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  language: string;
  setLanguage: (lang: string) => void;
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  fr: 'Français',
  es: 'Español',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
  ar: 'العربية',
  ru: 'Русский',
  hi: 'हिन्दी',
};

export function Settings({ onLogout, theme, setTheme, language: _langProp, setLanguage: _setLangProp }: SettingsProps) {
  const { language: currentLanguage, setLanguage: setCurrentLanguage } = useLanguage();
  const t = useAppTranslation();
  const [language, setLanguage] = useState(currentLanguage);
  const [languages, setLanguages] = useState<{ code: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [activityNotifications, setActivityNotifications] = useState(true);
  const [recommendationNotifications, setRecommendationNotifications] = useState(true);
  const { cursorSize, setCursorSize } = useCursor();
  const { enabled: maskEnabled, setEnabled: setMaskEnabled, maskHeight, setMaskHeight, opacity, setOpacity } = useReadingMask();

  const cursorOptions: { value: CursorSize; label: string; desc: string; preview: string }[] = [
    { value: 'normal', label: 'Normal',     desc: 'Curseur standard',          preview: 'text-base' },
    { value: 'large',  label: 'Grand',      desc: 'Curseur agrandi (×1.5)',     preview: 'text-lg'   },
    { value: 'xlarge', label: 'Très grand', desc: 'Curseur très agrandi (×2)',  preview: 'text-2xl'  },
  ];

  useEffect(() => {
    // Utiliser directement les langues définies localement — pas besoin d'API
    setLanguages(Object.keys(LANGUAGE_NAMES).map(code => ({ code })));
    setLoading(false);
  }, []);

  const handleLanguageChange = async (newLang: string) => {
    setLanguage(newLang);
    setCurrentLanguage(newLang);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl mb-2 text-foreground">{t('settings')}</h1>
        <p className="text-muted-foreground">{t('settingsDesc')}</p>
      </div>

      {/* Language & Region */}
      <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Globe className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl text-foreground">{t('languageRegion')}</h2>
            <p className="text-sm text-muted-foreground">{t('languageRegionDesc')}</p>
          </div>
        </div>

        <div>
          <label htmlFor="language" className="block text-sm mb-2 text-foreground">
            {t('language')}
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            disabled={saving}
            className="w-full md:w-64 px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
          >
            {loading ? (
              <option value="">Loading...</option>
            ) : (
              languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {LANGUAGE_NAMES[lang.code] || lang.code}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Moon className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl text-foreground">{t('appearance')}</h2>
            <p className="text-sm text-muted-foreground">{t('appearanceDesc')}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm mb-3 text-foreground">{t('theme')}</label>
          <div className="flex gap-4">
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 md:flex-none px-6 py-3 border rounded-lg transition-all ${
                theme === 'light'
                  ? 'bg-primary text-white border-primary'
                  : 'bg-card text-foreground border-input hover:border-primary dark:bg-secondary dark:text-foreground dark:border-border'
              }`}
            >
              {t('light')}
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 md:flex-none px-6 py-3 border rounded-lg transition-all ${
                theme === 'dark'
                  ? 'bg-primary text-white border-primary'
                  : 'bg-card text-foreground border-input hover:border-primary dark:bg-secondary dark:text-foreground dark:border-border'
              }`}
            >
              {t('dark')}
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <Bell className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl text-foreground">{t('notifications')}</h2>
            <p className="text-sm text-muted-foreground">{t('notificationsDesc')}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div>
              <p className="font-medium text-foreground" id="email-notif-label">{t('emailNotifications')}</p>
              <p className="text-sm text-muted-foreground">{t('emailNotificationsDesc')}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="sr-only peer"
                aria-labelledby="email-notif-label"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div>
              <p className="font-medium text-foreground" id="push-notif-label">{t('pushNotifications')}</p>
              <p className="text-sm text-muted-foreground">{t('pushNotificationsDesc')}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={pushNotifications}
                onChange={(e) => setPushNotifications(e.target.checked)}
                className="sr-only peer"
                aria-labelledby="push-notif-label"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div>
              <p className="font-medium text-foreground">{t('activityUpdates')}</p>
              <p className="text-sm text-muted-foreground">{t('activityUpdatesDesc')}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={activityNotifications}
                onChange={(e) => setActivityNotifications(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div>
              <p className="font-medium text-foreground">{t('recommendationAlerts')}</p>
              <p className="text-sm text-muted-foreground">{t('recommendationAlertsDesc')}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={recommendationNotifications}
                onChange={(e) => setRecommendationNotifications(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Accessibility — Cursor Size */}
      <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-orange-100 rounded-lg">
            <MousePointer className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl text-foreground">Accessibilité — Taille du curseur</h2>
            <p className="text-sm text-muted-foreground">Agrandissez le curseur et les zones cliquables pour une meilleure précision</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {cursorOptions.map(opt => (
            <button key={opt.value} onClick={() => setCursorSize(opt.value)}
              aria-pressed={cursorSize === opt.value}
              className={`flex flex-col items-center gap-3 p-4 border-2 rounded-xl transition-all ${cursorSize === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
              <MousePointer className={`${opt.preview} ${cursorSize === opt.value ? 'text-primary' : 'text-gray-400'}`} />
              <div className="text-center">
                <p className={`font-semibold ${cursorSize === opt.value ? 'text-primary' : 'text-foreground'}`}>{opt.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
              </div>
              {cursorSize === opt.value && <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">Actif</span>}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">Ce paramètre agrandit également les boutons et zones cliquables pour faciliter la navigation.</p>
      </div>

      {/* Accessibility — Reading Mask */}
      <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <BookOpen className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl text-foreground">Accessibilité — Masque de lecture</h2>
            <p className="text-sm text-muted-foreground">Bande horizontale qui suit votre curseur pour faciliter la lecture des listes</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={maskEnabled} onChange={e => setMaskEnabled(e.target.checked)}
              className="sr-only peer" aria-label="Activer le masque de lecture" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
          </label>
        </div>
        {maskEnabled && (
          <div className="space-y-5 pt-2 border-t border-border">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-foreground">Hauteur de la bande</label>
                <span className="text-sm text-primary font-semibold">{maskHeight}px</span>
              </div>
              <input type="range" min={40} max={120} step={10} value={maskHeight}
                onChange={e => setMaskHeight(parseInt(e.target.value))} className="w-full accent-primary" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Étroite (40px)</span><span>Large (120px)</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-foreground">Intensité du masque</label>
                <span className="text-sm text-primary font-semibold">{Math.round(opacity * 100)}%</span>
              </div>
              <input type="range" min={0.2} max={0.85} step={0.05} value={opacity}
                onChange={e => setOpacity(parseFloat(e.target.value))} className="w-full accent-primary" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Léger (20%)</span><span>Intense (85%)</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground bg-indigo-50 rounded-lg p-3">
              💡 Déplacez votre souris sur les listes d'employés, de skills ou de recommandations pour voir l'effet.
            </p>
          </div>
        )}
      </div>

      {/* Security & Privacy */}
      <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-100 rounded-lg">
            <Shield className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl text-foreground">{t('security')}</h2>
            <p className="text-sm text-muted-foreground">{t('securityDesc')}</p>
          </div>
        </div>

        <div className="space-y-4">
          <button className="w-full text-left p-4 border border-border rounded-lg hover:bg-secondary transition-colors">
            <p className="font-medium text-foreground">{t('changePassword')}</p>
            <p className="text-sm text-muted-foreground">{t('changePasswordDesc')}</p>
          </button>

          <button className="w-full text-left p-4 border border-border rounded-lg hover:bg-secondary transition-colors">
            <p className="font-medium text-foreground">{t('twoFactor')}</p>
            <p className="text-sm text-muted-foreground">{t('twoFactorDesc')}</p>
          </button>

          <button className="w-full text-left p-4 border border-border rounded-lg hover:bg-secondary transition-colors">
            <p className="font-medium text-foreground">{t('privacySettings')}</p>
            <p className="text-sm text-muted-foreground">{t('privacySettingsDesc')}</p>
          </button>

          <button className="w-full text-left p-4 border border-border rounded-lg hover:bg-secondary transition-colors">
            <p className="font-medium text-foreground">{t('downloadData')}</p>
            <p className="text-sm text-muted-foreground">{t('downloadDataDesc')}</p>
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col md:flex-row gap-4">
        <button className="flex items-center justify-center gap-2 flex-1 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors">
          <Save className="w-5 h-5" />
          {t('saveChanges')}
        </button>
        <button
          onClick={onLogout}
          className="flex items-center justify-center gap-2 flex-1 md:flex-none bg-destructive text-white px-6 py-3 rounded-lg hover:bg-destructive/90 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          {t('logout')}
        </button>
      </div>
    </div>
  );
}
