import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from '@/lib/router-compat';
import '@/styles/saas.css';
import '@/styles/saas-landing.css';
import { Scissors, ArrowUpRight, Check, Globe, CalendarDays, Users } from 'lucide-react';

export default function Landing(){
 const [price,setPrice]=useState<number|null>(null),[name,setName]=useState('BarberShop Pro');
 useEffect(()=>{void supabase.from('saas_settings').select('name,price_per_barber_cents').eq('id',true).single().then(({data})=>{if(data){setPrice(data.price_per_barber_cents);setName(data.name);}});},[]);
 return <main className="saas-page saas-landing">
 <div className="sl-cover" aria-hidden="true"><img src="/images/barbearia-capa.webp" alt="" fetchPriority="high" decoding="async" width="1672" height="941" /></div>
 <div className="sl-content">
 <header className="saas-nav sl-nav"><a href="/" className="sl-brand"><Scissors aria-hidden="true"/><strong>{name}</strong></a><Link className="sl-login" to="/admin/login">Entrar no painel <ArrowUpRight size={16} aria-hidden="true"/></Link></header>
 <section className="saas-hero sl-hero">
 <p className="saas-kicker"><span/> GESTÃO PARA BARBEARIAS QUE QUEREM CRESCER</p>
 <h1>Seu talento na cadeira.<br/><em>Sua gestão em outro nível.</em></h1>
 <p className="sl-intro">Transforme sua barbearia com um site exclusivo, agendamento online e tudo o que você precisa para cuidar do seu negócio.</p>
 <div className="saas-actions sl-actions"><Link className="saas-button" to="/cadastro">Começar meus 7 dias grátis <ArrowUpRight size={18} aria-hidden="true"/></Link><Link className="sl-model" to="/barbershop-pro">Conhecer o modelo <span aria-hidden="true">→</span></Link></div>
 <div className="sl-assurances"><span><Check size={15} aria-hidden="true"/> 7 dias para experimentar</span><span><Check size={15} aria-hidden="true"/> Seu site com sua identidade</span></div>
 </section>
 <section className="sl-benefits" aria-label="Recursos da plataforma">
 <div className="sl-section-heading"><p className="saas-kicker">MENOS COMPLICAÇÃO. MAIS CONTROLE.</p><h2>Uma experiência completa,<br/>do primeiro clique ao próximo corte.</h2></div>
 <div className="saas-grid">
 <article className="saas-card"><Globe className="sl-feature-icon" aria-hidden="true"/><span className="sl-number">01</span><h3>Sua marca, seu espaço</h3><p>Um endereço exclusivo com logo, cores, fotos e serviços da sua barbearia. Seus dados ficam separados das outras lojas.</p></article>
 <article className="saas-card"><Users className="sl-feature-icon" aria-hidden="true"/><span className="sl-number">02</span><h3>Cresça no seu ritmo</h3><p>{price===null?'Mensalidade por barbeiro cadastrado, com valor definido pela plataforma.':(price/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})+' por barbeiro cadastrado por mês.'}</p><p>Após o teste, cada agenda é liberada com pagamento confirmado.</p></article>
 <article className="saas-card"><CalendarDays className="sl-feature-icon" aria-hidden="true"/><span className="sl-number">03</span><h3>Seu negócio nas mãos</h3><p>Agenda, clientes, equipe, serviços e relatórios em um único painel. Mensalidades pelo Mercado Pago.</p></article>
 </div></section>
 <footer className="sl-footer"><span>{name}</span><p>Mais tempo para fazer o que você faz de melhor.</p><Link to="/cadastro">Criar minha barbearia <ArrowUpRight size={15} aria-hidden="true"/></Link></footer>
 </div></main>;
}
