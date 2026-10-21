import { useState, type FormEvent } from 'react';
import { useData } from '../../contexts/DataContext';
import { useNavigate } from '@/lib/router-compat';
import { lovable } from '@/integrations/lovable/index';
import '@lovable.dev/cloud-auth-js/styles.css';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Scissors, Lock, Mail, AlertCircle, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from '@/lib/router-compat';
import { SiteImage } from '@/components/SiteImage';

export default function AdminLogin() {
  const { login, currentUser, siteSettings, themeSettings, isPlatformAdmin } = useData();
  const accent = themeSettings.accentColor || '#c9a96e';
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const openAccountPanel = async () => {
    const { data: platform, error: permissionError } = await supabase.rpc('is_platform_admin');
    if (permissionError) throw permissionError;
    navigate(platform ? '/super-admin' : '/admin');
  };
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault(); setPending(true); setError('');
    try { if(await login(email,password)) await openAccountPanel(); else setError('E-mail, senha ou permissão de acesso inválidos.'); }
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
      if(role?.active) await openAccountPanel(); else setError('Esta conta não tem permissão para acessar o painel.');
    } finally { setPending(false); }
  };
  return (
    <div className="relative isolate min-h-screen min-h-dvh overflow-x-hidden bg-[#0d0d0d] text-white" style={{ fontFamily: themeSettings.fontFamily }}>
      <div className="absolute inset-0 -z-10">
        <SiteImage src={siteSettings.heroImage} fallbackSrc="/images/barbearia-capa.webp" alt="" fetchPriority="high" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/65 lg:bg-gradient-to-r lg:from-black/55 lg:via-black/65 lg:to-[#0d0d0d]/95" />
      </div>

      <div className="mx-auto flex min-h-screen min-h-dvh max-w-7xl flex-col px-5 py-6 sm:px-10 lg:px-12">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            {siteSettings.logo ? <SiteImage src={siteSettings.logo} alt={`Logo ${siteSettings.barbershopName}`} className="h-12 w-14 shrink-0 object-contain" /> :
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5"><Scissors className="size-6" style={{ color: accent }} /></span>}
            <span className="max-w-56 text-lg font-semibold sm:max-w-none" style={{ fontFamily: 'Playfair Display' }}>{siteSettings.barbershopName}</span>
          </Link>
          <Link to="/" className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">
            <ArrowLeft className="size-4" aria-hidden="true" /> Voltar ao site
          </Link>
        </header>

        <main className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-2 lg:gap-20 lg:py-16">
          <section className="hidden max-w-lg lg:block">
            <span className="mb-6 inline-block text-xs font-medium uppercase tracking-[0.3em]" style={{ color: accent }}>{siteSettings.tagline || 'Estilo em cada detalhe'}</span>
            <h1 className="text-5xl font-semibold leading-[1.12] xl:text-6xl" style={{ fontFamily: 'Playfair Display' }}>A excelência começa nos detalhes.</h1>
            <div className="my-7 h-px w-20" style={{ backgroundColor: accent }} />
            <p className="max-w-sm text-base leading-relaxed text-white/65">Seu espaço para cuidar da agenda, da equipe e de cada atendimento.</p>
          </section>

          <section aria-labelledby="login-heading" className="mx-auto w-full max-w-md lg:mr-0">
            <div className="rounded-3xl border border-white/15 bg-[#151515]/90 p-6 shadow-2xl backdrop-blur-xl sm:p-9">
              <div className="mb-8">
                <span className="mb-5 flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5"><Lock className="size-5" style={{ color: accent }} aria-hidden="true" /></span>
                <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em]" style={{ color: accent }}>Painel administrativo</p>
                <h2 id="login-heading" className="text-3xl font-semibold" style={{ fontFamily: 'Playfair Display' }}>Bem-vindo de volta</h2>
                <p className="mt-3 text-sm leading-relaxed text-white/55">Entre na sua conta para gerenciar a barbearia.</p>
              </div>

              {currentUser ? <div className="space-y-3"><Button className="h-12 w-full rounded-xl bg-white text-black hover:bg-white/90" onClick={() => navigate(isPlatformAdmin ? '/super-admin' : '/admin')}>{isPlatformAdmin ? 'Abrir Super Admin' : 'Abrir painel'} <ArrowRight className="ml-2 size-4" /></Button>{isPlatformAdmin && <Button variant="outline" className="h-12 w-full rounded-xl border-white/20 bg-transparent text-white hover:bg-white/10" onClick={() => navigate('/admin/dashboard')}>Abrir minha barbearia</Button>}</div> :
                <form onSubmit={handleSubmit} className="space-y-5" aria-busy={pending}>
                  {error && <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-sm text-red-200"><AlertCircle className="mt-0.5 size-4 shrink-0" />{error}</p>}
                  <div>
                    <label htmlFor="staff-email" className="mb-2 block text-sm text-white/80">E-mail</label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-4 size-4 text-white/40" aria-hidden="true" />
                      <input id="staff-email" type="email" autoComplete="username" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} className="h-12 w-full rounded-xl border border-white/15 bg-white/5 pl-11 pr-4 text-base text-white outline-none transition placeholder:text-white/30 focus:border-white/60 focus:ring-2 focus:ring-white/15" required />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="staff-password" className="mb-2 block text-sm text-white/80">Senha</label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-4 top-4 size-4 text-white/40" aria-hidden="true" />
                      <input id="staff-password" type="password" autoComplete="current-password" placeholder="Sua senha" value={password} onChange={e => setPassword(e.target.value)} className="h-12 w-full rounded-xl border border-white/15 bg-white/5 pl-11 pr-4 text-base text-white outline-none transition placeholder:text-white/30 focus:border-white/60 focus:ring-2 focus:ring-white/15" required />
                    </div>
                  </div>
                  <Button disabled={pending} type="submit" className="h-12 w-full rounded-xl border border-white/20 bg-[#c9a96e] font-semibold text-black transition hover:bg-[#ddc398] disabled:opacity-50">{pending ? 'Entrando...' : 'Entrar no painel'} <ArrowRight className="ml-2 size-4" aria-hidden="true" /></Button>
                  <div className="flex items-center gap-3 py-1" aria-hidden="true"><span className="h-px flex-1 bg-white/10" /><span className="text-xs text-white/35">ou continue com</span><span className="h-px flex-1 bg-white/10" /></div>
                  <div className="space-y-3">
                    <Button disabled={pending} type="button" variant="outline" className="h-12 w-full rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white" onClick={() => void social('google')}>
                      <span aria-hidden="true" className="mr-2 flex size-5 items-center justify-center rounded-full bg-white text-sm font-bold text-[#4285f4]">G</span> Entrar com Google
                    </Button>
                    <Button disabled={pending} type="button" className="lovable-auth-button w-full" onClick={() => void social('lovable')}>Sign in with Lovable</Button>
                  </div>
                </form>}
              <p className="mt-6 text-center text-sm text-white/60">Quer cadastrar sua barbearia? <Link to="/cadastro" className="text-[#c9a96e] underline">Começar teste grátis</Link></p>
              <p className="mt-7 flex items-center justify-center gap-2 text-center text-xs text-white/40"><ShieldCheck className="size-4 shrink-0" aria-hidden="true" /> Acesso exclusivo para a equipe autorizada</p>
            </div>
          </section>
        </main>
        <footer className="pb-1 text-center text-xs text-white/35 lg:text-left">© {new Date().getFullYear()} {siteSettings.barbershopName}</footer>
      </div>
    </div>
  );
}
