'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Zap, Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSent(true);
    setLoading(false);
    toast.success('Se o email existir, você receberá instruções de recuperação.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4"><Zap className="h-8 w-8 text-purple-500" /><h1 className="text-3xl font-display font-bold tracking-tight bg-gradient-to-r from-purple-500 via-blue-500 to-emerald-500 bg-clip-text text-transparent">VidEdge</h1></div>
          <p className="text-muted-foreground">Recupere o acesso à sua conta</p>
        </div>
        <div className="bg-card rounded-lg p-8" style={{ boxShadow: 'var(--shadow-lg)' }}>
          {sent ? (
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto" />
              <h2 className="text-lg font-semibold">Email Enviado</h2>
              <p className="text-sm text-muted-foreground">Se uma conta existir com este email, você receberá instruções para redefinir sua senha.</p>
              <Link href="/login" className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300"><ArrowLeft className="h-4 w-4" /> Voltar ao login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div><label className="text-sm font-medium text-foreground mb-1.5 block">Email</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="w-full pl-10 pr-4 py-2.5 bg-muted border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all" required /></div></div>
              <button type="submit" disabled={loading} className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium rounded-md transition-all disabled:opacity-50 flex items-center justify-center gap-2">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{loading ? 'Enviando...' : 'Enviar Instruções'}</button>
              <div className="text-center"><Link href="/login" className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300"><ArrowLeft className="h-4 w-4" /> Voltar ao login</Link></div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
