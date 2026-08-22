import React, { useState, useRef, useEffect } from 'react';
import { UserAccount, CenterSettings } from '../types';
import { Logo } from './Logo';
import { useLanguage } from '../context/LanguageContext';
import {
  Bell,
  Mail,
  ChevronDown,
  Search,
  Smartphone,
  CheckCheck,
  Trash2,
  Globe,
  ShieldCheck,
  UserCheck,
  X,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Menu
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

interface SystemNotification {
  id: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  type: 'info' | 'warning' | 'success';
}

interface SystemMessage {
  id: string;
  sender: string;
  avatar?: string;
  subject: string;
  content: string;
  time: string;
  read: boolean;
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

  // Dropdown states
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<SystemMessage | null>(null);

  // Chưa tích hợp hệ thống thông báo/tin nhắn thực tế: không hiển thị dữ liệu mẫu.
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [messages, setMessages] = useState<SystemMessage[]>([]);

  const unreadNotifsCount = notifications.filter(n => !n.read).length;
  const unreadMsgCount = messages.filter(m => !m.read).length;

  // Dropdown overlay refs
  const notifRef = useRef<HTMLDivElement>(null);
  const msgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (msgRef.current && !msgRef.current.contains(event.target as Node)) {
        setShowMessages(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkNotifRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllNotifsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearNotifs = () => {
    setNotifications([]);
  };

  const handleOpenMessage = (msg: SystemMessage) => {
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m));
    setSelectedMessage(msg);
    setShowMessages(false);
  };

  const handleMarkAllMsgsRead = () => {
    setMessages(prev => prev.map(m => ({ ...m, read: true })));
  };

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

          {/* Notification Bell Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowMessages(false);
              }}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title={t('notifications')}
            >
              <Bell className="w-5 h-5" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center animate-pulse">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {/* Notifications Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <Bell className="w-4 h-4 text-amber-400" />
                    <span>{t('notifications')} ({notifications.length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadNotifsCount > 0 && (
                      <button
                        onClick={handleMarkAllNotifsRead}
                        className="text-[11px] text-amber-300 hover:underline flex items-center gap-1"
                      >
                        <CheckCheck className="w-3 h-3" /> {t('mark_all_read')}
                      </button>
                    )}
                    <button
                      onClick={handleClearNotifs}
                      className="text-slate-400 hover:text-red-400"
                      title={t('clear_all')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-400">
                      {t('no_notifications')}
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleMarkNotifRead(n.id)}
                        className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-3 ${!n.read ? 'bg-red-50/40' : ''}`}
                      >
                        <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${!n.read ? 'bg-red-600' : 'bg-slate-300'}`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-bold text-slate-800">{n.title}</span>
                            <span className="text-[10px] text-slate-400">{n.time}</span>
                          </div>
                          <p className="text-slate-600 leading-relaxed text-[11px]">{n.desc}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mail / Messages Dropdown */}
          <div className="relative" ref={msgRef}>
            <button
              onClick={() => {
                setShowMessages(!showMessages);
                setShowNotifications(false);
              }}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title={t('messages')}
            >
              <Mail className="w-5 h-5" />
              {unreadMsgCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center animate-pulse">
                  {unreadMsgCount}
                </span>
              )}
            </button>

            {/* Messages Popover */}
            {showMessages && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <span>{t('messages')} ({messages.length})</span>
                  </div>
                  {unreadMsgCount > 0 && (
                    <button
                      onClick={handleMarkAllMsgsRead}
                      className="text-[11px] text-amber-300 hover:underline flex items-center gap-1"
                    >
                      <CheckCheck className="w-3 h-3" /> {t('mark_all_read')}
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {messages.length === 0 ? (
                    <div className="p-6 text-center text-slate-400">
                      {t('no_messages')}
                    </div>
                  ) : (
                    messages.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => handleOpenMessage(m)}
                        className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-3 ${!m.read ? 'bg-emerald-50/40' : ''}`}
                      >
                        <img
                          src={m.avatar}
                          alt={m.sender}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-bold text-slate-800 truncate">{m.sender}</span>
                            <span className="text-[10px] text-slate-400 flex-shrink-0">{m.time}</span>
                          </div>
                          <div className="font-semibold text-slate-700 truncate text-[11px]">{m.subject}</div>
                          <p className="text-slate-500 line-clamp-1 text-[11px] mt-0.5">{m.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

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

      {/* Message View Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setSelectedMessage(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
              <img
                src={selectedMessage.avatar}
                alt={selectedMessage.sender}
                className="w-12 h-12 rounded-full object-cover border border-slate-200"
              />
              <div>
                <div className="text-sm font-bold text-slate-900">{selectedMessage.sender}</div>
                <div className="text-xs text-slate-500">{selectedMessage.time}</div>
              </div>
            </div>

            <h3 className="font-extrabold text-slate-900 text-base mb-2">
              {selectedMessage.subject}
            </h3>

            <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-700 leading-relaxed border border-slate-200/80 mb-5">
              {selectedMessage.content}
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md">
                ✓ Đã ghi nhận thông tin
              </span>
              <button
                onClick={() => setSelectedMessage(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
