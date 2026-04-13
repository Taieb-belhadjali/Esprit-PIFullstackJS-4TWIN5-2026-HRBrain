import { useState } from 'react';
import { Globe, Moon, Bell, Shield, LogOut, Save } from 'lucide-react';

interface SettingsProps {
  onLogout: () => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export function Settings({ onLogout, theme, setTheme }: SettingsProps) {
  const [language, setLanguage] = useState('en');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [activityNotifications, setActivityNotifications] = useState(true);
  const [recommendationNotifications, setRecommendationNotifications] = useState(true);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl mb-2 text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and settings</p>
      </div>

      {/* Language & Region */}
      <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Globe className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl text-foreground">Language & Region</h2>
            <p className="text-sm text-muted-foreground">Set your preferred language</p>
          </div>
        </div>

        <div>
          <label htmlFor="language" className="block text-sm mb-2 text-foreground">
            Language
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
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
            <h2 className="text-xl text-foreground">Appearance</h2>
            <p className="text-sm text-muted-foreground">Customize how HRBrain looks</p>
          </div>
        </div>

        <div>
          <label className="block text-sm mb-3 text-foreground">Theme</label>
          <div className="flex gap-4">
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 md:flex-none px-6 py-3 border rounded-lg transition-all ${
                theme === 'light'
                  ? 'bg-primary text-white border-primary'
                  : 'bg-card text-foreground border-input hover:border-primary dark:bg-secondary dark:text-foreground dark:border-border'
              }`}
            >
              Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 md:flex-none px-6 py-3 border rounded-lg transition-all ${
                theme === 'dark'
                  ? 'bg-primary text-white border-primary'
                  : 'bg-card text-foreground border-input hover:border-primary dark:bg-secondary dark:text-foreground dark:border-border'
              }`}
            >
              Dark
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
            <h2 className="text-xl text-foreground">Notifications</h2>
            <p className="text-sm text-muted-foreground">Manage your notification preferences</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div>
              <p className="font-medium text-foreground">Email Notifications</p>
              <p className="text-sm text-muted-foreground">Receive notifications via email</p>
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
              <p className="font-medium text-foreground">Push Notifications</p>
              <p className="text-sm text-muted-foreground">Receive push notifications in browser</p>
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
              <p className="font-medium text-foreground">Activity Updates</p>
              <p className="text-sm text-muted-foreground">Get notified about activity changes</p>
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
              <p className="font-medium text-foreground">Recommendation Alerts</p>
              <p className="text-sm text-muted-foreground">Notifications for new recommendations</p>
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
            <h2 className="text-xl text-foreground">Security & Privacy</h2>
            <p className="text-sm text-muted-foreground">Manage your security settings</p>
          </div>
        </div>

        <div className="space-y-4">
          <button className="w-full text-left p-4 border border-border rounded-lg hover:bg-secondary transition-colors">
            <p className="font-medium text-foreground">Change Password</p>
            <p className="text-sm text-muted-foreground">Update your account password</p>
          </button>

          <button className="w-full text-left p-4 border border-border rounded-lg hover:bg-secondary transition-colors">
            <p className="font-medium text-foreground">Two-Factor Authentication</p>
            <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
          </button>

          <button className="w-full text-left p-4 border border-border rounded-lg hover:bg-secondary transition-colors">
            <p className="font-medium text-foreground">Privacy Settings</p>
            <p className="text-sm text-muted-foreground">Control your data and privacy (GDPR compliant)</p>
          </button>

          <button className="w-full text-left p-4 border border-border rounded-lg hover:bg-secondary transition-colors">
            <p className="font-medium text-foreground">Download My Data</p>
            <p className="text-sm text-muted-foreground">Export all your personal data</p>
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col md:flex-row gap-4">
        <button className="flex items-center justify-center gap-2 flex-1 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors">
          <Save className="w-5 h-5" />
          Save Changes
        </button>
        <button
          onClick={onLogout}
          className="flex items-center justify-center gap-2 flex-1 md:flex-none bg-destructive text-white px-6 py-3 rounded-lg hover:bg-destructive/90 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
