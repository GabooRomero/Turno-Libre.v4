
import React, { useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../App';
import { api } from '../../services/mockData';
import { Loader2, Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
    const { slug } = useParams<{slug: string}>();
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    
    const [formData, setFormData] = useState({ user: '', pass: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const isSuperAdmin = location.pathname === '/admin-login';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (isSuperAdmin) {
                const session = await api.superAdminLogin(formData.user, formData.pass);
                if (session) {
                    login(session);
                    navigate('/super-admin');
                } else {
                    setError('Credenciales de SuperAdmin inválidas');
                }
            } else if (slug) {
                const session = await api.login(slug, formData.user, formData.pass);
                if (session) {
                    login(session);
                    if (session.role === 'ADMIN') navigate(`/${slug}/admin/dashboard`);
                    if (session.role === 'BARBER') navigate(`/${slug}/barbero`);
                } else {
                    setError('Usuario o contraseña incorrectos');
                }
            }
        } catch (err) {
            setError('Error de conexión');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">
                <div className="text-center mb-8">
                    {isSuperAdmin ? (
                        <div className="w-16 h-16 bg-slate-900 rounded-xl mx-auto flex items-center justify-center text-white text-2xl font-bold mb-4">TL</div>
                    ) : (
                        <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto flex items-center justify-center text-blue-600 mb-4"><Lock size={32}/></div>
                    )}
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isSuperAdmin ? 'Plataforma Admin' : 'Iniciar Sesión'}
                    </h1>
                    {!isSuperAdmin && <p className="text-gray-500 text-sm mt-1">Acceso para administradores y barberos</p>}
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 flex items-center gap-2">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Usuario</label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-100 outline-none"
                                value={formData.user}
                                onChange={e => setFormData({...formData, user: e.target.value})}
                                placeholder={isSuperAdmin ? "admin" : "Usuario"}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Contraseña</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input 
                                type={showPassword ? "text" : "password"} 
                                className="w-full pl-10 pr-10 py-2 border rounded-xl focus:ring-2 focus:ring-blue-100 outline-none"
                                value={formData.pass}
                                onChange={e => setFormData({...formData, pass: e.target.value})}
                                placeholder="••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className={`w-full py-3 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 ${isSuperAdmin ? 'bg-slate-900 hover:bg-slate-800' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {isLoading ? <Loader2 className="animate-spin mx-auto"/> : 'Ingresar'}
                    </button>
                </form>

                {!isSuperAdmin && (
                    <div className="mt-8 text-center">
                        <Link to="/" className="text-xs text-gray-400 hover:text-gray-600">Volver al inicio</Link>
                    </div>
                )}
            </div>
        </div>
    );
};
