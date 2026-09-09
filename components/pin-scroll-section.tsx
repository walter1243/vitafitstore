'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getIcon } from '@/lib/icon-map';
import { DEFAULT_DESTAQUES, type DestaquesContent } from '@/lib/site-content-defaults';

gsap.registerPlugin(ScrollTrigger);

const STYLE_CYCLE = [
  { grad: 'from-orange-50 to-white', iconCls: 'text-orange-700', borderCls: 'border-orange-200' },
  { grad: 'from-amber-50 to-white', iconCls: 'text-amber-600', borderCls: 'border-amber-200' },
  { grad: 'from-sky-50 to-white', iconCls: 'text-sky-600', borderCls: 'border-sky-200' },
  { grad: 'from-violet-50 to-white', iconCls: 'text-violet-600', borderCls: 'border-violet-200' },
];

export default function PinScrollSection({ data }: { data?: DestaquesContent }) {
  const content = data?.features?.length ? data : DEFAULT_DESTAQUES;
  const sectionRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (!sectionRef.current) return;
    const items = itemsRef.current.filter(Boolean) as HTMLDivElement[];
    gsap.set(items, { opacity: 0, y: 60 });
    ScrollTrigger.batch(items, {
      onEnter: (batch) =>
        gsap.to(batch, { opacity: 1, y: 0, stagger: 0.15, duration: 0.8, ease: 'power3.out' }),
      start: 'top 85%',
      once: true,
    });
    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, [content]);

  return (
    <section
      ref={sectionRef}
      className="relative w-full py-24 flex flex-col items-center justify-center overflow-hidden bg-[#FAF8F5]"
    >
      {/* Soft frost speckle texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(194, 65, 12, 0.06) 1px, transparent 1.5px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Glow */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(194,65,12,0.06) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 text-center mb-14 px-4">
        <p className="text-orange-700 text-sm font-semibold tracking-[0.3em] uppercase mb-3">
          {content.eyebrow}
        </p>
        <h2 className="text-slate-900 text-4xl md:text-5xl font-black tracking-tight">
          {content.title} <span className="text-orange-700">{content.highlight}</span>
        </h2>
        <p className="text-slate-500 text-base mt-3 max-w-lg mx-auto">
          {content.subtitle}
        </p>
      </div>

      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-4xl px-4">
        {content.features.map((f, idx) => {
          const Icon = getIcon(f.icon);
          const style = STYLE_CYCLE[idx % STYLE_CYCLE.length];
          return (
            <div
              key={idx}
              ref={(el) => { itemsRef.current[idx] = el; }}
              className={`bg-gradient-to-br ${style.grad} border ${style.borderCls} rounded-2xl p-6 flex items-start gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)] transition-all duration-300`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${style.borderCls} bg-white animate-zero-gravity-slow`}
                style={{ animationDelay: `${idx * 0.4}s` }}
              >
                <Icon className={`h-6 w-6 ${style.iconCls}`} />
              </div>
              <div>
                <h3 className="text-slate-900 font-bold text-lg mb-1 leading-tight">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Section transition — wave divider into the next section */}
      <svg
        className="absolute bottom-0 left-0 w-full text-white"
        style={{ height: '60px' }}
        viewBox="0 0 1440 60"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path fill="currentColor" d="M0,28 C240,4 480,54 720,32 C960,10 1200,50 1440,24 L1440,60 L0,60 Z" />
      </svg>
    </section>
  );
}
