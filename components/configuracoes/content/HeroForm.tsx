import type { HeroContent } from '@/lib/site-content-defaults';
import { Field, inputCls, textareaCls } from './shared';

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
        <Field label="Título — linha 2 (com destaque em verde)">
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

      <Field label="URL do vídeo de fundo" hint="Arquivo .mp4 hospedado (ex: /video-hero.mp4 ou uma URL completa).">
        <input className={inputCls} value={data.videoUrl} onChange={(e) => set('videoUrl', e.target.value)} />
      </Field>

      <Field label="Imagem de capa (poster)" hint="Aparece enquanto o vídeo carrega.">
        <input className={inputCls} value={data.posterUrl} onChange={(e) => set('posterUrl', e.target.value)} />
      </Field>
    </div>
  );
}
