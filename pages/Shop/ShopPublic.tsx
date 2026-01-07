
import React from 'react';
import { Shop } from '../../types';
import { Link } from 'react-router-dom';
import { MapPin as MapPinIcon, Phone, Clock, Star, Calendar, Map, Info, LayoutGrid } from 'lucide-react';

interface ShopPublicProps {
    shop: Shop;
}

export const ShopPublic: React.FC<ShopPublicProps> = ({ shop }) => {
    const activeBarbers = shop.barbers.filter(b => b.active);
    const hasMultipleBranches = shop.features.multiBranch && shop.branches && shop.branches.length > 0;

    return (
        <div className="min-h-screen bg-white pb-20">
            {/* Header / Cover */}
            <div className="h-48 md:h-64 relative bg-gray-900 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center text-white opacity-20 text-9xl font-bold tracking-widest select-none uppercase">
                    {shop.name.substring(0,2)}
                </div>
            </div>

            {/* Info Section */}
            <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-20">
                <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start border">
                    <img 
                        src={shop.logo} 
                        alt={shop.name} 
                        className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-white shadow-lg object-cover"
                    />
                    <div className="flex-1 pt-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-3xl font-bold text-gray-900">{shop.name}</h1>
                            {hasMultipleBranches && (
                                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded uppercase">Multi-sede</span>
                            )}
                        </div>
                        <p className="text-gray-600 mt-2">{shop.description}</p>
                        
                        <div className="flex flex-col gap-1 mt-4 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <MapPinIcon size={14} className="text-gray-400" />
                                <span className="font-medium text-gray-700">Sede Principal:</span> {shop.address}, {shop.city}
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone size={14} className="text-gray-400" />
                                {shop.phone}
                            </div>
                        </div>
                    </div>
                    <div className="w-full md:w-auto mt-4 md:mt-0">
                         <Link 
                            to={`/${shop.slug}/reserva`}
                            className="block w-full md:w-auto px-10 py-4 rounded-xl font-extrabold text-white shadow-lg text-center transform transition hover:-translate-y-1 hover:brightness-110"
                            style={{ backgroundColor: shop.themeColor }}
                        >
                            Reservar Ahora
                        </Link>
                    </div>
                </div>

                {/* Branches List (If applicable) */}
                {hasMultipleBranches && (
                    <div className="mt-12 animate-fade-in">
                        <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                            <LayoutGrid size={20} className="text-blue-500" /> Nuestras Ubicaciones
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 border rounded-xl bg-gray-50 flex items-start gap-3">
                                <MapPinIcon size={18} className="text-blue-500 mt-1 flex-shrink-0" />
                                <div>
                                    <div className="font-bold text-gray-900">Casa Central</div>
                                    <div className="text-sm text-gray-600">{shop.address}, {shop.city}</div>
                                    <div className="text-[10px] text-blue-600 font-bold uppercase mt-1">Sede Principal</div>
                                </div>
                            </div>
                            {shop.branches?.map(branch => (
                                <div key={branch.id} className="p-4 border rounded-xl bg-white hover:border-blue-200 transition-colors flex items-start gap-3">
                                    <MapPinIcon size={18} className="text-gray-400 mt-1 flex-shrink-0" />
                                    <div>
                                        <div className="font-bold text-gray-900">{branch.name}</div>
                                        <div className="text-sm text-gray-600">{branch.address}, {branch.city}</div>
                                        {branch.phone && <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><Phone size={10}/> {branch.phone}</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Services Grid */}
                <div className="mt-12">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800">Servicios</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {shop.services.map(service => (
                            <div key={service.id} className="bg-gray-50 p-5 rounded-xl border border-gray-100 flex justify-between items-center hover:shadow-md transition-shadow">
                                <div>
                                    <h3 className="font-bold text-gray-900">{service.name}</h3>
                                    <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                                    <div className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                        <Clock size={12} /> {service.duration} min
                                    </div>
                                </div>
                                <div className="text-lg font-bold" style={{ color: shop.themeColor }}>
                                    ${service.price}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Team */}
                {activeBarbers.length > 0 && (
                    <div className="mt-12">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">Nuestro Equipo</h2>
                        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                            {activeBarbers.map(barber => (
                                <div key={barber.id} className="flex-shrink-0 w-48 bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                    <img src={barber.avatar} alt={barber.name} className="w-full h-48 object-cover" />
                                    <div className="p-4">
                                        <h3 className="font-bold text-gray-900">{barber.name}</h3>
                                        <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider line-clamp-1">{barber.specialties.join(' • ')}</div>
                                        {barber.branch && (
                                            <div className="text-[10px] font-bold text-blue-600 mt-2 flex items-center gap-1 uppercase">
                                                <MapPinIcon size={10}/> {barber.branch}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            <div className="mt-20 text-center">
                 <Link to={`/${shop.slug}/login`} className="text-[10px] font-bold text-gray-300 hover:text-gray-500 uppercase tracking-widest">
                    Administración de Negocio
                 </Link>
            </div>
        </div>
    );
};
