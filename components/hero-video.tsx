"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import Lenis from "@studio-freight/lenis";

export default function HeroVideo() {
  const textRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // GSAP reveal
    if (textRef.current) {
      gsap.fromTo(
        textRef.current,
        { opacity: 0, y: 60 },
        { opacity: 1, y: 0, duration: 1.2, ease: "power3.out", delay: 0.3 }
      );
    }
    // Scroll indicator hide
    const onScroll = () => {
      if (scrollRef.current) {
        if (window.scrollY > 40) {
          gsap.to(scrollRef.current, { opacity: 0, duration: 0.7, ease: "power3.out" });
        } else {
          gsap.to(scrollRef.current, { opacity: 1, duration: 0.7, ease: "power3.out" });
        }
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      smoothTouch: true,
    });
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  return (
    <section className="relative w-full h-screen flex items-center justify-center overflow-hidden">
      <video
        className="absolute inset-0 w-full h-full object-cover z-0"
        src="/video-hero.mp4"
        autoPlay
        loop
        muted
        playsInline
      />
      <div
        ref={textRef}
        className="relative z-10 text-white text-center flex flex-col items-center justify-center"
      >
        <h1 className="text-5xl md:text-7xl font-bold mb-6 drop-shadow-lg">
          Bem-vindo à Nova Experiência VitaFit
        </h1>
        <p className="text-xl md:text-2xl font-medium mb-8 drop-shadow">
          Saúde, performance e bem-estar com tecnologia e elegância.
        </p>
      </div>
      <div
        ref={scrollRef}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center opacity-100 transition"
      >
        <div className="w-8 h-8 border-2 border-white rounded-full flex items-center justify-center animate-bounce mb-2">
          <div className="w-2 h-2 bg-white rounded-full" />
        </div>
        <span className="text-white text-xs">Scroll</span>
      </div>
      <div className="absolute inset-0 bg-black/40 z-1" />
    </section>
  );
}
