// @ts-nocheck -- compatibility with imported screens
import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { manageStaff } from '@/lib/staff.functions';
import { defaultSiteSettings, defaultThemeSettings } from '../data/demoData';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const DataContext = createContext<any>(undefined);
export function DataProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [records, setRecords] = useState([]);
  const [busy, setBusy] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const staff = useServerFn(manageStaff);
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++generation.current;
    try {
      const { data: auth } = await supabase.auth.getUser();
      let role = null;
      if (auth.user) {
        const { data } = await supabase.from('user_roles').select('role,active').eq('user_id', auth.user.id).maybeSingle();
        if (data?.active) role = data.role;
      }
      let rows = [], offset = 0;
      for (;;) {
        const result = await supabase.from('barbershop_records').select('kind,id,data').order('kind').order('id').range(offset,offset+999);
        if (result.error) throw result.error;
        rows.push(...result.data);
        if (result.data.length < 1000) break;
        offset += 1000;
      }
      const slots = await supabase.rpc('busy_slots');
      if (slots.error) throw slots.error;
      if (generation.current !== request) return;
      setRecords(rows); setBusy(slots.data ?? []); setError('');
      setCurrentUser(role ? { id: auth.user.id, email: auth.user.email, name: auth.user.user_metadata?.name || auth.user.email, role, active: true } : null);
      if (role === 'admin') setUsers(await staff({ data: { action: 'list' } }));
      else setUsers([]);
    } catch { if (generation.current === request) setError('Não foi possível carregar os dados.'); }
    finally { if (generation.current === request) setLoading(false); }
  }, [staff]);
  useEffect(() => { void refresh(); const focus = () => void refresh(); window.addEventListener('focus',focus); return () => window.removeEventListener('focus',focus); }, [refresh]);
  const list = kind => records.filter(r => r.kind === kind).map(r => r.data);
  const settings = kind => records.find(r => r.kind === kind)?.data;
  const mutate = async operation => {
    try { const result = await operation(); if (result.error) throw result.error; await refresh(); return result.data; }
    catch (e) { toast.error('Não foi possível salvar a alteração.'); throw e; }
  };
  const save = (kind,id,data) => mutate(() => supabase.from('barbershop_records').upsert({kind,id,data}, {onConflict:'kind,id'}));
  const add = (kind,data) => { const value = {...data,id:crypto.randomUUID(),createdAt:new Date().toISOString()}; return save(kind,value.id,value).then(() => value); };
  const update = (kind,id,data) => { const existing = list(kind).find(r => r.id === id); if (!existing) return Promise.reject(new Error('Registro não encontrado.')); return save(kind,id,{...existing,...data,id}); };
  const remove = (kind,id) => mutate(() => supabase.from('barbershop_records').delete().eq('kind',kind).eq('id',id));
  const actions = {};
  for (const [singular,kind] of Object.entries({Client:'clients',Appointment:'appointments',Service:'services',Barber:'barbers',Testimonial:'testimonials',GalleryImage:'gallery',Holiday:'holidays'})) {
    actions['add'+singular] = data => add(kind,kind === 'clients' ? {...data,totalSpent:0,totalVisits:0} : data);
    actions['update'+singular] = (id,data) => update(kind,id,data);
    actions['delete'+singular] = id => remove(kind,id);
  }
  actions.deleteService = id => list('appointments').some(a=>a.serviceId===id) ? update('services',id,{active:false}) : remove('services',id);
  for(const action of ['create','update','delete']) {
    actions[action==='create'?'addUser':action==='update'?'updateUser':'deleteUser'] = async (id,user) => {
      try { await staff({data:{action,...(action==='create'?{user:id}:{id,...(user?{user:{...users.find(u=>u.id===id),...user}}:{})})}}); await refresh(); }
      catch(e) { toast.error(e.message || 'Não foi possível salvar o usuário.'); throw e; }
    };
  }
  // Existing screens may fire and forget: prevent unhandled rejections; errors remain visible via toast.
  for(const key of Object.keys(actions)) { const fn=actions[key]; actions[key]=(...args)=>{ const promise=fn(...args); promise.catch(()=>{}); return promise; }; }
  const login = async (email,password) => {
    const {data,error} = await supabase.auth.signInWithPassword({email,password});
    if(error || !data.user) return false;
    const {data:role} = await supabase.from('user_roles').select('active').eq('user_id',data.user.id).maybeSingle();
    if(!role?.active) { await supabase.auth.signOut(); return false; }
    await refresh(); return true;
  };
  const logout = async () => { await queryClient.cancelQueries(); queryClient.clear(); ++generation.current; setRecords([]); setUsers([]); setCurrentUser(null); await supabase.auth.signOut(); await refresh(); };
  if(loading) return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Carregando...</div>;
  if(error) return <div className="min-h-screen flex flex-col gap-4 items-center justify-center bg-background text-foreground"><p role="alert">{error}</p><Button onClick={()=>void refresh()}>Tentar novamente</Button></div>;
  return <DataContext.Provider value={{...actions,users,currentUser,isAuthenticated:!!currentUser,login,logout,refresh,
    clients:list('clients'), appointments:currentUser ? list('appointments'):busy, services:list('services'),barbers:list('barbers'),testimonials:list('testimonials'),gallery:list('gallery'),holidays:list('holidays'),
    siteSettings:settings('siteSettings') || defaultSiteSettings, themeSettings:settings('themeSettings') || defaultThemeSettings,
    updateSiteSettings:data=>save('siteSettings','main',{...(settings('siteSettings')||defaultSiteSettings),...data}),
    updateThemeSettings:data=>save('themeSettings','main',{...(settings('themeSettings')||defaultThemeSettings),...data})
  }}>{children}</DataContext.Provider>;
}
export function useData() { const value=useContext(DataContext); if(!value) throw new Error('useData must be used within DataProvider'); return value; }
