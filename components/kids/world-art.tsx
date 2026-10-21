'use client';
import { type SectorStyle } from '@/lib/sectors-shared';

// Ilustracao animada de cada mundo na home. As pecas sao recortes da mesma
// imagem (500x500, mesma posicao), empilhadas — por isso encaixam perfeito.
// `on` = estado "pronto" (mouse em cima, dedo segurando ou mundo escolhido);
// `go` muda a cada vez que comeca, pra repetir os movimentos de vai-e-volta.
//  - infantil:  o dinossauro e pintado e o foguete acende
//  - hogar:     as flores entram no vaso
//  - llaveros:  a foto vai pro prendedor e o chaveiro balanca
//  - mascotas:  a pa vira e a racao cai na tigela
const P = '/images/worlds/';

function Layer({ src, className = '' }: { src: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={P + src} alt="" draggable={false} className={`pointer-events-none absolute inset-0 h-full w-full select-none object-contain ${className}`} />;
}

export function WorldArt({ style, on, go = 0, alt }: { style: SectorStyle; on: boolean; go?: number; alt: string }) {
  const c = on ? 'wa-on' : '';
  return (
    <span className={`wa-float relative block aspect-square w-full ${c}`} role="img" aria-label={alt}>
      {style === 'infantil' && (
        <>
          <Layer src="infantil-base.png" />
          <span className={`wa-glow pointer-events-none absolute ${c}`} style={{ left: '18%', top: '30%', width: '28%', height: '28%' }} aria-hidden="true" />
          {/* tinta: so dentro do desenho do dino (mascara) */}
          <span
            className={`wa-paint pointer-events-none absolute inset-0 ${c}`}
            style={{
              WebkitMaskImage: `url(${P}infantil-dino.png)`,
              maskImage: `url(${P}infantil-dino.png)`,
              WebkitMaskSize: '100% 100%',
              maskSize: '100% 100%',
              background:
                'radial-gradient(circle at 63% 47%, #7EE2B8 0 9%, transparent 9.5%), radial-gradient(circle at 76% 58%, #FF8FB8 0 7%, transparent 7.5%), radial-gradient(circle at 70% 70%, #7CC4FF 0 8%, transparent 8.5%), linear-gradient(135deg, #FFD84D, #FF9F43 45%, #B9A4FF)',
              mixBlendMode: 'multiply',
            }}
            aria-hidden="true"
          />
        </>
      )}

      {style === 'hogar' && (
        <>
          <Layer src="hogar-vaso.png" />
          <Layer src="hogar-flores.png" className={`wa-flowers ${c}`} />
        </>
      )}

      {style === 'llaveros' && (
        <>
          <Layer src="pers-base.png" />
          <Layer key={`k${go}`} src="pers-llavero.png" className={`wa-swing ${on && go ? 'wa-go' : ''}`} />
          <Layer src="pers-foto.png" className={`wa-photo ${c}`} />
        </>
      )}

      {style === 'mascotas' && (
        <>
          <Layer src="pet-bol.png" />
          <Layer src="pet-racao.png" className={`wa-food ${c}`} />
          {on && go > 0 && (
            <span key={`d${go}`} className="pointer-events-none absolute inset-0" aria-hidden="true">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <span key={i} className="wa-kibble absolute rounded-full" style={{ left: `${56 + i * 4}%`, top: '30%', width: '3.2%', height: '2.6%', background: i % 2 ? '#8B5A2B' : '#A0692F', animationDelay: `${0.45 + i * 0.08}s` }} />
              ))}
            </span>
          )}
          <Layer key={`s${go}`} src="pet-pala.png" className={`wa-scoop ${on && go ? 'wa-go' : ''}`} />
        </>
      )}
    </span>
  );
}

export const HAS_WORLD_ART = (s: SectorStyle) => s === 'infantil' || s === 'hogar' || s === 'llaveros' || s === 'mascotas';
