'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, Shield, Zap, Flame, Volume2, VolumeX } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';
import { DEFAULT_HERO, type HeroContent } from '@/lib/site-content-defaults';

gsap.registerPlugin(ScrollTrigger);

function fadeVolume(video: HTMLVideoElement, target: number, duration: number, onDone?: () => void) {
  const steps = 20;
  const stepTime = duration / steps;
  const start = video.volume;
  const delta = (target - start) / steps;
  let step = 0;
  const id = setInterval(() => {
    step++;
    video.volume = Math.max(0, Math.min(1, video.volume + delta));
    if (step >= steps) {
      clearInterval(id);
      video.volume = target;
      onDone?.();
    }
  }, stepTime);
}

export default function HeroVideo({ content }: { content?: Partial<HeroContent> }) {
  const hero = { ...DEFAULT_HERO, ...content };
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  // GSAP text reveal
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

  // Lenis smooth scroll — driven by gsap.ticker (not its own rAF loop) and
  // wired into ScrollTrigger.update, otherwise every ScrollTrigger on the
  // page (Destacados, product carousels, etc.) gets stale trigger positions
  // and their reveal animations silently never fire.
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      smoothTouch: true,
    });

    lenis.on('scroll', ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  // IntersectionObserver: pause/resume with volume fade
  useEffect(() => {
    const video = videoRef.current;
    const section = sectionRef.current;
    if (!video || !section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.2) {
          video.play().catch(() => {});
          video.volume = 0;
          fadeVolume(video, isMuted ? 0 : 1, 500);
        } else {
          fadeVolume(video, 0, 500, () => video.pause());
        }
      },
      { threshold: [0, 0.2, 0.5, 1.0] }
    );

    observer.observe(section);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isMuted) {
      video.muted = false;
      video.volume = 0;
      fadeVolume(video, 1, 500);
      setIsMuted(false);
    } else {
      fadeVolume(video, 0, 500, () => { video.muted = true; });
      setIsMuted(true);
    }
  };

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-[72svh] min-h-[460px] sm:h-[85svh] lg:h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Video */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover object-[center_30%] sm:object-center z-0"
        src={hero.videoUrl}
        autoPlay
        loop
        muted
        playsInline
        poster={hero.posterUrl}
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
        <div className="animate-blob animation-delay-0 absolute -top-24 -left-24 h-96 w-96 rounded-full bg-sky-600/15 blur-[120px]" />
        <div className="animate-blob animation-delay-2000 absolute top-1/2 right-0 h-80 w-80 rounded-full bg-cyan-500/10 blur-[100px]" />
        <div className="animate-blob animation-delay-4000 absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-sky-400/10 blur-[90px]" />
        {/* Winter frost accent blob */}
        <div className="animate-blob animation-delay-2000 absolute top-10 right-1/4 h-64 w-64 rounded-full bg-sky-400/10 blur-[100px]" />
      </div>

      {/* Main content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <div
        ref={textRef}
        className="text-white text-center flex flex-col items-center max-w-5xl mx-auto"
      >
        {/* Badge */}
        <div className="mb-4 sm:mb-6 inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 backdrop-blur-sm px-3 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-semibold text-sky-300">
          <div className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
          {hero.badgeText}
        </div>

        {/* Title */}
        <h1
          className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-4 sm:mb-6 drop-shadow-2xl leading-[1.05] tracking-tight"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          <span className="block text-white">{hero.titleLine1}</span>
          <span className="block bg-gradient-to-r from-sky-300 via-sky-400 to-cyan-300 bg-clip-text text-transparent">
            {hero.titleLine2}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-lg md:text-2xl text-white/75 mb-7 sm:mb-10 font-light tracking-[0.2em] sm:tracking-widest drop-shadow">
          {hero.subtitle}
        </p>

        {/* Single CTA */}
        <a
          href={hero.ctaHref}
          className="group flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white px-6 py-3 sm:px-10 sm:py-4 rounded-xl text-sm sm:text-base font-semibold transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-[0_0_30px_rgba(14,165,233,0.6)]"
        >
          {hero.ctaText}
          <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
        </a>

        {/* Trust row */}
        <div className="mt-8 sm:mt-10 flex items-center gap-4 sm:gap-8 flex-wrap justify-center">
          {[
            { icon: Shield, label: 'Pago Seguro' },
            { icon: Zap, label: 'Calor Instantáneo' },
            { icon: Flame, label: 'Máxima Calidez' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-white/70 text-xs sm:text-sm">
              <Icon className="h-4 w-4 text-sky-400" />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
      </div>

      {/* Volume control */}
      <button
        onClick={toggleMute}
        className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-20 bg-black/40 backdrop-blur-sm border border-white/20 rounded-full p-2.5 sm:p-3 text-white hover:bg-black/60 transition-all duration-300 cursor-pointer"
        aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>

      {/* Scroll indicator */}
      <div
        ref={scrollIndicatorRef}
        className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
      >
        <span className="text-white/40 text-xs tracking-widest uppercase">Scroll</span>
        <div className="animate-bounce">
          <ArrowDown className="h-5 w-5 text-sky-400" />
        </div>
      </div>
    </section>
  );
}
