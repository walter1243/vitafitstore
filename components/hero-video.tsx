'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowDown, Play, ArrowRight, Shield, Zap, Leaf, X } from 'lucide-react';
import gsap from 'gsap';
import Lenis from '@studio-freight/lenis';

export default function HeroVideo() {
  const textRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (textRef.current) {
      gsap.fromTo(
        textRef.current.children,
        { opacity: 0, y: 60 },
        { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', stagger: 0.15, delay: 0.3 }
      );
    }
    const onScroll = () => {
      if (scrollIndicatorRef.current) {
        gsap.to(scrollIndicatorRef.current, {
          opacity: window.scrollY > 60 ? 0 : 1,
          duration: 0.5,
          ease: 'power2.out',
        });
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      smoothTouch: true,
    });
    const raf = (time: number) => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = showModal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showModal]);

  return (
    <>
      <section className="relative w-full h-screen flex items-center justify-center overflow-hidden">
        {/* Video */}
        <video
          className="absolute inset-0 w-full h-full object-cover z-0"
          src="/video-hero.mp4"
          autoPlay
          loop
          muted
          playsInline
          poster="/images/collagen.jpg"
        />

        {/* Gradient overlay */}
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background:
              'linear-gradient(135deg, rgba(0,0,0,0.72) 0%, rgba(0,40,20,0.55) 60%, rgba(0,0,0,0.42) 100%)',
          }}
        />

        {/* Ambient blobs */}
        <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden">
          <div className="animate-blob animation-delay-0 absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-600/15 blur-[120px]" />
          <div className="animate-blob animation-delay-2000 absolute top-1/2 right-0 h-80 w-80 rounded-full bg-teal-500/10 blur-[100px]" />
          <div className="animate-blob animation-delay-4000 absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-green-400/10 blur-[90px]" />
        </div>

        {/* Main content */}
        <div
          ref={textRef}
          className="relative z-10 text-white text-center flex flex-col items-center px-4 max-w-5xl mx-auto"
        >
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 backdrop-blur-sm px-5 py-2 text-sm font-semibold text-emerald-300">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Envío gratis en pedidos +50€ · España
          </div>

          {/* Title */}
          <h1
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 drop-shadow-2xl leading-[1.05] tracking-tight"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            <span className="block text-white">Bienvenido a</span>
            <span className="block bg-gradient-to-r from-emerald-300 via-green-400 to-teal-300 bg-clip-text text-transparent">
              VitaFit Store
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-white/75 mb-10 font-light tracking-widest drop-shadow">
            Salud · Performance · Bienestar
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <a
              href="#productos"
              className="group flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-4 rounded-xl text-base font-semibold transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-[0_0_30px_rgba(34,197,94,0.6)]"
            >
              Descubrir Productos
              <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </a>

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-white border border-white/25 backdrop-blur-sm bg-white/8 hover:bg-white/18 transition-all duration-300 cursor-pointer"
            >
              <span className="h-8 w-8 rounded-full border-2 border-white/70 flex items-center justify-center">
                <Play className="h-3.5 w-3.5 fill-white ml-0.5" />
              </span>
              Ver Vídeo
            </button>
          </div>

          {/* Trust row */}
          <div className="mt-10 flex items-center gap-6 flex-wrap justify-center">
            {[
              { icon: Shield, label: 'Pago Seguro' },
              { icon: Zap, label: 'Resultados Reales' },
              { icon: Leaf, label: '100% Natural' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-white/60 text-sm">
                <Icon className="h-4 w-4 text-emerald-400" />
                <span>{label}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-12 flex items-center divide-x divide-white/10 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
            {[
              { value: '50K+', label: 'Clientes felices' },
              { value: '4.9★', label: 'Valoración media' },
              { value: '100%', label: 'Natural' },
              { value: '2-3d', label: 'Entrega rápida' },
            ].map((stat) => (
              <div key={stat.label} className="px-6 py-4 text-center">
                <p className="text-xl font-bold text-emerald-400">{stat.value}</p>
                <p className="text-xs text-white/50 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          ref={scrollIndicatorRef}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
        >
          <span className="text-white/40 text-xs tracking-widest uppercase">Scroll</span>
          <div className="animate-bounce">
            <ArrowDown className="h-5 w-5 text-emerald-400" />
          </div>
        </div>
      </section>

      {/* Video Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute -top-12 right-0 flex items-center gap-2 text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
              <span className="text-sm">Fechar</span>
            </button>

            <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <video
                src="/video-hero.mp4"
                controls
                autoPlay
                className="w-full aspect-video bg-black"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
