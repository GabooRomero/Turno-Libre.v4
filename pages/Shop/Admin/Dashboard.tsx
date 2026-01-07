
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Shop, Booking, StockInfo } from '../../../types';
import { api } from '../../../services/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, DollarSign, Users, AlertCircle, Loader2, Filter, ChevronDown, Store } from 'lucide-react';

interface DashboardProps {
    shop: Shop;
    onUpdate: (shop: Shop) => void;
}

type TimeRange = 'TODAY' | 'WEEK' | 'MONTH' | 'ALL';

export const Dashboard: React.FC<DashboardProps> = ({ shop, onUpdate }) => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<TimeRange>('MONTH');
    const [selectedBranch, setSelectedBranch] = useState<string>('ALL');

    // Load real bookings
    useEffect(() => {
        const load = async () => {
            const data = await api.getBookings(shop.slug);
            setBookings(data);
            setIsLoading(false);
        };
        load();
    }, [shop.slug]);

    // --- FILTER LOGIC ---
    const filteredBookings = useMemo(() => {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        
        return bookings.filter(b => {
            if (b.status === 'CANCELLED') return false;
            
            if (selectedBranch !== 'ALL') {
                const barber = shop.barbers.find(bar => bar.id === b.barberId);
                const bookingBranch = barber?.branch || 'Casa Central';
                if (bookingBranch !== selectedBranch) return false;
            }

            if (timeRange === 'ALL') return true;
            const bookingDate = new Date(b.date + 'T00:00:00');
            const bookingDateStr = b.date;

            if (timeRange === 'TODAY') return bookingDateStr === todayStr;
            if (timeRange === 'WEEK') {
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay());
                startOfWeek.setHours(0,0,0,0);
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                endOfWeek.setHours(23,59,59,999);
                return bookingDate >= startOfWeek && bookingDate <= endOfWeek;
            }
            if (timeRange === 'MONTH') {
                return bookingDate.getMonth() === now.getMonth() && bookingDate.getFullYear() === now.getFullYear();
            }
            return true;
        });
    }, [bookings, timeRange, selectedBranch, shop.barbers]);
    
    const totalBookings = filteredBookings.length;
    const revenue = filteredBookings
        .filter(b => b.paymentStatus === 'PAID')
        .reduce((acc, curr) => {
            const service = shop.services.find(s => s.id === curr.serviceId);
            return acc + (service?.price || 0);
        }, 0);
    
    const uniqueClientsInPeriod = new Set(filteredBookings.map(b => b.clientPhone)).size;

    const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    const chartData = days.map((day, index) => {
        const count = filteredBookings.filter(b => {
            const d = new Date(b.date + 'T00:00:00');
            return d.getDay() === index;
        }).length;
        return { name: day, turnos: count };
    });
    
    // UPDATED: Alert threshold changed from +2 to exact stock <= minStock
    const lowStockItems = useMemo(() => {
        if (!shop.features.inventory || !shop.inventory) return [];
        return shop.inventory.flatMap(item => {
            const alerts: { name: string, branch: string, stock: number }[] = [];
            Object.entries(item.branchStock || {}).forEach(([branch, data]) => {
                if (selectedBranch !== 'ALL' && branch !== selectedBranch) return;
                const stockInfo = data as StockInfo;
                // Only alert if stock is critical
                if (stockInfo.stock <= stockInfo.minStock) {
                    alerts.push({
                        name: item.name,
                        branch: branch,
                        stock: stockInfo.stock
                    });
                }
            });
            return alerts;
        });
    }, [shop.inventory, selectedBranch, shop.features.inventory]);

    const upcomingBookings = useMemo(() => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const currentHm = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;

        return bookings
            .filter(b => {
                if (b.status === 'CANCELLED') return false;
                if (selectedBranch !== 'ALL') {
                    const barber = shop.barbers.find(bar => bar.id === b.barberId);
                    const bookingBranch = barber?.branch || 'Casa Central';
                    if (bookingBranch !== selectedBranch) return false;
                }
                if (b.date > todayStr) return true;
                if (b.date === todayStr) return b.time >= currentHm;
                return false;
            })
            .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
            .slice(0, 5);
    }, [bookings, selectedBranch, shop.barbers]);

    if (isLoading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>;

    const getRangeLabel = () => {
        switch(timeRange) {
            case 'TODAY': return 'Hoy';
            case 'WEEK': return 'Esta Semana';
            case 'MONTH': return 'Este Mes';
            case 'ALL': return 'Total';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <h1 className="text-2xl font-bold text-gray-800">Panel de Control</h1>
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    {shop.features.multiBranch && (
                        <div className="relative">
                            <Store className="absolute left-3 top-2.5 text-gray-400" size={16}/>
                            <select 
                                value={selectedBranch} 
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                className="pl-10 pr-4 py-2 border rounded-lg text-sm bg-gray-50 font-medium outline-none w-full md:w-auto appearance-none cursor-pointer"
                            >
                                <option value="ALL">Todas las Sedes</option>
                                <option value="Casa Central">Casa Central</option>
                                {shop.branches?.map(b => (
                                    <option key={b.id} value={b.name}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="bg-gray-100 p-1 rounded-lg flex text-xs">
                        {(['TODAY', 'WEEK', 'MONTH', 'ALL'] as TimeRange[]).map((range) => (
                            <button key={range} onClick={() => setTimeRange(range)} className={`px-3 py-1.5 rounded-md font-medium transition-all ${timeRange === range ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>
                                {range === 'TODAY' ? 'Hoy' : range === 'WEEK' ? 'Semana' : range === 'MONTH' ? 'Mes' : 'Total'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm font-medium text-gray-500">Reservas ({getRangeLabel()})</p>
                    <h3 className="text-3xl font-bold text-gray-800 mt-2">{totalBookings}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm font-medium text-gray-500">Ingresos ({getRangeLabel()})</p>
                    <h3 className="text-3xl font-bold text-gray-800 mt-2">${revenue.toLocaleString()}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm font-medium text-gray-500">Clientes</p>
                    <h3 className="text-3xl font-bold text-gray-800 mt-2">{uniqueClientsInPeriod}</h3>
                </div>
                <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 ${lowStockItems.length > 0 ? 'bg-red-50/30' : ''}`}>
                    <p className="text-sm font-medium text-gray-500">Alertas Stock</p>
                    <h3 className={`text-3xl font-bold mt-2 ${lowStockItems.length > 0 ? 'text-red-600' : 'text-gray-800'}`}>{lowStockItems.length}</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
                    <h3 className="text-lg font-bold mb-4">Actividad: {getRangeLabel()}</h3>
                    {/* FIXED: Min height wrapper for ResponsiveContainer to prevent -1 width/height warning */}
                    <div className="h-64 min-h-[256px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="turnos" fill={shop.themeColor} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold mb-4">Próximos Turnos</h3>
                    <div className="space-y-4">
                        {upcomingBookings.map((booking, idx) => (
                            <div key={idx} className="flex items-center gap-3 pb-3 border-b last:border-0 last:pb-0">
                                <div className="text-sm font-bold text-gray-800 w-12">{booking.time}</div>
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900 text-sm truncate">{booking.clientName}</div>
                                    <div className="text-[10px] text-gray-500">{booking.date}</div>
                                </div>
                            </div>
                        ))}
                        {upcomingBookings.length === 0 && <p className="text-gray-400 text-sm">No hay turnos pendientes.</p>}
                    </div>
                </div>
            </div>
            
            {shop.features.inventory && lowStockItems.length > 0 && (
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-bold text-red-600 mb-4 flex items-center gap-2"><AlertCircle size={20}/> Reponer Stock Urgentemente</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {lowStockItems.map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg">
                                <div>
                                    <div className="font-bold text-red-900">{item.name}</div>
                                    <div className="text-xs text-red-700">{item.stock} unidades en {item.branch}</div>
                                </div>
                                <Link to={`/${shop.slug}/admin/insumos`} className="text-xs bg-white text-red-700 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 font-bold">Corregir</Link>
                            </div>
                        ))}
                    </div>
                 </div>
            )}
        </div>
    );
}
