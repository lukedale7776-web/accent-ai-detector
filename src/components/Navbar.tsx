'use client';

import React, { useState } from 'react';
import {
  Mic,
  Shield,
  Sparkles,
  KeyRound,
  CheckCircle2,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Cpu,
} from 'lucide-react';
import { QuotaStatus } from '@/lib/types';
import { User } from '@/lib/auth';

interface NavbarProps {
  quota: QuotaStatus | null;
  onOpenAdmin: () => void;
  isAdmin: boolean;
  currentUser: User | null;
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  quota,
  onOpenAdmin,
  isAdmin,
  currentUser,
  onOpenAuth,
  onLogout,
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#090d16]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
                AccentAI
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                v2.5 Pro
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Acoustic Speech Dialectology &amp; Accent Studio
            </p>
          </div>
        </div>

        {/* Right Status / Actions */}
        <div className="flex items-center space-x-3">
          {/* Dual Engine Powered Badge */}
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[11px] font-medium text-indigo-300">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Dual Consensus Neural Engine</span>
          </div>

          {/* Quota Indicator */}
          {isAdmin ? (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Admin Unlimited</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                Free:{' '}
                <strong className="text-white font-semibold">
                  {quota ? quota.triesRemaining : 5}
                </strong>
                /5
              </span>
            </div>
          )}

          {/* User Account / Auth Section */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-2 p-1.5 pr-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold uppercase">
                  {currentUser.name.charAt(0)}
                </div>
                <span className="text-xs font-medium text-white max-w-[100px] truncate hidden md:inline">
                  {currentUser.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-panel p-2 shadow-2xl border border-white/10 z-50 animate-in fade-in zoom-in-95">
                  <div className="p-2.5 border-b border-white/5 mb-1">
                    <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                    <div className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {currentUser.role === 'admin' ? 'Admin Tier' : 'Account User (5 Tries/Day)'}
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onOpenAdmin();
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs text-emerald-300 hover:bg-emerald-500/10 transition-all font-semibold mb-1"
                    >
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span>Admin Analytics Dashboard</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-all font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onOpenAuth('signin')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-all"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('signup')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all"
              >
                Get Started
              </button>
            </div>
          )}

          {/* Admin Panel Button */}
          <button
            onClick={onOpenAdmin}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm ${
              isAdmin
                ? 'bg-gradient-to-r from-emerald-600/30 via-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 shadow-emerald-500/10 hover:bg-emerald-500/30'
                : 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-500/30 shadow-indigo-500/10'
            }`}
            title={isAdmin ? 'Open Admin Analytics Dashboard' : 'Unlock Admin Panel'}
          >
            {isAdmin ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Admin Panel</span>
              </>
            ) : (
              <>
                <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                <span>Admin Panel</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
