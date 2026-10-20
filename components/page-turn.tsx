'use client';
import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

// Animacao de "pagina virando" ao entrar numa colecao/setor (pra frente) e
// ao voltar (botao voltar do navegador ou link pro inicio: pra tras).
// Vale pro site todo; quem usa "reduzir movimento" so troca de pagina.
const DEEP = /^\/(coleccion|sector)\//;
let pending: 'fwd' | 'back' | null = null;

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const mainEl = () => document.querySelector('main') as HTMLElement | null;

export function PageTurn() {
  const router = useRouter();
  const pathname = usePathname();
  const busy = useRef(false);

  // Saida: a pagina atual gira presa na "lombada" e entao navega.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || a.target === '_blank' || a.origin !== location.origin || a.hasAttribute('download')) return;
      const to = a.pathname;
      if (to === location.pathname) return; // ancora na mesma pagina
      const from = location.pathname;
      // Pra uma colecao/setor: pra frente. De uma colecao/setor pro inicio: pra tras.
      const dir = DEEP.test(to) ? 'fwd' : DEEP.test(from) && to === '/' ? 'back' : null;
      if (!dir || reduced() || busy.current) return;
      const main = mainEl();
      if (!main) return;
      // So impede a navegacao do <Link> (os onClick dele, ex: fechar menu, continuam).
      e.preventDefault();
      busy.current = true;
      pending = dir;
      main.style.transformOrigin = dir === 'fwd' ? 'left center' : 'right center';
      const anim = main.animate(
        [
          { transform: 'perspective(2000px) rotateY(0deg)', opacity: 1 },
          { transform: `perspective(2000px) rotateY(${dir === 'fwd' ? -80 : 80}deg)`, opacity: 0.2 },
        ],
        { duration: 420, easing: 'cubic-bezier(.55,.06,.68,.19)', fill: 'forwards' },
      );
      anim.onfinish = () => { router.push(a.pathname + a.search + a.hash); busy.current = false; };
    }
    function onPop() { if (!reduced()) pending = 'back'; }
    document.addEventListener('click', onClick, true);
    window.addEventListener('popstate', onPop);
    return () => { document.removeEventListener('click', onClick, true); window.removeEventListener('popstate', onPop); };
  }, [router]);

  // Entrada: a pagina nova "assenta" vindo do outro lado.
  useEffect(() => {
    const dir = pending;
    pending = null;
    if (!dir) return;
    const main = mainEl();
    if (!main) return;
    main.style.transformOrigin = dir === 'fwd' ? 'right center' : 'left center';
    main.animate(
      [
        { transform: `perspective(2000px) rotateY(${dir === 'fwd' ? 60 : -60}deg)`, opacity: 0.3 },
        { transform: 'perspective(2000px) rotateY(0deg)', opacity: 1 },
      ],
      { duration: 560, easing: 'cubic-bezier(.22,1,.36,1)' },
    );
  }, [pathname]);

  return null;
}
