import { useState, useEffect } from 'react';
import { Globe, Moon, Bell, Shield, LogOut, Save } from 'lucide-react';
import { userApi } from '../../../api/userApi';
import { useTranslation } from '../../../api/translations';

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

export function Settings({ onLogout, theme, setTheme, language: currentLanguage, setLanguage: setCurrentLanguage }: SettingsProps) {
  const t = useTranslation(currentLanguage);
  const [language, setLanguage] = useState(currentLanguage);
  const [languages, setLanguages] = useState<{ code: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [activityNotifications, setActivityNotifications] = useState(true);
  const [recommendationNotifications, setRecommendationNotifications] = useState(true);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const langs = await userApi.getLanguages();
        setLanguages(langs);
      } catch (err) {
        console.error('Failed to load languages:', err);
        setLanguages([{ code: 'en' }, { code: 'fr' }]);
      } finally {
        setLoading(false);
      }
    };
    fetchLanguages();
  }, []);

  const handleLanguageChange = async (newLang: string) => {
    setLanguage(newLang);
    setSaving(true);
    try {
      await userApi.updateLanguage(newLang);
      setCurrentLanguage(newLang);
    } catch (err: any) {
      console.error('Failed to update language:', err);
      setLanguage(currentLanguage);
      alert('Failed to update language: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
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
              <p className="font-medium text-foreground">{t('emailNotifications')}</p>
              <p className="text-sm text-muted-foreground">{t('emailNotificationsDesc')}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div>
              <p className="font-medium text-foreground">{t('pushNotifications')}</p>
              <p className="text-sm text-muted-foreground">{t('pushNotificationsDesc')}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={pushNotifications}
                onChange={(e) => setPushNotifications(e.target.checked)}
                className="sr-only peer"
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
