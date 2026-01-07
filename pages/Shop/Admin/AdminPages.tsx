
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Shop, Booking, Barber, Service, InventoryItem, DaySchedule, ReceptionItem, StockInfo, Branch } from '../../../types';
import { api } from '../../../services/mockData';
import { 
    Calendar, Scissors, Package, Settings as SettingsIcon, 
    Plus, Edit2, Save, X, Clock, Coffee, Store, Minus, Trash, Lock, Loader2, Image as ImageIcon,
    Upload, MapPin, CreditCard, MessageCircle, ExternalLink, ShieldCheck, User as UserIcon
} from 'lucide-react';

interface AdminPageProps {
  shop: Shop;
  onUpdate: (shop: Shop) => void;
}

// --- SHARED UI ---
export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost', themeColor?: string }> = 
    ({ children, variant = 'primary', themeColor, className = '', ...props }) => {
    const baseStyle = "px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed";
    let variantStyle = "";
    const style: React.CSSProperties = {};
    switch (variant) {
        case 'primary': style.backgroundColor = themeColor || '#000'; style.color = '#fff'; break;
        case 'secondary': variantStyle = "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"; break;
        case 'danger': variantStyle = "bg-red-50 text-red-600 hover:bg-red-100"; break;
        case 'ghost': variantStyle = "text-gray-500 hover:bg-gray-100"; break;
    }
    return <button type={props.type || 'button'} className={`${baseStyle} ${variantStyle} ${className}`} style={style} {...props}>{children}</button>;
};

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm" {...props} />
);

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

