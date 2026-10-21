// @ts-nocheck -- imported code, kept as written
import { useData } from '../../contexts/DataContext';
import { Link } from '@/lib/router-compat';
import { Scissors, Star, MapPin, Phone, Clock, Instagram, Facebook, ChevronRight, Calendar, Users, Award, MessageCircle } from 'lucide-react';

export default function Home() {
  const { services, barbers, testimonials, gallery, siteSettings, themeSettings } = useData();
  const activeServices = services.filter(s => s.active);
  const activeBarbers = barbers.filter(b => b.active).sort((a, b) => a.order - b.order);
  const activeTestimonials = testimonials.filter(t => t.active);
  const theme = themeSettings;

  const cssVars = {
    '--color-primary': theme.primaryColor,
    '--color-secondary': theme.secondaryColor,
    '--color-accent': theme.accentColor,
    '--color-bg': theme.backgroundColor,
    '--color-button': theme.buttonColor,
    '--color-text': theme.textColor,
  } as React.CSSProperties;

  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const activeHours = siteSettings.businessHours.filter(bh => bh.active);

  return (
    <div className="min-h-screen" style={{ ...cssVars, fontFamily: theme.fontFamily, backgroundColor: theme.backgroundColor, color: theme.textColor }}>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/60 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Scissors className="w-6 h-6" style={{ color: theme.accentColor }} />
              <span className="text-xl font-bold" style={{ fontFamily: 'Playfair Display' }}>{siteSettings.barbershopName}</span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm">
              <a href="#servicos" className="hover:opacity-80 transition">Serviços</a>
              <a href="#barbeiros" className="hover:opacity-80 transition">Barbeiros</a>
              <a href="#galeria" className="hover:opacity-80 transition">Galeria</a>
              <a href="#depoimentos" className="hover:opacity-80 transition">Depoimentos</a>
              <a href="#contato" className="hover:opacity-80 transition">Contato</a>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/agendar"
                className="px-5 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105"
                style={{ backgroundColor: theme.buttonColor, color: theme.darkMode ? '#000' : '#fff' }}
              >
                {siteSettings.heroButtonText}
              </Link>
              <Link
                to="/admin/login"
                className="text-xs opacity-50 hover:opacity-100 transition"
              >
                Admin
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={siteSettings.heroImage}
            alt="Barbearia"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/90" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm">
            <Award className="w-4 h-4" style={{ color: theme.accentColor }} />
            <span className="text-sm text-white/80">{siteSettings.tagline}</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white" style={{ fontFamily: 'Playfair Display' }}>
            {siteSettings.heroTitle}
          </h1>
          <p className="text-lg md:text-xl text-white/70 mb-8 max-w-2xl mx-auto">
            {siteSettings.heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/agendar"
              className="px-8 py-4 rounded-xl text-lg font-bold transition-all hover:scale-105 hover:shadow-2xl flex items-center gap-2"
              style={{ backgroundColor: theme.buttonColor, color: theme.darkMode ? '#000' : '#fff' }}
            >
              <Calendar className="w-5 h-5" />
              {siteSettings.heroButtonText}
            </Link>
            <a
              href={`https://wa.me/${siteSettings.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 rounded-xl text-lg font-semibold border border-white/30 text-white hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              WhatsApp
            </a>
          </div>
          <div className="mt-12 flex items-center justify-center gap-8 text-white/60 text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" style={{ color: theme.accentColor }} />
              <span>+2000 clientes</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" style={{ color: theme.accentColor }} />
              <span>4.9 estrelas</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4" style={{ color: theme.accentColor }} />
              <span>+10 anos</span>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="servicos" className="py-20 px-4" style={{ backgroundColor: theme.backgroundColor }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'Playfair Display' }}>Nossos Serviços</h2>
            <p className="text-white/60 max-w-2xl mx-auto">Serviços profissionais para transformar seu visual com excelência</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeServices.map(service => (
              <div key={service.id} className="group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 hover:border-white/20 transition-all hover:transform hover:scale-[1.02]">
                {service.featured && (
                  <div className="absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: theme.accentColor, color: '#000' }}>
                    Popular
                  </div>
                )}
                <div className="mb-4">
                  <Scissors className="w-8 h-8" style={{ color: theme.accentColor }} />
                </div>
                <h3 className="text-xl font-bold mb-2">{service.name}</h3>
                <p className="text-white/60 text-sm mb-4">{service.description}</p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold" style={{ color: theme.accentColor }}>
                    {siteSettings.currency} {service.price.toFixed(2)}
                  </span>
                  <span className="text-sm text-white/50 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {service.duration} min
                  </span>
                </div>
                <Link
                  to={`/agendar?service=${service.id}`}
                  className="w-full py-3 rounded-lg text-center font-semibold text-sm transition-all hover:opacity-90 flex items-center justify-center gap-2"
                  style={{ backgroundColor: theme.buttonColor, color: theme.darkMode ? '#000' : '#fff' }}
                >
                  Agendar <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Barbers Section */}
      <section id="barbeiros" className="py-20 px-4" style={{ backgroundColor: theme.secondaryColor }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'Playfair Display' }}>Nossos Barbeiros</h2>
            <p className="text-white/60 max-w-2xl mx-auto">Profissionais experientes prontos para atender você</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeBarbers.map(barber => (
              <div key={barber.id} className="group text-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 hover:border-white/20 transition-all">
                <div className="relative w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-2" style={{ borderColor: theme.accentColor }}>
                  <img src={barber.photo} alt={barber.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-xl font-bold mb-1">{barber.name}</h3>
                <p className="text-sm mb-3" style={{ color: theme.accentColor }}>{barber.specialty}</p>
                <p className="text-white/60 text-sm mb-6">{barber.bio}</p>
                <Link
                  to={`/agendar?barber=${barber.id}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all hover:scale-105"
                  style={{ backgroundColor: theme.buttonColor, color: theme.darkMode ? '#000' : '#fff' }}
                >
                  Agendar com {barber.name.split(' ')[0]} <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="galeria" className="py-20 px-4" style={{ backgroundColor: theme.backgroundColor }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'Playfair Display' }}>Galeria</h2>
            <p className="text-white/60 max-w-2xl mx-auto">Confira nosso espaço e alguns dos nossos trabalhos</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {gallery.map((img, idx) => (
              <div key={img.id} className={`relative rounded-xl overflow-hidden group cursor-pointer ${idx === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}>
                <img src={img.url} alt={img.caption} className="w-full h-full object-cover min-h-[200px] group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end p-4">
                  <span className="text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity">{img.caption}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="depoimentos" className="py-20 px-4" style={{ backgroundColor: theme.secondaryColor }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'Playfair Display' }}>O que dizem nossos clientes</h2>
            <p className="text-white/60 max-w-2xl mx-auto">A satisfação dos nossos clientes é nosso maior orgulho</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {activeTestimonials.map(testimonial => (
              <div key={testimonial.id} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4" fill={i < testimonial.rating ? theme.accentColor : 'transparent'} stroke={i < testimonial.rating ? theme.accentColor : 'currentColor'} />
                  ))}
                </div>
                <p className="text-white/80 text-sm mb-4 italic">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: theme.accentColor, color: '#000' }}>
                    {testimonial.clientName.charAt(0)}
                  </div>
                  <span className="font-semibold text-sm">{testimonial.clientName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contato" className="py-20 px-4" style={{ backgroundColor: theme.backgroundColor }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'Playfair Display' }}>Localização & Contato</h2>
            <p className="text-white/60 max-w-2xl mx-auto">Venha nos visitar ou entre em contato</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 rounded-xl border border-white/10 bg-white/5">
                <MapPin className="w-6 h-6 flex-shrink-0 mt-1" style={{ color: theme.accentColor }} />
                <div>
                  <h4 className="font-semibold mb-1">Endereço</h4>
                  <p className="text-white/60 text-sm">{siteSettings.address}</p>
                  <p className="text-white/60 text-sm">{siteSettings.city} - {siteSettings.state}</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-xl border border-white/10 bg-white/5">
                <Phone className="w-6 h-6 flex-shrink-0 mt-1" style={{ color: theme.accentColor }} />
                <div>
                  <h4 className="font-semibold mb-1">Telefone & WhatsApp</h4>
                  <p className="text-white/60 text-sm">{siteSettings.phone}</p>
                  <a href={`https://wa.me/${siteSettings.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline" style={{ color: theme.accentColor }}>
                    Abrir WhatsApp
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-xl border border-white/10 bg-white/5">
                <Clock className="w-6 h-6 flex-shrink-0 mt-1" style={{ color: theme.accentColor }} />
                <div>
                  <h4 className="font-semibold mb-1">Horário de Funcionamento</h4>
                  <div className="text-white/60 text-sm space-y-1">
                    {activeHours.map(bh => (
                      <p key={bh.dayOfWeek}>{dayNames[bh.dayOfWeek]}: {bh.start} - {bh.end}</p>
                    ))}
                  </div>
                </div>
              </div>
              <a
                href={`https://wa.me/${siteSettings.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 rounded-xl text-center font-bold text-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                style={{ backgroundColor: '#25D366', color: '#fff' }}
              >
                <MessageCircle className="w-5 h-5" />
                Agendar pelo WhatsApp
              </a>
            </div>
            <div className="rounded-2xl overflow-hidden border border-white/10 min-h-[400px]">
              <iframe
                src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.1975778886!2d-46.65529668502213!3d-23.550519984681584!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce59c8da0aa315%3A0xd59f9431f2c9776a!2sRua%20Augusta%20-%20Consola%C3%A7%C3%A3o%2C%20S%C3%A3o%20Paulo%20-%20SP!5e0!3m2!1spt-BR!2sbr!4v1635000000000!5m2!1spt-BR!2sbr`}
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '400px' }}
                allowFullScreen
                loading="lazy"
                title="Localização"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-white/10" style={{ backgroundColor: theme.secondaryColor }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Scissors className="w-6 h-6" style={{ color: theme.accentColor }} />
                <span className="text-xl font-bold" style={{ fontFamily: 'Playfair Display' }}>{siteSettings.barbershopName}</span>
              </div>
              <p className="text-white/60 text-sm">{siteSettings.tagline}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Links Rápidos</h4>
              <div className="space-y-2 text-sm text-white/60">
                <a href="#servicos" className="block hover:text-white transition">Serviços</a>
                <a href="#barbeiros" className="block hover:text-white transition">Barbeiros</a>
                <a href="#galeria" className="block hover:text-white transition">Galeria</a>
                <a href="#contato" className="block hover:text-white transition">Contato</a>
                <Link to="/agendar" className="block hover:text-white transition">Agendar Online</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Redes Sociais</h4>
              <div className="flex items-center gap-4">
                {siteSettings.socialMedia.instagram && (
                  <a href={siteSettings.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:border-white/50 transition">
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                {siteSettings.socialMedia.facebook && (
                  <a href={siteSettings.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:border-white/50 transition">
                    <Facebook className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 text-center text-white/40 text-sm">
            <p>© {new Date().getFullYear()} {siteSettings.barbershopName}. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
