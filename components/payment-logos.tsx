// Small, simplified brand-colored payment badges (not the official vector
// artwork — a lightweight recreation using each brand's real palette) so the
// footer reads as recognizable payment icons instead of plain gray text.

type LogoProps = { w?: number; h?: number };

export function VisaLogo({ w = 34, h = 22 }: LogoProps) {
  return (
    <svg width={w} height={h} viewBox="0 0 34 22" fill="none">
      <rect width="34" height="22" rx="3" fill="#1A1F71" />
      <path d="M13.5 15.5L14.9 6.5H17.1L15.7 15.5H13.5Z" fill="white" />
      <path d="M22.8 6.7C22.3 6.5 21.5 6.3 20.5 6.3C18.1 6.3 16.4 7.5 16.4 9.2C16.4 10.4 17.4 11.1 18.2 11.5C19 11.9 19.3 12.2 19.3 12.6C19.3 13.2 18.6 13.5 17.9 13.5C16.9 13.5 16.4 13.3 15.5 12.9L15.2 12.8L14.8 15.1C15.4 15.4 16.5 15.6 17.6 15.6C20.2 15.6 21.8 14.4 21.8 12.6C21.8 11.6 21.2 10.8 19.9 10.2C19.1 9.8 18.7 9.5 18.7 9.1C18.7 8.7 19.1 8.3 19.9 8.3C20.6 8.3 21.1 8.4 21.5 8.6L21.7 8.7L22.1 6.5L22.8 6.7Z" fill="white" />
      <path d="M26 6.5H24.2C23.7 6.5 23.3 6.6 23.1 7.1L19.9 15.5H22.5L23 14H26.1L26.4 15.5H28.7L26 6.5ZM23.7 12.1C23.9 11.5 24.8 9.2 24.8 9.2C24.8 9.2 25 8.7 25.1 8.3L25.3 9.1C25.3 9.1 25.9 11.6 26 12.1H23.7Z" fill="white" />
      <path d="M11.5 6.5L9.2 12.5L9 11.5C8.5 9.8 7 8.2 5.3 7.3L7.4 15.5H10.1L14.2 6.5H11.5Z" fill="white" />
      <path d="M6.8 6.5H2.8L2.8 6.7C5.8 7.4 7.8 9.2 8.5 11.5L7.7 7.1C7.6 6.6 7.2 6.5 6.8 6.5Z" fill="#F9A51A" />
    </svg>
  );
}

export function MastercardLogo({ w = 34, h = 22 }: LogoProps) {
  return (
    <svg width={w} height={h} viewBox="0 0 34 22" fill="none">
      <rect width="34" height="22" rx="3" fill="white" stroke="#E2E8F0" />
      <circle cx="13" cy="11" r="6" fill="#EB001B" />
      <circle cx="21" cy="11" r="6" fill="#F79E1B" />
      <path d="M17 7.5A6 6 0 0 1 21 11 6 6 0 0 1 17 14.5 6 6 0 0 1 13 11 6 6 0 0 1 17 7.5Z" fill="#FF5F00" />
    </svg>
  );
}

export function PayPalLogo({ w = 34, h = 22 }: LogoProps) {
  return (
    <svg width={w} height={h} viewBox="0 0 34 22" fill="none">
      <rect width="34" height="22" rx="3" fill="white" stroke="#E2E8F0" />
      <text x="17" y="14.5" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontWeight="bold" fontSize="8.5" fill="#003087">Pay</text>
      <text x="24.5" y="14.5" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontWeight="bold" fontSize="8.5" fill="#009CDE">Pal</text>
    </svg>
  );
}

export function ApplePayLogo({ w = 34, h = 22 }: LogoProps) {
  return (
    <svg width={w} height={h} viewBox="0 0 34 22" fill="none">
      <rect width="34" height="22" rx="3" fill="#000000" />
      {/* Simplified apple silhouette — two lobes, a bitten notch, a leaf */}
      <circle cx="6.4" cy="12.6" r="2.9" fill="white" />
      <circle cx="9.6" cy="11.6" r="3.3" fill="white" />
      <circle cx="11.4" cy="10.7" r="1.6" fill="#000000" />
      <ellipse cx="9.6" cy="5.9" rx="1.5" ry="0.9" fill="white" transform="rotate(-35 9.6 5.9)" />
      <text x="24" y="14.5" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="600" fontSize="7.5" fill="white">Pay</text>
    </svg>
  );
}

export function GooglePayLogo({ w = 34, h = 22 }: LogoProps) {
  return (
    <svg width={w} height={h} viewBox="0 0 34 22" fill="none">
      <rect width="34" height="22" rx="3" fill="white" stroke="#E2E8F0" />
      <text x="9" y="14.5" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="600" fontSize="9" fill="#4285F4">G</text>
      <text x="22" y="14.5" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="500" fontSize="8" fill="#5F6368">Pay</text>
    </svg>
  );
}

export function BizumLogo({ w = 34, h = 22 }: LogoProps) {
  return (
    <svg width={w} height={h} viewBox="0 0 34 22" fill="none">
      <rect width="34" height="22" rx="3" fill="#00AEEF" />
      <text x="17" y="14.5" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="8.5" fill="white">Bizum</text>
    </svg>
  );
}

export const PAYMENT_LOGOS = [
  { key: 'visa', label: 'Visa', Logo: VisaLogo },
  { key: 'mastercard', label: 'Mastercard', Logo: MastercardLogo },
  { key: 'paypal', label: 'PayPal', Logo: PayPalLogo },
  { key: 'apple-pay', label: 'Apple Pay', Logo: ApplePayLogo },
  { key: 'google-pay', label: 'Google Pay', Logo: GooglePayLogo },
  { key: 'bizum', label: 'Bizum', Logo: BizumLogo },
] as const;
