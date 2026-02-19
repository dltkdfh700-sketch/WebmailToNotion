import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Tags, Settings, FileText, Mail, X } from 'lucide-react';

const navItems = [
  { to: '/', label: '대시보드', icon: LayoutDashboard },
  { to: '/categories', label: '카테고리', icon: Tags },
  { to: '/settings', label: '설정', icon: Settings },
  { to: '/logs', label: '처리 로그', icon: FileText },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 text-white
          transition-transform duration-200 ease-in-out
          lg:static lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo / Title */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Mail className="h-6 w-6 text-blue-400" />
            <span className="text-lg font-bold tracking-tight">Mail to Notion</span>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-slate-700 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-700 px-6 py-4">
          <p className="text-xs text-slate-500">Mail-to-Notion Organizer</p>
          <p className="text-xs text-slate-600">v1.0.0</p>
        </div>
      </aside>
    </>
  );
}
