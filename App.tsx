
import React, { useState, useEffect, useContext, createContext } from 'react';
import { HashRouter, Routes, Route, useParams, Navigate, Outlet, useNavigate, Link } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { BookingFlow, BookingSuccess } from './pages/Shop/Booking';
import { ShopPublic } from './pages/Shop/ShopPublic';
import { Dashboard } from './pages/Shop/Admin/Dashboard';
import { Agenda, Settings, Barbers, Services, Inventory, Receptions } from './pages/Shop/Admin/AdminPages';
import { ClientsList, ClientDetail, Memberships } from './pages/Shop/Admin/ClientManagement';
import { Login } from './pages/Auth/Login';
import { SuperDashboard } from './pages/SuperAdmin/SuperDashboard';
import { BarberDashboard } from './pages/Shop/Barber/BarberDashboard';
import { ShopAdminLayout } from './components/ui/Layouts';
import { api } from './services/mockData';
import { Shop, UserSession } from './types';
import { Loader2, Wrench } from 'lucide-react';

// --- AUTH CONTEXT ---
interface AuthContextType {
  session: UserSession | null;
  login: (session: UserSession) => void;
  logout: () => void;
}
const AuthContext = createContext<AuthContextType>({ session: null, login: () => {}, logout: () => {} });
export const useAuth = () => useContext(AuthContext);

const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [session, setSession] = useState<UserSession | null>(() => {
        const saved = localStorage.getItem('turnolibre_session');
        return saved ? JSON.parse(saved) : null;
    });

    const login = (sess: UserSession) => {
        setSession(sess);
        localStorage.setItem('turnolibre_session', JSON.stringify(sess));
    };

    const logout = () => {
        setSession(null);
        localStorage.removeItem('turnolibre_session');
    };

    return <AuthContext.Provider value={{ session, login, logout }}>{children}</AuthContext.Provider>;
};

// --- GUARDS ---
const ProtectedRoute = ({ allowedRoles }: { allowedRoles: string[] }) => {
    const { session } = useAuth();
    const { slug } = useParams<{slug: string}>();
    
    if (!session) return <Navigate to={slug ? `/${slug}/login` : '/admin-login'} replace />;
    
    if (!allowedRoles.includes(session.role)) return <Navigate to="/" replace />;
    
    // Check Tenant Context (Admin of Shop A cannot access Shop B)
    if (session.role === 'ADMIN' && slug && session.shopSlug !== slug) {
        return <Navigate to={`/${session.shopSlug}/admin/dashboard`} replace />;
    }

    return <Outlet />;
};

// --- ROUTES ---

const ShopProfileRoute = () => {
    const { slug } = useParams<{ slug: string }>();
    const [shop, setShop] = useState<Shop | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            if(slug) {
                const data = await api.getShopBySlug(slug);
                setShop(data || null);
            }
            setLoading(false);
        };
        load();
    }, [slug]);

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin"/></div>;
    if (!shop) return <Navigate to="/" />;
    return <ShopPublic shop={shop} />;
};

const ShopAdminRoute = () => {
     const { slug } = useParams<{ slug: string }>();
     const { logout } = useAuth();
     const [shop, setShop] = useState<Shop | null>(null);
     const [loading, setLoading] = useState(true);
     const navigate = useNavigate();

     useEffect(() => {
        const load = async () => {
            if(slug) {
                const data = await api.getShopBySlug(slug);
                setShop(data || null);
            }
            setLoading(false);
        };
        load();
    }, [slug]);

     const handleShopUpdate = (updatedShop: Shop) => {
         setShop(updatedShop);
     };

     const handleLogout = () => {
         logout();
         navigate(`/${slug}/login`);
     };

     if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin"/></div>;
     if (!shop) return <Navigate to="/" />;

     return (
         <ShopAdminLayout shop={shop} onLogout={handleLogout}>
             <Routes>
                 <Route path="dashboard" element={<Dashboard shop={shop} onUpdate={handleShopUpdate} />} />
                 <Route path="agenda" element={<Agenda shop={shop} onUpdate={handleShopUpdate} />} />
                 <Route path="clientes" element={<ClientsList shop={shop} onUpdate={handleShopUpdate} />} />
                 <Route path="clientes/:clientId" element={<ClientDetail shop={shop} onUpdate={handleShopUpdate} />} />
                 <Route path="membresias" element={<Memberships shop={shop} onUpdate={handleShopUpdate} />} />
                 <Route path="configuracion" element={<Settings shop={shop} onUpdate={handleShopUpdate} />} />
                 <Route path="barberos" element={<Barbers shop={shop} onUpdate={handleShopUpdate} />} />
                 <Route path="servicios" element={<Services shop={shop} onUpdate={handleShopUpdate} />} />
                 <Route path="insumos" element={<Inventory shop={shop} onUpdate={handleShopUpdate} />} />
                 <Route path="recepciones" element={<Receptions shop={shop} onUpdate={handleShopUpdate} />} />
                 <Route path="*" element={<Navigate to="dashboard" replace />} />
             </Routes>
         </ShopAdminLayout>
     );
};

const DevToolbar = () => {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-white py-2 px-4 flex items-center justify-center gap-4 text-xs z-[9999] opacity-90 hover:opacity-100 transition-opacity border-t border-slate-700 shadow-2xl">
            <div className="flex items-center gap-2 font-bold text-slate-400">
                <Wrench size={12} /> DEV TOOLS:
            </div>
            <Link to="/" className="hover:text-blue-300 transition-colors">Home Pública</Link>
            <span className="text-slate-700">|</span>
            <Link to="/admin-login" className="hover:text-blue-300 transition-colors">Login SuperAdmin</Link>
            <span className="text-slate-700">|</span>
            <Link to="/barberia-urbana" className="hover:text-blue-300 transition-colors">Perfil Tienda</Link>
            <span className="text-slate-700">|</span>
            <Link to="/barberia-urbana/login" className="hover:text-blue-300 transition-colors">Login Tienda</Link>
        </div>
    );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            
            {/* SUPER ADMIN (Protected) */}
            <Route path="/admin-login" element={<Login />} />
            <Route element={<ProtectedRoute allowedRoles={['SUPERADMIN']} />}>
                <Route path="/super-admin" element={<SuperDashboard />} />
            </Route>

            {/* SHOP ROUTES */}
            <Route path="/:slug" element={<ShopProfileRoute />} />
            <Route path="/:slug/reserva" element={<BookingFlow />} />
            <Route path="/:slug/reserva/confirmacion" element={<BookingSuccess />} />
            <Route path="/:slug/login" element={<Login />} />

            {/* SHOP ADMIN (Protected) */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="/:slug/admin/*" element={<ShopAdminRoute />} />
            </Route>
            
            {/* BARBER PANEL (Protected) */}
             <Route element={<ProtectedRoute allowedRoles={['BARBER']} />}>
                <Route path="/:slug/barbero" element={<BarberDashboard />} />
            </Route>
          </Routes>
          
          <DevToolbar />
        </HashRouter>
    </AuthProvider>
  );
};

export default App;
