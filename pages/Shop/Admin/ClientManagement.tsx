
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shop, Client, MembershipPlan, Booking, ClientMembership } from '../../../types';
import { api } from '../../../services/mockData';
import { 
    Search, Plus, User, Phone, Calendar, ArrowLeft, Star, Clock, 
    CreditCard, Check, AlertCircle, Edit2, Trash2, Download, Filter, Mail, X, Save, Ban, History, AlertTriangle, Power, Lock
} from 'lucide-react';

interface AdminPageProps {
  shop: Shop;
  onUpdate: (shop: Shop) => void;
}

// --- SHARED COMPONENTS ---
const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger', themeColor?: string }> = 
    ({ children, variant = 'primary', themeColor, className = '', ...props }) => {
    const baseStyle = "px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed";
    let variantStyle = "";
    const style: React.CSSProperties = {};
    switch (variant) {
        case 'primary': style.backgroundColor = themeColor || '#000'; style.color = '#fff'; break;
        case 'secondary': variantStyle = "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"; break;
        case 'danger': variantStyle = "bg-red-50 text-red-600 hover:bg-red-100"; break;
    }
    return <button className={`${baseStyle} ${variantStyle} ${className}`} style={style} {...props}>{children}</button>;
};

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm" {...props} />
);

interface ToastProps { message: string; type: 'success' | 'error'; show: boolean; onClose: () => void; }
const Toast: React.FC<ToastProps> = ({ message, type, show, onClose }) => {
    useEffect(() => { if (show) { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); } }, [show, onClose]);
    if (!show) return null;
    return (
        <div className={`fixed bottom-6 right-6 z-[100] px-6 py-4 rounded-xl shadow-lg border flex items-center gap-3 animate-fade-in ${type === 'success' ? 'bg-white border-green-200 text-green-800' : 'bg-white border-red-200 text-red-800'}`}>
            <div className={`p-1 rounded-full ${type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>{type === 'success' ? <Check size={16} className="text-green-600" /> : <AlertCircle size={16} className="text-red-600" />}</div>
            <span className="font-medium text-sm">{message}</span>
            <button onClick={onClose}><X size={14} className="text-gray-400" /></button>
        </div>
    );
};

// FEATURE GATE COMPONENT
const FeatureGate: React.FC<{title: string, message: string}> = ({title, message}) => (
    <div className="h-[50vh] flex flex-col items-center justify-center text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 mb-4">
            <Lock size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">{title}</h2>
        <p className="text-gray-500 max-w-md">{message}</p>
        <div className="mt-6 px-4 py-2 bg-yellow-50 text-yellow-800 rounded-lg text-sm font-bold border border-yellow-100">
            Requiere Plan Superior
        </div>
    </div>
);


// --- HELPER ---
const formatPhone = (phone: string): string => {
    const clean = phone.replace(/\D/g, ''); // Remove non-digits
    if (clean.startsWith('549')) return '+' + clean;
    return '+549' + clean;
};

// --- CLIENT LIST COMPONENT ---
export const ClientsList: React.FC<AdminPageProps> = ({ shop, onUpdate }) => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [clients, setClients] = useState<Client[]>(shop.clients || []);
    const [selectedClients, setSelectedClients] = useState<string[]>([]);
    const [toast, setToast] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({ show: false, message: '', type: 'success' });
    
    // Filters
    const [filterType, setFilterType] = useState<'ALL' | 'REGULAR' | 'EXPRESS'>('ALL');
    const [filterMembership, setFilterMembership] = useState<'ALL' | 'WITH' | 'WITHOUT'>('ALL');
    const [filterDateStart, setFilterDateStart] = useState('');
    const [filterDateEnd, setFilterDateEnd] = useState('');
    
    // Modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newClientData, setNewClientData] = useState({ firstName: '', lastName: '', phone: '', notes: '', type: 'REGULAR', planId: '' });
    const [isSaving, setIsSaving] = useState(false);

    // Sync
    useEffect(() => { setClients(shop.clients || []); }, [shop.clients]);

    // Refresh
    useEffect(() => {
        api.getShopBySlug(shop.slug).then(data => { if(data) onUpdate(data); });
    }, []);

    const filteredClients = clients.filter(c => {
        const matchesSearch = c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || c.lastName.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm);
        const matchesType = filterType === 'ALL' || c.type === filterType;
        const matchesMem = filterMembership === 'ALL' || (filterMembership === 'WITH' ? !!c.activeMembership : !c.activeMembership);
        
        let matchesDate = true;
        if (filterDateStart && c.lastVisit) matchesDate = matchesDate && c.lastVisit >= filterDateStart;
        if (filterDateEnd && c.lastVisit) matchesDate = matchesDate && c.lastVisit <= filterDateEnd;
        if ((filterDateStart || filterDateEnd) && !c.lastVisit) matchesDate = false;

        return matchesSearch && matchesType && matchesMem && matchesDate;
    });

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) setSelectedClients(filteredClients.map(c => c.id));
        else setSelectedClients([]);
    };

    const handleSelectOne = (id: string) => {
        if (selectedClients.includes(id)) setSelectedClients(selectedClients.filter(cid => cid !== id));
        else setSelectedClients([...selectedClients, id]);
    };

    const handleCreateClient = async () => {
        if (!newClientData.firstName || !newClientData.lastName || !newClientData.phone) {
            setToast({ show: true, message: 'Nombre, Apellido y Teléfono son obligatorios', type: 'error' });
            return;
        }
        
        const formattedPhone = formatPhone(newClientData.phone);
        
        if (shop.clients.some(c => c.phone === formattedPhone)) {
            setToast({ show: true, message: 'Ya existe un cliente con este teléfono', type: 'error' });
            return;
        }

        setIsSaving(true);

        // --- RE-FETCH SHOP ---
        const latestShop = await api.getShopBySlug(shop.slug);
        if (!latestShop) {
             setIsSaving(false);
             return;
        }

        let membership: ClientMembership | undefined = undefined;
        // Only allow membership if Regular AND if feature enabled
        if (newClientData.type === 'REGULAR' && newClientData.planId && shop.features.memberships) {
            const plan = latestShop.membershipPlans.find(p => p.id === newClientData.planId);
            if (plan) {
                membership = {
                    planId: plan.id, planName: plan.name, sessionsTotal: plan.sessions, sessionsUsed: 0,
                    startDate: new Date().toISOString().split('T')[0],
                    expiryDate: new Date(Date.now() + plan.validityDays * 86400000).toISOString().split('T')[0]
                };
            }
        }

        const newClient: Client = {
            id: Math.random().toString(),
            shopSlug: shop.slug,
            firstName: newClientData.firstName,
            lastName: newClientData.lastName,
            phone: formattedPhone,
            type: newClientData.type as 'REGULAR' | 'EXPRESS',
            notes: newClientData.notes,
            activeMembership: membership,
            pastMemberships: []
        };

        const updatedClients = [...latestShop.clients, newClient];
        
        // PERSISTENCE AND SYNC
        try {
            const updatedShop = { ...latestShop, clients: updatedClients };
            await api.saveShop(updatedShop);
            onUpdate(updatedShop);
            setClients(updatedClients);

            setShowCreateModal(false);
            setNewClientData({ firstName: '', lastName: '', phone: '', notes: '', type: 'REGULAR', planId: '' });
            setToast({ show: true, message: 'Cliente creado exitosamente', type: 'success' });
        } catch (error) {
            setToast({ show: true, message: 'Error al guardar cliente', type: 'error' });
        }
        setIsSaving(false);
    };

    const handleExportCSV = () => {
        const headers = "Nombre,Apellido,Telefono,Tipo,Ultima Visita,Membresia\n";
        const rows = filteredClients.map(c => 
            `${c.firstName},${c.lastName},${c.phone},${c.type},${c.lastVisit || ''},${c.activeMembership?.planName || ''}`
        ).join("\n");
        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `clientes_${shop.slug}.csv`;
        a.click();
    };

    return (
        <div className="space-y-6 relative">
            <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast(prev => ({...prev, show: false}))} />
            
            {/* Header & Main Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-800">Gestión de Clientes</h1>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={handleExportCSV} disabled={filteredClients.length === 0}>
                        <Download size={18} /> Exportar CSV
                    </Button>
                    <Button themeColor={shop.themeColor} onClick={() => setShowCreateModal(true)}>
                        <Plus size={18} /> Nuevo Cliente
                    </Button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar por nombre o teléfono..." 
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                        <select className="px-3 py-2 border rounded-lg text-sm bg-white" value={filterType} onChange={e => setFilterType(e.target.value as any)}>
                            <option value="ALL">Todos los tipos</option>
                            <option value="REGULAR">Solo Regulares</option>
                            <option value="EXPRESS">Solo Express</option>
                        </select>
                        {shop.features.memberships && (
                            <select className="px-3 py-2 border rounded-lg text-sm bg-white" value={filterMembership} onChange={e => setFilterMembership(e.target.value as any)}>
                                <option value="ALL">Membresía: Todos</option>
                                <option value="WITH">Con Membresía</option>
                                <option value="WITHOUT">Sin Membresía</option>
                            </select>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg w-full md:w-auto self-start">
                    <Calendar size={16} />
                    <span>Última visita:</span>
                    <input type="date" className="bg-transparent border-b border-gray-300 focus:outline-none text-xs" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)} />
                    <span>a</span>
                    <input type="date" className="bg-transparent border-b border-gray-300 focus:outline-none text-xs" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} />
                </div>
            </div>

            {/* Bulk Actions Bar (Visible if selection > 0) */}
            {selectedClients.length > 0 && (
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-center justify-between animate-fade-in">
                    <div className="text-sm text-blue-800 font-bold">{selectedClients.length} clientes seleccionados</div>
                    <div className="flex gap-2">
                         <Button variant="secondary" className="bg-white text-xs h-8" onClick={() => alert('Demo: Enviar Promo WhatsApp')}>
                            <Mail size={14} /> Enviar Promo
                        </Button>
                        {shop.features.memberships && (
                             <Button variant="secondary" className="bg-white text-xs h-8" onClick={() => alert('Demo: Asignar Membresía Masiva')}>
                                <CreditCard size={14} /> Asignar Membresía
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-4 w-10"><input type="checkbox" onChange={handleSelectAll} checked={selectedClients.length === filteredClients.length && filteredClients.length > 0} /></th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Cliente</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Teléfono</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Tipo</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Última Visita</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Membresía</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredClients.map(client => (
                                <tr key={client.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-4 py-4"><input type="checkbox" checked={selectedClients.includes(client.id)} onChange={() => handleSelectOne(client.id)} /></td>
                                    <td className="px-6 py-4 cursor-pointer" onClick={() => navigate(`/${shop.slug}/admin/clientes/${client.id}`)}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs">
                                                {client.firstName.charAt(0)}{client.lastName.charAt(0)}
                                            </div>
                                            <span className="font-bold text-gray-800">{client.firstName} {client.lastName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 text-sm">{client.phone}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${client.type === 'REGULAR' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {client.type === 'EXPRESS' ? 'WALK-IN' : 'REGULAR'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 text-sm">{client.lastVisit || '-'}</td>
                                    <td className="px-6 py-4">
                                        {client.activeMembership && shop.features.memberships ? (
                                            <div className="text-green-600 text-xs font-bold flex items-center gap-1 bg-green-50 px-2 py-1 rounded w-fit">
                                                <Star size={12} fill="currentColor" /> {client.activeMembership.planName}
                                            </div>
                                        ) : <span className="text-gray-300 text-xs">-</span>}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => navigate(`/${shop.slug}/admin/clientes/${client.id}`)} className="text-blue-600 hover:text-blue-800 font-medium text-xs">Ver Detalle</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredClients.length === 0 && <div className="p-10 text-center text-gray-500">No se encontraron clientes con los filtros actuales.</div>}
            </div>

            {/* Create Client Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="font-bold text-lg">Nuevo Cliente</h3>
                            <button onClick={() => setShowCreateModal(false)}><X size={20} className="text-gray-400" /></button>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-bold text-gray-700 mb-1">Nombre *</label><Input value={newClientData.firstName} onChange={e => setNewClientData({...newClientData, firstName: e.target.value})} /></div>
                                <div><label className="block text-xs font-bold text-gray-700 mb-1">Apellido *</label><Input value={newClientData.lastName} onChange={e => setNewClientData({...newClientData, lastName: e.target.value})} /></div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Teléfono *</label>
                                <Input value={newClientData.phone} onChange={e => setNewClientData({...newClientData, phone: e.target.value})} placeholder="351-11111111" />
                                <p className="text-[10px] text-gray-400 mt-1">Se guardará con formato internacional (+549...)</p>
                            </div>
                            
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <label className="block text-xs font-bold text-gray-700 mb-2">Tipo de Cliente</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="ctype" checked={newClientData.type === 'REGULAR'} onChange={() => setNewClientData({...newClientData, type: 'REGULAR'})} /><span className="text-sm">Regular</span></label>
                                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="ctype" checked={newClientData.type === 'EXPRESS'} onChange={() => setNewClientData({...newClientData, type: 'EXPRESS'})} /><span className="text-sm">Express / Walk-in</span></label>
                                </div>
                            </div>
                            
                            <div><label className="block text-xs font-medium text-gray-700 mb-1">Notas</label><textarea className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} value={newClientData.notes} onChange={e => setNewClientData({...newClientData, notes: e.target.value})} /></div>
                            
                            {/* Membership Selection: Only for Regular and if Enabled */}
                            {newClientData.type === 'REGULAR' && shop.features.memberships && (
                                <div className="border-t pt-4">
                                    <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-2"><CreditCard size={14}/> Asignar Membresía (Opcional)</label>
                                    <select className="w-full px-3 py-2 border rounded-lg text-sm" value={newClientData.planId} onChange={e => setNewClientData({...newClientData, planId: e.target.value})}>
                                        <option value="">-- Sin Membresía --</option>
                                        {shop.membershipPlans.map(p => <option key={p.id} value={p.id}>{p.name} (${p.price})</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 pt-6">
                            <Button variant="secondary" onClick={() => setShowCreateModal(false)} className="flex-1">Cancelar</Button>
                            <Button themeColor={shop.themeColor} onClick={handleCreateClient} className="flex-1" disabled={isSaving}>
                                {isSaving ? 'Guardando...' : 'Crear Cliente'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- CLIENT DETAIL COMPONENT ---
export const ClientDetail: React.FC<AdminPageProps> = ({ shop, onUpdate }) => {
    const { clientId } = useParams<{ clientId: string }>();
    const navigate = useNavigate();
    
    // Refresh
    useEffect(() => {
        api.getShopBySlug(shop.slug).then(data => { if(data) onUpdate(data); });
    }, []);

    const [client, setClient] = useState<Client | undefined>(shop.clients.find(c => c.id === clientId));
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Client>>({});
    const [toast, setToast] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({ show: false, message: '', type: 'success' });
    const [showMembershipModal, setShowMembershipModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    
    // Sync with prop
    useEffect(() => {
        const found = shop.clients.find(c => c.id === clientId);
        setClient(found);
        if(found) setEditForm(found);
    }, [shop.clients, clientId]);

    // Load Bookings for History
    useEffect(() => {
        const loadHistory = async () => {
            if (clientId) {
                const allBookings = await api.getBookings(shop.slug);
                const clientHistory = allBookings.filter(b => b.clientId === clientId).sort((a,b) => b.date.localeCompare(a.date));
                setBookings(clientHistory);
            }
        };
        loadHistory();
    }, [clientId, shop.slug]);

    // Translation Maps
    const STATUS_LABELS: Record<string, string> = {
        'CONFIRMED': 'Confirmado',
        'COMPLETED': 'Completado',
        'CANCELLED': 'Cancelado',
        'ABSENT': 'Ausente'
    };
    
    const PAYMENT_LABELS: Record<string, string> = {
        'PENDING': 'Pendiente',
        'PAID': 'Pagado'
    };

    if (!client) return <div className="p-10">Cliente no encontrado</div>;

    const handleSaveEdit = async () => {
        if (!editForm.firstName || !editForm.lastName || !editForm.phone) {
            setToast({ show: true, message: 'Datos obligatorios incompletos', type: 'error' });
            return;
        }

        const formattedPhone = formatPhone(editForm.phone);
        
        // --- RE-FETCH SHOP ---
        const latestShop = await api.getShopBySlug(shop.slug);
        if (!latestShop) return;

        // Validate phone uniqueness
        if (latestShop.clients.some(c => c.phone === formattedPhone && c.id !== client.id)) {
             setToast({ show: true, message: 'El teléfono ya está registrado con otro cliente', type: 'error' });
             return;
        }
        
        const updatedClient = { ...client, ...editForm, phone: formattedPhone } as Client;
        const updatedClients = latestShop.clients.map(c => c.id === client.id ? updatedClient : c);
        
        try {
            const updatedShop = { ...latestShop, clients: updatedClients };
            await api.saveShop(updatedShop);
            onUpdate(updatedShop);

            setClient(updatedClient);
            setIsEditing(false);
            setToast({ show: true, message: 'Cliente actualizado', type: 'success' });
        } catch (e) {
            setToast({ show: true, message: 'Error al guardar', type: 'error' });
        }
    };

    const handleConvertToRegular = async () => {
        // --- RE-FETCH SHOP ---
        const latestShop = await api.getShopBySlug(shop.slug);
        if (!latestShop) return;

        const updatedClient = { ...client, type: 'REGULAR' } as Client;
        const updatedClients = latestShop.clients.map(c => c.id === client.id ? updatedClient : c);
        
        try {
            const updatedShop = { ...latestShop, clients: updatedClients };
            await api.saveShop(updatedShop);
            onUpdate(updatedShop);

            setClient(updatedClient);
            setToast({ show: true, message: 'Cliente convertido a Regular', type: 'success' });
        } catch(e) {
            setToast({ show: true, message: 'Error al guardar', type: 'error' });
        }
    };

    const handleAssignMembership = async (planId: string) => {
        // --- RE-FETCH SHOP ---
        const latestShop = await api.getShopBySlug(shop.slug);
        if (!latestShop) return;

        const plan = latestShop.membershipPlans.find(p => p.id === planId);
        if (!plan) return;

        const newMem: ClientMembership = {
            planId: plan.id, planName: plan.name, sessionsTotal: plan.sessions, sessionsUsed: 0,
            startDate: new Date().toISOString().split('T')[0],
            expiryDate: new Date(Date.now() + plan.validityDays * 86400000).toISOString().split('T')[0]
        };

        const currentClient = latestShop.clients.find(c => c.id === client.id);
        if (!currentClient) return;

        const past = currentClient.activeMembership ? [...(currentClient.pastMemberships || []), currentClient.activeMembership] : (currentClient.pastMemberships || []);
        
        const updatedClient = { ...currentClient, activeMembership: newMem, pastMemberships: past };
        const updatedClients = latestShop.clients.map(c => c.id === client.id ? updatedClient : c);

        try {
            const updatedShop = { ...latestShop, clients: updatedClients };
            await api.saveShop(updatedShop);
            onUpdate(updatedShop);

            setClient(updatedClient);
            setShowMembershipModal(false);
            setToast({ show: true, message: 'Membresía asignada correctamente', type: 'success' });
        } catch (e) {
            setToast({ show: true, message: 'Error al guardar', type: 'error' });
        }
    };

    const confirmCancelMembership = async () => {
        if (!client.activeMembership) return;
        
        // --- RE-FETCH SHOP ---
        const latestShop = await api.getShopBySlug(shop.slug);
        if (!latestShop) return;
        
        const currentClient = latestShop.clients.find(c => c.id === client.id);
        if (!currentClient || !currentClient.activeMembership) return;

        const cancelledMem = { ...currentClient.activeMembership, expiryDate: new Date().toISOString().split('T')[0] + ' (Cancelada)' };
        const past = [...(currentClient.pastMemberships || []), cancelledMem]; 
        const updatedClient = { ...currentClient, activeMembership: undefined, pastMemberships: past } as Client;
        
        const updatedClients = latestShop.clients.map(c => c.id === client.id ? updatedClient : c);
        
        try {
            const updatedShop = { ...latestShop, clients: updatedClients };
            await api.saveShop(updatedShop);
            onUpdate(updatedShop);

            setClient(updatedClient);
            setShowCancelModal(false);
            setToast({ show: true, message: 'Membresía cancelada', type: 'success' });
        } catch(e) {
            setToast({ show: true, message: 'Error al guardar', type: 'error' });
        }
    };

    return (
        <div className="space-y-6 relative">
             <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast(prev => ({...prev, show: false}))} />
            
            <button onClick={() => navigate(`/${shop.slug}/admin/clientes`)} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors">
                <ArrowLeft size={18} /> Volver a Clientes
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="text-center mb-6">
                            <div className="w-24 h-24 mx-auto bg-gray-200 rounded-full flex items-center justify-center text-3xl font-bold text-gray-500 mb-4">
                                {client.firstName.charAt(0)}{client.lastName.charAt(0)}
                            </div>
                            {isEditing ? (
                                <div className="space-y-2">
                                    <Input value={editForm.firstName} onChange={e => setEditForm({...editForm, firstName: e.target.value})} placeholder="Nombre" />
                                    <Input value={editForm.lastName} onChange={e => setEditForm({...editForm, lastName: e.target.value})} placeholder="Apellido" />
                                </div>
                            ) : (
                                <h2 className="text-xl font-bold text-gray-900">{client.firstName} {client.lastName}</h2>
                            )}
                            <div className="flex justify-center mt-2 gap-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${client.type === 'REGULAR' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                    {client.type}
                                </span>
                            </div>
                        </div>
                        
                        <div className="space-y-4 text-left">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Teléfono</label>
                                {isEditing ? <Input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} placeholder="351-11111111" /> : <div className="flex items-center gap-2 text-gray-700"><Phone size={16} /> {client.phone}</div>}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Notas Internas</label>
                                {isEditing ? <textarea className="w-full px-3 py-2 border rounded-lg text-sm" rows={3} value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} /> : <p className="text-sm bg-gray-50 p-3 rounded text-gray-600 italic">{client.notes || 'Sin notas.'}</p>}
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-100 flex gap-2">
                            {isEditing ? (
                                <>
                                    <Button variant="secondary" onClick={() => setIsEditing(false)} className="flex-1">Cancelar</Button>
                                    <Button themeColor={shop.themeColor} onClick={handleSaveEdit} className="flex-1">Guardar</Button>
                                </>
                            ) : (
                                <Button variant="secondary" className="w-full" onClick={() => setIsEditing(true)}>
                                    <Edit2 size={16} /> Editar Datos
                                </Button>
                            )}
                        </div>
                        {client.type === 'EXPRESS' && !isEditing && (
                            <button onClick={handleConvertToRegular} className="w-full mt-2 text-sm text-blue-600 hover:underline text-center block">Convertir a Cliente Regular</button>
                        )}
                    </div>

                    {/* Active Membership Card (Conditionally Rendered) */}
                    {shop.features.memberships ? (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2"><CreditCard size={18} /> Membresía</h3>
                                {client.activeMembership && (
                                    <button onClick={() => setShowCancelModal(true)} className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors border border-red-100">
                                        <Ban size={12} /> Cancelar
                                    </button>
                                )}
                            </div>
                            
                            {client.activeMembership ? (
                                <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 rounded-xl relative overflow-hidden animate-fade-in">
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-bl-full -mr-4 -mt-4"></div>
                                    <div className="flex justify-between items-start mb-2 relative z-10">
                                        <div className="font-bold text-lg">{client.activeMembership.planName}</div>
                                        <Star className="text-yellow-400" size={18} fill="currentColor"/>
                                    </div>
                                    <div className="text-xs text-gray-400 mb-4 relative z-10">Vence: {client.activeMembership.expiryDate}</div>
                                    <div className="flex justify-between items-end relative z-10">
                                        <div className="text-2xl font-bold">{client.activeMembership.sessionsTotal - client.activeMembership.sessionsUsed} <span className="text-xs font-normal text-gray-400">sesiones</span></div>
                                        <div className="text-xs">{client.activeMembership.sessionsUsed} / {client.activeMembership.sessionsTotal} usadas</div>
                                    </div>
                                    <div className="w-full bg-gray-700 h-1.5 rounded-full mt-2 relative z-10">
                                        <div className="bg-yellow-400 h-1.5 rounded-full" style={{ width: `${(client.activeMembership.sessionsUsed / client.activeMembership.sessionsTotal) * 100}%` }}></div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                    {client.type === 'EXPRESS' ? (
                                        <p className="text-sm text-gray-500 italic">Los clientes Express no pueden tener membresía.</p>
                                    ) : (
                                        <>
                                            <p className="text-sm text-gray-500 mb-3">Sin membresía activa</p>
                                            <Button themeColor={shop.themeColor} onClick={() => setShowMembershipModal(true)} className="mx-auto text-xs h-8">Asignar Membresía</Button>
                                        </>
                                    )}
                                </div>
                            )}
                            
                            {/* Membership History */}
                            {(client.pastMemberships && client.pastMemberships.length > 0) && (
                                 <div className="mt-6 pt-4 border-t border-gray-100 animate-fade-in">
                                    <h4 className="text-xs font-bold text-gray-500 mb-3 uppercase flex items-center gap-1"><History size={12}/> Historial de Planes</h4>
                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                        {client.pastMemberships.slice().reverse().map((pm, i) => (
                                            <div key={i} className="text-xs flex justify-between items-center text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">
                                                <span className="font-medium">{pm.planName}</span>
                                                <span className="text-gray-400 text-[10px]">{pm.expiryDate}</span>
                                            </div>
                                        ))}
                                    </div>
                                 </div>
                            )}
                        </div>
                    ) : (
                        // Placeholder if feature disabled but maybe useful space
                        <div className="bg-gray-50 p-6 rounded-xl shadow-sm border border-gray-100 opacity-60 flex flex-col justify-center items-center">
                            <CreditCard size={24} className="text-gray-400 mb-2" />
                            <p className="text-sm font-bold text-gray-500">Membresías</p>
                            <p className="text-xs text-gray-400">Disponible en Plan Basic/Pro</p>
                        </div>
                    )}
                </div>

                {/* History Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-xl border shadow-sm text-center">
                            <span className="text-gray-500 text-xs uppercase font-bold">Total Visitas</span>
                            <div className="text-2xl font-bold text-gray-800">{bookings.length}</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border shadow-sm text-center">
                            <span className="text-gray-500 text-xs uppercase font-bold">Gastado Total</span>
                            <div className="text-2xl font-bold text-gray-800">${bookings.filter(h => h.paymentStatus === 'PAID').reduce((acc, curr) => {
                                const service = shop.services.find(s => s.id === curr.serviceId);
                                return acc + (service?.price || 0);
                            }, 0)}</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border shadow-sm text-center">
                            <span className="text-gray-500 text-xs uppercase font-bold">Ausencias</span>
                            <div className="text-2xl font-bold text-red-600">{bookings.filter(h => h.status === 'ABSENT').length}</div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><Clock size={18} /> Historial de Turnos</h3>
                        {bookings.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                                {bookings.map(booking => {
                                    const service = shop.services.find(s => s.id === booking.serviceId);
                                    const barber = shop.barbers.find(b => b.id === booking.barberId);
                                    return (
                                        <div key={booking.id} className="flex flex-col md:flex-row md:items-center justify-between py-4 hover:bg-gray-50 transition-colors rounded px-2">
                                            <div className="mb-2 md:mb-0">
                                                <div className="font-bold text-gray-800 flex items-center gap-2">
                                                    {booking.date} <span className="text-gray-400 text-xs">•</span> {booking.time}
                                                </div>
                                                <div className="text-sm text-gray-600 mt-1">
                                                    {service?.name} con <span className="font-medium text-gray-900">{barber?.name}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className="font-bold text-gray-900">${service?.price}</div>
                                                    <div className={`text-[10px] uppercase font-bold ${booking.paymentStatus === 'PAID' ? 'text-green-600' : 'text-orange-500'}`}>
                                                        {PAYMENT_LABELS[booking.paymentStatus] || booking.paymentStatus}
                                                    </div>
                                                </div>
                                                <div className={`px-2 py-1 rounded text-xs font-bold w-24 text-center ${booking.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : booking.status === 'ABSENT' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {STATUS_LABELS[booking.status] || booking.status}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-gray-500">No hay historial de reservas.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Cancel Membership Modal */}
            {showCancelModal && client.activeMembership && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-fade-in">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600"><AlertTriangle size={24} /></div>
                        <h3 className="text-lg font-bold text-center text-gray-800 mb-2">¿Cancelar Membresía?</h3>
                        
                        {(client.activeMembership.sessionsTotal - client.activeMembership.sessionsUsed) > 0 ? (
                            <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 mb-4">
                                <p className="text-xs text-orange-800 font-medium text-center">
                                    ¡Atención! El cliente tiene <span className="font-bold">{client.activeMembership.sessionsTotal - client.activeMembership.sessionsUsed} sesiones pendientes</span> que se perderán irreversiblemente.
                                </p>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center text-sm mb-6">El cliente perderá los beneficios del plan actual.</p>
                        )}
                        
                        <div className="flex gap-3">
                            <Button variant="secondary" onClick={() => setShowCancelModal(false)} className="flex-1">Volver</Button>
                            <Button variant="danger" onClick={confirmCancelMembership} className="flex-1">Confirmar Baja</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Membership Modal */}
            {showMembershipModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                     <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">Asignar Plan</h3>
                            <button onClick={() => setShowMembershipModal(false)}><X size={20} className="text-gray-400" /></button>
                        </div>
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                            {shop.membershipPlans.map(plan => (
                                <button key={plan.id} onClick={() => handleAssignMembership(plan.id)} className="w-full flex justify-between items-center p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-all text-left group">
                                    <div>
                                        <div className="font-bold text-gray-800 group-hover:text-blue-700">{plan.name}</div>
                                        <div className="text-xs text-gray-500">{plan.sessions} sesiones • {plan.validityDays} días</div>
                                    </div>
                                    <div className="font-bold text-blue-600">${plan.price}</div>
                                </button>
                            ))}
                        </div>
                     </div>
                </div>
            )}
        </div>
    );
};

