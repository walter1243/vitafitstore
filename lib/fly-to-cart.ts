'use client';

// Animação "produto voando para o carrinho" (lojas próprias, ex.: VICE CITY).
// Copia a foto do produto e faz ela ir, em arco, até o botão do carrinho
// marcado com data-cart-target; quando chega, o carrinho dá um "pulo".
// Quem pediu menos movimento (prefers-reduced-motion) vê só o pulo.

function bump(target: Element | null) {
  (target as HTMLElement | null)?.animate?.(
    [{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(0.96)' }, { transform: 'scale(1)' }],
    { duration: 420, easing: 'ease-out' },
  );
}

export function flyToCart(from: Element | null, imgSrc: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  const target = document.querySelector('[data-cart-target]');
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!from || !target || !imgSrc || reduce || !('animate' in Element.prototype)) {
    bump(target);
    return Promise.resolve();
  }

  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const size = Math.max(48, Math.min(a.width, a.height, 140));
  const startX = a.left + a.width / 2 - size / 2;
  const startY = a.top + a.height / 2 - size / 2;
  const dx = b.left + b.width / 2 - (startX + size / 2);
  const dy = b.top + b.height / 2 - (startY + size / 2);

  const ghost = document.createElement('img');
  ghost.src = imgSrc;
  ghost.alt = '';
  ghost.setAttribute('aria-hidden', 'true');
  Object.assign(ghost.style, {
    position: 'fixed', left: `${startX}px`, top: `${startY}px`, width: `${size}px`, height: `${size}px`,
    objectFit: 'cover', borderRadius: '18px', zIndex: '9999', pointerEvents: 'none',
    boxShadow: '0 14px 36px rgba(0,0,0,.45), 0 0 0 2px rgba(255,255,255,.35)',
  });
  document.body.appendChild(ghost);

  // arco: sobe um pouco no meio do caminho e encolhe chegando no carrinho
  const anim = ghost.animate(
    [
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 90}px) scale(0.72)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.16)`, opacity: 0.35 },
    ],
    { duration: 780, easing: 'cubic-bezier(.45,0,.25,1)', fill: 'forwards' },
  );
  return anim.finished
    .then(() => { ghost.remove(); bump(target); })
    .catch(() => { ghost.remove(); });
}
