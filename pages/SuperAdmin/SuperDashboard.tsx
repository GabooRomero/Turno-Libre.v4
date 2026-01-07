
import React, { useState, useEffect } from 'react';
import { api } from '../../services/mockData';
import { Shop } from '../../types';
import { useAuth } from '../../App';
import { useNavigate } from 'react-router-dom';
import { Plus, Power, LogOut, ExternalLink, Loader2, Store, MapPin, Check, Copy, Shield, Package, X, Edit2, RotateCcw, AlertTriangle, Cloud, CloudOff, RefreshCw, Globe, Key, User, Zap, Star, Crown, MessageCircle, CreditCard, LayoutGrid, Coffee } from 'lucide-react';

export const SuperDashboard: React.FC = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [cloudStatus, setCloudStatus] = useState<'checking' | 'online' | 'offline'>('checking');
    
    // Configuración de Marca
    const MAIN_DOMAIN = "turno-libre.com";
    
    // UI States
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [toggleModal, setToggleModal] = useState<{show: boolean, shop: Shop | null}>({ show: false, shop: null });
    const [createdShopCreds, setCreatedShopCreds] = useState<{url: string, user: string, pass: string} | null>(null);

    const [formData, setFormData] = useState({
        name: '', slug: '', customDomain: '', adminUser: '', adminPassword: '', province: '', city: '', address: '', phone: '', plan: 'FREE' as 'FREE' | 'BASIC' | 'PRO'
    });
    const [editingShop, setEditingShop] = useState<Shop | null>(null);

    const checkHealth = async () => {
        setCloudStatus('checking');
        const isOnline = await api.checkConnection();
        setCloudStatus(isOnline ? 'online' : 'offline');
    };

    const generateRandomPass = () => Math.random().toString(36).slice(-8);

    useEffect(() => {
        loadShops();
        checkHealth();
    }, []);

    const loadShops = async () => {
        setLoading(true);
        try {
            const data = await api.getAllShops();
            setShops(data);
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        setFormData({ 
            ...formData, 
            name, 
            slug,
            adminUser: name ? `admin-${slug}` : '',
            adminPassword: name && !formData.adminPassword ? generateRandomPass() : formData.adminPassword
        });
    };

    const handleCreate = async () => {
        if (!formData.name || !formData.slug || !formData.adminUser || !formData.adminPassword) return;
        setIsCreating(true);
        try {
            const features = {
                mercadoPago: formData.plan === 'PRO',
                mercadoPagoToken: '',
                whatsapp: formData.plan !== 'FREE',
                multiBranch: formData.plan === 'PRO',
                memberships: formData.plan !== 'FREE',
                inventory: formData.plan !== 'FREE',
                receptions: formData.plan !== 'FREE'
            };

            const newShopPayload: Partial<Shop> = {
                ...formData,
                features: features as any,
                active: true 
            };

            await api.createShop(newShopPayload);
            
            const loginUrl = formData.customDomain 
                ? `https://${formData.customDomain}/#/login`
                : `https://${MAIN_DOMAIN}/#/${formData.slug}/login`;

            setCreatedShopCreds({ url: loginUrl, user: formData.adminUser, pass: formData.adminPassword });
            setShowCreateModal(false);
            setShowSuccessModal(true);
            loadShops();
            setFormData({ name: '', slug: '', customDomain: '', adminUser: '', adminPassword: '', province: '', city: '', address: '', phone: '', plan: 'FREE' });
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsCreating(false);
        }
    };

    const handleUpdateShop = async () => {
        if (!editingShop) return;
        try {
            let features = { ...editingShop.features };
            if (editingShop.plan === 'FREE') {
                features = { ...features, mercadoPago: false, multiBranch: false, whatsapp: false, memberships: false, inventory: false, receptions: false };
            } else if (editingShop.plan === 'BASIC') {
                features = { ...features, mercadoPago: false, multiBranch: false, whatsapp: true, memberships: true, inventory: true, receptions: true };
            } else if (editingShop.plan === 'PRO') {
                features = { ...features, mercadoPago: true, multiBranch: true, whatsapp: true, memberships: true, inventory: true, receptions: true };
            }

            await api.saveShop({ ...editingShop, features });
            setShowEditModal(false);
            setEditingShop(null);
            loadShops();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const planOptions = [
        { 
            id: 'FREE', 
            name: 'Plan Free', 
            icon: Zap, 
            color: 'text-gray-500', 
            bgColor: 'bg-gray-100',
            border: 'border-gray-200',
            features: ['Agenda Básica', 'Perfil Público', 'Clientes Ilimitados']
        },
        { 
            id: 'BASIC', 
            name: 'Plan Basic', 
            icon: Star, 
            color: 'text-blue-600', 
            bgColor: 'bg-blue-50',
            border: 'border-blue-200',
            features: ['Notif. WhatsApp', 'Membresías/Bonos', 'Stock Insumos', 'Recepciones']
        },
        { 
            id: 'PRO', 
            name: 'Plan Pro', 
            icon: Crown, 
            color: 'text-purple-600', 
            bgColor: 'bg-purple-50',
            border: 'border-purple-200',
            features: ['Cobros MercadoPago', 'Multi-sucursales', 'Estadísticas Avanzadas']
        }
    ];

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center font-bold text-white shadow">TL</div>
                        <h1 className="text-xl font-bold">SuperAdmin <span className="text-slate-500 text-sm font-normal hidden md:inline">| {MAIN_DOMAIN}</span></h1>
                        
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                            cloudStatus === 'online' ? 'bg-green-500/20 text-green-400' : 
                            cloudStatus === 'offline' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'
                        }`}>
                            {cloudStatus === 'online' ? <Cloud size={12}/> : <CloudOff size={12}/>}
                            {cloudStatus === 'online' ? 'Cloud Online' : cloudStatus === 'offline' ? 'Cloud Pausado' : 'Chequeando...'}
                            <button onClick={checkHealth} className="ml-1 hover:rotate-180 transition-transform"><RefreshCw size={10}/></button>
                        </div>
                    </div>
                    <button onClick={logout} className="flex items-center gap-2 text-sm text-slate-300 hover:text-white bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700"><LogOut size={16} /> Salir</button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Tiendas Activas</h2>
                        <p className="text-sm text-gray-500">{shops.length} barberías registradas en la plataforma</p>
                    </div>
                    <button onClick={() => { setFormData({ name: '', slug: '', customDomain: '', adminUser: '', adminPassword: '', province: '', city: '', address: '', phone: '', plan: 'FREE' }); setShowCreateModal(true); }} className="bg-blue-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg transition-all transform hover:-translate-y-0.5"><Plus size={20} /> Nueva Barbería</button>
                </div>

                {loading ? <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-blue-600" size={40}/></div> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {shops.map(shop => {
                            const shopUrl = shop.customDomain 
                                ? `https://${shop.customDomain}` 
                                : `https://${MAIN_DOMAIN}/#/${shop.slug}`;

                            return (
                                <div key={shop.id} className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md transition-all relative ${!shop.active ? 'opacity-75 grayscale' : ''}`}>
                                    <div className={`h-1.5 w-full ${shop.plan === 'PRO' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : shop.plan === 'BASIC' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 border"><Store size={24}/></div>
                                                <div>
                                                    <h3 className="font-bold text-lg text-gray-900 leading-tight truncate w-32">{shop.name}</h3>
                                                    <div className="flex items-center gap-1 text-xs text-gray-500"><MapPin size={10} /> {shop.city || 'S/D'}</div>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${shop.plan === 'PRO' ? 'bg-purple-100 text-purple-700' : shop.plan === 'BASIC' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{shop.plan}</span>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3 space-y-2 mb-6 border border-gray-100">
                                            <div className="flex justify-between text-xs"><span className="text-gray-500">Ruta:</span><span className="font-mono font-bold text-gray-700 truncate ml-2">/{shop.slug}</span></div>
                                            {shop.customDomain && (
                                                <div className="flex justify-between text-xs items-center text-blue-600"><span className="text-gray-500">Dominio:</span><span className="font-bold flex items-center gap-1 ml-2"><Globe size={10}/> {shop.customDomain}</span></div>
                                            )}
                                            <div className="flex justify-between text-xs"><span className="text-gray-500">Admin:</span><span className="font-mono text-blue-600 ml-2">{shop.adminUser}</span></div>
                                        </div>
                                        <div className="flex gap-2">
                                            <a href={`${shopUrl}/login`} target="_blank" rel="noopener noreferrer" className="flex-1 bg-white hover:bg-gray-50 text-gray-700 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border border-gray-200 transition-colors"><ExternalLink size={14} /> Login</a>
                                            <button onClick={() => { setEditingShop(shop); setShowEditModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg border transition-colors"><Edit2 size={18} /></button>
                                            <button onClick={() => setToggleModal({ show: true, shop })} className={`p-2 rounded-lg border transition-colors ${shop.active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}><Power size={18} /></button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* CREATE / EDIT MODAL */}
            {(showCreateModal || (showEditModal && editingShop)) && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="text-xl font-bold text-gray-900">{showEditModal ? 'Editar Barbería' : 'Nueva Barbería'}</h3>
                            <button onClick={() => { setShowCreateModal(false); setShowEditModal(false); }} className="p-2 hover:bg-gray-200 rounded-full"><X size={20} className="text-gray-500"/></button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* SECCIÓN 1: DATOS TIENDA */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">Nombre Comercial</label>
                                    <input 
                                        className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-100" 
                                        placeholder="Ej: Barbería Urbana" 
                                        value={showEditModal ? editingShop?.name : formData.name} 
                                        onChange={e => showEditModal ? setEditingShop({...editingShop!, name: e.target.value}) : handleNameChange(e)} 
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">URL Slug (Identificador)</label>
                                    <div className="flex items-center"><span className="bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg p-2.5 text-gray-500 text-sm">/</span><input className="w-full border border-gray-300 rounded-r-lg p-2.5 font-mono text-sm bg-gray-50" value={showEditModal ? editingShop?.slug : formData.slug} readOnly /></div>
                                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">Base: {MAIN_DOMAIN}/#/</p>
                                </div>
                                <div className="col-span-1">
                                    <label className="text-xs font-bold text-gray-500 mb-1 block flex items-center gap-1"><Globe size={12}/> Dominio Personalizado</label>
                                    <input 
                                        className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-100 font-bold text-blue-600" 
                                        placeholder="ejemplo.com.ar" 
                                        value={showEditModal ? editingShop?.customDomain : formData.customDomain} 
                                        onChange={e => showEditModal ? setEditingShop({...editingShop!, customDomain: e.target.value}) : setFormData({...formData, customDomain: e.target.value})} 
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">Opcional: Si el cliente compró su propio dominio.</p>
                                </div>
                            </div>

                            {/* SECCIÓN 2: CREDENCIALES ACCESO */}
                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-4">
                                <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest flex items-center gap-2"><Shield size={14}/> Credenciales de Administrador</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase">Usuario Admin</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-2.5 text-blue-400" size={16} />
                                            <input 
                                                className="w-full border border-gray-300 rounded-lg p-2.5 pl-10 outline-none focus:ring-2 focus:ring-blue-100 font-mono text-sm bg-white" 
                                                value={showEditModal ? editingShop?.adminUser : formData.adminUser} 
                                                onChange={e => showEditModal ? setEditingShop({...editingShop!, adminUser: e.target.value}) : setFormData({...formData, adminUser: e.target.value})} 
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase">Contraseña</label>
                                        <div className="relative">
                                            <Key className="absolute left-3 top-2.5 text-blue-400" size={16} />
                                            <input 
                                                className="w-full border border-gray-300 rounded-lg p-2.5 pl-10 pr-10 outline-none focus:ring-2 focus:ring-blue-100 font-mono text-sm bg-white" 
                                                value={showEditModal ? editingShop?.adminPassword : formData.adminPassword} 
                                                onChange={e => showEditModal ? setEditingShop({...editingShop!, adminPassword: e.target.value}) : setFormData({...formData, adminPassword: e.target.value})} 
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    const newPass = generateRandomPass();
                                                    showEditModal ? setEditingShop({...editingShop!, adminPassword: newPass}) : setFormData({...formData, adminPassword: newPass});
                                                }}
                                                className="absolute right-3 top-2.5 text-gray-300 hover:text-blue-500 transition-colors"
                                            >
                                                <RotateCcw size={16}/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SECCIÓN 3: SELECCIÓN DE PLAN (DETALLADO) */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-3 block uppercase tracking-widest">Nivel de Suscripción</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {planOptions.map(plan => {
                                        const isSelected = (showEditModal ? editingShop?.plan : formData.plan) === plan.id;
                                        return (
                                            <div 
                                                key={plan.id} 
                                                onClick={() => showEditModal ? setEditingShop({...editingShop!, plan: plan.id as any}) : setFormData({...formData, plan: plan.id as any})} 
                                                className={`cursor-pointer rounded-2xl border-2 p-5 transition-all relative flex flex-col h-full ${isSelected ? 'border-blue-600 bg-blue-50/30 ring-4 ring-blue-600/5' : 'border-gray-100 bg-white hover:border-gray-300'}`}
                                            >
                                                <div className="flex justify-between items-center mb-3">
                                                    <div className={`p-2 rounded-lg ${plan.bgColor}`}>
                                                        <plan.icon size={20} className={plan.color} />
                                                    </div>
                                                    {isSelected && <Check size={18} className="text-blue-600 bg-blue-100 rounded-full p-0.5"/>}
                                                </div>
                                                <h4 className="font-bold text-gray-900 mb-1">{plan.name}</h4>
                                                <div className="space-y-2 mt-2 flex-grow">
                                                    {plan.features.map((feat, i) => (
                                                        <div key={i} className="flex items-center gap-2 text-[11px] text-gray-600">
                                                            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                                                            {feat}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t bg-gray-50 flex gap-4">
                            <button onClick={() => { setShowCreateModal(false); setShowEditModal(false); }} className="flex-1 py-3 bg-white border font-bold text-gray-700 rounded-xl hover:bg-gray-100 transition-colors">Cancelar</button>
                            <button 
                                onClick={showEditModal ? handleUpdateShop : handleCreate} 
                                disabled={isCreating} 
                                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all transform active:scale-95"
                            >
                                {isCreating ? <Loader2 className="animate-spin" size={20}/> : showEditModal ? 'Guardar Cambios' : 'Crear Entorno'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SUCCESS MODAL */}
            {showSuccessModal && createdShopCreds && (
                <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                     <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-0 overflow-hidden animate-in zoom-in duration-300">
                        <div className="bg-green-600 p-6 text-center text-white"><h3 className="text-2xl font-bold">¡Barbería Lista!</h3></div>
                        <div className="p-6 space-y-4">
                            <div className="bg-gray-50 p-3 rounded-lg border group relative">
                                <span className="text-[10px] font-bold text-gray-400 block uppercase">URL de Acceso Profesional</span>
                                <span className="font-mono text-blue-600 text-xs truncate block pr-8">{createdShopCreds.url}</span>
                                <button onClick={() => { navigator.clipboard.writeText(createdShopCreds.url); alert('Copiado'); }} className="absolute right-3 top-3 text-gray-300 hover:text-blue-600"><Copy size={16}/></button>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg border group relative">
                                <span className="text-[10px] font-bold text-gray-400 block uppercase">Usuario Admin</span>
                                <span className="font-mono text-gray-800 text-xs">{createdShopCreds.user}</span>
                                <button onClick={() => { navigator.clipboard.writeText(createdShopCreds.user); alert('Copiado'); }} className="absolute right-3 top-3 text-gray-300 hover:text-blue-600"><Copy size={16}/></button>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg border group relative">
                                <span className="text-[10px] font-bold text-gray-400 block uppercase">Contraseña</span>
                                <span className="font-mono text-gray-800 text-xs">{createdShopCreds.pass}</span>
                                <button onClick={() => { navigator.clipboard.writeText(createdShopCreds.pass); alert('Copiado'); }} className="absolute right-3 top-3 text-gray-300 hover:text-blue-600"><Copy size={16}/></button>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 border-t">
                            <button onClick={() => setShowSuccessModal(false)} className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-colors">Volver al Panel</button>
                        </div>
                     </div>
                </div>
            )}
        </div>
    );
};
