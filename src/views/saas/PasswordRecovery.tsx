import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import '@/styles/saas.css';

export default function PasswordRecovery() {
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirmation,setConfirmation]=useState('');
 const [session,setSession]=useState(false),[checking,setChecking]=useState(true),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{
  let mounted=true;
  const update=async()=>{const {data}=await supabase.auth.getUser();if(mounted){setSession(!!data.user);setChecking(false);}};
  void update();
  const {data}=supabase.auth.onAuthStateChange(()=>{window.setTimeout(()=>{void update();},0);});
  return ()=>{mounted=false;data.subscription.unsubscribe();};
 },[]);
 const submit=async(e:React.FormEvent)=>{
  e.preventDefault();if(busy)return;setBusy(true);setMessage('');
  try {
   if(session){
    if(password!==confirmation)throw new Error('As senhas não coincidem.');
    const {error}=await supabase.auth.updateUser({password});if(error)throw new Error('Não foi possível salvar. Use uma senha com pelo menos 8 caracteres ou solicite um novo link.');
    await supabase.auth.signOut();setSession(false);setPassword('');setConfirmation('');setMessage('Senha salva. Entre no painel com seu e-mail e a nova senha.');
   }else{
    const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+'/admin/recuperar-senha'});
    if(error)throw new Error('Não foi possível enviar o link. Aguarde e tente novamente.');
    setMessage('Se houver uma conta com esse e-mail, você receberá um link para definir sua senha. Confira também o spam.');
   }
  }catch(e){setMessage(e instanceof Error?e.message:'Não foi possível concluir.');}finally{setBusy(false);}
 };
 return <main className="saas-page"><section className="saas-card saas-signup"><a href="/admin/login">← Voltar ao login</a><p className="saas-kicker">ACESSO POR E-MAIL E SENHA</p><h1>{session?'Defina sua senha':'Recuperar acesso'}</h1><p>{session?'Escolha uma senha para acessar sua conta.':'Informe o e-mail da sua conta. Você receberá um link para criar ou redefinir sua senha, inclusive se antes entrava pelo Google ou Lovable.'}</p>{checking?<p>Verificando acesso...</p>:<form className="saas-form" onSubmit={submit}>{session?<><label>Nova senha<input type="password" minLength={8} autoComplete="new-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><label>Confirmar senha<input type="password" minLength={8} autoComplete="new-password" required value={confirmation} onChange={e=>setConfirmation(e.target.value)}/></label></>:<label>E-mail da conta<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label>}<button disabled={busy}>{busy?'Aguarde...':session?'Salvar senha':'Enviar link por e-mail'}</button></form>}{message&&<p role="status">{message}</p>}</section></main>;
}