// --- MODAL: COMPLETAR TURNO ---
export const CompletionModal: React.FC<{ 
    shop: Shop, 
    booking: Booking, 
    onClose: () => void, 
    onConfirm: (data: { barberId: string, usedInventory: Record<string, number>, usedReceptions: Record<string, number> }) => void 
}> = ({ shop, booking, onClose, onConfirm }) => {
    const [selectedBarberId, setSelectedBarberId] = useState(booking.barberId);
    const [usedInventory, setUsedInventory] = useState<Record<string, number>>({});
    const [usedReceptions, setUsedReceptions] = useState<Record<string, number>>({});

    const originalBarber = shop.barbers.find(b => b.id === booking.barberId);
    const contextBranch = originalBarber?.branch || 'Casa Central';

    const allowedBarbers = useMemo(() => {
        return shop.barbers.filter(b => (b.branch || 'Casa Central') === contextBranch);
    }, [shop.barbers, contextBranch]);

    const handleQtyChange = (type: 'inventory' | 'reception', id: string, delta: number) => {
        const setter = type === 'inventory' ? setUsedInventory : setUsedReceptions;
        const state = type === 'inventory' ? usedInventory : usedReceptions;
        const current = state[id] || 0;
        const next = Math.max(0, current + delta);
        setter({ ...state, [id]: next });
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
                <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="text-xl font-extrabold text-gray-900">Finalizar Turno</h3>
                        <p className="text-xs text-gray-500">Registra el consumo técnico y cortesía</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20} className="text-gray-400" /></button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    <section>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-2 block tracking-widest flex items-center gap-2">
                            <Scissors size={14}/> Profesional que Atendió
                        </label>
                        <select 
                            value={selectedBarberId}
                            onChange={(e) => setSelectedBarberId(e.target.value)}
                            className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100 font-bold text-gray-700 bg-white"
                        >
                            {allowedBarbers.map(b => (
                                <option key={b.id} value={b.id}>{b.name} ({b.branch || 'Casa Central'})</option>
                            ))}
                        </select>
                    </section>

                    {shop.features.inventory && shop.inventory && (
                        <section>
                            <label className="text-xs font-bold text-gray-400 uppercase mb-3 block tracking-widest flex items-center gap-2">
                                <Package size={14}/> Insumos Utilizados
                            </label>
                            <div className="space-y-2">
                                {shop.inventory.filter(i => i.active).map(item => (
                                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-xl bg-gray-50/50">
                                        <div className="text-sm font-bold text-gray-800">{item.name}</div>
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => handleQtyChange('inventory', item.id, -1)} className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center hover:bg-gray-100"><Minus size={14}/></button>
                                            <span className="w-6 text-center font-bold text-blue-600">{usedInventory[item.id] || 0}</span>
                                            <button onClick={() => handleQtyChange('inventory', item.id, 1)} className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center hover:bg-gray-100"><Plus size={14}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {shop.features.receptions && shop.receptions && (
                        <section>
                            <label className="text-xs font-bold text-gray-400 uppercase mb-3 block tracking-widest flex items-center gap-2">
                                <Coffee size={14}/> Consumo de Recepción
                            </label>
                            <div className="space-y-2">
                                {shop.receptions.filter(r => r.active).map(item => (
                                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-xl bg-gray-50/50">
                                        <div className="text-sm font-bold text-gray-800">{item.name}</div>
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => handleQtyChange('reception', item.id, -1)} className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center hover:bg-gray-100"><Minus size={14}/></button>
                                            <span className="w-6 text-center font-bold text-blue-600">{usedReceptions[item.id] || 0}</span>
                                            <button onClick={() => handleQtyChange('reception', item.id, 1)} className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center hover:bg-gray-100"><Plus size={14}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                <div className="p-6 border-t bg-gray-50 flex gap-4">
                    <Button variant="secondary" onClick={onClose} className="flex-1 py-3">Cancelar</Button>
                    <Button 
                        themeColor={shop.themeColor} 
                        onClick={() => onConfirm({ barberId: selectedBarberId, usedInventory, usedReceptions })} 
                        className="flex-1 py-3 font-bold"
                    >
                        Confirmar Cierre
                    </Button>
                </div>
            </div>
        </div>
    );
};

// --- AGENDA ---
export const Agenda: React.FC<AdminPageProps> = ({ shop, onUpdate }) => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [targetCompletion, setTargetCompletion] = useState<Booking | null>(null);

    const loadBookings = async () => {
        setLoading(true);
        const data = await api.getBookings(shop.slug);
        setBookings(data.filter(b => b.date === selectedDate && b.status !== 'CANCELLED'));
        setLoading(false);
    };

    useEffect(() => { loadBookings(); }, [selectedDate, shop.slug]);

    const handleStatusChange = async (booking: Booking, status: Booking['status']) => {
        if (status === 'COMPLETED') { setTargetCompletion(booking); return; }
        const updated = { ...booking, status };
        await api.saveBooking(updated);
        loadBookings();
    };

    const handleFinalize = async (data: { barberId: string, usedInventory: Record<string, number>, usedReceptions: Record<string, number> }) => {
        if (!targetCompletion) return;
        const updatedBooking: Booking = { ...targetCompletion, status: 'COMPLETED', paymentStatus: 'PAID', barberId: data.barberId };
        
        const barber = shop.barbers.find(b => b.id === data.barberId);
        const branchName = barber?.branch || 'Casa Central';

        const updatedShop = { ...shop };
        
        if (updatedShop.inventory) {
            updatedShop.inventory = updatedShop.inventory.map(item => {
                const usage = data.usedInventory[item.id] || 0;
                if (usage === 0) return item;
                const branchStock = { ...item.branchStock };
                const current = branchStock[branchName] || { stock: 0, minStock: 5 };
                branchStock[branchName] = { ...current, stock: Math.max(0, current.stock - usage) };
                return { ...item, branchStock };
            });
        }

        if (updatedShop.receptions) {
            updatedShop.receptions = updatedShop.receptions.map(item => {
                const usage = data.usedReceptions[item.id] || 0;
                if (usage === 0) return item;
                const branchStock = { ...item.branchStock };
                const current = branchStock[branchName] || { stock: 0, minStock: 5 };
                branchStock[branchName] = { ...current, stock: Math.max(0, current.stock - usage) };
                return { ...item, branchStock };
            });
        }

        await api.saveBooking(updatedBooking);
        await api.saveShop(updatedShop);
        onUpdate(updatedShop);
        setTargetCompletion(null);
        loadBookings();
    };

    return (
        <div className="space-y-6">
            {targetCompletion && <CompletionModal shop={shop} booking={targetCompletion} onClose={() => setTargetCompletion(null)} onConfirm={handleFinalize} />}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Calendar size={20}/> Agenda del Día</h1>
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="border rounded-lg p-2 text-sm outline-none" />
            </div>
            {loading ? <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600"/></div> : (
                <div className="bg-white rounded-xl border shadow-sm divide-y">
                    {bookings.length === 0 ? <div className="p-10 text-center text-gray-500 italic">No hay turnos para este día</div> : (
                        bookings.sort((a,b) => a.time.localeCompare(b.time)).map(b => (
                            <div key={b.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="text-lg font-bold text-blue-600 w-16">{b.time}</div>
                                    <div>
                                        <div className="font-bold text-gray-900">{b.clientName}</div>
                                        <div className="text-xs text-gray-500">{shop.services.find(s => s.id === b.serviceId)?.name}</div>
                                    </div>
                                </div>
                                <select value={b.status} onChange={e => handleStatusChange(b, e.target.value as any)} className={`text-xs font-bold border rounded-lg p-2 outline-none cursor-pointer ${b.status === 'CONFIRMED' ? 'text-blue-600 bg-blue-50' : 'text-green-600 bg-green-50'}`}>
                                    <option value="CONFIRMED">Confirmado</option>
                                    <option value="COMPLETED">Completado</option>
                                    <option value="ABSENT">Ausente</option>
                                    <option value="CANCELLED">Cancelado</option>
                                </select>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

// --- SETTINGS (CON HORARIOS DE DESCANSO RESTAURADOS) ---
export const Settings: React.FC<AdminPageProps> = ({ shop, onUpdate }) => {
    const [formData, setFormData] = useState({ ...shop });
    const [activeTab, setActiveTab] = useState<'GENERAL' | 'HOURS' | 'BRANCHES' | 'MODULES'>('GENERAL');
    const [newBranch, setNewBranch] = useState<Partial<Branch>>({ name: '', address: '', city: '', province: '', phone: '' });
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [selectedScheduleBranch, setSelectedScheduleBranch] = useState<string>('Casa Central');
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { setFormData({ ...shop }); }, [shop]);

    const handleSave = async (updatedData = formData) => {
        setIsSaving(true);
        try {
            await api.saveShop(updatedData);
            onUpdate(updatedData);
            alert('Cambios guardados correctamente.');
        } catch (e: any) {
            alert('Error al guardar: ' + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setFormData(prev => ({ ...prev, logo: base64String }));
        };
        reader.readAsDataURL(file);
    };

    const getCurrentSchedules = () => {
        if (selectedScheduleBranch === 'Casa Central') return formData.openingHours;
        return (formData.branchSchedules && formData.branchSchedules[selectedScheduleBranch]) || formData.openingHours;
    };

    const toggleDay = (idx: number) => {
        const currentSchedules = [...getCurrentSchedules()];
        currentSchedules[idx].isOpen = !currentSchedules[idx].isOpen;
        if (selectedScheduleBranch === 'Casa Central') {
            setFormData({ ...formData, openingHours: currentSchedules });
        } else {
            const newBranchSchedules = { ...(formData.branchSchedules || {}) };
            newBranchSchedules[selectedScheduleBranch] = currentSchedules;
            setFormData({ ...formData, branchSchedules: newBranchSchedules });
        }
    };

    const updateHour = (idx: number, field: keyof DaySchedule, value: any) => {
        const currentSchedules = [...getCurrentSchedules()];
        (currentSchedules[idx] as any)[field] = value;
        if (selectedScheduleBranch === 'Casa Central') {
            setFormData({ ...formData, openingHours: currentSchedules });
        } else {
            const newBranchSchedules = { ...(formData.branchSchedules || {}) };
            newBranchSchedules[selectedScheduleBranch] = currentSchedules;
            setFormData({ ...formData, branchSchedules: newBranchSchedules });
        }
    };

    const addBranch = () => {
        if (!newBranch.name) { alert("Nombre obligatorio"); return; }
        const updatedBranches = [...(formData.branches || []), { ...newBranch, id: Math.random().toString(36).substr(2, 9) } as Branch];
        setFormData(prev => ({ ...prev, branches: updatedBranches }));
        setNewBranch({ name: '', address: '', city: '', province: '', phone: '' });
    };

    const updateExistingBranch = () => {
        if (!editingBranch || !editingBranch.name) return;
        const oldBranch = formData.branches?.find(b => b.id === editingBranch.id);
        const updatedBranches = (formData.branches || []).map(b => b.id === editingBranch.id ? editingBranch : b);
        let updatedBranchSchedules = { ...(formData.branchSchedules || {}) };
        if (oldBranch && oldBranch.name !== editingBranch.name) {
            const schedules = updatedBranchSchedules[oldBranch.name];
            if (schedules) {
                updatedBranchSchedules[editingBranch.name] = schedules;
                delete updatedBranchSchedules[oldBranch.name];
            }
        }
        setFormData({ ...formData, branches: updatedBranches, branchSchedules: updatedBranchSchedules });
        setEditingBranch(null);
    };

    const removeBranch = (id: string) => {
        const br = formData.branches?.find(b => b.id === id);
        const updated = { ...formData, branches: (formData.branches || []).filter(b => b.id !== id) };
        if (br && updated.branchSchedules) {
            delete updated.branchSchedules[br.name];
        }
        setFormData(updated);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2"><SettingsIcon size={20}/> Configuración</h1>
                <Button themeColor={shop.themeColor} onClick={() => handleSave()} disabled={isSaving}>
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18}/>}
                    {isSaving ? 'Guardando...' : 'Guardar Todo'}
                </Button>
            </div>

            <div className="flex gap-1 border-b overflow-x-auto scrollbar-hide bg-white px-4 rounded-t-xl">
                {['GENERAL', 'HOURS', 'BRANCHES', 'MODULES'].map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab as any)} className={`pb-3 pt-4 px-6 text-xs font-bold transition-all uppercase tracking-wider whitespace-nowrap ${activeTab === tab ? 'border-b-2 text-blue-600 border-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
                        {tab === 'GENERAL' ? 'General' : tab === 'HOURS' ? 'Horarios' : tab === 'BRANCHES' ? 'Sucursales' : 'Módulos'}
                    </button>
                ))}
            </div>

            <div className="bg-white p-6 rounded-b-xl border border-t-0 shadow-sm min-h-[50vh]">
                {activeTab === 'GENERAL' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in duration-300">
                        <div className="md:col-span-1 space-y-4">
                            <label className="text-xs font-bold text-gray-500 uppercase block">Logotipo</label>
                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <div className="w-full aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-blue-300 group-hover:bg-blue-50">
                                    {formData.logo ? <img src={formData.logo} className="w-full h-full object-cover" alt="Logo preview" /> : <><ImageIcon className="text-gray-300 mb-2" size={48} /><span className="text-[10px] font-bold text-gray-400 uppercase">Seleccionar</span></>}
                                </div>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                            </div>
                        </div>
                        <div className="md:col-span-2 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Nombre Comercial</label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                                <div><label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Teléfono</label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                                <div className="col-span-2"><label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Dirección Matriz</label><Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'HOURS' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border">
                            <div>
                                <h3 className="font-bold text-gray-800">Horarios por Sede</h3>
                                <p className="text-[10px] text-gray-500 uppercase font-bold">Configura si cierras al mediodía</p>
                            </div>
                            <select value={selectedScheduleBranch} onChange={(e) => setSelectedScheduleBranch(e.target.value)} className="p-2 border rounded-lg text-xs font-bold outline-none bg-white">
                                <option value="Casa Central">Casa Central</option>
                                {formData.branches?.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                            </select>
                        </div>
                        <div className="divide-y border rounded-xl overflow-hidden">
                            {getCurrentSchedules().map((day, idx) => (
                                <div key={day.day} className="py-4 px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors hover:bg-gray-50/50">
                                    <div className="flex items-center gap-4 w-40">
                                        <button onClick={() => toggleDay(idx)} className={`w-10 h-6 rounded-full relative transition-colors ${day.isOpen ? 'bg-green-500' : 'bg-gray-200'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${day.isOpen ? 'left-5' : 'left-1'}`} /></button>
                                        <span className={`font-bold text-sm ${day.isOpen ? 'text-gray-900' : 'text-gray-300'}`}>{day.day}</span>
                                    </div>
                                    {day.isOpen ? (
                                        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 flex-1">
                                            <div className="flex items-center gap-2">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase">Apertura</label>
                                                <input type="time" value={day.openTime} onChange={e => updateHour(idx, 'openTime', e.target.value)} className="border rounded px-2 py-1.5 text-xs font-bold" />
                                                <label className="text-[10px] font-bold text-gray-400 uppercase">Cierre</label>
                                                <input type="time" value={day.closeTime} onChange={e => updateHour(idx, 'closeTime', e.target.value)} className="border rounded px-2 py-1.5 text-xs font-bold" />
                                            </div>
                                            
                                            <div className="flex items-center gap-3 border-l-0 md:border-l md:pl-6 border-gray-100">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="checkbox" checked={day.hasBreak} onChange={e => updateHour(idx, 'hasBreak', e.target.checked)} className="rounded" />
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">¿Cierra al mediodía?</span>
                                                </label>
                                                
                                                {day.hasBreak && (
                                                    <div className="flex items-center gap-2 animate-in slide-in-from-left-2">
                                                        <input type="time" value={day.breakStart} onChange={e => updateHour(idx, 'breakStart', e.target.value)} className="border rounded px-2 py-1.5 text-xs font-bold text-orange-600 bg-orange-50" />
                                                        <span className="text-gray-300 text-[10px]">hasta</span>
                                                        <input type="time" value={day.breakEnd} onChange={e => updateHour(idx, 'breakEnd', e.target.value)} className="border rounded px-2 py-1.5 text-xs font-bold text-orange-600 bg-orange-50" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-gray-300 text-xs italic">Cerrado</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'BRANCHES' && (
                    <div className="space-y-6">
                        <section className="bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-300">
                            <h3 className="font-bold text-gray-800 mb-4">{editingBranch ? 'Editando Sucursal' : 'Nueva Sucursal'}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Input value={editingBranch ? editingBranch.name : newBranch.name} onChange={e => editingBranch ? setEditingBranch({...editingBranch, name: e.target.value}) : setNewBranch({...newBranch, name: e.target.value})} placeholder="Nombre" />
                                <Input value={editingBranch ? editingBranch.address : newBranch.address} onChange={e => editingBranch ? setEditingBranch({...editingBranch, address: e.target.value}) : setNewBranch({...newBranch, address: e.target.value})} placeholder="Dirección" />
                                {editingBranch ? <div className="flex gap-2"><Button variant="secondary" onClick={() => setEditingBranch(null)}>Cerrar</Button><Button themeColor={shop.themeColor} onClick={updateExistingBranch}>Actualizar</Button></div> : <Button themeColor={shop.themeColor} onClick={addBranch}>Registrar</Button>}
                            </div>
                        </section>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {formData.branches?.map(br => (
                                <div key={br.id} className="p-4 border rounded-xl flex justify-between items-center bg-white shadow-sm">
                                    <div><h4 className="font-bold text-gray-800">{br.name}</h4><p className="text-xs text-gray-500">{br.address}</p></div>
                                    <div className="flex gap-2"><button onClick={() => setEditingBranch(br)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 size={16}/></button><button onClick={() => removeBranch(br.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash size={16}/></button></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'MODULES' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className={`p-6 border rounded-2xl ${formData.features.mercadoPago ? 'bg-white border-blue-200 shadow-md' : 'bg-gray-50 border-gray-100 opacity-80'}`}>
                                <div className="flex justify-between mb-6">
                                    <div className="flex items-center gap-3"><div className="w-12 h-12 bg-[#009ee3] rounded-xl flex items-center justify-center text-white"><CreditCard size={24} /></div><div><h4 className="font-bold text-gray-900">Mercado Pago</h4><p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Pasarela de Cobros</p></div></div>
                                    <button onClick={() => setFormData({ ...formData, features: { ...formData.features, mercadoPago: !formData.features.mercadoPago } })} className={`w-12 h-6 rounded-full relative transition-colors ${formData.features.mercadoPago ? 'bg-green-500' : 'bg-gray-300'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${formData.features.mercadoPago ? 'left-7' : 'left-1'}`} /></button>
                                </div>
                                {formData.features.mercadoPago && <div className="space-y-4"><label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block">Access Token</label><input type="password" value={formData.features.mercadoPagoToken || ''} onChange={e => setFormData({ ...formData, features: { ...formData.features, mercadoPagoToken: e.target.value } })} className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm font-mono outline-none" placeholder="APP_USR-..." /></div>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- BARBERS (RESTORED IMAGE UPLOAD) ---
export const Barbers: React.FC<AdminPageProps> = ({ shop, onUpdate }) => {
    const [isEditing, setIsEditing] = useState<Barber | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !isEditing) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setIsEditing({ ...isEditing, avatar: base64String });
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isEditing) return;
        const updatedBarbers = isEditing.id 
            ? shop.barbers.map(b => b.id === isEditing.id ? isEditing : b)
            : [...shop.barbers, { ...isEditing, id: Math.random().toString(36).substr(2, 9) }];
        const updatedShop = { ...shop, barbers: updatedBarbers };
        await api.saveShop(updatedShop);
        onUpdate(updatedShop);
        setIsEditing(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Profesionales</h1>
                <Button themeColor={shop.themeColor} onClick={() => setIsEditing({ id: '', name: '', specialties: [], avatar: '', active: true, branch: 'Casa Central' })}>
                    <Plus size={18}/> Nuevo Barbero
                </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {shop.barbers.map(b => (
                    <div key={b.id} className="bg-white p-6 rounded-xl border shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
                        {b.avatar ? <img src={b.avatar} className="w-16 h-16 rounded-full object-cover border" /> : <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border"><UserIcon size={24}/></div>}
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{b.name}</h3>
                            <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">{b.branch || 'Casa Central'}</p>
                        </div>
                        <button onClick={() => setIsEditing(b)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={18}/></button>
                    </div>
                ))}
            </div>
            {isEditing && (
                <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
                    <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full space-y-4 animate-in zoom-in duration-200">
                        <div className="flex justify-between items-center border-b pb-4">
                            <h2 className="text-xl font-bold">{isEditing.id ? 'Editar Perfil' : 'Nuevo Perfil'}</h2>
                            <button type="button" onClick={() => setIsEditing(null)}><X size={20} className="text-gray-400"/></button>
                        </div>
                        
                        <div className="flex flex-col items-center gap-4 py-4">
                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-blue-400 group-hover:bg-blue-50">
                                    {isEditing.avatar ? <img src={isEditing.avatar} className="w-full h-full object-cover" /> : <><ImageIcon size={32} className="text-gray-300 mb-1"/><span className="text-[10px] font-bold text-gray-400 uppercase">Subir Foto</span></>}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white"><Upload size={20}/></div>
                                </div>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                            </div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Foto del Profesional (Obligatorio)</p>
                        </div>

                        <div className="space-y-3">
                            <div><label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Nombre Completo</label><Input value={isEditing.name} onChange={e => setIsEditing({...isEditing, name: e.target.value})} required /></div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Sede Asignada</label>
                                <select value={isEditing.branch || 'Casa Central'} onChange={e => setIsEditing({...isEditing, branch: e.target.value})} className="w-full border rounded-lg p-2 text-sm font-bold bg-white">
                                    <option value="Casa Central">Casa Central</option>
                                    {shop.branches?.map(br => <option key={br.id} value={br.name}>{br.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Usuario</label><Input value={isEditing.username} onChange={e => setIsEditing({...isEditing, username: e.target.value})} required /></div>
                                <div><label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Contraseña</label><Input value={isEditing.password} onChange={e => setIsEditing({...isEditing, password: e.target.value})} type="password" required /></div>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button variant="secondary" onClick={() => setIsEditing(null)} className="flex-1">Cancelar</Button>
                            <Button themeColor={shop.themeColor} type="submit" className="flex-1">Guardar Barbero</Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

// --- SERVICES, INVENTORY & RECEPTIONS ---
export const Services: React.FC<AdminPageProps> = ({ shop, onUpdate }) => {
    const [isEditing, setIsEditing] = useState<Service | null>(null);
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isEditing) return;
        const updatedServices = isEditing.id ? shop.services.map(s => s.id === isEditing.id ? isEditing : s) : [...shop.services, { ...isEditing, id: Math.random().toString(36).substr(2, 9) }];
        const updatedShop = { ...shop, services: updatedServices };
        await api.saveShop(updatedShop);
        onUpdate(updatedShop);
        setIsEditing(null);
    };
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center"><h1 className="text-2xl font-bold">Servicios</h1><Button themeColor={shop.themeColor} onClick={() => setIsEditing({ id: '', name: '', description: '', price: 0, duration: 30 })}><Plus size={18}/> Nuevo Servicio</Button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {shop.services.map(s => (<div key={s.id} className="bg-white p-6 rounded-xl border shadow-sm flex justify-between items-center"><div><h3 className="font-bold text-gray-900">{s.name}</h3><p className="text-xs font-bold text-blue-600">${s.price} • {s.duration} min</p></div><button onClick={() => setIsEditing(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={18}/></button></div>))}
            </div>
            {isEditing && (
                <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
                    <form onSubmit={handleSave} className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full space-y-4"><h2 className="text-xl font-bold">{isEditing.id ? 'Editar Servicio' : 'Nuevo Servicio'}</h2><Input value={isEditing.name} onChange={e => setIsEditing({...isEditing, name: e.target.value})} placeholder="Nombre" required /><div className="grid grid-cols-2 gap-4"><Input value={isEditing.price} type="number" onChange={e => setIsEditing({...isEditing, price: Number(e.target.value)})} placeholder="Precio $" required /><Input value={isEditing.duration} type="number" onChange={e => setIsEditing({...isEditing, duration: Number(e.target.value)})} placeholder="Min" required /></div><div className="flex gap-2 pt-4"><Button variant="secondary" onClick={() => setIsEditing(null)} className="flex-1">Cerrar</Button><Button themeColor={shop.themeColor} type="submit" className="flex-1">Guardar</Button></div></form>
                </div>
            )}
        </div>
    );
};

export const Inventory: React.FC<AdminPageProps> = ({ shop, onUpdate }) => {
    if (!shop.features.inventory) return <FeatureGate title="Gestión de Insumos" message="Controla el stock técnico." />;
    const [isEditing, setIsEditing] = useState<InventoryItem | null>(null);
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isEditing) return;
        const updatedInventory = isEditing.id ? shop.inventory.map(i => i.id === isEditing.id ? isEditing : i) : [...(shop.inventory || []), { ...isEditing, id: Math.random().toString(36).substr(2, 9), branchStock: { 'Casa Central': { stock: 0, minStock: 5 } }, active: true }];
        const updatedShop = { ...shop, inventory: updatedInventory };
        await api.saveShop(updatedShop);
        onUpdate(updatedShop);
        setIsEditing(null);
    };
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center"><h1 className="text-2xl font-bold">Inventario Técnico</h1><Button themeColor={shop.themeColor} onClick={() => setIsEditing({ id: '', name: '', branchStock: {}, active: true })}><Plus size={18}/> Alta Insumo</Button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(shop.inventory || []).map(i => (<div key={i.id} className="bg-white p-6 rounded-xl border shadow-sm flex justify-between items-center"><div><h3 className="font-bold text-gray-900">{i.name}</h3></div><button onClick={() => setIsEditing(i)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={18}/></button></div>))}
            </div>
            {isEditing && (
                <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
                    <form onSubmit={handleSave} className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full space-y-4"><h2 className="text-xl font-bold">Editar Insumo</h2><Input value={isEditing.name} onChange={e => setIsEditing({...isEditing, name: e.target.value})} placeholder="Nombre" required /><div className="flex gap-2 pt-4"><Button variant="secondary" onClick={() => setIsEditing(null)} className="flex-1">Cerrar</Button><Button themeColor={shop.themeColor} type="submit" className="flex-1">Guardar</Button></div></form>
                </div>
            )}
        </div>
    );
};

export const Receptions: React.FC<AdminPageProps> = ({ shop, onUpdate }) => {
    if (!shop.features.receptions) return <FeatureGate title="Gestión de Recepciones" message="Controla consumos de cortesía." />;
    const [isEditing, setIsEditing] = useState<ReceptionItem | null>(null);
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isEditing) return;
        const updatedReceptions = isEditing.id ? shop.receptions.map(r => r.id === isEditing.id ? isEditing : r) : [...(shop.receptions || []), { ...isEditing, id: Math.random().toString(36).substr(2, 9), branchStock: { 'Casa Central': { stock: 0, minStock: 5 } }, active: true }];
        const updatedShop = { ...shop, receptions: updatedReceptions };
        await api.saveShop(updatedShop);
        onUpdate(updatedShop);
        setIsEditing(null);
    };
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center"><h1 className="text-2xl font-bold">Recepción / Bar</h1><Button themeColor={shop.themeColor} onClick={() => setIsEditing({ id: '', name: '', branchStock: {}, active: true })}><Plus size={18}/> Nuevo Ítem</Button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(shop.receptions || []).map(r => (<div key={r.id} className="bg-white p-6 rounded-xl border shadow-sm flex justify-between items-center"><div><h3 className="font-bold text-gray-900">{r.name}</h3></div><button onClick={() => setIsEditing(r)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={18}/></button></div>))}
            </div>
            {isEditing && (
                <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
                    <form onSubmit={handleSave} className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full space-y-4"><h2 className="text-xl font-bold">Editar Ítem</h2><Input value={isEditing.name} onChange={e => setIsEditing({...isEditing, name: e.target.value})} placeholder="Nombre" required /><div className="flex gap-2 pt-4"><Button variant="secondary" onClick={() => setIsEditing(null)} className="flex-1">Cerrar</Button><Button themeColor={shop.themeColor} type="submit" className="flex-1">Guardar</Button></div></form>
                </div>
            )}
        </div>
    );
};
