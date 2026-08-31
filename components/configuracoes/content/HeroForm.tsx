import type { HeroContent } from '@/lib/site-content-defaults';
import { Field, inputCls, MediaUploadField } from './shared';

export function HeroForm({ data, onChange }: { data: HeroContent; onChange: (d: HeroContent) => void }) {
  function set<K extends keyof HeroContent>(key: K, value: HeroContent[K]) {
    onChange({ ...data, [key]: value });
  }

  return (
    <div>
      <Field label="Texto do selo (badge acima do título)">
        <input className={inputCls} value={data.badgeText} onChange={(e) => set('badgeText', e.target.value)} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Título — linha 1">
          <input className={inputCls} value={data.titleLine1} onChange={(e) => set('titleLine1', e.target.value)} />
        </Field>
        <Field label="Título — linha 2 (com destaque colorido)">
          <input className={inputCls} value={data.titleLine2} onChange={(e) => set('titleLine2', e.target.value)} />
        </Field>
      </div>

      <Field label="Subtítulo">
        <input className={inputCls} value={data.subtitle} onChange={(e) => set('subtitle', e.target.value)} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Texto do botão (CTA)">
          <input className={inputCls} value={data.ctaText} onChange={(e) => set('ctaText', e.target.value)} />
        </Field>
        <Field label="Link do botão (CTA)">
          <input className={inputCls} value={data.ctaHref} onChange={(e) => set('ctaHref', e.target.value)} placeholder="#productos" />
        </Field>
      </div>

      <MediaUploadField
        label="Vídeo de fundo"
        hint="Vídeos grandes deixam a página mais lenta — prefira arquivos curtos e leves (poucos segundos, sem áudio)."
        kind="video"
        value={data.videoUrl}
        onChange={(url) => set('videoUrl', url)}
      />

      <Field
        label="Enquadramento do vídeo"
        hint="Ajusta qual parte do vídeo fica visível quando a tela é mais estreita ou mais larga que o vídeo original."
      >
        <div className="grid grid-cols-3 gap-2">
          {([
            { key: 'top' as const, label: 'Topo' },
            { key: 'center' as const, label: 'Centro' },
            { key: 'bottom' as const, label: 'Base' },
          ]).map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => set('videoPosition', opt.key)}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                data.videoPosition === opt.key
                  ? 'border-green-500/50 bg-green-500/15 text-green-300'
                  : 'border-white/10 text-white/60 hover:bg-white/5'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Field>

      <MediaUploadField
        label="Imagem de capa (poster)"
        hint="Aparece enquanto o vídeo carrega."
        kind="image"
        value={data.posterUrl}
        onChange={(url) => set('posterUrl', url)}
      />
    </div>
  );
}
