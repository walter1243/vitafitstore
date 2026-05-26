import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

// Lazy singleton — only throws when a query is actually attempted,
// so a missing DATABASE_URL won't crash the whole app at import time.
let _sql: NeonQueryFunction<false, false> | null = null;

function getSql(): NeonQueryFunction<false, false> {
  if (_sql) return _sql;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. ' +
      'Add it to .env.local for local dev and to ' +
      'Vercel → Project → Settings → Environment Variables for production.'
    );
  }
  _sql = neon(url);
  return _sql;
}

// Re-export as a tagged-template-literal compatible proxy so existing
// `sql\`...\`` call sites keep working without any changes.
export const sql: NeonQueryFunction<false, false> = new Proxy(
  (() => {}) as unknown as NeonQueryFunction<false, false>,
  {
    apply(_t, _ctx, args) {
      return (getSql() as unknown as Function)(...args);
    },
    get(_t, prop) {
      return (getSql() as any)[prop];
    },
  }
);
