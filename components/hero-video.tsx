'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Volume2, VolumeX } from 'lucide-react';
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
  }, []);

  // Lenis smooth scroll — driven by gsap.ticker (not its own rAF loop) and
  // wired into ScrollTrigger.update, otherwise every ScrollTrigger on the
  // page (Destacados, product carousels, etc.) gets stale trigger positions
  // and their reveal animations silently never fire.
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      // Touch scrolling is left as plain native scroll on purpose — no
      // syncTouch/smoothTouch. Virtualizing touch scroll made swiping feel
      // heavy and disconnected from the finger, so only wheel/keyboard
      // scroll (desktop) get the eased Lenis treatment.
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
      {/* Video — object-cover always fills the section on any screen size/
         orientation without letterboxing; videoPosition controls which part
         of the frame gets cropped when the video's aspect ratio doesn't
         match the viewport's. */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{
          objectPosition:
            hero.videoPosition === 'top' ? 'center 15%' : hero.videoPosition === 'bottom' ? 'center 85%' : 'center center',
        }}
        src={hero.videoUrl}
        autoPlay
        loop
        muted
        playsInline
        poster={hero.posterUrl}
      />

      {/* Gradient overlay — flat vertical tint instead of a diagonal wash, so
         it darkens evenly for text contrast without patchily cutting across
         the subject's face */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            'linear-gradient(180deg, rgba(15,23,42,0.48) 0%, rgba(15,23,42,0.38) 45%, rgba(15,23,42,0.58) 100%)',
        }}
      />

      {/* Ambient blobs */}
      <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden">
        <div className="animate-blob animation-delay-0 absolute -top-24 -left-24 h-96 w-96 rounded-full bg-orange-800/15 blur-[120px]" />
        <div className="animate-blob animation-delay-2000 absolute top-1/2 right-0 h-80 w-80 rounded-full bg-amber-500/10 blur-[100px]" />
        <div className="animate-blob animation-delay-4000 absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-orange-600/10 blur-[90px]" />
        {/* Winter frost accent blob */}
        <div className="animate-blob animation-delay-2000 absolute top-10 right-1/4 h-64 w-64 rounded-full bg-orange-600/10 blur-[100px]" />
      </div>

      {/* Main content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <div
        ref={textRef}
        className="text-white text-center flex flex-col items-center max-w-5xl mx-auto"
      >
        {/* Title */}
        <h1
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 drop-shadow-2xl leading-[1.15] tracking-tight max-w-4xl"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          <span className="block text-white">{hero.titleLine1}</span>
          <span className="block bg-gradient-to-r from-orange-600 via-orange-600 to-amber-600 bg-clip-text text-transparent">
            {hero.titleLine2}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base md:text-lg text-white/80 mb-7 sm:mb-10 max-w-2xl font-light drop-shadow">
          {hero.subtitle}
        </p>

        {/* Single CTA */}
        <a
          href={hero.ctaHref}
          className="group flex items-center gap-2 bg-orange-700 hover:bg-orange-600 text-white px-6 py-3 sm:px-10 sm:py-4 rounded-lg text-sm sm:text-base font-semibold transition-all duration-300 cursor-pointer shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30"
        >
          {hero.ctaText}
          <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
        </a>
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
    </section>
  );
}
