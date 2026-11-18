import { Chakra_Petch, Russo_One } from 'next/font/google';

// Fontes das lojas próprias (recomendação da skill ui-ux-pro-max para o tema
// gaming/neon): Russo One nos títulos, Chakra Petch no texto. Carregadas só
// nas páginas que usam storeFontClass — a Kitoys não baixa estas fontes.
const display = Russo_One({ weight: '400', subsets: ['latin'], variable: '--font-store-display', display: 'swap' });
const body = Chakra_Petch({ weight: ['400', '500', '600', '700'], subsets: ['latin'], variable: '--font-store-body', display: 'swap' });

export const storeFontClass = `${display.variable} ${body.variable} font-store`;
