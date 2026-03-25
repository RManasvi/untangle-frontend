'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Bell, Palette, Lock, Save, BrainCircuit, Check } from 'lucide-react';
import { useBot } from '@/context/BotContext';
import { useTheme } from '@/context/ThemeContext';
import MFASettings from '@/components/settings/MFASettings';
import ChangePassword from '@/components/settings/ChangePassword';

const ACCENT_COLORS = [
  { id: 'blue',    label: 'Ocean Blue',    hex: '#3b82f6' },
  { id: 'purple',  label: 'Lavender',      hex: '#8b5cf6' },
  { id: 'emerald', label: 'Emerald',       hex: '#10b981' },
  { id: 'rose',    label: 'Rose',          hex: '#f43f5e' },
  { id: 'amber',   label: 'Amber',         hex: '#f59e0b' },
  { id: 'cyan',    label: 'Cyan',          hex: '#06b6d4' },
];

const PERSONALITY_DESCRIPTIONS = {
  professional: { label: 'Balanced Advisor', emoji: '🧠', desc: "Calm, clear, and always grounded. I give thoughtful advice without overcomplicating things." },
  minimalist:   { label: 'Minimalist',       emoji: '⚡', desc: "Short and sharp. I cut through the noise and get straight to the point—no fluff." },
  corporate:    { label: 'Executive Coach',  emoji: '💼', desc: "Strategic and focused. I frame everything through the lens of clarity, outcomes, and performance." },
  advisor:      { label: 'Health Strategist',emoji: '🌿', desc: "A thoughtful guide who blends intuition with insight — practical, warm, and holistic." },
  wellness_coach:{ label: 'Performance Coach',emoji: '💪', desc: "Encouraging and action-oriented. I keep it real, celebrate your wins, and push you forward." },
};

export default function SettingsPage() {
  const router = useRouter();
  const { user, updateUser, logout, loading } = useAuth();
  const { botStyle, setBotStyle } = useBot();
  const { theme, setTheme, accentColor, setAccentColor } = useTheme();
  const [activeTab, setActiveTab] = useState('general');
  const [saved, setSaved] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notifications: true,
    emailUpdates: false,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        notifications: true,
        emailUpdates: false,
      });
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleSave = () => {
    updateUser({
      ...user,
      name: formData.name,
      phone: formData.phone,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentPersonality = PERSONALITY_DESCRIPTIONS[botStyle] || PERSONALITY_DESCRIPTIONS.professional;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button
            onClick={() => router.push('/chat')}
            variant="ghost"
            size="icon"
            className="text-slate-700 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Manage your preferences and account</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-blue-100 dark:border-gray-700">
          {[
            { id: 'general',     label: 'General',     icon: '👤' },
            { id: 'preferences', label: 'Preferences', icon: '⚙️' },
            { id: 'security',    label: 'Security',    icon: '🔒' },
          ].map((tab) => (
            <Button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              className={`rounded-b-none border-b-2 ${
                activeTab === tab.id
                  ? 'bg-transparent text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </Button>
          ))}
        </div>

        {/* ── General Settings ── */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <Card className="border-blue-100 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Profile Information</CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Update your personal details</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-900 dark:text-slate-200 font-medium">Full Name</Label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-2 bg-blue-50 dark:bg-gray-800 border-blue-200 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-900 dark:text-slate-200 font-medium">Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    disabled
                    className="mt-2 bg-slate-100 dark:bg-gray-800 border-slate-200 dark:border-gray-600 dark:text-gray-400"
                  />
                  <p className="text-xs text-slate-600 dark:text-slate-500 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <Label className="text-slate-900 dark:text-slate-200 font-medium">Phone</Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-2 bg-blue-50 dark:bg-gray-800 border-blue-200 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <Button
                  onClick={handleSave}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saved ? '✅ Saved!' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Preferences ── */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            {/* Notifications */}
            <Card className="border-blue-100 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <Label className="text-slate-900 dark:text-white font-medium">Push Notifications</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Session reminders and updates</p>
                  </div>
                  <Switch
                    checked={formData.notifications}
                    onCheckedChange={(checked) => setFormData({ ...formData, notifications: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <Label className="text-slate-900 dark:text-white font-medium">Email Updates</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Weekly wellness summaries and tips</p>
                  </div>
                  <Switch
                    checked={formData.emailUpdates}
                    onCheckedChange={(checked) => setFormData({ ...formData, emailUpdates: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Advisor Personality */}
            <Card className="border-blue-100 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Advisor Personality
                </CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Choose how your AI companion talks to you</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  {Object.entries(PERSONALITY_DESCRIPTIONS).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setBotStyle(key);
                        const current = JSON.parse(localStorage.getItem('botCustomization') || '{}');
                        localStorage.setItem('botCustomization', JSON.stringify({ ...current, personality: key }));
                      }}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                        botStyle === key
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 dark:border-blue-400'
                          : 'border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{val.emoji}</span>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{val.label}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{val.desc}</p>
                          </div>
                        </div>
                        {botStyle === key && (
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                            <Check className="h-3.5 w-3.5 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Preview */}
                <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Active Style</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{currentPersonality.emoji} {currentPersonality.label}:</span>{' '}
                    {currentPersonality.desc}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Appearance — Theme */}
            <Card className="border-blue-100 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                  <Palette className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Appearance
                </CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Customize how Untangle looks</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Theme Selection */}
                <div>
                  <Label className="text-slate-900 dark:text-slate-200 font-medium mb-3 block">Theme</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'light', label: 'Light',  icon: '☀️', preview: 'bg-white border-slate-200' },
                      { id: 'dark',  label: 'Dark',   icon: '🌙', preview: 'bg-gray-900 border-gray-700' },
                      { id: 'auto',  label: 'System', icon: '🖥️', preview: 'bg-gradient-to-br from-white to-gray-900 border-slate-300' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={`relative p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                          theme === t.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40'
                            : 'border-slate-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-gray-500'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg border ${t.preview} shadow-sm`} />
                        <span className="text-xl">{t.icon}</span>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.label}</span>
                        {theme === t.id && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accent Color */}
                <div>
                  <Label className="text-slate-900 dark:text-slate-200 font-medium mb-3 block">Accent Color</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {ACCENT_COLORS.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => setAccentColor(color.id)}
                        className={`relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 ${
                          accentColor === color.id
                            ? 'border-opacity-100 shadow-md scale-105'
                            : 'border-slate-200 dark:border-gray-700 hover:scale-102'
                        }`}
                        style={accentColor === color.id ? { borderColor: color.hex } : {}}
                      >
                        <div
                          className="w-8 h-8 rounded-full shadow-sm flex-shrink-0 flex items-center justify-center"
                          style={{ backgroundColor: color.hex }}
                        >
                          {accentColor === color.id && <Check className="h-4 w-4 text-white" />}
                        </div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{color.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Security ── */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <Card className="border-blue-100 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                  <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Security & Privacy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ChangePassword />
                <MFASettings />
                <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg mt-6">
                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-300 mb-2">Privacy & Data</p>
                  <p className="text-xs text-yellow-800 dark:text-yellow-400">
                    Your conversations are encrypted and stored securely. We never share your data with third parties.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-950/20 shadow-lg">
              <CardHeader>
                <CardTitle className="text-red-900 dark:text-red-400">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 h-auto py-3 bg-transparent"
                >
                  Logout
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 h-auto py-3 bg-transparent"
                >
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
