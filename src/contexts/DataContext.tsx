import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Client, Barber, Service, Appointment, Testimonial, GalleryImage, SiteSettings, ThemeSettings, Holiday } from '../types';
import { defaultUsers, defaultClients, defaultBarbers, defaultServices, defaultAppointments, defaultTestimonials, defaultGallery, defaultSiteSettings, defaultThemeSettings, defaultHolidays } from '../data/demoData';

interface DataContextType {
  users: User[];
  clients: Client[];
  barbers: Barber[];
  services: Service[];
  appointments: Appointment[];
  testimonials: Testimonial[];
  gallery: GalleryImage[];
  siteSettings: SiteSettings;
  themeSettings: ThemeSettings;
  holidays: Holiday[];
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'totalSpent' | 'totalVisits'>) => void;
  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt'>) => void;
  updateAppointment: (id: string, data: Partial<Appointment>) => void;
  updateService: (id: string, data: Partial<Service>) => void;
  addService: (service: Omit<Service, 'id' | 'createdAt'>) => void;
  deleteService: (id: string) => void;
  updateBarber: (id: string, data: Partial<Barber>) => void;
  addBarber: (barber: Omit<Barber, 'id' | 'createdAt'>) => void;
  deleteBarber: (id: string) => void;
  updateTestimonial: (id: string, data: Partial<Testimonial>) => void;
  addTestimonial: (testimonial: Omit<Testimonial, 'id' | 'createdAt'>) => void;
  deleteTestimonial: (id: string) => void;
  updateGalleryImage: (id: string, data: Partial<GalleryImage>) => void;
  addGalleryImage: (image: Omit<GalleryImage, 'id' | 'createdAt'>) => void;
  deleteGalleryImage: (id: string) => void;
  updateSiteSettings: (settings: Partial<SiteSettings>) => void;
  updateThemeSettings: (settings: Partial<ThemeSettings>) => void;
  updateClient: (id: string, data: Partial<Client>) => void;
  addHoliday: (holiday: Omit<Holiday, 'id'>) => void;
  deleteHoliday: (id: string) => void;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error(`Error loading ${key} from storage`, e);
  }
  return defaultValue;
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to storage`, e);
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(() => loadFromStorage('users', defaultUsers));
  const [clients, setClients] = useState<Client[]>(() => loadFromStorage('clients', defaultClients));
  const [barbers, setBarbers] = useState<Barber[]>(() => loadFromStorage('barbers', defaultBarbers));
  const [services, setServices] = useState<Service[]>(() => loadFromStorage('services', defaultServices));
  const [appointments, setAppointments] = useState<Appointment[]>(() => loadFromStorage('appointments', defaultAppointments));
  const [testimonials, setTestimonials] = useState<Testimonial[]>(() => loadFromStorage('testimonials', defaultTestimonials));
  const [gallery, setGallery] = useState<GalleryImage[]>(() => loadFromStorage('gallery', defaultGallery));
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => loadFromStorage('siteSettings', defaultSiteSettings));
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(() => loadFromStorage('themeSettings', defaultThemeSettings));
  const [holidays, setHolidays] = useState<Holiday[]>(() => loadFromStorage('holidays', defaultHolidays));
  const [currentUser, setCurrentUser] = useState<User | null>(() => loadFromStorage('currentUser', null));

  useEffect(() => { saveToStorage('users', users); }, [users]);
  useEffect(() => { saveToStorage('clients', clients); }, [clients]);
  useEffect(() => { saveToStorage('barbers', barbers); }, [barbers]);
  useEffect(() => { saveToStorage('services', services); }, [services]);
  useEffect(() => { saveToStorage('appointments', appointments); }, [appointments]);
  useEffect(() => { saveToStorage('testimonials', testimonials); }, [testimonials]);
  useEffect(() => { saveToStorage('gallery', gallery); }, [gallery]);
  useEffect(() => { saveToStorage('siteSettings', siteSettings); }, [siteSettings]);
  useEffect(() => { saveToStorage('themeSettings', themeSettings); }, [themeSettings]);
  useEffect(() => { saveToStorage('holidays', holidays); }, [holidays]);
  useEffect(() => { saveToStorage('currentUser', currentUser); }, [currentUser]);

  const login = (email: string, password: string): boolean => {
    const user = users.find(u => u.email === email && u.password === password && u.active);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => setCurrentUser(null);

  const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

  const addClient = (client: Omit<Client, 'id' | 'createdAt' | 'totalSpent' | 'totalVisits'>) => {
    setClients(prev => [...prev, { ...client, id: generateId(), totalSpent: 0, totalVisits: 0, createdAt: new Date().toISOString() }]);
  };

  const addAppointment = (appointment: Omit<Appointment, 'id' | 'createdAt'>) => {
    const newAppt = { ...appointment, id: generateId(), createdAt: new Date().toISOString() };
    setAppointments(prev => [...prev, newAppt]);
    // Update client stats
    if (appointment.status === 'completed') {
      const service = services.find(s => s.id === appointment.serviceId);
      setClients(prev => prev.map(c => c.id === appointment.clientId ? {
        ...c,
        totalVisits: c.totalVisits + 1,
        totalSpent: c.totalSpent + (service?.price || 0)
      } : c));
    }
  };

  const updateAppointment = (id: string, data: Partial<Appointment>) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
  };

  const updateService = (id: string, data: Partial<Service>) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  };

  const addService = (service: Omit<Service, 'id' | 'createdAt'>) => {
    setServices(prev => [...prev, { ...service, id: generateId(), createdAt: new Date().toISOString() }]);
  };

  const deleteService = (id: string) => {
    const hasAppointments = appointments.some(a => a.serviceId === id);
    if (hasAppointments) {
      updateService(id, { active: false });
    } else {
      setServices(prev => prev.filter(s => s.id !== id));
    }
  };

  const updateBarber = (id: string, data: Partial<Barber>) => {
    setBarbers(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
  };

  const addBarber = (barber: Omit<Barber, 'id' | 'createdAt'>) => {
    setBarbers(prev => [...prev, { ...barber, id: generateId(), createdAt: new Date().toISOString() }]);
  };

  const deleteBarber = (id: string) => {
    setBarbers(prev => prev.filter(b => b.id !== id));
  };

  const updateTestimonial = (id: string, data: Partial<Testimonial>) => {
    setTestimonials(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
  };

  const addTestimonial = (testimonial: Omit<Testimonial, 'id' | 'createdAt'>) => {
    setTestimonials(prev => [...prev, { ...testimonial, id: generateId(), createdAt: new Date().toISOString() }]);
  };

  const deleteTestimonial = (id: string) => {
    setTestimonials(prev => prev.filter(t => t.id !== id));
  };

  const updateGalleryImage = (id: string, data: Partial<GalleryImage>) => {
    setGallery(prev => prev.map(g => g.id === id ? { ...g, ...data } : g));
  };

  const addGalleryImage = (image: Omit<GalleryImage, 'id' | 'createdAt'>) => {
    setGallery(prev => [...prev, { ...image, id: generateId(), createdAt: new Date().toISOString() }]);
  };

  const deleteGalleryImage = (id: string) => {
    setGallery(prev => prev.filter(g => g.id !== id));
  };

  const updateSiteSettings = (settings: Partial<SiteSettings>) => {
    setSiteSettings(prev => ({ ...prev, ...settings }));
  };

  const updateThemeSettings = (settings: Partial<ThemeSettings>) => {
    setThemeSettings(prev => ({ ...prev, ...settings }));
  };

  const updateClient = (id: string, data: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const addHoliday = (holiday: Omit<Holiday, 'id'>) => {
    setHolidays(prev => [...prev, { ...holiday, id: generateId() }]);
  };

  const deleteHoliday = (id: string) => {
    setHolidays(prev => prev.filter(h => h.id !== id));
  };

  const addUser = (user: Omit<User, 'id' | 'createdAt'>) => {
    setUsers(prev => [...prev, { ...user, id: generateId(), createdAt: new Date().toISOString() }]);
  };

  const updateUser = (id: string, data: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  return (
    <DataContext.Provider value={{
      users, clients, barbers, services, appointments, testimonials, gallery,
      siteSettings, themeSettings, holidays, currentUser,
      isAuthenticated: !!currentUser,
      login, logout,
      addClient, addAppointment, updateAppointment,
      updateService, addService, deleteService,
      updateBarber, addBarber, deleteBarber,
      updateTestimonial, addTestimonial, deleteTestimonial,
      updateGalleryImage, addGalleryImage, deleteGalleryImage,
      updateSiteSettings, updateThemeSettings,
      updateClient, addHoliday, deleteHoliday,
      addUser, updateUser, deleteUser
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
}
