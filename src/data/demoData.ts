import { User, Client, Barber, Service, Appointment, Testimonial, GalleryImage, SiteSettings, ThemeSettings, Holiday } from '../types';

export const defaultUsers: User[] = [
  {
    id: '1',
    name: 'Admin Master',
    email: 'admin@barbershop.com',
    password: 'admin123',
    role: 'admin',
    active: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Carlos Atendente',
    email: 'atendente@barbershop.com',
    password: '123456',
    role: 'attendant',
    active: true,
    createdAt: '2024-01-05T00:00:00Z'
  }
];

export const defaultClients: Client[] = [
  { id: '1', name: 'João Silva', phone: '(11) 99999-1234', email: 'joao@email.com', notes: '', blocked: false, totalSpent: 450, totalVisits: 6, createdAt: '2024-01-10T00:00:00Z' },
  { id: '2', name: 'Pedro Santos', phone: '(11) 98888-5678', email: 'pedro@email.com', notes: 'Prefere barba bem definida', blocked: false, totalSpent: 320, totalVisits: 4, createdAt: '2024-02-15T00:00:00Z' },
  { id: '3', name: 'Lucas Oliveira', phone: '(11) 97777-9012', email: 'lucas@email.com', notes: '', blocked: false, totalSpent: 180, totalVisits: 2, createdAt: '2024-03-20T00:00:00Z' },
  { id: '4', name: 'Rafael Costa', phone: '(11) 96666-3456', email: 'rafael@email.com', notes: 'Cliente VIP', blocked: false, totalSpent: 890, totalVisits: 12, createdAt: '2023-11-01T00:00:00Z' },
  { id: '5', name: 'André Lima', phone: '(11) 95555-7890', email: 'andre@email.com', notes: '', blocked: false, totalSpent: 250, totalVisits: 3, createdAt: '2024-04-01T00:00:00Z' },
];

export const defaultBarbers: Barber[] = [
  {
    id: '1',
    name: 'Ricardo Mendes',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
    specialty: 'Cortes Modernos & Degradê',
    bio: 'Com mais de 10 anos de experiência, Ricardo é especialista em cortes modernos e degradê perfeito.',
    active: true,
    order: 1,
    serviceIds: ['1', '2', '3', '4', '5'],
    workingHours: [
      { dayOfWeek: 1, start: '09:00', end: '18:00', active: true },
      { dayOfWeek: 2, start: '09:00', end: '18:00', active: true },
      { dayOfWeek: 3, start: '09:00', end: '18:00', active: true },
      { dayOfWeek: 4, start: '09:00', end: '18:00', active: true },
      { dayOfWeek: 5, start: '09:00', end: '20:00', active: true },
      { dayOfWeek: 6, start: '09:00', end: '17:00', active: true },
    ],
    daysOff: [],
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Bruno Alves',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face',
    specialty: 'Barba & Tratamentos',
    bio: 'Bruno é mestre em barbas e tratamentos capilares. Seus acabamentos são impecáveis.',
    active: true,
    order: 2,
    serviceIds: ['1', '2', '3', '6', '7'],
    workingHours: [
      { dayOfWeek: 1, start: '10:00', end: '19:00', active: true },
      { dayOfWeek: 2, start: '10:00', end: '19:00', active: true },
      { dayOfWeek: 3, start: '10:00', end: '19:00', active: true },
      { dayOfWeek: 4, start: '10:00', end: '19:00', active: true },
      { dayOfWeek: 5, start: '10:00', end: '20:00', active: true },
      { dayOfWeek: 6, start: '09:00', end: '16:00', active: true },
    ],
    daysOff: [],
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'Diego Ferreira',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face',
    specialty: 'Cortes Clássicos & Navalhado',
    bio: 'Diego combina técnicas clássicas com toques modernos. Especialista em corte navalhado.',
    active: true,
    order: 3,
    serviceIds: ['1', '2', '4', '5', '8'],
    workingHours: [
      { dayOfWeek: 2, start: '09:00', end: '18:00', active: true },
      { dayOfWeek: 3, start: '09:00', end: '18:00', active: true },
      { dayOfWeek: 4, start: '09:00', end: '18:00', active: true },
      { dayOfWeek: 5, start: '09:00', end: '20:00', active: true },
      { dayOfWeek: 6, start: '08:00', end: '15:00', active: true },
    ],
    daysOff: [],
    createdAt: '2024-01-01T00:00:00Z'
  }
];

