
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/mockData';
import { Shop } from '../types';
import { Search, MapPin, Loader2, Shield, LayoutGrid } from 'lucide-react';
import { PublicLayout } from '../components/ui/Layouts';

export const Landing: React.FC = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getAllShops();
        setShops(data || []);
      } catch (e: any) {
        setError("Error al cargar la información. Por favor, revisa la conexión con la base de datos y la configuración de RLS en Supabase.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredShops = shops.filter(shop => {
    const matchesSearch = shop.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          shop.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (shop.branches?.some(b => b.city.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesProvince = selectedProvince ? shop.province === selectedProvince : true;
    return matchesSearch && matchesProvince;
  });

  const provinces = Array.from(new Set(shops.map(s => s.province))) as string[];

  return (
    <PublicLayout>
      <section className="bg-slate-900 text-white py-20 px-4 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6">Tu próximo turno,<br/><span className="text-blue-400">más simple.</span></h1>
          <div className="bg-white p-4 rounded-xl shadow-2xl max-w-3xl mx-auto flex flex-col md:flex-row gap-4 text-gray-800">
             <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input className="w-full pl-10 p-2 border rounded-lg" placeholder="Barbería o Ciudad..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
             </div>
             <select className="p-2 border rounded-lg md:w-48" value={selectedProvince} onChange={e => setSelectedProvince(e.target.value)}>
                <option value="">Todas las Provincias</option>
                {provinces.map(p => <option key={p} value={p}>{p}</option>)}
             </select>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
        ) : error ? (
            <div className="col-span-full text-center py-20 text-red-500 bg-red-50 border border-red-200 rounded-lg p-8">
                <h3 className="font-bold text-lg mb-2">¡Ups! Algo salió mal</h3>
                <p>{error}</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredShops.map(shop => {
                    const branchCities = Array.from(new Set([shop.city, ...(shop.branches || []).map(b => b.city)]));
                    return (
                        <Link key={shop.id} to={`/${shop.slug}`} className="block bg-white rounded-2xl shadow-sm hover:shadow-xl border p-5 transition-all transform hover:-translate-y-1">
                            <div className="flex items-center gap-4 mb-4">
                                <img src={shop.logo} className="w-16 h-16 rounded-2xl object-cover border" />
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900 text-lg leading-tight">{shop.name}</h3>
                                    <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                                        <MapPin size={12} />
                                        <span>{branchCities.join(' • ')}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                {shop.features.multiBranch && shop.branches && shop.branches.length > 0 ? (
                                    <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded uppercase flex items-center gap-1">
                                        <LayoutGrid size={10} /> {shop.branches.length + 1} Sedes
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-bold bg-gray-50 text-gray-500 px-2 py-1 rounded uppercase">Sede Única</span>
                                )}
                                <span className="text-sm font-bold text-blue-600">Ver Agenda</span>
                            </div>
                        </Link>
                    );
                })}
                {filteredShops.length === 0 && (
                    <div className="col-span-full text-center py-20 text-gray-400">
                        No se encontraron barberías que coincidan con tu búsqueda.
                    </div>
                )}
            </div>
        )}
      </section>

      <Link to="/admin-login" className="fixed bottom-6 right-6 bg-slate-800 text-white p-4 rounded-full shadow-xl hover:scale-110 transition-transform z-50 flex items-center gap-2" title="Acceso SuperAdmin">
          <Shield size={24} />
      </Link>
    </PublicLayout>
  );
};
