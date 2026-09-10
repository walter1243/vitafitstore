'use client'

import { X, Ruler } from 'lucide-react'
import type { ProductType } from '@/lib/products'

// Generic industry-standard EU size reference charts — not measurements of
// any specific product. Always shown with a disclaimer that exact fit
// varies by model, since we don't have (and won't fabricate) per-product
// spec sheets.
const ROPA_CHART = [
  { talla: '36', cintura: '66–69', cadera: '90–93' },
  { talla: '38', cintura: '70–73', cadera: '94–97' },
  { talla: '40', cintura: '74–77', cadera: '98–101' },
  { talla: '42', cintura: '78–81', cadera: '102–105' },
  { talla: '44', cintura: '82–86', cadera: '106–110' },
  { talla: '46', cintura: '87–91', cadera: '111–115' },
  { talla: '48', cintura: '92–96', cadera: '116–120' },
]

const CALZADO_CHART = [
  { talla: '35', pie: '22.0–22.5' },
  { talla: '36', pie: '22.5–23.0' },
  { talla: '37', pie: '23.0–23.5' },
  { talla: '38', pie: '23.5–24.0' },
  { talla: '39', pie: '24.0–24.5' },
  { talla: '40', pie: '24.5–25.3' },
  { talla: '41', pie: '25.3–26.0' },
  { talla: '42', pie: '26.0–26.7' },
  { talla: '43', pie: '26.7–27.3' },
  { talla: '44', pie: '27.3–28.0' },
  { talla: '45', pie: '28.0–28.7' },
  { talla: '46', pie: '28.7–29.3' },
]

export function SizeGuideModal({ type, onClose }: { type: ProductType; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white sm:rounded-3xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Ruler size={18} className="text-orange-700" /> Guía de tallas
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
            Tabla de referencia general en tallaje europeo (EU). Las medidas reales pueden variar según el modelo y el fabricante — úsala como orientación, no como medida exacta de esta prenda.
          </p>

          {type === 'ropa' ? (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="py-2">Talla EU</th>
                    <th className="py-2">Cintura (cm)</th>
                    <th className="py-2">Cadera (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  {ROPA_CHART.map(row => (
                    <tr key={row.talla} className="border-b border-slate-100">
                      <td className="py-2 font-semibold text-slate-900">{row.talla}</td>
                      <td className="py-2 text-slate-600">{row.cintura}</td>
                      <td className="py-2 text-slate-600">{row.cadera}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-5">
                <h4 className="mb-2 text-sm font-bold text-slate-900">Cómo medirte</h4>
                <ul className="space-y-1.5 text-sm text-slate-600">
                  <li><strong className="text-slate-800">Cintura:</strong> mide la parte más estrecha de tu torso, justo por encima del ombligo.</li>
                  <li><strong className="text-slate-800">Cadera:</strong> mide la parte más ancha de tu cadera, manteniendo la cinta métrica horizontal.</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="py-2">Talla EU</th>
                    <th className="py-2">Largo del pie (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  {CALZADO_CHART.map(row => (
                    <tr key={row.talla} className="border-b border-slate-100">
                      <td className="py-2 font-semibold text-slate-900">{row.talla}</td>
                      <td className="py-2 text-slate-600">{row.pie}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-5">
                <h4 className="mb-2 text-sm font-bold text-slate-900">Cómo medir tu pie</h4>
                <ul className="space-y-1.5 text-sm text-slate-600">
                  <li>Coloca el pie sobre una hoja de papel y dibuja su contorno descalzo.</li>
                  <li>Mide la distancia desde el talón hasta el dedo más largo.</li>
                  <li>Añade 0,5 cm de margen para mayor comodidad.</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