export const defaultServices: Service[] = [
  { id: '1', name: 'Corte Masculino', description: 'Corte moderno com acabamento perfeito na máquina e tesoura.', price: 55, duration: 40, category: 'Cortes', active: true, featured: true, image: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: '2', name: 'Barba Completa', description: 'Barba com toalha quente, navalha e finalização com balm.', price: 40, duration: 30, category: 'Barba', active: true, featured: true, image: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: '3', name: 'Corte + Barba', description: 'Combo completo com corte e barba. O pacote mais popular.', price: 85, duration: 60, category: 'Combos', active: true, featured: true, image: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: '4', name: 'Degradê Premium', description: 'Degradê perfeito com transição suave e acabamento navalhado.', price: 65, duration: 50, category: 'Cortes', active: true, featured: false, image: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: '5', name: 'Corte Navalhado', description: 'Corte clássico com acabamento na navalha para um visual impecável.', price: 70, duration: 45, category: 'Cortes', active: true, featured: false, image: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: '6', name: 'Hidratação Capilar', description: 'Tratamento profundo para cabelos ressecados com produtos premium.', price: 50, duration: 30, category: 'Tratamentos', active: true, featured: false, image: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: '7', name: 'Limpeza de Pele', description: 'Limpeza facial completa com extração e máscara revitalizante.', price: 60, duration: 40, category: 'Tratamentos', active: true, featured: false, image: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: '8', name: 'Sobrancelha', description: 'Design de sobrancelha masculina com pinça e navalha.', price: 20, duration: 15, category: 'Acabamento', active: true, featured: false, image: '', createdAt: '2024-01-01T00:00:00Z' },
];

export const defaultAppointments: Appointment[] = [
  { id: '1', clientId: '1', barberId: '1', serviceId: '3', date: '2025-01-20', time: '09:00', status: 'completed', notes: '', paymentStatus: 'paid', paymentMethod: 'pix', amountPaid: 85, cancelReason: '', createdAt: '2025-01-19T00:00:00Z' },
  { id: '2', clientId: '2', barberId: '2', serviceId: '1', date: '2025-01-20', time: '10:00', status: 'completed', notes: '', paymentStatus: 'paid', paymentMethod: 'cash', amountPaid: 55, cancelReason: '', createdAt: '2025-01-19T00:00:00Z' },
  { id: '3', clientId: '3', barberId: '1', serviceId: '4', date: '2025-01-21', time: '14:00', status: 'completed', notes: '', paymentStatus: 'paid', paymentMethod: 'card', amountPaid: 65, cancelReason: '', createdAt: '2025-01-20T00:00:00Z' },
  { id: '4', clientId: '4', barberId: '3', serviceId: '5', date: '2025-01-22', time: '11:00', status: 'cancelled', notes: 'Cliente cancelou por motivo pessoal', paymentStatus: 'pending', paymentMethod: '', amountPaid: 0, cancelReason: 'Motivo pessoal', createdAt: '2025-01-21T00:00:00Z' },
  { id: '5', clientId: '5', barberId: '2', serviceId: '2', date: '2025-01-23', time: '15:00', status: 'confirmed', notes: '', paymentStatus: 'pending', paymentMethod: '', amountPaid: 0, cancelReason: '', createdAt: '2025-01-22T00:00:00Z' },
  { id: '6', clientId: '1', barberId: '1', serviceId: '1', date: '2025-01-24', time: '09:30', status: 'pending', notes: 'Primeira vez com Ricardo', paymentStatus: 'pending', paymentMethod: '', amountPaid: 0, cancelReason: '', createdAt: '2025-01-23T00:00:00Z' },
];

export const defaultTestimonials: Testimonial[] = [
  { id: '1', clientName: 'João Silva', text: 'Melhor barbearia da região! O Ricardo é incrível, sempre sai satisfeito. Ambiente top e atendimento de primeira.', rating: 5, photo: '', active: true, createdAt: '2024-06-01T00:00:00Z' },
  { id: '2', clientName: 'Pedro Santos', text: 'A barba que o Bruno faz não tem igual. Profissional demais! Recomendo para todos.', rating: 5, photo: '', active: true, createdAt: '2024-07-15T00:00:00Z' },
  { id: '3', clientName: 'Lucas Oliveira', text: 'Ambiente muito agradável, cerveja gelada e um corte perfeito. O que mais posso pedir?', rating: 4, photo: '', active: true, createdAt: '2024-08-20T00:00:00Z' },
  { id: '4', clientName: 'Rafael Costa', text: 'Frequento há mais de um ano e nunca me decepcionei. Equipe profissional e preço justo.', rating: 5, photo: '', active: true, createdAt: '2024-09-10T00:00:00Z' },
];

