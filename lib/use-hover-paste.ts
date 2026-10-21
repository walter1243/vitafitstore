'use client';
import { useCallback, useEffect, useRef } from 'react';

// Ctrl+V sem precisar clicar: enquanto o mouse esta em cima da area, colar
// uma imagem (ou varias, copiadas do Explorer) entrega os arquivos pra ela.
// Nao rouba o colar de campos de texto / editor.

export function isEditableTarget(t: EventTarget | null) {
  const el = t as HTMLElement | null;
  if (!el) return false;
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
}

export function clipboardFiles(e: ClipboardEvent, accept: (type: string) => boolean): File[] {
  const out: File[] = [];
  const dt = e.clipboardData;
  if (!dt) return out;
  for (const f of Array.from(dt.files ?? [])) if (accept(f.type)) out.push(f);
  if (out.length === 0) {
    for (const item of Array.from(dt.items ?? [])) {
      if (item.kind === 'file' && accept(item.type)) {
        const f = item.getAsFile();
        if (f) out.push(f);
      }
    }
  }
  return out;
}

// `ref` e um callback ref: funciona mesmo quando a area aparece depois
// (formulario que abre/fecha). `onFiles` sempre usa a versao mais nova.
export function useHoverPaste<T extends HTMLElement>(accept: (type: string) => boolean, onFiles: (files: File[]) => void) {
  const hovered = useRef(false);
  const latest = useRef(onFiles);
  latest.current = onFiles;
  const acceptRef = useRef(accept);
  acceptRef.current = accept;
  const nodeRef = useRef<T | null>(null);

  const enter = useCallback(() => { hovered.current = true; }, []);
  const leave = useCallback(() => { hovered.current = false; }, []);

  const ref = useCallback((el: T | null) => {
    if (nodeRef.current) {
      nodeRef.current.removeEventListener('mouseenter', enter);
      nodeRef.current.removeEventListener('mouseleave', leave);
    }
    nodeRef.current = el;
    hovered.current = false;
    if (el) {
      el.addEventListener('mouseenter', enter);
      el.addEventListener('mouseleave', leave);
    }
  }, [enter, leave]);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      // ja tratado (ex: a area estava com foco e colou pelo onPaste dela)
      if (e.defaultPrevented || !hovered.current || !nodeRef.current || isEditableTarget(e.target)) return;
      const files = clipboardFiles(e, acceptRef.current);
      if (files.length === 0) return;
      e.preventDefault();
      latest.current(files);
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, []);

  return { ref, hovered };
}
