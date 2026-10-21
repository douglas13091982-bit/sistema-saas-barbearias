import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { SiteImage } from '@/components/SiteImage';
import { preparePhoto } from '@/lib/prepare-photo';

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBusyChange: (busy: boolean) => void;
  disabled?: boolean;
  maxEdge?: number;
};

export function PhotoUpload({ id, label, value, onChange, onBusyChange, disabled, maxEdge }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const request = useRef(0);
  useEffect(() => () => { request.current += 1; }, []);
  const selectPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const current = ++request.current;
    setError(''); setBusy(true); onBusyChange(true);
    try {
      const photo = await preparePhoto(file, { maxEdge });
      if (request.current === current) onChange(photo);
    } catch (cause) {
      if (request.current === current) setError(cause instanceof Error ? cause.message : 'Não foi possível abrir a foto. Escolha outro arquivo.');
    } finally {
      if (request.current === current) { setBusy(false); onBusyChange(false); }
    }
  };
  return <div className="space-y-3">
    <label htmlFor={id} className="block text-sm text-white/70">{label}</label>
    <input id={id} type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled || busy} onChange={selectPhoto}
      aria-describedby={id + '-help'} className="block w-full min-w-0 text-sm text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2.5 file:text-white disabled:opacity-50" />
    <p id={id + '-help'} className="text-xs text-white/50">{busy ? 'Preparando foto...' : 'JPG, PNG ou WebP, até 5 MB. Compressão e conversão WebP automáticas. Clique em Salvar.'}</p>
    {value && <div className="space-y-2">
      <SiteImage src={value} alt="Prévia da foto selecionada" className="h-40 w-full rounded-xl border border-white/10 object-contain bg-black/20" />
      <button type="button" disabled={disabled || busy} onClick={() => { onChange(''); setError(''); }} className="text-sm text-red-400 hover:underline disabled:opacity-50">Remover foto</button>
    </div>}
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
  </div>;
}
