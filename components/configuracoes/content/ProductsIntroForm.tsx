import { type ProductsIntroContent } from '@/lib/site-content-defaults';
import { Field, inputCls } from './shared';

export function ProductsIntroForm({ data, onChange }: { data: ProductsIntroContent; onChange: (d: ProductsIntroContent) => void }) {
  return (
    <div>
      <Field
        label="Texto acima de 'Productos'"
        hint="Aparece em cima do título de cada categoria, na seção de produtos da loja."
      >
        <input
          className={inputCls}
          value={data.eyebrow}
          onChange={(e) => onChange({ ...data, eyebrow: e.target.value })}
        />
      </Field>
    </div>
  );
}
