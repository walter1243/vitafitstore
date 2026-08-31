'use client';
import { useRef, useState, type ReactNode } from 'react';
import { upload } from '@vercel/blob/client';
import { Upload, Loader2 } from 'lucide-react';

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-xs font-medium text-white/60">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-white/35">{hint}</p>}
    </div>
  );
}

export const inputCls =
  'w-full rounded-lg border border-white/10 bg-[#1c2236] px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-green-500/40 focus:ring-2 focus:ring-green-500/40';

export const textareaCls = `${inputCls} resize-none`;

export function MediaUploadField({
  label,
  hint,
  value,
  onChange,
  kind,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (url: string) => void;
  kind: 'image' | 'video';
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const accept = kind === 'image' ? 'image/*' : 'video/mp4,video/webm';
  const maxSizeMb = kind === 'image' ? 15 : 150;

  async function acceptFile(file: File | null | undefined) {
    if (!file) return;
    if (!file.type.startsWith(kind === 'image' ? 'image/' : 'video/')) {
      setError('Formato de arquivo não suportado.');
      return;
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`Arquivo muito grande (máx. ${maxSizeMb}MB). Comprima o arquivo ou cole uma URL já hospedada.`);
      return;
    }

    setError('');
    setUploading(true);
    try {
      const filename = file.name || `${kind}-${Date.now()}`;
      const blob = await upload(filename, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      });
      onChange(blob.url);
    } catch (err: any) {
      setError(err?.message || 'Erro ao enviar arquivo. Tente uma URL já hospedada.');
    } finally {
      setUploading(false);
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    for (const item of e.clipboardData.items) {
      if (item.type.startsWith(kind === 'image' ? 'image/' : 'video/')) {
        e.preventDefault();
        void acceptFile(item.getAsFile());
        return;
      }
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    void acceptFile(e.dataTransfer.files?.[0]);
  }

  return (
    <Field label={label} hint={hint}>
      <div
        tabIndex={0}
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={`flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-5 text-center outline-none transition ${
          dragOver ? 'border-green-500/60 bg-green-500/10' : 'border-white/15 bg-[#0f1117] hover:border-white/25'
        }`}
      >
        {uploading ? (
          <Loader2 size={18} className="animate-spin text-green-400" />
        ) : value ? (
          kind === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-28 w-auto rounded-lg border border-white/10 object-contain" />
          ) : (
            <video src={value} className="h-28 w-auto rounded-lg border border-white/10" muted playsInline />
          )
        ) : (
          <Upload size={18} className="text-white/30" />
        )}
        <p className="text-xs text-white/55">
          {uploading ? (
            'Enviando...'
          ) : (
            <>Cole com <span className="font-semibold text-white/80">Ctrl+V</span>, arraste o arquivo aqui, ou</>
          )}
        </p>
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/5 disabled:opacity-50"
        >
          Escolher {kind === 'image' ? 'imagem' : 'vídeo'} da mídia
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => void acceptFile(e.target.files?.[0])}
        />
      </div>
      {error && <p className="mt-1.5 text-[11px] text-red-400">{error}</p>}
      <input
        className={`${inputCls} mt-2`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="ou cole uma URL aqui"
      />
    </Field>
  );
}
