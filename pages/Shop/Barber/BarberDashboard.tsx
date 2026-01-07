
import React, { useState, useEffect } from 'react';
import { api } from '../../../services/mockData';
import { Shop, Booking } from '../../../types';
import { useAuth } from '../../../App';
import { useNavigate } from 'react-router-dom';
import { LogOut, Calendar, Clock, User, CheckCircle, Package, Coffee, Loader2 } from 'lucide-react';
import { CompletionModal } from '../Admin/AdminPages';

export const BarberDashboard: React.FC = () => {
    const { session, logout } = useAuth();
    const navigate = useNavigate();
    const [shop, setShop] = useState<Shop | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [targetCompletion, setTargetCompletion] = useState<Booking | null>(null);

    const loadData = async () => {
        if (session?.shopSlug) {
            const s = await api.getShopBySlug(session.shopSlug);
            setShop(s || null);
            const b = await api.getBookings(session.shopSlug);
            const today = new Date().toISOString().split('T')[0];
            // Only my bookings for today
            setBookings(b.filter(booking => booking.barberId === session.id && booking.date === today));
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [session]);

    const handleLogout = () => {
        logout();
        navigate(`/${session?.shopSlug}/login`);
    };

    const handleStatusChange = async (booking: Booking, newStatus: Booking['status']) => {
        if (newStatus === 'COMPLETED') {
            setTargetCompletion(booking);
            return;
        }

        const updated = { ...booking, status: newStatus };
        setBookings(bookings.map(b => b.id === booking.id ? updated : b));
        try {
            await api.saveBooking(updated);
        } catch(e) {
            loadData();
        }
    };

    const handleFinalizeCompletion = async (data: { barberId: string, usedInventory: Record<string, number>, usedReceptions: Record<string, number> }) => {
        if (!targetCompletion || !shop) return;

        const updatedBooking: Booking = { 
            ...targetCompletion, 
            status: 'COMPLETED', 
            paymentStatus: 'PAID',
            barberId: data.barberId 
        };

        const attendant = shop.barbers.find(b => b.id === data.barberId);
        const branchName = attendant?.branch || 'Casa Central';

        // Update Inventory Stock
        const newInventory = (shop.inventory || []).map(item => {
            const usage = data.usedInventory[item.id] || 0;
            if (usage === 0) return item;
            
            const branchStock = { ...item.branchStock };
            const current = branchStock[branchName] || { stock: 0, minStock: 5 };
            branchStock[branchName] = { ...current, stock: Math.max(0, current.stock - usage) };
            
            return { ...item, branchStock };
        });

        // Update Reception Stock
        const newReceptions = (shop.receptions || []).map(item => {
            const usage = data.usedReceptions[item.id] || 0;
            if (usage === 0) return item;
            
            const branchStock = { ...item.branchStock };
            const current = branchStock[branchName] || { stock: 0, minStock: 5 };
            branchStock[branchName] = { ...current, stock: Math.max(0, current.stock - usage) };
            
            return { ...item, branchStock };
        });

        const updatedShop = { ...shop, inventory: newInventory, receptions: newReceptions };
        
        // Optimistic UI updates
        setBookings(bookings.map(b => b.id === targetCompletion.id ? updatedBooking : b));
        setShop(updatedShop);
        setTargetCompletion(null);

        try {
            await api.saveBooking(updatedBooking);
            await api.saveShop(updatedShop);
        } catch (e) {
            loadData();
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;
    if (!shop) return <div className="p-10 text-center">Tienda no cargada.</div>;

    const sortedBookings = [...bookings].sort((a,b) => a.time.localeCompare(b.time));

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-10">
            {targetCompletion && (
                <CompletionModal 
                    shop={shop} 
                    booking={targetCompletion} 
                    onClose={() => setTargetCompletion(null)}
                    onConfirm={handleFinalizeCompletion}
                />
            )}

            <header className="bg-white shadow-sm sticky top-0 z-[60]">
                <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <img src={shop.barbers.find(b => b.id === session?.id)?.avatar || shop.logo} className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover" />
                        <div>
                            <h1 className="font-extrabold text-gray-900 leading-tight">Hola, {session?.name}</h1>
                            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Hoy: {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-gray-50 rounded-full"><LogOut size={20}/></button>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 mt-6">
                <div className="grid grid-cols-2 gap-3 mb-6 text-center">
                    <div className="bg-white p-4 rounded-2xl border shadow-sm">
                        <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Turnos Hoy</div>
                        <div className="text-2xl font-extrabold text-gray-800">{bookings.length}</div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border shadow-sm">
                        <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Completados</div>
                        <div className="text-2xl font-extrabold text-green-600">{bookings.filter(b => b.status === 'COMPLETED').length}</div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                    <div className="p-5 border-b bg-gray-50/50 flex justify-between items-center">
                        <h2 className="text-sm font-extrabold text-gray-800 flex items-center gap-2 uppercase tracking-tight">
                            <Calendar size={18} className="text-blue-600"/> Tu Agenda del Día
                        </h2>
                    </div>
                    
                    {sortedBookings.length === 0 ? (
                        <div className="p-12 text-center text-gray-400 font-bold text-sm italic">
                            No tienes turnos para hoy.
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {sortedBookings.map(booking => {
                                const service = shop.services.find(s => s.id === booking.serviceId);
                                return (
                                    <div key={booking.id} className={`p-5 flex flex-col gap-4 transition-colors ${booking.status === 'COMPLETED' ? 'bg-green-50/30' : ''}`}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex gap-4">
                                                <div className="text-xl font-black text-blue-600 pt-0.5 w-14">{booking.time}</div>
                                                <div>
                                                    <div className="font-bold text-gray-900 text-lg leading-tight">{booking.clientName}</div>
                                                    <div className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-wider">{service?.name}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-black text-gray-900">${service?.price}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 mt-1">
                                            <select 
                                                value={booking.status}
                                                disabled={booking.status === 'COMPLETED'}
                                                onChange={(e) => handleStatusChange(booking, e.target.value as any)}
                                                className={`flex-1 p-3 rounded-xl text-xs font-bold border outline-none transition-all cursor-pointer ${
                                                    booking.status === 'CONFIRMED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    booking.status === 'COMPLETED' ? 'bg-green-600 text-white border-green-600' :
                                                    booking.status === 'ABSENT' ? 'bg-red-50 text-red-700 border-red-200' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}
                                            >
                                                <option value="CONFIRMED">Confirmado</option>
                                                <option value="COMPLETED">Finalizar Turno...</option>
                                                <option value="ABSENT">Marcar como Ausente</option>
                                            </select>
                                            
                                            {booking.status === 'COMPLETED' && (
                                                <div className="bg-green-100 p-3 rounded-xl text-green-600 shadow-sm">
                                                    <CheckCircle size={20} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};
