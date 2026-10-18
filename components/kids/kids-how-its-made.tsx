import Image from 'next/image';

// "Nuestro taller" no padrao dos destaques (tela cheia, foto real com
// degrade por cima, titulo grande e uma linha) — escuro, logo depois do
// destaque claro de "Para pintar".
export function KidsHowItsMade() {
  return (
    <section id="como-se-hace" className="relative flex min-h-[80vh] scroll-mt-24 items-end justify-center overflow-hidden px-4 pb-16 text-center sm:pb-24">
      <Image
        src="/images/taller-nina-impresora-3d.jpg"
        alt="Niña sonriendo mientras juega con un estegosaurio impreso en 3D, junto a nuestra impresora 3D"
        fill
        sizes="100vw"
        className="object-cover object-[30%_center]"
      />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(7,8,15,0.05) 0%, rgba(7,8,15,0.25) 45%, rgba(7,8,15,0.85) 100%)' }} />
      <div className="relative z-10 max-w-3xl">
        <h2 className="text-5xl font-bold text-white sm:text-6xl md:text-7xl">Nuestro taller</h2>
        <p className="mt-3 text-lg text-white/85 sm:text-xl">
          Lo diseñamos, lo imprimimos capa a capa y te lo enviamos a casa.
        </p>
      </div>
    </section>
  );
}
