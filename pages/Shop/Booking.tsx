
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/mockData';
import { Shop, Service, Barber, Booking, Client } from '../../types';
import { 
    ChevronRight, MapPin as MapPinIcon, Clock, Calendar, 
    User, Scissors, CheckCircle, Loader2, ArrowLeft, Phone, Search
} from 'lucide-react';
import { PublicLayout } from '../../components/ui/Layouts';

export const BookingFlow: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [shop, setShop] = useState<Shop | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentStep, setCurrentStep] = useState(1);

    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

    // Selections state
    const [selectedBranch, setSelectedBranch] = useState<string>('Casa Central');
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>(todayStr);
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [isClientFound, setIsClientFound] = useState(false);

    useEffect(() => {
        const load = async () => {
            if (slug) {
                const data = await api.getShopBySlug(slug);
                setShop(data || null);
                // If shop has no extra branches, skip to step 2
                if (data && (!data.features.multiBranch || !data.branches || data.branches.length === 0)) {
                    setCurrentStep(2);
                }
            }
            setLoading(false);
        };
        load();
    }, [slug]);

    // Available time slots logic - Strictly filtering past hours for today
    const availableSlots = useMemo(() => {
        const slots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
        
        if (selectedDate === todayStr) {
            const now = new Date();
            const currentHm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            return slots.filter(slot => slot > currentHm);
        }
        
        return slots;
    }, [selectedDate, todayStr]);

    // FIXED: Real-time client lookup and cleanup
    const handlePhoneChange = (value: string) => {
        setClientPhone(value);
        if (!shop) return;

        const cleanInput = value.replace(/\D/g, '');

        // If phone is empty, reset everything immediately
        if (cleanInput.length === 0) {
            setClientName('');
            setIsClientFound(false);
            return;
        }

        // Search logic only if enough digits
        if (cleanInput.length >= 7) {
            const found = shop.clients.find(c => {
                const cleanClientPhone = c.phone.replace(/\D/g, '');
                return cleanClientPhone.includes(cleanInput) || cleanInput.includes(cleanClientPhone);
            });

            if (found) {
                setClientName(`${found.firstName} ${found.lastName}`);
                setIsClientFound(true);
            } else {
                // Not found but enough digits: clear
                setClientName('');
                setIsClientFound(false);
            }
        } else {
            // Less than 7 digits: clear name if it was previously set
            if (clientName !== '') {
                setClientName('');
                setIsClientFound(false);
            }
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;
    if (!shop) return <div className="p-10 text-center">Tienda no encontrada</div>;

    const handleBranchSelect = (branchName: string) => {
        setSelectedBranch(branchName);
        setCurrentStep(2);
    };

    const handleServiceSelect = (service: Service) => {
        setSelectedService(service);
        setCurrentStep(3);
    };

    const handleBarberSelect = (barber: Barber) => {
        setSelectedBarber(barber);
        setCurrentStep(4);
    };

    const handleDateTimeSelect = (date: string, time: string) => {
        setSelectedDate(date);
        setSelectedTime(time);
        setCurrentStep(5);
    };

    const handleConfirm = async () => {
        if (!clientName || !clientPhone || !selectedService || !selectedBarber) return;

        const booking: Booking = {
            id: Math.random().toString(36).substr(2, 9),
            shopSlug: shop.slug,
            serviceId: selectedService.id,
            barberId: selectedBarber.id,
            clientId: isClientFound ? (shop.clients.find(c => `${c.firstName} ${c.lastName}` === clientName)?.id || 'guest-' + Date.now()) : 'guest-' + Date.now(),
            date: selectedDate,
            time: selectedTime,
            clientName,
            clientPhone,
            status: 'CONFIRMED',
            paymentStatus: 'PENDING'
        };

        await api.saveBooking(booking);
        navigate(`/${shop.slug}/reserva/confirmacion`);
    };

    const filteredBarbers = shop.barbers.filter(b => b.active && (b.branch === selectedBranch || (!b.branch && selectedBranch === 'Casa Central')));

    return (
        <PublicLayout>
            <div className="max-w-xl mx-auto p-4 py-10">
                <div className="mb-8 flex justify-between items-center">
                    <button 
                        onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))} 
                        className={`text-gray-400 hover:text-gray-600 transition-colors ${currentStep === 1 || (!shop.features.multiBranch && currentStep === 2) ? 'invisible' : ''}`}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(s => (
                            <div key={s} className={`h-1.5 w-8 rounded-full transition-all duration-300 ${currentStep >= s ? 'bg-blue-600' : 'bg-gray-200'}`} />
                        ))}
                    </div>
                    <div className="w-5" />
                </div>

                {/* STEP 1: BRANCH */}
                {currentStep === 1 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">¿A qué sucursal quieres ir?</h2>
                        <div className="space-y-3">
                            <button onClick={() => handleBranchSelect('Casa Central')} className="w-full p-4 border rounded-xl flex items-center justify-between hover:border-blue-500 hover:bg-blue-50 transition-all shadow-sm bg-white text-left">
                                <div className="flex items-center gap-3">
                                    <div className="bg-gray-100 p-2 rounded-lg text-gray-600"><MapPinIcon size={24}/></div>
                                    <div>
                                        <div className="font-bold text-gray-900">Casa Central</div>
                                        <div className="text-xs text-gray-500">{shop.address}, {shop.city}</div>
                                    </div>
                                </div>
                                <ChevronRight className="text-gray-400" size={20}/>
                            </button>
                            {shop.branches?.map(branch => (
                                <button key={branch.id} onClick={() => handleBranchSelect(branch.name)} className="w-full p-4 border rounded-xl flex items-center justify-between hover:border-blue-500 hover:bg-blue-50 transition-all shadow-sm bg-white text-left">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><MapPinIcon size={24}/></div>
                                        <div>
                                            <div className="font-bold text-gray-900">{branch.name}</div>
                                            <div className="text-xs text-gray-500">{branch.address}, {branch.city}</div>
                                        </div>
                                    </div>
                                    <ChevronRight className="text-gray-400" size={20}/>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 2: SERVICE */}
                {currentStep === 2 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">Elige un servicio</h2>
                        <div className="grid grid-cols-1 gap-3">
                            {shop.services.map(service => (
                                <button key={service.id} onClick={() => handleServiceSelect(service)} className="w-full p-5 border rounded-xl flex items-center justify-between hover:border-blue-500 hover:bg-blue-50 transition-all shadow-sm bg-white group text-left">
                                    <div>
                                        <div className="font-bold text-gray-900 group-hover:text-blue-700">{service.name}</div>
                                        <div className="text-xs text-gray-500 mt-1">{service.description}</div>
                                        <div className="flex items-center gap-3 mt-3">
                                            <span className="text-xs font-bold text-gray-400 flex items-center gap-1"><Clock size={12}/> {service.duration} min</span>
                                            <span className="text-sm font-bold text-blue-600">${service.price}</span>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-2 rounded-lg group-hover:bg-blue-100 transition-colors"><Scissors size={20} className="text-gray-400 group-hover:text-blue-600"/></div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 3: BARBER */}
                {currentStep === 3 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">¿Con quién te atiendes?</h2>
                        <div className="grid grid-cols-1 gap-3">
                            {filteredBarbers.map(barber => (
                                <button key={barber.id} onClick={() => handleBarberSelect(barber)} className="w-full p-4 border rounded-xl flex items-center justify-between hover:border-blue-500 hover:bg-blue-50 transition-all shadow-sm bg-white group text-left">
                                    <div className="flex items-center gap-4">
                                        <img src={barber.avatar} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" />
                                        <div>
                                            <div className="font-bold text-gray-900">{barber.name}</div>
                                            <div className="text-xs text-gray-500 mt-1">{barber.specialties.join(' • ')}</div>
                                            <div className="text-[10px] text-blue-600 font-bold uppercase mt-1">{barber.branch || 'Casa Central'}</div>
                                        </div>
                                    </div>
                                    <ChevronRight className="text-gray-400" size={20}/>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 4: DATE & TIME */}
                {currentStep === 4 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">Selecciona fecha y hora</h2>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-6">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase block mb-2 tracking-wider">Fecha de Reserva</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-3.5 text-blue-500 pointer-events-none" size={18} />
                                    <input 
                                        type="date" 
                                        min={todayStr}
                                        onKeyDown={(e) => e.preventDefault()} 
                                        onClick={(e) => (e.currentTarget as any).showPicker?.()}
                                        className="w-full p-3.5 pl-12 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100 transition-shadow bg-gray-50 font-bold text-gray-700 cursor-pointer appearance-none"
                                        onChange={(e) => {
                                            setSelectedDate(e.target.value);
                                            setSelectedTime('');
                                        }}
                                        value={selectedDate}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase block mb-3 tracking-wider">
                                    Horarios Disponibles {selectedDate === todayStr ? '(Hoy)' : ''}
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {availableSlots.map(t => (
                                        <button 
                                            key={t}
                                            onClick={() => handleDateTimeSelect(selectedDate, t)}
                                            className={`p-3 rounded-xl text-sm font-bold border transition-all ${selectedTime === t ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-700 hover:border-blue-300 active:scale-95'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                    {availableSlots.length === 0 && (
                                        <div className="col-span-3 py-6 text-center text-red-500 text-xs font-bold bg-red-50 rounded-xl border border-red-100">
                                            No quedan horarios disponibles para hoy. Por favor selecciona otra fecha.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 5: CONFIRMATION (REFINED LOOKUP) */}
                {currentStep === 5 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">Finaliza tu reserva</h2>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-5">
                            <div className="p-4 bg-gray-50 rounded-xl flex items-start gap-3 mb-2 border border-gray-100">
                                <div className="bg-blue-600 p-2 rounded-lg text-white mt-0.5"><Clock size={16}/></div>
                                <div>
                                    <div className="text-sm font-bold text-gray-900">{selectedService?.name}</div>
                                    <div className="text-xs text-gray-500 font-medium">Con {selectedBarber?.name} • {selectedBranch}</div>
                                    <div className="text-xs text-blue-600 font-bold mt-1 uppercase">{selectedDate} a las {selectedTime} hs</div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1.5 tracking-widest ml-1">Tu Teléfono</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3.5 text-gray-400" size={16} />
                                        <input 
                                            type="tel"
                                            className="w-full p-3.5 pl-10 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100 transition-shadow font-bold text-gray-700" 
                                            placeholder="351-1234567"
                                            value={clientPhone}
                                            onChange={e => handlePhoneChange(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1.5 tracking-widest ml-1">Tu Nombre</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3.5 text-gray-400" size={16} />
                                        <input 
                                            className="w-full p-3.5 pl-10 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100 transition-shadow font-bold text-gray-700" 
                                            placeholder="Ej: Juan Perez"
                                            value={clientName}
                                            onChange={e => setClientName(e.target.value)}
                                        />
                                        {isClientFound && (
                                            <div className="absolute right-3 top-3.5 flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-100">
                                                <CheckCircle size={12}/> Cliente Frecuente
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handleConfirm}
                                disabled={!clientName || !clientPhone}
                                className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all transform active:scale-95 disabled:opacity-40 disabled:grayscale mt-2"
                            >
                                Confirmar Turno
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </PublicLayout>
    );
};

export const BookingSuccess: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    return (
        <PublicLayout>
            <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-8 shadow-inner border-4 border-white">
                    <CheckCircle size={56} />
                </div>
                <h1 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">¡Todo listo!</h1>
                <p className="text-gray-500 max-w-sm mb-10 leading-relaxed">Tu turno ha sido confirmado con éxito. Te esperamos en el local.</p>
                <Link to={`/${slug}`} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl active:scale-95">
                    Volver al Inicio
                </Link>
            </div>
        </PublicLayout>
    );
};
