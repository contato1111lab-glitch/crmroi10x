import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Package, Activity, ScrollText, Server, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, signOut } = useAuth();
  
  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'CRM X1', path: '/crm', icon: <Users className="w-5 h-5" /> },
    { name: 'Produtos', path: '/produtos', icon: <Package className="w-5 h-5" /> },
    { name: 'Tráfego Diário', path: '/trafego', icon: <Activity className="w-5 h-5" /> },
    { name: 'Infraestrutura BMs', path: '/infraestrutura', icon: <Server className="w-5 h-5" /> },
    { name: 'Logs de Auditoria', path: '/logs', icon: <ScrollText className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 h-screen bg-[#0A0A0A] border-r border-gray-800 flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-gray-800">
        <h1 className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-gray-300 tracking-tight">CRM ROI</span>
          <span className="text-4xl font-black text-blue-500 tracking-tighter">10X</span>
        </h1>
        <p className="text-xs text-blue-400 mt-1 uppercase tracking-wider font-bold">Gestão Avançada</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
              }`
            }
          >
            {item.icon}
            <span className="font-medium text-sm">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800 space-y-2">
        <div className="flex items-center justify-between px-3 py-2 bg-[#111] border border-gray-800 rounded-lg">
          <div className="flex items-center gap-2 overflow-hidden">
            <User className="w-4 h-4 text-gray-500 shrink-0" />
            <span className="text-xs text-gray-400 font-medium truncate">
              {user?.nome}
            </span>
          </div>
          <button
            onClick={() => signOut()}
            className="text-gray-500 hover:text-red-400 transition-colors p-1"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        <div className="px-4 py-2 rounded-lg flex items-center justify-center">
          <span className="text-[10px] text-gray-600 font-mono">v1.0.0-internal</span>
        </div>
      </div>
    </aside>
  );
}
