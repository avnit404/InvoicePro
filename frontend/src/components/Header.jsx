import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, History, Plus, LogOut, ChevronDown, User } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, onNew, user, onLogout }) {
  const [showMenu, setShowMenu] = useState(false);
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-none">InvoicePro</h1>
              <p className="text-[11px] text-slate-400 font-medium leading-none mt-0.5">Professional Invoice Generator</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <TabButton active={activeTab === 'builder'} onClick={() => setActiveTab('builder')}
              icon={<FileText className="w-4 h-4" />} label="Invoice Builder" />
            <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')}
              icon={<History className="w-4 h-4" />} label="History" />
          </nav>

          {/* Right: New Invoice + User Menu */}
          <div className="flex items-center gap-3">
            <button onClick={onNew} className="btn-primary hidden sm:inline-flex">
              <Plus className="w-4 h-4" /> New Invoice
            </button>

            {/* User avatar + dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(v => !v)}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                  {user?.avatar
                    ? <img
                        src={user.avatar}
                        alt="avatar"
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full object-cover"
                        onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement.innerText = initials; }}
                      />
                    : initials}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-slate-700 leading-none">{user?.name}</p>
                  <p className="text-[10px] text-slate-400 leading-none mt-0.5 truncate max-w-28">{user?.email}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-700">{user?.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => { setShowMenu(false); onLogout(); }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>

      {/* Close dropdown on outside click */}
      {showMenu && <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />}
    </header>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all duration-150 ${
        active ? 'text-blue-700' : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      {active && (
        <motion.div
          layoutId="tab-bg"
          className="absolute inset-0 bg-white rounded-md shadow-sm"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-2">{icon}{label}</span>
    </button>
  );
}
