import { useState, type FormEvent } from 'react';
import { useData } from '../../contexts/DataContext';
import { useNavigate } from '@/lib/router-compat';
import { lovable } from '@/integrations/lovable/index';
import '@lovable.dev/cloud-auth-js/styles.css';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Scissors, Lock, Mail, AlertCircle } from 'lucide-react';

export default function AdminLogin() {
  const { login, currentUser } = useData();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault(); setPending(true); setError('');
    try { if(await login(email,password)) navigate('/admin'); else setError('E-mail, senha ou permissão de acesso inválidos.'); }
    catch { setError('Não foi possível entrar. Tente novamente.'); }
    finally { setPending(false); }
  };
  const social = async (provider: 'google'|'lovable') => {
    setPending(true); setError('');
    try {
      const result = await lovable.auth.signInWithOAuth(provider,{redirect_uri:`${window.location.origin}/admin/login`});
      if(result.error) { setError('Não foi possível entrar. Tente novamente.'); return; }
      if(result.redirected) return;
      const {data:{user}} = await supabase.auth.getUser();
      if(!user) return;
      const {data:role} = await supabase.from('user_roles').select('active').eq('user_id',user.id).maybeSingle();
      if(role?.active) navigate('/admin'); else setError('Esta conta não tem permissão para acessar o painel.');
    } finally { setPending(false); }
  };
  return <div className="min-h-screen flex items-center justify-center px-4 bg-background text-foreground">
    <div className="max-w-md w-full py-8">
      <div className="text-center mb-8"><Scissors className="size-10 text-primary mx-auto mb-4"/><h1 className="text-2xl font-bold">Painel Administrativo</h1><p className="text-muted-foreground mt-2">BarberShop Pro</p></div>
      {currentUser ? <Button className="w-full" onClick={()=>navigate('/admin')}>Abrir painel</Button> : <form onSubmit={handleSubmit} className="border border-border rounded-lg p-6 space-y-5">
        {error && <p role="alert" className="flex gap-2 text-destructive text-sm"><AlertCircle className="size-4 shrink-0"/>{error}</p>}
        <div><label htmlFor="staff-email" className="block text-sm mb-2">E-mail</label><div className="relative"><Mail className="absolute left-3 top-3 size-4 text-muted-foreground"/><input id="staff-email" type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} className="w-full pl-10 pr-3 py-2 rounded-md bg-background border border-input" required/></div></div>
        <div><label htmlFor="staff-password" className="block text-sm mb-2">Senha</label><div className="relative"><Lock className="absolute left-3 top-3 size-4 text-muted-foreground"/><input id="staff-password" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full pl-10 pr-3 py-2 rounded-md bg-background border border-input" required/></div></div>
        <Button disabled={pending} type="submit" className="w-full">{pending?'Entrando...':'Entrar'}</Button>
        <Button disabled={pending} type="button" variant="outline" className="w-full" onClick={()=>void social('google')}>Entrar com Google</Button>
        <Button disabled={pending} type="button" className="lovable-auth-button w-full" onClick={()=>void social('lovable')}>Sign in with Lovable</Button>
      </form>}
    </div>
  </div>;
}
