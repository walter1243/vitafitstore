import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

export default function PinScrollSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (!sectionRef.current) return;
    const items = itemsRef.current;
    gsap.set(items, { opacity: 0, y: 60 });
    ScrollTrigger.batch(items, {
      onEnter: batch =>
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          stagger: 0.2,
          duration: 0.8,
          ease: "power3.out",
        }),
      start: "top 80%",
      once: true,
    });
    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top top",
      end: "+=1000",
      pin: true,
      scrub: 1,
      anticipatePin: 1,
    });
    return () => ScrollTrigger.getAll().forEach(t => t.kill());
  }, []);

  return (
    <section ref={sectionRef} className="relative w-full min-h-[80vh] bg-white flex flex-col items-center justify-center py-24">
      <h2 className="text-3xl font-bold mb-8">Destaques VitaFit</h2>
      <div className="flex flex-col gap-8 w-full max-w-2xl">
        {[1, 2, 3, 4].map((i, idx) => (
          <div
            key={i}
            ref={el => (itemsRef.current[idx] = el)}
            className="bg-gray-100 rounded-lg p-8 shadow text-xl font-medium"
          >
            Elemento especial {i}
          </div>
        ))}
      </div>
    </section>
  );
}
