import { redirect } from 'next/navigation'

// O catalogo "revista" saiu: Hogar agora e um setor normal (faixas no visual
// Casa), editavel no Admin → Setores e coleções.
export default function HogarPage() {
  redirect('/sector/hogar')
}
