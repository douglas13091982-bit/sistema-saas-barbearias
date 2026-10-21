import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from '@/lib/router-compat';
import '@/styles/saas.css';

export default function Signup() {
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[name,setName]=useState(''),[slug,setSlug]=useState('');
 const [existing,setExisting]=useState(false);
 const [signed,setSigned]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{void supabase.auth.getUser().then(({data})=>setSigned(!!data.user));},[]);
 const submit=async(e:React.FormEvent)=>{
  e.preventDefault();if(busy)return;setBusy(true);setMessage('');
  try {
   if(!signed){
    const {data,error}=existing ? await supabase.auth.signInWithPassword({email,password}) : await supabase.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin+'/cadastro'}});
    if(error)throw new Error(existing?'Não foi possível entrar. Confira a senha e confirme seu e-mail.':'Não foi possível criar a conta. Verifique os dados ou entre com sua conta existente.');
    if(!data.session){setMessage('Enviamos a confirmação para seu e-mail. Confirme o endereço e volte a esta página para informar o nome e o endereço da barbearia.');return;}
    setSigned(true);
   }
   const {error}=await supabase.rpc('create_shop',{shop_name:name,shop_slug:slug});
   if(error)throw new Error(error.message.includes('duplicate')?'Este endereço já está em uso. Escolha outro.':error.message);
   window.location.assign('/admin');
  } catch(e){setMessage(e instanceof Error?e.message:'Não foi possível criar a barbearia.');}
  finally{setBusy(false);}
 };
 return <main className="saas-page"><div className="saas-card saas-signup"><Link to="/">← Voltar</Link><p className="saas-kicker">7 DIAS GRÁTIS</p><h1>Seu próximo capítulo começa aqui.</h1><p>Crie a conta da sua barbearia. Seu site e painel terão dados e configurações próprios.</p>
 {!signed&&<button type="button" onClick={()=>setExisting(!existing)}>{existing?'Quero criar uma conta':'Já criei minha conta / confirmei meu e-mail'}</button>}
 <form onSubmit={submit} className="saas-form">
 {!signed&&<><label>E-mail<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} /></label><label>Senha<input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)} /></label></>}
 <label>Nome da barbearia<input required minLength={2} maxLength={120} value={name} onChange={e=>setName(e.target.value)} /></label>
 <label>Endereço do seu site<input required pattern="[a-z0-9][a-z0-9-]{2,49}" minLength={3} maxLength={50} placeholder="minha-barbearia" value={slug} onChange={e=>setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,''))} /></label>
 <small>Seu endereço: /{slug || 'minha-barbearia'}</small><p>Após o teste, cada barbeiro cadastrado precisa de uma mensalidade para liberar sua agenda. Nenhuma cobrança é feita sem a contratação no Mercado Pago.</p>
 {message&&<p role="status">{message}</p>}<button disabled={busy}>{busy?'Criando...':signed?'Criar minha barbearia':'Criar conta e começar'}</button>
 </form><p>Já tem conta? <a href="/admin/login">Entrar no painel</a></p></div></main>;
}
