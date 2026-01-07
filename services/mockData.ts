
import { Shop, Booking, InventoryItem, Client, MembershipPlan, DaySchedule, ReceptionItem, UserSession, NotificationPreferences } from '../types';
import { supabase, isSupabaseConfigured } from '../src/lib/supabase';

const DEFAULT_HOURS: DaySchedule[] = [
    { day: 'Lunes', isOpen: true, openTime: '09:00', closeTime: '20:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
    { day: 'Martes', isOpen: true, openTime: '09:00', closeTime: '20:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
    { day: 'Miércoles', isOpen: true, openTime: '09:00', closeTime: '20:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
    { day: 'Jueves', isOpen: true, openTime: '09:00', closeTime: '20:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
    { day: 'Viernes', isOpen: true, openTime: '09:00', closeTime: '20:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
    { day: 'Sábado', isOpen: true, openTime: '10:00', closeTime: '18:00', hasBreak: false },
    { day: 'Domingo', isOpen: false, openTime: '09:00', closeTime: '18:00', hasBreak: false },
];

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
    emailNewBooking: true,
    emailCancellation: true,
    pushDailySummary: true,
    smsReminders: false
};

const storage = {
    getShops: (): Shop[] => {
        try {
            const stored = localStorage.getItem('turnolibre_shops');
            return stored ? JSON.parse(stored) : [];
        } catch (e) { return []; }
    },
    setShops: (shops: Shop[]) => localStorage.setItem('turnolibre_shops', JSON.stringify(shops)),
    getBookings: (): Booking[] => {
        try {
            const stored = localStorage.getItem('turnolibre_bookings');
            return stored ? JSON.parse(stored) : [];
        } catch (e) { return []; }
    },
    setBookings: (bookings: Booking[]) => localStorage.setItem('turnolibre_bookings', JSON.stringify(bookings))
};

export const api = {
    checkConnection: async (): Promise<boolean> => {
        if (!isSupabaseConfigured() || !supabase) return false;
        try {
            const { error } = await supabase.from('shops').select('count', { count: 'exact', head: true });
            return !error;
        } catch (e) { return false; }
    },

    getShopBySlug: async (slug: string): Promise<Shop | undefined> => {
        if (isSupabaseConfigured() && supabase) {
            try {
                const { data, error } = await supabase.from('shops').select('data').eq('slug', slug).single();
                if (data && !error) {
                    const cloudShop = data.data as Shop;
                    const local = storage.getShops();
                    const filtered = local.filter(s => s.slug !== slug);
                    storage.setShops([...filtered, cloudShop]);
                    return cloudShop;
                }
                if (error && error.code === 'PGRST116') return undefined; // Not found
            } catch (e) { console.warn("Supabase Fetch Error", e); }
        }
        return storage.getShops().find(s => s.slug === slug);
    },

    getAllShops: async (): Promise<Shop[]> => {
        if (isSupabaseConfigured() && supabase) {
            try {
                const { data, error } = await supabase.from('shops').select('data');
                if (data && !error) {
                    const cloudShops = data.map(i => i.data) as Shop[];
                    storage.setShops(cloudShops);
                    return cloudShops;
                }
                if (error) throw error;
            } catch (e: any) { 
                console.error("Supabase Error:", e);
                if (e.message?.includes('fetch') || e.code === '500') {
                    throw new Error("La base de datos Cloud parece estar fuera de línea o pausada.");
                }
            }
        }
        return storage.getShops();
    },

    saveShop: async (shop: Shop): Promise<void> => {
        if (isSupabaseConfigured() && supabase) {
            const { error } = await supabase.from('shops').upsert({
                slug: shop.slug,
                name: shop.name,
                data: shop,
                updated_at: new Date().toISOString()
            }, { onConflict: 'slug' });
            
            if (error) {
                console.error("Error al guardar en la nube:", error);
                throw new Error("Error Cloud: " + error.message);
            }
        }
        const shops = storage.getShops();
        const index = shops.findIndex(s => s.slug === shop.slug);
        const updated = index >= 0 ? shops.map((s, i) => i === index ? shop : s) : [...shops, shop];
        storage.setShops(updated);
    },

    saveBooking: async (booking: Booking): Promise<void> => {
        if (isSupabaseConfigured() && supabase) {
            const { error } = await supabase.from('bookings').upsert({
                id: booking.id,
                shop_slug: booking.shopSlug,
                date: booking.date,
                data: booking
            });
            if (error) throw new Error("Error Cloud: " + error.message);
        }
        const bookings = storage.getBookings();
        const index = bookings.findIndex(b => b.id === booking.id);
        const updated = index >= 0 ? bookings.map((b, i) => i === index ? booking : b) : [...bookings, booking];
        storage.setBookings(updated);
    },

    getBookings: async (shopSlug: string): Promise<Booking[]> => {
        if (isSupabaseConfigured() && supabase) {
            const { data, error } = await supabase.from('bookings').select('data').eq('shop_slug', shopSlug);
            if (data && !error) return data.map(i => i.data) as Booking[];
        }
        return storage.getBookings().filter(b => b.shopSlug === shopSlug);
    },

    login: async (slug: string, user: string, pass: string): Promise<UserSession | null> => {
        const shop = await api.getShopBySlug(slug);
        if (!shop || !shop.active) return null;
        if (shop.adminUser === user && shop.adminPassword === pass) {
            return { id: 'admin-' + shop.id, name: shop.name, role: 'ADMIN', shopSlug: shop.slug };
        }
        const barber = shop.barbers.find(b => b.username === user && b.password === pass && b.active);
        if (barber) return { id: barber.id, name: barber.name, role: 'BARBER', shopSlug: shop.slug };
        return null;
    },

    superAdminLogin: async (user: string, pass: string): Promise<UserSession | null> => {
        if (user === 'admin' && pass === '123456') return { id: 'super-1', name: 'SuperAdmin', role: 'SUPERADMIN' };
        return null;
    },

    createShop: async (data: Partial<Shop>): Promise<void> => {
        const newShop: Shop = {
            id: Math.random().toString(36).substr(2, 9),
            slug: data.slug || `shop-${Date.now()}`,
            name: data.name || 'Nueva Barbería',
            logo: data.logo || 'https://via.placeholder.com/150',
            themeColor: data.themeColor || '#0ea5e9',
            description: data.description || '',
            province: data.province || '',
            city: data.city || '',
            address: data.address || '',
            phone: data.phone || '',
            customDomain: data.customDomain || '',
            active: true,
            plan: data.plan || 'FREE',
            adminUser: data.adminUser || 'admin',
            adminPassword: data.adminPassword || '123',
            features: data.features || { mercadoPago: false, whatsapp: false, multiBranch: false, memberships: false, inventory: false, receptions: false },
            notificationPrefs: DEFAULT_NOTIFICATIONS,
            clients: [], barbers: [], services: [], membershipPlans: [], receptions: [], inventory: [],
            openingHours: DEFAULT_HOURS,
            branches: [] 
        };
        await api.saveShop(newShop);
    }
};
