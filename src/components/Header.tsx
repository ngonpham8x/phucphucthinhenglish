import React, { useState } from 'react';
import { UserAccount, CenterSettings } from '../types';
import { Logo } from './Logo';
import { useLanguage } from '../context/LanguageContext';
import {
  ChevronDown,
  Search,
  Smartphone,
  Globe,
  ShieldCheck,
  UserCheck,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

interface HeaderProps {
  currentUser: UserAccount;
  settings: CenterSettings;
  onOpenLogin: () => void;
  onOpenUserManagement: () => void;
  onOpenBackupModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenPwaInstall?: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onLogout: () => void;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  settings,
  onOpenLogin,
  onOpenUserManagement,
  onOpenPwaInstall,
  searchQuery,
  setSearchQuery,
  sidebarCollapsed,
  onToggleSidebar
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="px-3 sm:px-4 py-2 flex items-center justify-between gap-2 sm:gap-3">
        {/* Brand & Logo & Mobile Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Menu Collapse/Expand Arrow Button */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 text-slate-700 hover:text-red-700 hover:bg-slate-100 rounded-xl transition-all border border-slate-200 flex items-center justify-center bg-slate-50 shadow-2xs active:scale-95"
              title={sidebarCollapsed ? "Mở menu điều hướng" : "Thu gọn menu"}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-5 h-5 text-red-700" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-red-700" />
              )}
            </button>
          )}

          <Logo size={42} />
          <div>
            <h1 className="font-black text-red-700 tracking-tight text-sm sm:text-base md:text-lg leading-tight uppercase">
              {settings.name}
            </h1>
            <p className="text-[11px] text-blue-900 font-semibold hidden sm:block">
              {settings.slogan}
            </p>
          </div>
        </div>

        {/* Center Search Bar */}
        <div className="flex-1 max-w-lg mx-2 hidden md:block">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={t('search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100/80 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <button
            type="button"
            onClick={() => setShowMobileSearch((shown) => !shown)}
            className="p-2 text-slate-600 hover:bg-slate-100 hover:text-red-700 rounded-xl transition-colors md:hidden"
            title={showMobileSearch ? 'Ẩn tìm kiếm' : 'Tìm kiếm'}
            aria-label={showMobileSearch ? 'Ẩn tìm kiếm' : 'Mở tìm kiếm'}
            aria-expanded={showMobileSearch}
            aria-controls="mobile-search"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Owner Staff Permission Button shortcut */}
          {currentUser.role === 'owner' && (
            <button
              onClick={onOpenUserManagement}
              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-amber-300 transition-colors hidden lg:flex shadow-2xs"
              title="Cấp quyền quản lý cho nhân viên trung tâm"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              <span>{t('permissions')}</span>
            </button>
          )}

          {/* User Account Dropdown Pill */}
          <div className="relative group">
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-2 pl-2 py-1 pr-2 hover:bg-slate-100 rounded-xl transition-all border border-slate-200"
              title="Chuyển đổi tài khoản / Phân quyền"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover border border-slate-200"
              />
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  {currentUser.name.replace(/\s*\(Quản [L|l]ý\)/gi, '')}
                </div>
                <div className="text-[10px] font-semibold text-red-600">
                  {currentUser.role === 'owner' ? t('owner') : t('staff')}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {showMobileSearch && (
        <div id="mobile-search" className="border-t border-slate-100 px-3 pb-2 pt-1.5 md:hidden">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              autoFocus
              type="text"
              placeholder={t('search_placeholder')}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-100/80 py-2 pl-10 pr-10 text-sm placeholder-slate-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button
              type="button"
              onClick={() => setShowMobileSearch(false)}
              className="absolute right-1.5 top-1.5 rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              title="Ẩn tìm kiếm"
              aria-label="Ẩn tìm kiếm"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
