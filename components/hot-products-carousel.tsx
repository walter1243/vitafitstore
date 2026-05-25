import { useEffect, useRef } from "react";

const hotProducts = [
  { id: 1, nome: "Creatina", img: "/images/creatina.jpg" },
  { id: 2, nome: "Colágeno", img: "/images/collagen.jpg" },
  { id: 3, nome: "Ômega 3", img: "/images/omega.jpg" },
  { id: 4, nome: "Multivitamínico", img: "/images/multivita.jpg" },
];

export default function HotProductsCarousel() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % hotProducts.length;
      if (ref.current) {
        ref.current.scrollTo({
          left: idx * ref.current.offsetWidth,
          behavior: "smooth",
        });
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full overflow-hidden">
      <div
        ref={ref}
        className="flex transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
        style={{ scrollSnapType: "x mandatory", overflowX: "auto" }}
      >
        {hotProducts.map((p) => (
          <div
            key={p.id}
            className="min-w-full flex flex-col items-center justify-center p-8 scroll-snap-align-start"
          >
            <img
              src={p.img}
              alt={p.nome}
              className="w-40 h-40 object-contain mb-4 rounded shadow"
            />
            <div className="text-lg font-bold">{p.nome}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
