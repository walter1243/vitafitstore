import Image from 'next/image';

// "Nuestro taller": a arte dos adornos e presentes personalizados inteira
// (sem cortar o texto dela) e, embaixo, o titulo.
export function KidsHowItsMade() {
  return (
    <section id="como-se-hace" className="scroll-mt-24 bg-[#23263f]">
      <div className="relative aspect-[1024/434] w-full">
        <Image
          src="/images/taller-adornos.jpg"
          alt="Adornos y regalos personalizados impresos en 3D en nuestro taller: llaveros, árbol, muñeco de nieve y jarrón"
          fill
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div className="mx-auto max-w-3xl px-4 py-10 text-center sm:py-14">
        <h2 className="text-4xl font-bold text-white sm:text-6xl">Nuestro taller</h2>
        <p className="mt-3 text-lg text-white/85 sm:text-xl">
          Lo diseñamos, lo imprimimos capa a capa y te lo enviamos a casa.
        </p>
      </div>
    </section>
  );
}
