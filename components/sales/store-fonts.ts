import { Chakra_Petch, Russo_One } from 'next/font/google';

// Fontes das lojas próprias (ex.: VICE CITY STORE): Russo One no letreiro e
// títulos, Chakra Petch no texto (o estilo de texto aprovado da VICE CITY STORE). Carregadas só nas páginas que usam storeFontClass — a
// Kitoys não baixa estas fontes.
const display = Russo_One({ weight: '400', subsets: ['latin'], variable: '--font-store-display', display: 'swap' });
const body = Chakra_Petch({ weight: ['400', '500', '600', '700'], subsets: ['latin'], variable: '--font-store-body', display: 'swap' });

export const storeFontClass = `${display.variable} ${body.variable} font-store`;
