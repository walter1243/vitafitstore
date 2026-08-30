import type { NewsletterContent } from '@/lib/site-content-defaults';
import { Field, inputCls, textareaCls } from './shared';

export function NewsletterForm({ data, onChange }: { data: NewsletterContent; onChange: (d: NewsletterContent) => void }) {
  function set<K extends keyof NewsletterContent>(key: K, value: NewsletterContent[K]) {
    onChange({ ...data, [key]: value });
  }

  return (
    <div>
      <Field label="Título">
        <input className={inputCls} value={data.title} onChange={(e) => set('title', e.target.value)} />
      </Field>
      <Field label="Texto de apoio">
        <textarea className={textareaCls} rows={3} value={data.text} onChange={(e) => set('text', e.target.value)} />
      </Field>
      <Field label="Aviso de privacidade (linha pequena abaixo do formulário)">
        <textarea className={textareaCls} rows={2} value={data.privacyText} onChange={(e) => set('privacyText', e.target.value)} />
      </Field>
    </div>
  );
}
