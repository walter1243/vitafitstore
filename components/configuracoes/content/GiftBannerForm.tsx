import type { GiftBannerContent } from '@/lib/site-content-defaults';
import { Field, inputCls, textareaCls } from './shared';

export function GiftBannerForm({ data, onChange }: { data: GiftBannerContent; onChange: (d: GiftBannerContent) => void }) {
  function set<K extends keyof GiftBannerContent>(key: K, value: GiftBannerContent[K]) {
    onChange({ ...data, [key]: value });
  }

  return (
    <div>
      <Field label="Selo pequeno (acima do título)" hint="Ex: Edición Navidad, Edición Verano...">
        <input className={inputCls} value={data.badgeText} onChange={(e) => set('badgeText', e.target.value)} />
      </Field>
      <Field label="Título do banner">
        <input className={inputCls} value={data.heading} onChange={(e) => set('heading', e.target.value)} />
      </Field>
      <Field label="Texto de apoio">
        <textarea className={textareaCls} rows={3} value={data.description} onChange={(e) => set('description', e.target.value)} />
      </Field>
      <Field label="Texto do botão">
        <input className={inputCls} value={data.ctaText} onChange={(e) => set('ctaText', e.target.value)} />
      </Field>
    </div>
  );
}
