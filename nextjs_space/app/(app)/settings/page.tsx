'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { Settings, User, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { data: session } = useSession() || {};
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Gerencie suas preferências</p>
      </div>

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

      <div className="bg-card rounded-lg border border-border p-6" style={{ boxShadow: 'var(--shadow-md)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-md bg-blue-500/10"><Settings className="h-5 w-5 text-blue-400" /></div>
          <h2 className="text-lg font-semibold">Preferências</h2>
        </div>
        <p className="text-sm text-muted-foreground">Mais configurações estarão disponíveis em breve, incluindo integrações e personalizações avançadas.</p>
      </div>
    </div>
  );
}
