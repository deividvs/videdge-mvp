'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Lightbulb, FileText, Kanban, FolderKanban, Settings, LogOut, Zap, Menu, X, TrendingUp, Bookmark, Workflow } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/market-intelligence', label: 'Market Intelligence', icon: TrendingUp },
  { href: '/opportunities', label: 'Oportunidades', icon: Bookmark },
  { href: '/ideas', label: 'Video Ideas', icon: Lightbulb },
  { href: '/scripts', label: 'Scripts', icon: FileText },
  { href: '/board', label: 'Production Board', icon: Kanban },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/content-pipeline', label: 'Esteira de Conteúdo', icon: Workflow },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname() ?? '';
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-card rounded-md border border-border"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-purple-500" />
            <span className="text-xl font-display font-bold bg-gradient-to-r from-purple-500 via-blue-500 to-emerald-500 bg-clip-text text-transparent">
              VidEdge
            </span>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems?.map?.((item: any) => {
            const isActive = pathname === item?.href || pathname?.startsWith?.(`${item?.href}/`);
            const Icon = item?.icon;
            return (
              <Link
                key={item?.href}
                href={item?.href ?? '/dashboard'}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all',
                  isActive
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {Icon ? <Icon className="h-4 w-4" /> : null}
                {item?.label ?? ''}
              </Link>
            );
          }) ?? []}
        </nav>

        <div className="p-3 border-t border-border">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
