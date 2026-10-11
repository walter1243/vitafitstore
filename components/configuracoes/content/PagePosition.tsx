// Small "where does this show up" visual for each content card in Admin →
// Editar loja. The actual home page order can shift a little if the admin
// reorders blocks in "Blocos da Home", but this reflects the default/
// common order — close enough to orient someone who has no idea which
// card controls which part of the page.
export const PAGE_LANDMARKS = [
  'Cabeçalho',
  'Vídeo principal',
  'Selos de confiança',
  'Produtos',
  'Destacados',
  'Categorias em destaque',
  'Banner de presente',
  'Mais vendidos',
  'Sobre a loja',
  'Rodapé',
] as const;

export function PagePosition({ index }: { index: number }) {
  return (
    <div className="mt-2 flex items-center gap-1.5">
      {PAGE_LANDMARKS.map((label, i) => (
        <span
          key={label}
          title={label}
          className={`h-1.5 rounded-full transition-all ${
            i === index ? 'w-5 bg-green-400' : 'w-1.5 bg-white/15'
          }`}
        />
      ))}
    </div>
  );
}
