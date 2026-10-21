import Image from 'next/image';

// "Nuestro taller": a arte dos adornos inteira, na proporcao dela (sem cortar
// o logo). No computador o titulo fica por cima, na parte de baixo; no
// celular (imagem baixinha) vem logo embaixo, numa faixa curta.
export function KidsHowItsMade() {
  return (
    <section id="como-se-hace" className="relative scroll-mt-24 overflow-hidden bg-[#23263f]">
      <div className="relative aspect-[1024/434] w-full">
        <Image
          src="/images/taller-adornos.jpg"
          alt="Adornos y regalos personalizados impresos en 3D en nuestro taller: llaveros, árbol, muñeco de nieve y jarrón"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 hidden sm:block" style={{ background: 'linear-gradient(180deg, rgba(7,8,15,0) 50%, rgba(7,8,15,0.55) 78%, rgba(7,8,15,0.85) 100%)' }} />
        <div className="absolute inset-x-0 bottom-0 hidden px-4 pb-8 text-center sm:block md:pb-10">
          <h2 className="text-4xl font-bold text-white drop-shadow md:text-6xl">Nuestro taller</h2>
          <p className="mt-2 text-lg text-white/90 md:text-xl">Lo diseñamos, lo imprimimos capa a capa y te lo enviamos a casa.</p>
        </div>
      </div>
      <div className="px-4 py-5 text-center sm:hidden">
        <h2 className="text-2xl font-bold text-white">Nuestro taller</h2>
        <p className="mt-1 text-sm text-white/85">Lo diseñamos, lo imprimimos capa a capa y te lo enviamos a casa.</p>
      </div>
    </section>
  );
}