// --- MEMBERSHIPS PLANS MANAGEMENT ---
export const Memberships: React.FC<AdminPageProps> = ({ shop, onUpdate }) => {
    // --- FEATURE GATE ---
    if (!shop.features.memberships) {
        return <FeatureGate title="Gestión de Membresías" message="Crea planes de suscripción y paquetes de servicios. Disponible en planes Basic y Pro." />;
    }

    const [plans, setPlans] = useState<MembershipPlan[]>(shop.membershipPlans);
    const [isEditing, setIsEditing] = useState(false);
    const [currentPlan, setCurrentPlan] = useState<Partial<MembershipPlan>>({ active: true });
    const [toast, setToast] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({ show: false, message: '', type: 'success' });

    // Sync with prop
    useEffect(() => { setPlans(shop.membershipPlans); }, [shop.membershipPlans]);

    // Refresh
    useEffect(() => {
        api.getShopBySlug(shop.slug).then(data => { if(data) onUpdate(data); });
    }, []);

    const handleSave = async () => {
        if (!currentPlan.name || !currentPlan.price) {
            setToast({ show: true, message: 'Nombre y Precio son obligatorios', type: 'error' });
            return;
        }

        // --- RE-FETCH SHOP ---
        const latestShop = await api.getShopBySlug(shop.slug);
        if (!latestShop) return;

        const newPlan: MembershipPlan = { 
            id: currentPlan.id || Math.random().toString(), 
            name: currentPlan.name, 
            sessions: currentPlan.sessions || 1, 
            price: currentPlan.price, 
            validityDays: currentPlan.validityDays || 30, 
            description: currentPlan.description,
            active: currentPlan.active ?? true
        };

        let updatedPlans;
        if (currentPlan.id) {
            updatedPlans = latestShop.membershipPlans.map(p => p.id === currentPlan.id ? newPlan : p);
        } else {
            updatedPlans = [...latestShop.membershipPlans, newPlan];
        }
        
        try {
            const updatedShop = { ...latestShop, membershipPlans: updatedPlans };
            await api.saveShop(updatedShop);
            onUpdate(updatedShop); // Sync
            
            setPlans(updatedPlans);
            setToast({ show: true, message: 'Plan guardado', type: 'success' });
            setIsEditing(false); 
            setCurrentPlan({ active: true });
        } catch (e) {
            setToast({ show: true, message: 'Error al guardar', type: 'error' });
        }
    };

    const handleToggleStatus = async (plan: MembershipPlan) => {
        // --- RE-FETCH SHOP ---
        const latestShop = await api.getShopBySlug(shop.slug);
        if (!latestShop) return;

        const updated = { ...plan, active: !plan.active };
        const updatedPlans = latestShop.membershipPlans.map(p => p.id === plan.id ? updated : p);
        
        try {
            const updatedShop = { ...latestShop, membershipPlans: updatedPlans };
            await api.saveShop(updatedShop);
            onUpdate(updatedShop); // Sync

            setPlans(updatedPlans);
            setToast({ 
                show: true, 
                message: `Plan ${updated.active ? 'reactivado' : 'inactivado'} correctamente`, 
                type: 'success' 
            });
        } catch(e) {
             setToast({ show: true, message: 'Error al actualizar', type: 'error' });
        }
    };

    const sortedPlans = [...plans].sort((a, b) => (Number(b.active) - Number(a.active)));

    return (
        <div className="space-y-6 relative">
            <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast(prev => ({...prev, show: false}))} />
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Planes de Membresía</h1>
                <Button themeColor={shop.themeColor} onClick={() => { setCurrentPlan({ active: true }); setIsEditing(true); }}>
                    <Plus size={18} /> Crear Plan
                </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedPlans.map(plan => (
                    <div key={plan.id} className={`bg-white p-6 rounded-xl shadow-sm border relative group transition-all hover:shadow-md ${plan.active ? 'border-gray-100' : 'border-gray-200 bg-gray-50 opacity-75'}`}>
                        <div className="absolute top-4 right-4 flex gap-2">
                             <button onClick={() => { setCurrentPlan(plan); setIsEditing(true); }} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors" title="Editar">
                                <Edit2 size={16} />
                            </button>
                             <button onClick={() => handleToggleStatus(plan)} className={`p-1.5 rounded transition-colors ${plan.active ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-green-600 bg-green-50 hover:bg-green-100'}`} title={plan.active ? 'Inactivar' : 'Reactivar'}>
                                {plan.active ? <Power size={16} /> : <Check size={16} />}
                            </button>
                        </div>
                        
                        <div className="mb-2">
                            {!plan.active && <span className="text-[10px] font-bold bg-gray-200 text-gray-600 px-2 py-0.5 rounded uppercase inline-block mb-1">Inactivo</span>}
                            <h3 className={`text-xl font-bold ${plan.active ? 'text-gray-900' : 'text-gray-500'}`}>{plan.name}</h3>
                        </div>
                        
                        <p className="text-gray-500 text-sm mb-4 h-10 line-clamp-2">{plan.description || 'Sin descripción'}</p>
                        
                        <div className="flex items-baseline gap-1 mb-4">
                            <span className={`text-3xl font-bold ${plan.active ? '' : 'text-gray-400'}`} style={plan.active ? {color: shop.themeColor} : {}}>${plan.price}</span>
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-600 bg-white/50 p-3 rounded-lg border border-gray-100">
                            <div className="flex justify-between"><span>Sesiones:</span><span className="font-bold">{plan.sessions}</span></div>
                            <div className="flex justify-between"><span>Validez:</span><span className="font-bold">{plan.validityDays} días</span></div>
                        </div>
                    </div>
                ))}
            </div>

            {isEditing && (
                 <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-fade-in">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="text-lg font-bold">{currentPlan.id ? 'Editar Plan' : 'Nuevo Plan'}</h3>
                            <button onClick={() => setIsEditing(false)}><X size={20} className="text-gray-400" /></button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Nombre del Plan</label>
                                <Input value={currentPlan.name || ''} onChange={e => setCurrentPlan({...currentPlan, name: e.target.value})} placeholder="Ej: Pack Mensual" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Precio</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-gray-400">$</span>
                                        <Input type="number" className="pl-6" value={currentPlan.price || ''} onChange={e => setCurrentPlan({...currentPlan, price: Number(e.target.value)})} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Sesiones</label>
                                    <Input type="number" value={currentPlan.sessions || ''} onChange={e => setCurrentPlan({...currentPlan, sessions: Number(e.target.value)})} />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Días de vigencia</label>
                                <Input type="number" value={currentPlan.validityDays || ''} onChange={e => setCurrentPlan({...currentPlan, validityDays: Number(e.target.value)})} />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Descripción</label>
                                <Input value={currentPlan.description || ''} onChange={e => setCurrentPlan({...currentPlan, description: e.target.value})} placeholder="Breve descripción..." />
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Estado del Plan</span>
                                <button 
                                    onClick={() => setCurrentPlan({...currentPlan, active: !currentPlan.active})}
                                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${currentPlan.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}
                                >
                                    {currentPlan.active ? 'ACTIVO' : 'INACTIVO'}
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex gap-3 pt-6 mt-2 border-t">
                            <Button variant="secondary" onClick={() => setIsEditing(false)} className="flex-1">Cancelar</Button>
                            <Button themeColor={shop.themeColor} onClick={handleSave} className="flex-1">Guardar</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
