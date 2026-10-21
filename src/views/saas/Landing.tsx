import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from '@/lib/router-compat';
import '@/styles/saas.css';

export default function Landing(){
 const [price,setPrice]=useState<number|null>(null),[name,setName]=useState('BarberShop Pro');
 useEffect(()=>{void supabase.from('saas_settings').select('name,price_per_barber_cents').eq('id',true).single().then(({data})=>{if(data){setPrice(data.price_per_barber_cents);setName(data.name);}});},[]);
 return <main className="saas-page"><header className="saas-nav"><strong>{name}</strong><Link to="/admin/login">Entrar</Link></header><section className="saas-hero"><p className="saas-kicker">SUA BARBEARIA. SEU SITE. SUA AGENDA.</p><h1>Mais organização.<br/>Mais tempo para o seu negócio.</h1><p>Tenha seu site de agendamento, equipe, clientes e serviços em um só lugar. Personalize tudo com a identidade da sua barbearia.</p><div className="saas-actions"><Link className="saas-button" to="/cadastro">Testar grátis por 7 dias</Link><Link to="/barbershop-pro">Conhecer o modelo →</Link></div></section><section className="saas-grid"><article className="saas-card"><h2>Seu próprio endereço</h2><p>Site personalizado, logo, cores, fotos e serviços, com dados separados das outras barbearias.</p></article><article className="saas-card"><h2>Cobrança por barbeiro</h2><p>{price===null?'O valor da mensalidade será definido pela plataforma.':(price/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})+' por barbeiro cadastrado por mês.'}</p><p>Após o teste, a agenda de cada profissional é liberada com pagamento confirmado.</p></article><article className="saas-card"><h2>Gestão completa</h2><p>Agenda, clientes, equipe, serviços e relatórios na mesma interface, com mensalidades pelo Mercado Pago.</p></article></section></main>;
}
