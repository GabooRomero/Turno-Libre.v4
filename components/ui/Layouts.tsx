
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shop } from '../../types';
import { Home, Calendar, Users, Settings, LogOut, Scissors, Package, LayoutDashboard, Menu, X, CreditCard, UserCircle, Coffee } from 'lucide-react';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => (
  <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
           <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold">T</div>
           <span className="text-xl font-bold text-slate-900">TurnoLibre</span>
        </Link>
        <div className="text-sm text-gray-500">
            Plataforma SaaS para Barberías
        </div>
      </div>
    </header>
    <main className="pb-10">
      {children}
    </main>
    <footer className="bg-slate-900 text-slate-400 py-8 mt-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
            <p>&copy; {new Date().getFullYear()} TurnoLibre. Todos los derechos reservados.</p>
        </div>
    </footer>
  </div>
);

interface ShopAdminLayoutProps {
  children: React.ReactNode;
  shop: Shop;
  onLogout: () => void;
}

export const ShopAdminLayout: React.FC<ShopAdminLayoutProps> = ({ children, shop, onLogout }) => {
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = React.useState(false);

  // Dynamically build nav items based on enabled features
  const navItems = [
    { path: `/${shop.slug}/admin/dashboard`, icon: LayoutDashboard, label: 'Dashboard' },
    { path: `/${shop.slug}/admin/agenda`, icon: Calendar, label: 'Agenda' },
    { path: `/${shop.slug}/admin/clientes`, icon: UserCircle, label: 'Clientes' },
    { path: `/${shop.slug}/admin/barberos`, icon: Users, label: 'Barberos' },
    { path: `/${shop.slug}/admin/servicios`, icon: Scissors, label: 'Servicios' },
    // Modular Features
    ...(shop.features.memberships ? [{ path: `/${shop.slug}/admin/membresias`, icon: CreditCard, label: 'Membresías' }] : []),
    ...(shop.features.inventory ? [{ path: `/${shop.slug}/admin/insumos`, icon: Package, label: 'Insumos' }] : []),
    ...(shop.features.receptions ? [{ path: `/${shop.slug}/admin/recepciones`, icon: Coffee, label: 'Recepciones' }] : []),
    
    { path: `/${shop.slug}/admin/configuracion`, icon: Settings, label: 'Configuración' },
  ];

  const isActive = (path: string) => location.pathname.includes(path);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Mobile Sidebar Toggle */}
      <button 
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded shadow"
        onClick={() => setSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X /> : <Menu />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b flex items-center gap-3">
             <img src={shop.logo} alt={shop.name} className="w-10 h-10 rounded-full object-cover" />
             <div>
                 <h2 className="font-bold text-gray-800 text-sm leading-tight">{shop.name}</h2>
                 <span className="text-xs text-gray-500 uppercase">Panel Admin</span>
             </div>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? `bg-gray-100 text-[${shop.themeColor}]`
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                style={isActive(item.path) ? { color: shop.themeColor, backgroundColor: `${shop.themeColor}15` } : {}}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t">
            <button
              onClick={onLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
            >
              <LogOut size={20} />
              Cerrar Sesión
            </button>
            <Link to={`/${shop.slug}`} className="mt-2 text-xs text-center block text-gray-400 hover:underline">
                Ver perfil público
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
            {children}
        </main>
      </div>
      
      {/* Overlay for mobile */}
      {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
      )}
    </div>
  );
};
