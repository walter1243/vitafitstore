'use client';
import { type SectorStyle } from '@/lib/sectors-shared';

// Ilustracao animada de cada mundo nos cards "Elige tu mundo". As pecas sao
// recortes da mesma imagem (500x500, mesma posicao), empilhados — por isso
// encaixam perfeito. `on` = card escolhido: a animacao toca ao clicar e o
// card fica no estado "pronto".
//  - infantil:  o dinossauro e pintado (tinta espalhando) e o foguete acende
//  - hogar:     as flores entram no vaso
//  - llaveros:  a foto vai pro prendedor e o chaveiro balanca
//  - mascotas:  a pa vira e a racao cai na tigela
const P = '/images/worlds/';

function Layer({ src, className = '', style }: { src: string; className?: string; style?: React.CSSProperties }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={P + src} alt="" draggable={false} className={`pointer-events-none absolute inset-0 h-full w-full select-none object-contain ${className}`} style={style} />;
}

export function WorldArt({ style, on, trigger = 0, alt }: { style: SectorStyle; on: boolean; trigger?: number; alt: string }) {
  // Cada clique (trigger) reinicia a animacao.
  const play = trigger;

  return (
    <span className="absolute inset-y-0 left-1/2 block aspect-square h-full -translate-x-1/2" role="img" aria-label={alt}>
      {style === 'infantil' && (
        <>
          <Layer src="infantil-base.png" />
          {/* luz do foguete */}
          <span key={`l${play}`} className={`wa-glow pointer-events-none absolute ${on ? 'wa-on' : ''}`} style={{ left: '18%', top: '30%', width: '28%', height: '28%' }} aria-hidden="true" />
          {/* tinta: so aparece dentro do desenho do dino (mascara) */}
          <span
            key={`p${play}`}
            className={`wa-paint pointer-events-none absolute inset-0 ${on ? 'wa-on' : ''}`}
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
          <Layer key={`f${play}`} src="hogar-flores.png" className={`wa-flowers ${on ? 'wa-on' : ''}`} />
        </>
      )}

      {style === 'llaveros' && (
        <>
          <Layer src="pers-base.png" />
          <Layer key={`k${play}`} src="pers-llavero.png" className={`wa-swing ${on ? 'wa-on' : ''}`} />
          <Layer key={`f${play}`} src="pers-foto.png" className={`wa-photo ${on ? 'wa-on' : ''}`} />
        </>
      )}

      {style === 'mascotas' && (
        <>
          <Layer src="pet-bol.png" />
          <Layer key={`r${play}`} src="pet-racao.png" className={`wa-food ${on ? 'wa-on' : ''}`} />
          {/* graos caindo */}
          {on && (
            <span key={`d${play}`} className="pointer-events-none absolute inset-0" aria-hidden="true">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <span key={i} className="wa-kibble absolute rounded-full" style={{ left: `${56 + i * 4}%`, top: '30%', width: '3.2%', height: '2.6%', background: i % 2 ? '#8B5A2B' : '#A0692F', animationDelay: `${0.45 + i * 0.08}s` }} />
              ))}
            </span>
          )}
          <Layer key={`s${play}`} src="pet-pala.png" className={`wa-scoop ${on ? 'wa-on' : ''}`} />
        </>
      )}
    </span>
  );
}

export const HAS_WORLD_ART = (s: SectorStyle) => s === 'infantil' || s === 'hogar' || s === 'llaveros' || s === 'mascotas';
