import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  PieChart, 
  Calendar, 
  History, 
  Briefcase, 
  Package, 
  Users, 
  User, 
  Store, 
  TrendingUp, 
  TrendingDown, 
  LineChart, 
  BarChart3, 
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function AdminLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navCategories = [
    {
      items: [
        { to: '/estabelecimento/dashboard', icon: PieChart, label: 'Dashboard' },
        { to: '/estabelecimento/agenda', icon: Calendar, label: 'Agenda' },
        { to: '/estabelecimento/historico', icon: History, label: 'Histórico' },
      ]
    },
    {
      title: 'GERENCIAMENTO',
      items: [
        { to: '/estabelecimento/servicos', icon: Briefcase, label: 'Serviços' },
        { to: '/estabelecimento/profissionais', icon: Users, label: 'Profissionais' },
        { to: '/estabelecimento/clientes', icon: User, label: 'Clientes' },
        { to: '/estabelecimento/config-estabelecimento', icon: Store, label: 'Config. Estabelecimento' },
      ]
    },
    {
      title: 'FINANCEIRO',
      items: [
        { to: '/estabelecimento/receitas', icon: TrendingUp, label: 'Receitas' },
        { to: '/estabelecimento/despesas', icon: TrendingDown, label: 'Despesas' },
        { to: '/estabelecimento/receita-vs-despesa', icon: LineChart, label: 'Receita vs Despesa' },
        { to: '/estabelecimento/relatorios', icon: BarChart3, label: 'Relatórios' },
      ]
    },
    {
      title: 'OUTROS',
      items: [
        { to: '/estabelecimento/config', icon: Settings, label: 'Configurações' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-gray-200 bg-white transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        } hidden lg:flex`}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
          {!isCollapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <Store className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-gray-900 truncate">AgendaAi</span>
            </div>
          )}
          {isCollapsed && (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Store className="h-5 w-5" />
            </div>
          )}
          
          {/* Toggle Button */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm hover:text-indigo-600 transition-transform ${isCollapsed ? '' : 'rotate-0'}`}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 space-y-6 p-4 ${isCollapsed ? 'overflow-visible' : 'overflow-y-auto'} [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}>
          {navCategories.map((category, idx) => (
            <div key={idx} className="space-y-1">
              {category.title && !isCollapsed && (
                <h3 className="px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  {category.title}
                </h3>
              )}
              {category.title && isCollapsed && (
                <div className="h-px bg-gray-100 my-4 mx-2" />
              )}
              
              <div className="space-y-1">
                {category.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      } ${isCollapsed ? 'justify-center px-0' : ''}`
                    }
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                    
                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-4 hidden group-hover:block z-[100]">
                        <div className="relative flex items-center">
                          <div className="absolute -left-1 h-2 w-2 rotate-45 bg-slate-900"></div>
                          <div className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-xl whitespace-nowrap">
                            {item.label}
                          </div>
                        </div>
                      </div>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-8">
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Pesquisar..." 
                className="h-9 w-64 rounded-full bg-gray-50 pl-10 pr-4 text-sm outline-none focus:ring-1 focus:ring-indigo-600 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative rounded-full p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
            </button>
            
            <div className="h-8 w-px bg-gray-200 mx-2"></div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900">{user?.nome}</p>
                <p className="text-xs text-gray-500">Administrador</p>
              </div>
              <div className="group relative">
                <button className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-bold hover:ring-2 hover:ring-indigo-600 hover:ring-offset-2 transition-all">
                  {user?.nome?.charAt(0) || 'A'}
                </button>
                
                {/* Dropdown Menu (Simplified) */}
                <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none hidden group-hover:block z-50">
                  <button 
                    onClick={() => navigate('/estabelecimento/config-estabelecimento')}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Meu Perfil
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

