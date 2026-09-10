// Payment badges built from each brand's real published mark (paths sourced
// from the Simple Icons project, MIT-licensed) rather than hand-drawn
// approximations, so they read as recognizable and clean at footer/checkout
// size instead of looking like a generic placeholder.

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

// Official PayPal monogram (Simple Icons) — a single-tone rendering of the
// two-layer "P" mark in PayPal's brand navy.
export function PayPalLogo({ w = 34, h = 22 }: LogoProps) {
  return (
    <svg width={w} height={h} viewBox="0 0 34 22" fill="none">
      <rect width="34" height="22" rx="3" fill="white" stroke="#E2E8F0" />
      <svg x="11" y="3" width="12" height="16" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
        <path
          fill="#003087"
          d="M15.607 4.653H8.941L6.645 19.251H1.82L4.862 0h7.995c3.754 0 6.375 2.294 6.473 5.513-.648-.478-2.105-.86-3.722-.86m6.57 5.546c0 3.41-3.01 6.853-6.958 6.853h-2.493L11.595 24H6.74l1.845-11.538h3.592c4.208 0 7.346-3.634 7.153-6.949a5.24 5.24 0 0 1 2.848 4.686M9.653 5.546h6.408c.907 0 1.942.222 2.363.541-.195 2.741-2.655 5.483-6.441 5.483H8.714Z"
        />
      </svg>
    </svg>
  );
}

// Official Apple glyph (Simple Icons) instead of a hand-drawn silhouette.
export function ApplePayLogo({ w = 34, h = 22 }: LogoProps) {
  return (
    <svg width={w} height={h} viewBox="0 0 34 22" fill="none">
      <rect width="34" height="22" rx="3" fill="#000000" />
      <svg x="5" y="3" width="9" height="16" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
        <path
          fill="white"
          d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
        />
      </svg>
      <text x="24" y="14.5" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="600" fontSize="7.5" fill="white">Pay</text>
    </svg>
  );
}

// Official Google Pay wordmark (Simple Icons), rendered in Google's
// standard monochrome usage.
export function GooglePayLogo({ w = 34, h = 22 }: LogoProps) {
  return (
    <svg width={w} height={h} viewBox="0 0 34 22" fill="none">
      <rect width="34" height="22" rx="3" fill="white" stroke="#E2E8F0" />
      <svg x="3" y="6.5" width="28" height="9" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
        <path
          fill="#5F6368"
          d="M3.963 7.235A3.963 3.963 0 00.422 9.419a3.963 3.963 0 000 3.559 3.963 3.963 0 003.541 2.184c1.07 0 1.97-.352 2.627-.957.748-.69 1.18-1.71 1.18-2.916a4.722 4.722 0 00-.07-.806H3.964v1.526h2.14a1.835 1.835 0 01-.79 1.205c-.356.241-.814.379-1.35.379-1.034 0-1.911-.697-2.225-1.636a2.375 2.375 0 010-1.517c.314-.94 1.191-1.636 2.225-1.636a2.152 2.152 0 011.52.594l1.132-1.13a3.808 3.808 0 00-2.652-1.033zm6.501.55v6.9h.886V11.89h1.465c.603 0 1.11-.196 1.522-.588a1.911 1.911 0 00.635-1.464 1.92 1.92 0 00-.635-1.456 2.125 2.125 0 00-1.522-.598zm2.427.85a1.156 1.156 0 01.823.365 1.176 1.176 0 010 1.686 1.171 1.171 0 01-.877.357H11.35V8.635h1.487a1.156 1.156 0 01.054 0zm4.124 1.175c-.842 0-1.477.308-1.907.925l.781.491c.288-.417.68-.626 1.175-.626a1.255 1.255 0 01.856.323 1.009 1.009 0 01.366.785v.202c-.34-.193-.774-.289-1.3-.289-.617 0-1.11.145-1.479.434-.37.288-.554.677-.554 1.165a1.476 1.476 0 00.525 1.156c.35.308.785.463 1.305.463.61 0 1.098-.27 1.465-.81h.038v.655h.848v-2.909c0-.61-.19-1.09-.568-1.44-.38-.35-.896-.525-1.551-.525zm2.263.154l1.946 4.422-1.098 2.38h.915L24 9.963h-.965l-1.368 3.391h-.02l-1.406-3.39zm-2.146 2.368c.494 0 .88.11 1.156.33 0 .372-.147.696-.44.973a1.413 1.413 0 01-.997.414 1.081 1.081 0 01-.69-.232.708.708 0 01-.293-.578c0-.257.12-.47.363-.647.24-.173.54-.26.9-.26Z"
        />
      </svg>
    </svg>
  );
}

export function BizumLogo({ w = 34, h = 22 }: LogoProps) {
  return (
    <svg width={w} height={h} viewBox="0 0 34 22" fill="none">
      <rect width="34" height="22" rx="3" fill="#00AEEF" />
      <text x="17" y="14.5" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="9" letterSpacing="0.2" fill="white">Bizum</text>
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
