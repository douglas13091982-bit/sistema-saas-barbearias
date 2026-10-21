export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'attendant' | 'barber';
  barberId?: string;
  active: boolean;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  blocked: boolean;
  totalSpent: number;
  totalVisits: number;
  createdAt: string;
}

export interface Barber {
  id: string;
  name: string;
  photo: string;
  specialty: string;
  bio: string;
  active: boolean;
  order: number;
  serviceIds: string[];
  workingHours: WorkingHours[];
  daysOff: string[];
  createdAt: string;
}

export interface WorkingHours {
  dayOfWeek: number;
  start: string;
  end: string;
  active: boolean;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  active: boolean;
  featured: boolean;
  image: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  barberId: string;
  serviceId: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  notes: string;
  paymentStatus: 'pending' | 'paid' | 'partial';
  paymentMethod: 'cash' | 'pix' | 'card' | 'other' | '';
  amountPaid: number;
  cancelReason: string;
  createdAt: string;
}

export interface Testimonial {
  id: string;
  clientName: string;
  text: string;
  rating: number;
  photo: string;
  active: boolean;
  createdAt: string;
}

export interface GalleryImage {
  id: string;
  url: string;
  caption: string;
  order: number;
  createdAt: string;
}

export interface SiteSettings {
  barbershopName: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  heroButtonText: string;
  heroImage: string;
  logo: string;
  favicon: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  state: string;
  cnpj: string;
  socialMedia: {
    instagram: string;
    facebook: string;
    tiktok: string;
    youtube: string;
  };
  businessHours: {
    dayOfWeek: number;
    start: string;
    end: string;
    active: boolean;
  }[];
  minAdvanceHours: number;
  maxAdvanceDays: number;
  intervalMinutes: number;
  toleranceMinutes: number;
  cancelPolicy: string;
  currency: string;
  sections: {
    id: string;
    name: string;
    active: boolean;
    order: number;
  }[];
}

export interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  buttonColor: string;
  textColor: string;
  fontFamily: string;
  darkMode: boolean;
  buttonStyle: 'rounded' | 'sharp' | 'pill';
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  active: boolean;
}

export interface BlockedDate {
  id: string;
  date: string;
  reason: string;
}
