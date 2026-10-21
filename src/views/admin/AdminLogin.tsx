import { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useNavigate } from '@/lib/router-compat';
import { Scissors, Lock, Mail, AlertCircle } from 'lucide-react';

export default function AdminLogin() {
  const { login, themeSettings } = useData();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const theme = themeSettings;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (login(email, password)) {
      navigate('/admin');
    } else {
      setError('E-mail ou senha incorretos');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: theme.backgroundColor, fontFamily: theme.fontFamily }}>
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ backgroundColor: theme.accentColor }}>
            <Scissors className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Playfair Display' }}>Painel Administrativo</h1>
          <p className="text-white/50 mt-2">Faça login para acessar o sistema</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@barbershop.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-white/30 outline-none transition text-white placeholder:text-white/30"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-white/30 outline-none transition text-white placeholder:text-white/30"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-xl font-bold transition-all hover:scale-[1.02]"
            style={{ backgroundColor: theme.accentColor, color: '#000' }}
          >
            Entrar
          </button>
          <div className="text-center text-xs text-white/40 mt-4">
            <p>Demo: admin@barbershop.com / admin123</p>
          </div>
        </form>
      </div>
    </div>
  );
}
