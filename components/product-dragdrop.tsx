'use client';
import { useState } from "react";

export default function ProductDragDrop({ products }: { products: any[] }) {
  const [selected, setSelected] = useState<any[]>([]);

  function onDragStart(e: React.DragEvent, product: any) {
    e.dataTransfer.setData("productId", product.id);
  }

  function onDrop(e: React.DragEvent) {
    const id = e.dataTransfer.getData("productId");
    const prod = products.find(p => p.id == id);
    if (prod && !selected.some(s => s.id === prod.id)) {
      setSelected([...selected, prod]);
    }
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  return (
    <div className="flex flex-col md:flex-row gap-8 mt-10">
      <div className="flex-1">
        <h3 className="font-semibold mb-2">Produtos disponíveis</h3>
        <div className="grid grid-cols-2 gap-2">
          {products.map(p => (
            <div
              key={p.id}
              draggable
              onDragStart={e => onDragStart(e, p)}
              className="border rounded p-2 bg-white shadow cursor-move"
            >
              <b>{p.nome}</b>
            </div>
          ))}
        </div>
      </div>
      <div
        className="flex-1 border-2 border-dashed rounded min-h-[120px] p-4 bg-gray-50"
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        <h3 className="font-semibold mb-2">Selecionados</h3>
        {selected.length === 0 && <div className="text-gray-400">Arraste produtos aqui</div>}
        <div className="flex flex-wrap gap-2">
          {selected.map(p => (
            <div key={p.id} className="border rounded p-2 bg-green-100">
              <b>{p.nome}</b>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