export const defaultGallery: GalleryImage[] = [
  { id: '1', url: 'https://images.unsplash.com/photo-1585747860019-024e8567e756?w=600&h=400&fit=crop', caption: 'Nosso espaço', order: 1, createdAt: '2024-01-01T00:00:00Z' },
  { id: '2', url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&h=400&fit=crop', caption: 'Corte degradê', order: 2, createdAt: '2024-01-01T00:00:00Z' },
  { id: '3', url: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&h=400&fit=crop', caption: 'Barba perfeita', order: 3, createdAt: '2024-01-01T00:00:00Z' },
  { id: '4', url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600&h=400&fit=crop', caption: 'Ambiente premium', order: 4, createdAt: '2024-01-01T00:00:00Z' },
  { id: '5', url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&h=400&fit=crop', caption: 'Detalhes do corte', order: 5, createdAt: '2024-01-01T00:00:00Z' },
  { id: '6', url: 'https://images.unsplash.com/photo-1596728325488-58c876d1f9ee?w=600&h=400&fit=crop', caption: 'Produtos premium', order: 6, createdAt: '2024-01-01T00:00:00Z' },
];

export const defaultSiteSettings: SiteSettings = {
  barbershopName: 'BarberShop Pro',
  tagline: 'Estilo, Tradição e Excelência',
  heroTitle: 'Seu Estilo, Nossa Arte',
  heroSubtitle: 'Mais de 10 anos transformando visuais com excelência. Agende agora e descubra o melhor da barbearia moderna.',
  heroButtonText: 'Agendar Agora',
  heroImage: 'https://images.unsplash.com/photo-1585747860019-024e8567e756?w=1920&h=1080&fit=crop',
  logo: '',
  favicon: '',
  phone: '(11) 3456-7890',
  whatsapp: '5511999991234',
  email: 'contato@barbershoppro.com',
  address: 'Rua Augusta, 1234 - Consolação',
  city: 'São Paulo',
  state: 'SP',
  cnpj: '12.345.678/0001-90',
  socialMedia: {
    instagram: 'https://instagram.com/barbershoppro',
    facebook: 'https://facebook.com/barbershoppro',
    tiktok: '',
    youtube: ''
  },
  businessHours: [
    { dayOfWeek: 0, start: '', end: '', active: false },
    { dayOfWeek: 1, start: '09:00', end: '20:00', active: true },
    { dayOfWeek: 2, start: '09:00', end: '20:00', active: true },
    { dayOfWeek: 3, start: '09:00', end: '20:00', active: true },
    { dayOfWeek: 4, start: '09:00', end: '20:00', active: true },
    { dayOfWeek: 5, start: '09:00', end: '21:00', active: true },
    { dayOfWeek: 6, start: '08:00', end: '18:00', active: true },
  ],
  minAdvanceHours: 2,
  maxAdvanceDays: 30,
  intervalMinutes: 15,
  toleranceMinutes: 10,
  cancelPolicy: 'Cancelamentos devem ser feitos com pelo menos 2 horas de antecedência. Cancelamentos tardios podem estar sujeitos a taxa.',
  currency: 'R$',
  sections: [
    { id: 'services', name: 'Serviços', active: true, order: 1 },
    { id: 'barbers', name: 'Barbeiros', active: true, order: 2 },
    { id: 'gallery', name: 'Galeria', active: true, order: 3 },
    { id: 'testimonials', name: 'Depoimentos', active: true, order: 4 },
    { id: 'contact', name: 'Contato', active: true, order: 5 },
  ]
};

export const defaultThemeSettings: ThemeSettings = {
  primaryColor: '#1a1a2e',
  secondaryColor: '#16213e',
  accentColor: '#c9a96e',
  backgroundColor: '#0f0f0f',
  buttonColor: '#c9a96e',
  textColor: '#ffffff',
  fontFamily: 'Inter',
  darkMode: true,
  buttonStyle: 'rounded'
};

export const defaultHolidays: Holiday[] = [
  { id: '1', name: 'Ano Novo', date: '2025-01-01', active: true },
  { id: '2', name: 'Carnaval', date: '2025-03-03', active: true },
  { id: '3', name: 'Carnaval', date: '2025-03-04', active: true },
  { id: '4', name: 'Tiradentes', date: '2025-04-21', active: true },
  { id: '5', name: 'Dia do Trabalho', date: '2025-05-01', active: true },
  { id: '6', name: 'Independência', date: '2025-09-07', active: true },
  { id: '7', name: 'Natal', date: '2025-12-25', active: true },
];
