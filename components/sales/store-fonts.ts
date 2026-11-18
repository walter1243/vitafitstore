import { Anton, Barlow } from 'next/font/google';

// Fontes das lojas próprias (ex.: VICE CITY STORE): Anton nos títulos
// (condensada, caixa alta, no estilo dos cartazes do jogo) e Barlow no texto
// (limpa e legível). Carregadas só nas páginas que usam storeFontClass — a
// Kitoys não baixa estas fontes.
const display = Anton({ weight: '400', subsets: ['latin'], variable: '--font-store-display', display: 'swap' });
const body = Barlow({ weight: ['400', '500', '600', '700'], subsets: ['latin'], variable: '--font-store-body', display: 'swap' });

export const storeFontClass = `${display.variable} ${body.variable} font-store`;
