'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, BookOpen, Activity, Flame, ShieldCheck, Sparkles, Terminal } from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Today', icon: Compass },
    { href: '/session', label: 'Session', icon: Sparkles },
    { href: '/map', label: 'Skill Map', icon: BookOpen },
    { href: '/lab', label: 'Robotics Lab', icon: Terminal },
    { href: '/insights', label: 'Insights', icon: Activity },
    { href: '/demo', label: 'Phase 0 Demo', icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#090a0f]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold tracking-wider bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-400 bg-clip-text text-transparent">
              SAVANT
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
              v1.0
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-sky-400 border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1 text-amber-400 bg-amber-950/40 border border-amber-900/50 px-2.5 py-1 rounded-full">
            <Flame className="w-3.5 h-3.5" />
            <span className="font-semibold">5 / 7 days</span>
          </div>

          <div className="hidden sm:flex items-center space-x-1 text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Gemini 3.8 Flash</span>
          </div>
        </div>
      </div>
    </header>
  );
};
