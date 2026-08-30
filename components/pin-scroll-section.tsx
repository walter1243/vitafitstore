'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getIcon } from '@/lib/icon-map';
import { DEFAULT_DESTAQUES, type DestaquesContent } from '@/lib/site-content-defaults';

gsap.registerPlugin(ScrollTrigger);

const STYLE_CYCLE = [
  { grad: 'from-emerald-500/20 to-green-500/5', iconCls: 'text-emerald-400', borderCls: 'border-emerald-500/30' },
  { grad: 'from-amber-500/20 to-yellow-500/5', iconCls: 'text-amber-400', borderCls: 'border-amber-500/30' },
  { grad: 'from-blue-500/20 to-cyan-500/5', iconCls: 'text-blue-400', borderCls: 'border-blue-500/30' },
  { grad: 'from-violet-500/20 to-purple-500/5', iconCls: 'text-violet-400', borderCls: 'border-violet-500/30' },
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
      className="relative w-full py-24 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #060f1e 0%, #081510 100%)' }}
    >
      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(16,185,129,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.05) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Glow */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 text-center mb-14 px-4">
        <p className="text-emerald-400 text-sm font-semibold tracking-[0.3em] uppercase mb-3">
          {content.eyebrow}
        </p>
        <h2 className="text-white text-4xl md:text-5xl font-black tracking-tight">
          {content.title} <span className="text-emerald-400">{content.highlight}</span>
        </h2>
        <p className="text-gray-500 text-base mt-3 max-w-lg mx-auto">
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
              className={`bg-gradient-to-br ${style.grad} border ${style.borderCls} rounded-2xl p-6 flex items-start gap-4 backdrop-blur-sm hover:brightness-110 transition-all duration-300`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${style.borderCls} bg-gray-900/50 animate-zero-gravity-slow`}
                style={{ animationDelay: `${idx * 0.4}s` }}
              >
                <Icon className={`h-6 w-6 ${style.iconCls}`} />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-1 leading-tight">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
