import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SiteImage } from '@/components/SiteImage';
import { Link } from '@/lib/router-compat';
import '@/styles/saas.css';
import '@/styles/saas-landing.css';
import { Scissors, ArrowUpRight, Check, Globe, CalendarDays, Users, BarChart3, Percent, CircleDollarSign, Gift } from 'lucide-react';

const features = [
  {
    icon: CalendarDays,
    number: '01',
    title: 'Agendamento online',
    description: 'Seus clientes escolhem o serviço, o barbeiro e o horário disponível pelo site da barbearia.',
  },
  {
    icon: Globe,
    number: '02',
    title: 'Site, equipe e clientes em um só lugar',
    description: 'Apresente a barbearia e organize serviços, horários, barbeiros e clientes no mesmo sistema.',
  },
  {
    icon: BarChart3,
    number: '03',
    title: 'Faturamento por barbeiro',
    description: 'Veja quantos cortes e atendimentos cada profissional concluiu e o faturamento que gerou.',
  },
  {
    icon: Percent,
    number: '04',
    title: 'Repasse definido por você',
    description: 'Configure um valor fixo por corte ou uma porcentagem para cada barbeiro e acompanhe o repasse do período.',
  },
  {
    icon: Gift,
    number: '05',
    title: 'Programa de fidelidade',
    description: 'Crie recompensas, divulgue a campanha no site da barbearia e acompanhe o progresso e os resgates dos clientes.',
  },
  {
    icon: CircleDollarSign,
    number: '06',
    title: 'Visão do faturamento da barbearia',
    description: 'Acompanhe o faturamento dos serviços concluídos e veja a parte da barbearia após o repasse dos cortes.',
  },
];

export default function Landing(){
 const [price,setPrice]=useState<number|null>(null),[name,setName]=useState('BarberShop Pro'),[logo,setLogo]=useState('');
 useEffect(()=>{
  let active=true;
  const load=()=>{void supabase.from('saas_settings').select('name,logo,price_per_barber_cents').eq('id',true).single().then(({data})=>{if(active&&data){setPrice(data.price_per_barber_cents);setName(data.name);setLogo(data.logo);}});};
  load();window.addEventListener('focus',load);
  return ()=>{active=false;window.removeEventListener('focus',load);};
 },[]);
 const formattedPrice=price===null?null:(price/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
 return <main className="saas-page saas-landing">
 <div className="sl-cover" aria-hidden="true"><img src="/images/barbearia-capa.webp" alt="" fetchPriority="high" decoding="async" width="1672" height="941" /></div>
 <div className="sl-content">
 <header className="saas-nav sl-nav"><a href="/" className="sl-brand">{logo?<SiteImage src={logo} alt={`Logo ${name}`} className="sl-logo"/>:<Scissors aria-hidden="true"/>}<strong>{name}</strong></a><Link className="sl-login" to="/admin/login">Entrar no painel <ArrowUpRight size={16} aria-hidden="true"/></Link></header>
 <section className="saas-hero sl-hero">
 <p className="saas-kicker"><span/> GESTÃO COMPLETA PARA BARBEARIAS</p>
 <h1>Mais que agendamento.<br/><em>Gestão para crescer.</em></h1>
 <p className="sl-intro">Organize a agenda e a equipe, acompanhe o faturamento por barbeiro e crie um programa de fidelidade para trazer seus clientes de volta. Seu site e a gestão da barbearia em um só sistema.</p>
 <div className="saas-actions sl-actions"><Link className="saas-button" to="/cadastro">Começar meus 7 dias grátis <ArrowUpRight size={18} aria-hidden="true"/></Link><Link className="sl-model" to="/barbershop-pro">Conhecer o modelo <span aria-hidden="true">→</span></Link></div>
 <div className="sl-assurances"><span><Check size={15} aria-hidden="true"/> 7 dias para experimentar</span><span><Check size={15} aria-hidden="true"/> Seu site com sua identidade</span><span><Check size={15} aria-hidden="true"/> Gestão e relatórios em um só painel</span><span><Check size={15} aria-hidden="true"/> Fidelidade com recompensas configuráveis</span></div>
 </section>

 <section className="sl-benefits" aria-label="Recursos da plataforma">
 <div className="sl-section-heading"><p className="saas-kicker">DA AGENDA AO FATURAMENTO</p><div><h2>O que a sua barbearia precisa,<br/>em um só lugar.</h2><p className="sl-section-intro">Tenha mais clareza sobre a rotina, a equipe e os resultados do negócio.</p></div></div>
 <div className="saas-grid sl-feature-grid">
 {features.map(({icon:Icon,number,title,description})=><article className="saas-card sl-feature-card" key={number}><Icon className="sl-feature-icon" aria-hidden="true"/><span className="sl-number">{number}</span><h3>{title}</h3><p>{description}</p></article>)}
 </div>
 </section>

 <section className="sl-showcase" aria-label="Barbearia e gestão do negócio">
 <div className="sl-showcase-copy">
  <p className="saas-kicker">RESULTADOS VISÍVEIS PARA A EQUIPE</p>
  <h2>Saiba o que cada cadeira está rendendo.</h2>
  <p>O painel mostra a produção por profissional: cortes concluídos, faturamento e o repasse calculado de acordo com a regra que você definiu para cada barbeiro.</p>
  <ul>
   <li><Check size={17} aria-hidden="true"/> Valor fixo por corte ou comissão percentual</li>
   <li><Check size={17} aria-hidden="true"/> Relatório por profissional e por período</li>
   <li><Check size={17} aria-hidden="true"/> Faturamento bruto e parte da barbearia</li>
  </ul>
  <Link className="sl-inline-link" to="/cadastro">Quero organizar minha barbearia <ArrowUpRight size={16} aria-hidden="true"/></Link>
 </div>
 <div className="sl-photo-composition">
  <figure className="sl-photo-main"><img src="/images/corte.webp" alt="Detalhe de um corte de cabelo feito na barbearia" loading="lazy" decoding="async"/><figcaption>Atendimento de qualidade, rotina organizada.</figcaption></figure>
  <figure className="sl-photo-secondary"><img src="/images/ambiente.webp" alt="Ambiente de uma barbearia" loading="lazy" decoding="async"/></figure>
  <div className="sl-photo-badge"><BarChart3 size={20} aria-hidden="true"/><span>Equipe, cortes<br/>e faturamento</span></div>
 </div>
 </section>

 <section className="sl-plan-callout">
  <div><p className="saas-kicker">COMECE COM 7 DIAS GRÁTIS</p><h2>Conheça o sistema completo<br/>antes de contratar.</h2><p>Cadastre sua barbearia, personalize o site e explore o painel. O plano é calculado por barbeiro cadastrado.</p></div>
  <div className="sl-plan-action">{formattedPrice?<div className="sl-price"><strong>{formattedPrice}</strong><span>por barbeiro<br/>por mês</span></div>:<p className="sl-plan-price-note">Mensalidade por barbeiro cadastrado.</p>}<Link className="saas-button" to="/cadastro">Criar minha barbearia <ArrowUpRight size={18} aria-hidden="true"/></Link></div>
 </section>

 <footer className="sl-footer"><span>{name}</span><p>Mais tempo para fazer o que você faz de melhor.</p><Link to="/cadastro">Criar minha barbearia <ArrowUpRight size={15} aria-hidden="true"/></Link></footer>
 </div></main>;
}
