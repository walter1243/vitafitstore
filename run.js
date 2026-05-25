/**
 * ╔═══════════════════════════════════════════════════════╗
 * ║  INTEL ENGINE — Pipeline Completo                    ║
 * ║  Scrape → Analyze → Report                          ║
 * ║  Uso: node run.js                                   ║
 * ╚═══════════════════════════════════════════════════════╝
 */

import { execSync } from 'child_process';
import fs from 'fs';

// Carregar .env se existir
try {
  const envFile = fs.readFileSync('.env', 'utf-8');
  envFile.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length && !key.startsWith('#')) {
      process.env[key.trim()] = val.join('=').trim();
    }
  });
} catch {}

function log(emoji, msg) {
  console.log(`\n${emoji}  ${msg}`);
}

function run(script, label) {
  log('▶', `Iniciando: ${label}`);
  const start = Date.now();
  try {
    execSync(`node ${script}`, {
      stdio: 'inherit',
      env: process.env,
    });
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    log('✅', `${label} concluído em ${elapsed}s`);
  } catch (err) {
    log('❌', `${label} falhou: ${err.message}`);
    process.exit(1);
  }
}

async function main() {
  const banner = `
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   ⚡  INTEL ENGINE — Motor de Inteligência Competitiva  ║
║        Facebook Ads · Big 4 Niches · Espanha            ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
`;
  console.log(banner);

  // Verificar dependências
  if (!fs.existsSync('./node_modules')) {
    log('📦', 'Instalando dependências...');
    execSync('npm install', { stdio: 'inherit' });
  }

  // Verificar chave Anthropic
  if (!process.env.ANTHROPIC_API_KEY) {
    log('⚠️', 'ANTHROPIC_API_KEY não encontrada — análise IA usará modo fallback');
    log('💡', 'Crie o arquivo .env com: ANTHROPIC_API_KEY=sk-ant-...\n');
  }

  const args = process.argv.slice(2);

  if (args.includes('--only-report')) {
    // Só gera o report a partir de dados já existentes
    run('generate_report.js', 'Geração de Dashboard');
  } else if (args.includes('--only-analyze')) {
    // Só analisa dados já coletados
    run('analyze.js', 'Análise IA');
    run('generate_report.js', 'Geração de Dashboard');
  } else {
    // Pipeline completo
    run('scraper.js', '1/3 — Scraping Facebook Ads Library');
    run('analyze.js', '2/3 — Curadoria e Análise IA');
    run('generate_report.js', '3/3 — Geração de Dashboard');
  }

  console.log(`
╔══════════════════════════════════════════════════════════╗
║  ✅  INTEL ENGINE — Pipeline Concluído!                 ║
║                                                          ║
║  📁  ads_raw.json      → dados brutos de todos os ads   ║
║  📁  ads_analyzed.json → top 30 com análise IA          ║
║  🌐  report.html       → abra no browser                 ║
║                                                          ║
║  Comando para abrir: open report.html                    ║
╚══════════════════════════════════════════════════════════╝
  `);
}

main().catch(err => {
  console.error('\n❌ FATAL:', err.message);
  process.exit(1);
});
