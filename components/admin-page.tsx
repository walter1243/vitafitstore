'use client';
import { useState } from "react";
import ProductDragDrop from "./product-dragdrop";

export default function AdminPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function handleImagePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.indexOf("image") !== -1) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            setPreview(ev.target?.result as string);
            setImage(ev.target?.result as string);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreview(ev.target?.result as string);
        setImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: Salvar produto (mock)
    alert("Produto cadastrado!");
    setName("");
    setDescription("");
    setPrice("");
    setCategory("");
    setImage(null);
    setPreview(null);
  }

  // Mock de pedidos
  const [pedidos, setPedidos] = useState([
    { id: 1, cliente: 'Walter', produto: 'Creatina', status: 'Aguardando envio', rastreio: '' },
    { id: 2, cliente: 'Maria', produto: 'Colágeno', status: 'Enviado', rastreio: 'ES123456789ES' },
  ]);

  function handleRastreioChange(id: number, value: string) {
    setPedidos(pedidos => pedidos.map(p => p.id === id ? { ...p, rastreio: value, status: value ? 'Enviado' : 'Aguardando envio' } : p));
  }

  // Produtos mockados para drag & drop
  const produtos = [
    { id: 1, nome: 'Creatina' },
    { id: 2, nome: 'Colágeno' },
    { id: 3, nome: 'Ômega 3' },
    { id: 4, nome: 'Multivitamínico' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Cadastro de Produto</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full border p-2 rounded"
          placeholder="Nome"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <textarea
          className="w-full border p-2 rounded"
          placeholder="Descrição"
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
        />
        <input
          className="w-full border p-2 rounded"
          placeholder="Preço"
          type="number"
          value={price}
          onChange={e => setPrice(e.target.value)}
          required
        />
        <input
          className="w-full border p-2 rounded"
          placeholder="Categoria"
          value={category}
          onChange={e => setCategory(e.target.value)}
        />
        <div>
          <label className="block mb-1">Imagem do produto</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="mb-2"
          />
          <input
            type="text"
            placeholder="Cole uma imagem aqui (Ctrl+V)"
            onPaste={handleImagePaste}
            className="w-full border p-2 rounded"
          />
          {preview && (
            <div
              className="mt-2 mx-auto flex items-center justify-center border bg-white"
              style={{ width: 256, height: 256 }}
            >
              <img
                src={preview}
                alt="Preview"
                style={{
                  maxWidth: '90%',
                  maxHeight: '90%',
                  objectFit: 'contain',
                  background: 'white',
                  borderRadius: 12,
                  boxShadow: '0 2px 16px #0001',
                  padding: 12,
                  display: 'block',
                  margin: 'auto',
                }}
              />
            </div>
          )}
        </div>
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
        >
          Cadastrar Produto
        </button>
      </form>

      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-2">Pedidos recentes</h2>
        <div className="space-y-2">
          {pedidos.map(p => (
            <div key={p.id} className="border rounded p-3 flex flex-col gap-1 bg-gray-50">
              <div><b>Cliente:</b> {p.cliente}</div>
              <div><b>Produto:</b> {p.produto}</div>
              <div><b>Status:</b> {p.status}</div>
              <div className="flex items-center gap-2">
                <b>Rastreio:</b>
                <input
                  className="border rounded p-1 text-sm"
                  placeholder="ES..."
                  value={p.rastreio}
                  onChange={e => handleRastreioChange(p.id, e.target.value)}
                  style={{ width: 140 }}
                />
                {p.rastreio && (
                  <a
                    href={`https://www.correos.es/es/es/herramientas/localizador/envios?numero=${p.rastreio}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline text-xs"
                  >
                    Rastrear
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <ProductDragDrop products={produtos} />
    </div>
  );
}
