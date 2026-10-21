import Image from 'next/image';

// "Nuestro taller": a arte dos adornos em largura total, na proporcao dela,
// com o titulo por cima na parte de baixo (degrade escuro pra ler bem).
export function KidsHowItsMade() {
  return (
    <section id="como-se-hace" className="relative scroll-mt-24 overflow-hidden">
      <div className="relative aspect-[4/3] w-full sm:aspect-[1024/434]">
        <Image
          src="/images/taller-adornos.jpg"
          alt="Adornos y regalos personalizados impresos en 3D en nuestro taller: llaveros, árbol, muñeco de nieve y jarrón"
          fill
          sizes="100vw"
          className="object-cover object-[60%_center]"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(7,8,15,0) 45%, rgba(7,8,15,0.55) 75%, rgba(7,8,15,0.85) 100%)' }} />
        <div className="absolute inset-x-0 bottom-0 px-4 pb-6 text-center sm:pb-10">
          <h2 className="text-3xl font-bold text-white drop-shadow sm:text-5xl md:text-6xl">Nuestro taller</h2>
          <p className="mt-2 text-base text-white/90 sm:text-xl">Lo diseñamos, lo imprimimos capa a capa y te lo enviamos a casa.</p>
        </div>
      </div>
    </section>
  );
}
