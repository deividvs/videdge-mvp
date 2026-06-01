'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import { Settings, User, Save, Loader2, Key, Eye, EyeOff, CheckCircle, AlertCircle, Trash2, Youtube } from 'lucide-react';
import { toast } from 'sonner';

const API_PROVIDERS = [
  { value: '', label: 'Padrão (Integrada)', description: 'Usar a IA integrada da plataforma' },
  { value: 'openai', label: 'OpenAI', description: 'GPT-4o Mini, GPT-4o, etc.' },
  { value: 'claude', label: 'Claude (Anthropic)', description: 'Claude Sonnet, Opus, etc.' },
];

export default function SettingsPage() {
  const { data: session } = useSession() || {};
  const [saving, setSaving] = useState(false);
  const [loadingApi, setLoadingApi] = useState(true);
  const [apiProvider, setApiProvider] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [savingApi, setSavingApi] = useState(false);
  const [youtubeApiKey, setYoutubeApiKey] = useState('');
  const [hasYoutubeKey, setHasYoutubeKey] = useState(false);
  const [showYoutubeKey, setShowYoutubeKey] = useState(false);
  const [savingYoutube, setSavingYoutube] = useState(false);

  const fetchApiSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setApiProvider(data.apiProvider || '');
        setHasExistingKey(data.hasApiKey);
        setHasYoutubeKey(data.hasYoutubeApiKey || false);
      }
    } catch (err) {
      console.error('Error fetching API settings:', err);
    } finally {
      setLoadingApi(false);
    }
  }, []);

  useEffect(() => {
    fetchApiSettings();
  }, [fetchApiSettings]);

  const handleSaveApiKey = async () => {
    if (apiProvider && !apiKey && !hasExistingKey) {
      toast.error('Insira sua chave de API');
      return;
    }

    setSavingApi(true);
    try {
      const body: any = { apiProvider: apiProvider || null };
      if (apiKey) body.apiKey = apiKey;
      if (!apiProvider) body.apiKey = null;

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Erro ao salvar');

      toast.success('Configurações de API salvas!');
      setApiKey('');
      setHasExistingKey(!!apiProvider);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar configurações');
    } finally {
      setSavingApi(false);
    }
  };

  const handleSaveYoutubeKey = async () => {
    if (!youtubeApiKey && !hasYoutubeKey) {
      toast.error('Insira sua chave de API do YouTube');
      return;
    }
    setSavingYoutube(true);
    try {
      const body: any = {};
      if (youtubeApiKey) body.youtubeApiKey = youtubeApiKey;
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Erro ao salvar');
      toast.success('Chave do YouTube salva!');
      setYoutubeApiKey('');
      setHasYoutubeKey(true);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar chave');
    } finally {
      setSavingYoutube(false);
    }
  };

  const handleRemoveYoutubeKey = async () => {
    setSavingYoutube(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtubeApiKey: null }),
      });
      if (!res.ok) throw new Error('Erro ao remover');
      setYoutubeApiKey('');
      setHasYoutubeKey(false);
      toast.success('Chave do YouTube removida. Usando chave padrão da plataforma.');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover chave');
    } finally {
      setSavingYoutube(false);
    }
  };

  const handleRemoveKey = async () => {
    setSavingApi(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiProvider: null, apiKey: null }),
      });
      if (!res.ok) throw new Error('Erro ao remover');
      setApiProvider('');
      setApiKey('');
      setHasExistingKey(false);
      toast.success('Chave de API removida. Usando IA integrada.');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover chave');
    } finally {
      setSavingApi(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Gerencie suas preferências</p>
      </div>

      {/* Profile */}
      <div className="bg-card rounded-lg border border-border p-6" style={{ boxShadow: 'var(--shadow-md)' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-md bg-purple-500/10"><User className="h-5 w-5 text-purple-400" /></div>
          <h2 className="text-lg font-semibold">Perfil</h2>
        </div>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Nome</label>
            <input type="text" defaultValue={session?.user?.name ?? ''} className="w-full px-4 py-2.5 bg-muted border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Email</label>
            <input type="email" defaultValue={session?.user?.email ?? ''} disabled className="w-full px-4 py-2.5 bg-muted border border-border rounded-md text-muted-foreground cursor-not-allowed" />
          </div>
          <button onClick={() => { toast.success('Configurações salvas!'); }} className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-md transition-colors">
            <Save className="h-4 w-4" /> Salvar Alterações
          </button>
        </div>
      </div>

      {/* API Key Configuration */}
      <div className="bg-card rounded-lg border border-border p-6" style={{ boxShadow: 'var(--shadow-md)' }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-md bg-emerald-500/10"><Key className="h-5 w-5 text-emerald-400" /></div>
          <h2 className="text-lg font-semibold">Chave de API — IA</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Configure sua própria chave de API para usar OpenAI ou Claude nas gerações de conteúdo.
          Se não configurar, será usada a IA integrada da plataforma.
        </p>

        {loadingApi ? (
          <div className="flex items-center gap-2 text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
          </div>
        ) : (
          <div className="space-y-5 max-w-lg">
            {/* Provider Select */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Provedor de IA</label>
              <select
                value={apiProvider}
                onChange={(e) => {
                  setApiProvider(e.target.value);
                  setApiKey('');
                  if (!e.target.value) setHasExistingKey(false);
                }}
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none"
              >
                {API_PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                {API_PROVIDERS.find(p => p.value === apiProvider)?.description}
              </p>
            </div>

            {/* API Key Input */}
            {apiProvider && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">Chave de API</label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={hasExistingKey ? '••••••••••••••••  (chave salva)' : apiProvider === 'openai' ? 'sk-...' : 'sk-ant-...'}
                    className="w-full px-4 py-2.5 pr-12 bg-muted border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {hasExistingKey && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Chave configurada — deixe em branco para manter a atual
                  </div>
                )}

                <div className="flex items-start gap-1.5 mt-2 text-xs text-muted-foreground">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    {apiProvider === 'openai'
                      ? 'Obtenha sua chave em platform.openai.com/api-keys'
                      : 'Obtenha sua chave em console.anthropic.com/settings/keys'}
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleSaveApiKey}
                disabled={savingApi}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
              >
                {savingApi ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar Configuração
              </button>

              {hasExistingKey && (
                <button
                  onClick={handleRemoveKey}
                  disabled={savingApi}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-md border border-red-500/20 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" /> Remover Chave
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      {/* YouTube API Key */}
      <div className="bg-card rounded-lg border border-border p-6" style={{ boxShadow: 'var(--shadow-md)' }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-md bg-red-500/10"><Youtube className="h-5 w-5 text-red-400" /></div>
          <h2 className="text-lg font-semibold">Chave de API — YouTube</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Configure sua própria chave da YouTube Data API v3 para pesquisas e análises.
          Se não configurar, será usada a chave padrão da plataforma.
        </p>

        {loadingApi ? (
          <div className="flex items-center gap-2 text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
          </div>
        ) : (
          <div className="space-y-5 max-w-lg">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Chave de API</label>
              <div className="relative">
                <input
                  type={showYoutubeKey ? 'text' : 'password'}
                  value={youtubeApiKey}
                  onChange={(e) => setYoutubeApiKey(e.target.value)}
                  placeholder={hasYoutubeKey ? '••••••••••••••••  (chave salva)' : 'AIzaSy...'}
                  className="w-full px-4 py-2.5 pr-12 bg-muted border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/50 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowYoutubeKey(!showYoutubeKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showYoutubeKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {hasYoutubeKey && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-red-400">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Chave configurada — deixe em branco para manter a atual
                </div>
              )}

              <div className="flex items-start gap-1.5 mt-2 text-xs text-muted-foreground">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  Obtenha sua chave em{' '}
                  <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-red-400 hover:underline">
                    Google Cloud Console → Credenciais
                  </a>.
                  Ative a YouTube Data API v3 no seu projeto.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleSaveYoutubeKey}
                disabled={savingYoutube}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
              >
                {savingYoutube ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar Chave
              </button>

              {hasYoutubeKey && (
                <button
                  onClick={handleRemoveYoutubeKey}
                  disabled={savingYoutube}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-md border border-red-500/20 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" /> Remover Chave
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
