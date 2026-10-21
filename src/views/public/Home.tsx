import { useState, type CSSProperties, type ReactNode } from 'react';
import { SiteImage } from '@/components/SiteImage';
import { useData } from '@/contexts/DataContext';
import { Link } from '@/lib/router-compat';
import { Scissors, Star, MapPin, Phone, Clock, Instagram, Facebook, CalendarDays, UsersRound, ArrowRight, Menu, X, MessageCircle, Youtube } from 'lucide-react';
import '@/styles/barbershop-home.css';
import { getServiceImage } from '@/lib/service-images';
import type { Service, Barber, Testimonial, GalleryImage, SiteSettings, ThemeSettings } from '@/types';

export default function Home() {
  const { services, barbers, testimonials, gallery, siteSettings: site, themeSettings: theme }: {
    services: Service[]; barbers: Barber[]; testimonials: Testimonial[]; gallery: GalleryImage[]; siteSettings: SiteSettings; themeSettings: ThemeSettings;
  } = useData();
  const [menuOpen, setMenuOpen] = useState(false);
  const [allPhotos, setAllPhotos] = useState(false);
  const activeServices = services.filter(s => s.active);
  const activeBarbers = barbers.filter(b => b.active).sort((a, b) => a.order - b.order);
  const activeTestimonials = testimonials.filter(t => t.active);
  const photos = [...gallery].sort((a, b) => a.order - b.order);
  const configured = site.sections || [];
  const enabled = (id: string) => configured.find(section => section.id === id)?.active !== false;
  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const activeHours = (site.businessHours || []).filter(day => day.active);
  const whatsapp = String(site.whatsapp || '').replace(/\D/g, '');
  const address = [site.address, site.city, site.state].filter(Boolean).join(', ');
  const accent = theme.accentColor || '#c9a96e';
  const panel = ['#16213e', '#1a1a2e'].includes(theme.secondaryColor) ? '#151514' : theme.secondaryColor;
  const colorOn = (hex: string) => {
    const value = hex?.replace('#', '');
    if (!/^[0-9a-f]{6}$/i.test(value || '')) return '#111111';
    const [r, g, b] = [0, 2, 4].map(start => parseInt(value.slice(start, start + 2), 16));
    return r * .299 + g * .587 + b * .114 > 155 ? '#15120d' : '#ffffff';
  };
  const css = {
    '--bb-accent': accent,
    '--bb-bg': theme.backgroundColor || '#101010',
    '--bb-panel': panel || '#151514',
    '--bb-text': theme.textColor || '#ffffff',
    '--bb-button': theme.buttonColor || accent,
    '--bb-button-text': colorOn(theme.buttonColor || accent),
    '--bb-radius': theme.buttonStyle === 'pill' ? '999px' : theme.buttonStyle === 'sharp' ? '0px' : '4px',
    fontFamily: theme.fontFamily || 'Inter, sans-serif',
  } as CSSProperties;
  const links = [
    { id: 'services', anchor: 'servicos', label: 'Serviços', show: activeServices.length > 0 },
    { id: 'barbers', anchor: 'barbeiros', label: 'Nossa equipe', show: activeBarbers.length > 0 },
    { id: 'gallery', anchor: 'galeria', label: 'Galeria', show: photos.length > 0 },
    { id: 'testimonials', anchor: 'depoimentos', label: 'Depoimentos', show: activeTestimonials.length > 0 },
    { id: 'contact', anchor: 'contato', label: 'Contato', show: true },
  ].filter(item => enabled(item.id) && item.show);
  const brand = <>{site.logo ? <SiteImage src={site.logo} alt={`Logo ${site.barbershopName}`} className="bb-logo" /> : <Scissors className="bb-brand-icon" aria-hidden="true" />}<span>{site.barbershopName}</span></>;
  const servicePhoto = (service: { name: string; category: string; image: string }) => service.image || getServiceImage(service.name, service.category);
  const sectionHeading = (eyebrow: string, title: string) => <div className="bb-section-heading"><p className="bb-eyebrow">{eyebrow}</p><h2>{title}</h2></div>;

  const sections: Record<string, ReactNode> = {
    services: activeServices.length > 0 && <section id="servicos" className="bb-section bb-wrap">
      {sectionHeading('Nossos serviços', 'O cuidado que seu estilo merece.')}
      <div className="bb-service-grid">{activeServices.map(service => <article className="bb-service-card" key={service.id}>
        <div className="bb-service-photo"><SiteImage src={servicePhoto(service)} fallbackSrc={getServiceImage(service.name, service.category)} alt={service.name} loading="lazy" decoding="async" />
        </div>
        <div className="bb-service-body"><h3>{service.name}</h3><div className="bb-service-meta"><strong>{site.currency} {Number(service.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong><span><Clock size={13} aria-hidden="true" />{service.duration} min</span></div>
          <p>{service.description}</p><Link to={`/agendar?service=${encodeURIComponent(service.id)}`} className="bb-text-link" aria-label={`Agendar ${service.name}`}>Agendar serviço <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
      </article>)}</div>
    </section>,
    barbers: activeBarbers.length > 0 && <section id="barbeiros" className="bb-section bb-wrap">
      {sectionHeading('Nossa equipe', 'Quem cuida do seu visual.')}
      <div className="bb-barber-grid">{activeBarbers.map(barber => <article key={barber.id} className="bb-barber-card">
        <div className="bb-barber-photo"><SiteImage src={barber.photo} alt={barber.name} loading="lazy" decoding="async" /></div>
        <div className="bb-barber-body"><h3>{barber.name}</h3><p className="bb-specialty">{barber.specialty}</p><p className="bb-bio">{barber.bio}</p>
          <Link to={`/agendar?barber=${encodeURIComponent(barber.id)}`} className="bb-text-link">Agendar com {barber.name.split(' ')[0]} <ArrowRight size={15} aria-hidden="true" /></Link>
        </div>
      </article>)}</div>
    </section>,
    gallery: photos.length > 0 && <section id="galeria" className="bb-section bb-wrap">
      <div className="bb-gallery-heading"><div><p className="bb-eyebrow">Galeria</p><h2>Mais que cortes, bons momentos.</h2></div>
        {photos.length > 3 && <button type="button" className="bb-text-link" aria-expanded={allPhotos} aria-controls="bb-gallery-photos" onClick={() => setAllPhotos(!allPhotos)}>{allPhotos ? 'Mostrar menos' : 'Ver todas as fotos'} <ArrowRight size={16} aria-hidden="true" /></button>}
      </div>
      <div id="bb-gallery-photos" className="bb-gallery-grid">{(allPhotos ? photos : photos.slice(0, 3)).map(photo => <figure key={photo.id}><SiteImage src={photo.url} fallbackSrc="/images/barbearia-capa.webp" alt={photo.caption || 'Galeria da barbearia'} loading="lazy" decoding="async" /><figcaption>{photo.caption}</figcaption></figure>)}</div>
    </section>,
    testimonials: activeTestimonials.length > 0 && <section id="depoimentos" className="bb-section bb-reviews">
      <div className="bb-wrap">{sectionHeading('Depoimentos', 'Quem vem, recomenda.')}
        <div className="bb-review-grid">{activeTestimonials.map(review => <figure key={review.id} className="bb-review">
          <div className="bb-stars" aria-label={`${review.rating} de 5 estrelas`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={15} fill={index < review.rating ? 'currentColor' : 'none'} aria-hidden="true" />)}</div>
          <blockquote>“{review.text}”</blockquote><figcaption>{review.clientName}</figcaption>
        </figure>)}</div>
      </div>
    </section>,
    contact: <section id="contato" className="bb-section bb-wrap">
      {sectionHeading('Faça uma visita', 'Seu próximo momento de cuidado.')}
      <div className="bb-contact-grid"><div className="bb-contact-info">
        {address && <div><MapPin aria-hidden="true" /><div><h3>Onde estamos</h3><p>{site.address}<br />{[site.city, site.state].filter(Boolean).join(' — ')}</p></div></div>}
        {site.phone && <div><Phone aria-hidden="true" /><div><h3>Fale com a gente</h3><a href={`tel:${String(site.phone).replace(/[^+\d]/g, '')}`}>{site.phone}</a>{site.email && <p><a href={`mailto:${site.email}`}>{site.email}</a></p>}</div></div>}
        {activeHours.length > 0 && <div><Clock aria-hidden="true" /><div><h3>Horário de funcionamento</h3>{activeHours.map(day => <p key={day.dayOfWeek}>{dayNames[day.dayOfWeek]} <span>{day.start} – {day.end}</span></p>)}</div></div>}
        {whatsapp && <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="bb-button bb-button-outline"><MessageCircle size={17} aria-hidden="true" /> Conversar pelo WhatsApp</a>}
      </div>{address && <iframe title="Localização da barbearia" src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" />}</div>
    </section>,
  };
  const orderedSections = [...new Set([...configured.slice().sort((a, b) => a.order - b.order).map(section => section.id), ...Object.keys(sections)])];

  return <div className="bb-home" style={css}>
    <a href="#bb-main" className="bb-skip">Pular para o conteúdo</a>
    <header className="bb-header"><div className="bb-wrap bb-header-inner">
      <Link to="/" className="bb-brand" aria-label={`${site.barbershopName} — início`}>{brand}</Link>
      <nav className="bb-desktop-nav" aria-label="Navegação principal">{links.map(item => <a key={item.id} href={`#${item.anchor}`}>{item.label}</a>)}</nav>
      <div className="bb-header-actions"><Link to="/admin/login" className="bb-login-link">Entrar</Link><Link to="/agendar" className="bb-button bb-header-book">Agendar horário</Link>
        <button type="button" className="bb-menu-toggle" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen} aria-controls="bb-mobile-menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
      </div>
    </div>{menuOpen && <nav id="bb-mobile-menu" className="bb-mobile-nav" aria-label="Navegação para celular">{links.map(item => <a key={item.id} href={`#${item.anchor}`} onClick={() => setMenuOpen(false)}>{item.label}</a>)}<Link to="/admin/login" onClick={() => setMenuOpen(false)}>Entrar no painel</Link></nav>}</header>

    <main id="bb-main">
      <section className="bb-hero"><div className="bb-hero-image"><SiteImage src={site.heroImage} fallbackSrc="/images/barbearia-capa.webp" alt="" fetchPriority="high" decoding="async" /></div><div className="bb-hero-shade" />
        <div className="bb-wrap bb-hero-content"><p className="bb-eyebrow">{site.tagline}</p><h1>{site.heroTitle}</h1><p className="bb-hero-description">{site.heroSubtitle}</p>
          <div className="bb-hero-actions"><Link to="/agendar" className="bb-button">{site.heroButtonText || 'Agendar meu horário'} <ArrowRight size={17} aria-hidden="true" /></Link><a href="#sobre" className="bb-hero-secondary">Conheça a barbearia <ArrowRight size={15} aria-hidden="true" /></a></div>
        </div>
      </section>
      <div className="bb-benefits"><div className="bb-wrap">{[{ icon: CalendarDays, title: 'Agendamento online', copy: 'Seu horário, em poucos passos.' }, { icon: UsersRound, title: 'Cuidado em cada serviço', copy: 'Atenção a todos os detalhes.' }, { icon: Star, title: 'Atendimento personalizado', copy: 'Seu estilo, do seu jeito.' }].map(item => <div key={item.title}><item.icon aria-hidden="true" /><div><h2>{item.title}</h2><p>{item.copy}</p></div></div>)}</div></div>
      {orderedSections.map((id, index) => <div key={id}>
        {enabled(id) && sections[id]}
        {index === 0 && <section id="sobre" className="bb-about">
          <div className="bb-about-image"><SiteImage src="/images/sobre-atendimento.webp" alt="Cuidado profissional e acabamento de um corte de cabelo" loading="lazy" decoding="async" /></div>
          <div className="bb-about-copy"><p className="bb-eyebrow">Sobre a barbearia</p><h2>Tradição no cuidado.<br />Precisão em cada detalhe.</h2><p>Um espaço para cuidar de você, valorizar seu estilo e transformar cada visita em um momento especial. Do corte ao acabamento, cada detalhe faz parte da experiência.</p>
            {enabled('barbers') && activeBarbers.length > 0 ? <a href="#barbeiros" className="bb-button bb-button-outline">Conheça nossa equipe <ArrowRight size={16} aria-hidden="true" /></a> : <Link to="/agendar" className="bb-button bb-button-outline">Agendar horário <ArrowRight size={16} aria-hidden="true" /></Link>}
          </div>
        </section>}
      </div>)}
    </main>

    <footer className="bb-footer"><div className="bb-wrap bb-footer-cta"><div><Link to="/" className="bb-brand">{brand}</Link><p className="bb-footer-tagline">{site.tagline}</p></div><div><h2>Pronto para renovar seu visual?</h2><p>Escolha seu horário e venha viver essa experiência.</p></div><Link to="/agendar" className="bb-button">Agendar horário <ArrowRight size={16} aria-hidden="true" /></Link></div>
      <div className="bb-wrap bb-footer-bottom"><p>© {new Date().getFullYear()} {site.barbershopName}</p><div className="bb-socials">
        {site.socialMedia?.instagram && <a href={site.socialMedia.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Instagram size={19} /></a>}
        {site.socialMedia?.facebook && <a href={site.socialMedia.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"><Facebook size={19} /></a>}
        {site.socialMedia?.youtube && <a href={site.socialMedia.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube"><Youtube size={19} /></a>}
        {site.socialMedia?.tiktok && <a href={site.socialMedia.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok">TikTok</a>}
      </div></div>
    </footer>
  </div>;
}
