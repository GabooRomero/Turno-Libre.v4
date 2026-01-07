
export type Role = 'SUPERADMIN' | 'ADMIN' | 'BARBER' | 'CLIENT';

export interface UserSession {
  role: Role;
  shopSlug?: string;
  name: string;
  id: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  phone: string;
}

export interface Barber {
  id: string;
  name: string;
  specialties: string[];
  avatar: string;
  active: boolean;
  username?: string;
  password?: string;
  branch?: string; // Linked by Branch ID or Name
}

export interface MembershipPlan {
  id: string;
  name: string;
  sessions: number;
  price: number;
  validityDays: number;
  description?: string;
  active?: boolean;
}

export interface ClientMembership {
  planId: string;
  planName: string;
  sessionsTotal: number;
  sessionsUsed: number;
  startDate: string;
  expiryDate: string;
  id?: string;
}

export interface Client {
  id: string;
  shopSlug: string;
  firstName: string;
  lastName: string;
  phone: string;
  type: 'REGULAR' | 'EXPRESS';
  notes?: string;
  activeMembership?: ClientMembership;
  pastMemberships?: ClientMembership[];
  lastVisit?: string;
}

export interface DaySchedule {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  hasBreak: boolean;
  breakStart?: string;
  breakEnd?: string;
}

export interface NotificationPreferences {
  emailNewBooking: boolean;
  emailCancellation: boolean;
  pushDailySummary: boolean;
  smsReminders: boolean;
}

export interface StockInfo {
  stock: number;
  minStock: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  branchStock: { [branchName: string]: StockInfo };
  active?: boolean; 
}

export interface ReceptionItem {
  id: string;
  name: string;
  branchStock: { [branchName: string]: StockInfo };
  active?: boolean;
}

export interface Shop {
  id: string;
  slug: string;
  name: string;
  logo: string;
  themeColor: string;
  description: string;
  province: string;
  city: string;
  address: string;
  phone: string;
  active?: boolean;
  customDomain?: string; // Nuevo: Para mapear el dominio propio
  
  adminUser?: string;
  adminPassword?: string;

  services: Service[];
  barbers: Barber[];
  membershipPlans: MembershipPlan[];
  clients: Client[];
  plan: 'FREE' | 'BASIC' | 'PRO';
  openingHours: DaySchedule[];
  branchSchedules?: { [key: string]: DaySchedule[] };
  notificationPrefs: NotificationPreferences;
  branches?: Branch[]; 
  features: {
    mercadoPago: boolean;
    mercadoPagoToken?: string;
    whatsapp: boolean;
    multiBranch: boolean;
    memberships: boolean;
    inventory: boolean;
    receptions: boolean;
  };
  receptions: ReceptionItem[];
  inventory: InventoryItem[];
}

export interface Booking {
  id: string;
  shopSlug: string;
  serviceId: string;
  barberId: string;
  clientId: string;
  date: string;
  time: string;
  clientName: string;
  clientPhone: string;
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'ABSENT';
  paymentStatus: 'PENDING' | 'PAID';
}
