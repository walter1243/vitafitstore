'use client';

import { MessageCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type StoreSettings = {
  whatsapp?: string;
  whatsappFloatingEnabled?: boolean;
  whatsappGreeting?: string;
};

function buildWhatsAppUrl(rawPhone: string, greeting: string) {
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) return '';
  const text = encodeURIComponent(greeting.trim());
  return `https://wa.me/${digits}${text ? `?text=${text}` : ''}`;
}

export function WhatsAppFloating() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/store-settings', { cache: 'no-store' });
        if (!res.ok) return;
        setSettings(await res.json());
      } catch {
        // ignore
      }
    })();
  }, []);

  const link = useMemo(() => {
    const phone = settings?.whatsapp ?? '';
    const greeting = settings?.whatsappGreeting ?? 'Hola! Me gustaria saber mas sobre los productos de VitaFit.';
    return buildWhatsAppUrl(phone, greeting);
  }, [settings?.whatsapp, settings?.whatsappGreeting]);

  if (!settings?.whatsappFloatingEnabled || !link) return null;

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-6 right-5 z-[90] inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_12px_24px_rgba(37,211,102,0.35)] transition-transform hover:scale-105"
    >
      <MessageCircle size={28} />
    </a>
  );
}
