/**
 * ╔═══════════════════════════════════════════════════════╗
 * ║  INTEL ENGINE — Módulo 2: Curadoria + Análise IA     ║
 * ║  Filtra os 30 anúncios mais antigos (validados)      ║
 * ║  e analisa copy, ângulo e fit com Claude             ║
 * ╚═══════════════════════════════════════════════════════╝
 */

import fs from 'fs';

const INPUT_FILE  = './ads_raw.json';
const OUTPUT_FILE = './ads_analyzed.json';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = 'claude-opus-4-5';

// ── Contexto do produto (calibra o score de fit) ─────────
const PRODUCT_CONTEXT = `
PRODUTO DO ANUNCIANTE (você):
- Categoria: Suplemento alimentar físico (cápsulas/pó/shake)
- Subcategorias possíveis: emagrecimento, energia, imunidade, bem-estar
- Ticket médio: EUR 30-80 (equivalente a R$100-300)
- Mercado-alvo: Espanha e Europa
- Público: adultos em geral (18-65 anos)
- Canal de venda: e-commerce direto ao consumidor
- Estágio: pré-lançamento — buscando ofertas validadas para modelar
`;

// ── Utilitários ──────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function log(emoji, msg) {
  const ts = new Date().toLocaleTimeString('pt-BR');
  console.log(`[${ts}] ${emoji}  ${msg}`);
}

function calcDurationDays(startDate, endDate) {
  if (!startDate) return 0;
  const start = new Date(typeof startDate === 'number' ? startDate * 1000 : startDate);
  const end   = endDate
    ? new Date(typeof endDate === 'number' ? endDate * 1000 : endDate)
    : new Date();
  const days  = Math.floor((end - start) / (1000 * 60 * 60 * 24));
  return isNaN(days) ? 0 : Math.max(0, days);
}

// ── Selecionar os 30 mais antigos ───────────────────────
function selectTop30(ads) {
  // Calcula duração de cada anúncio
  const withDuration = ads
    .map(ad => ({
      ...ad,
      durationDays: calcDurationDays(ad.startDate, ad.endDate),
    }))
    .filter(ad => ad.copyText && ad.copyText.trim().length > 10); // só os com copy

  // Ordena por maior duração (mais tempo ativo = mais validado)
  withDuration.sort((a, b) => b.durationDays - a.durationDays);

  return withDuration.slice(0, 30);
}

// ── Prompt de análise ────────────────────────────────────
function buildPrompt(ad) {
  const startFormatted = ad.startDate
    ? new Date(typeof ad.startDate === 'number' ? ad.startDate * 1000 : ad.startDate)
        .toLocaleDateString('es-ES')
    : 'Desconhecida';

  return `Você é um especialista sênior em growth hacking, copywriting direto ao consumidor e e-commerce de suplementos no mercado europeu.

${PRODUCT_CONTEXT}

ANÚNCIO A ANALISAR:
─────────────────────────────
Anunciante: ${ad.pageName}
País: ${ad.country || 'ES'}
Ativo desde: ${startFormatted}
Duração: ${ad.durationDays} dias rodando (quanto mais dias = mais validado pelo mercado)
Status: ${ad.isActive ? '🟢 ATIVO AGORA' : '🔴 INATIVO'}
Tipo de mídia: ${ad.mediaType}
CTA: ${ad.callToAction || 'Não identificado'}
Título do anúncio: ${ad.title || 'Sem título'}
Descrição: ${ad.description || 'Sem descrição'}

COPY DO ANÚNCIO:
"""
${ad.copyText.slice(0, 1500)}
"""
─────────────────────────────

TAREFA: Analise este anúncio e retorne APENAS um objeto JSON válido (sem markdown, sem backticks, sem texto antes ou depois).

Formato exato do JSON:
{
  "score": <número de 1 a 10>,
  "fitLabel": "<Alto | Médio | Baixo>",
  "angle": "<nome do ângulo de venda>",
  "angleEmoji": "<1 emoji que representa o ângulo>",
  "strategy": "<2-3 frases explicando a estratégia de copy usada neste anúncio>",
  "whyItWorks": "<1-2 frases sobre por que este anúncio sobreviveu tanto tempo no ar>",
  "applicability": "<2-3 frases específicas de como adaptar este ângulo/copy para um suplemento de emagrecimento/energia/imunidade vendido na Espanha>",
  "hooks": ["<hook 1 extraído ou inspirado>", "<hook 2>"],
  "keyEmotions": ["<emoção 1>", "<emoção 2>", "<emoção 3>"],
  "redFlags": "<se houver algo que NÃO copiar, mencione aqui. Se não houver, deixe vazio>"
}

Critérios para o score:
- 9-10: Anúncio perfeito para modelar — ângulo forte, copy validada, altíssima transferibilidade
- 7-8:  Muito bom — algumas adaptações necessárias
- 5-6:  Útil como referência mas ângulo não é ideal
- 3-4:  Pouca transferibilidade ou copy fraca
- 1-2:  Irrelevante ou nicho completamente diferente

Ângulos possíveis (escolha o mais preciso):
Prova Social, Transformação, Urgência, Escassez, Autoridade Científica, 
Medo de Perder, Benefício Direto, Storytelling Pessoal, UGC/Testemunho, 
Comparação, Problema-Solução, Curiosidade, Identidade, Novidade, Simplicidade`;
}

// ── Chamar Claude API ────────────────────────────────────
async function analyzeWithClaude(ad) {
  if (!ANTHROPIC_API_KEY) {
    log('⚠️', 'ANTHROPIC_API_KEY não configurada — pulando análise IA');
    return buildFallbackAnalysis(ad);
  }

  const prompt = buildPrompt(ad);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      MODEL,
      max_tokens: 1000,
      messages:   [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const raw  = data.content?.map(b => b.text || '').join('') || '';

  // Parse JSON seguro
  const clean = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

function buildFallbackAnalysis(ad) {
  return {
    score:         5,
    fitLabel:     'Médio',
    angle:        'Benefício Direto',
    angleEmoji:   '💡',
    strategy:     'Análise automática não disponível — adicione ANTHROPIC_API_KEY no .env',
    whyItWorks:   `Este anúncio rodou por ${ad.durationDays} dias, indicando performance positiva.`,
    applicability:'Configure ANTHROPIC_API_KEY para análise detalhada.',
    hooks:        [ad.title || 'Hook não extraído'],
    keyEmotions:  ['Interesse'],
    redFlags:     '',
  };
}

// ── Pipeline principal ───────────────────────────────────
async function analyzeAds() {
  log('🧠', 'Iniciando Intel Engine — Análise IA\n');

  // Ler dados brutos
  if (!fs.existsSync(INPUT_FILE)) {
    log('❌', `Arquivo ${INPUT_FILE} não encontrado. Execute: node scraper.js`);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  log('📂', `${raw.length} anúncios carregados de ${INPUT_FILE}`);

  // Selecionar top 30 mais antigos
  const top30 = selectTop30(raw);
  log('🏆', `Top 30 selecionados (maior duração: ${top30[0]?.durationDays || 0} dias)\n`);

  if (top30.length === 0) {
    log('⚠️', 'Nenhum anúncio com copy encontrado. Verifique ads_raw.json.');
    process.exit(1);
  }

  // Analisar cada anúncio com IA
  const analyzed = [];
  let success = 0, errors = 0;

  for (let i = 0; i < top30.length; i++) {
    const ad = top30[i];
    log('🔬', `[${i+1}/${top30.length}] Analisando: ${ad.pageName} (${ad.durationDays} dias)`);

    try {
      const analysis = await analyzeWithClaude(ad);

      analyzed.push({
        ...ad,
        ai: analysis,
        _raw: undefined, // remove dados brutos do output final
      });

      log('✅', `Score: ${analysis.score}/10 | Fit: ${analysis.fitLabel} | Ângulo: ${analysis.angle}`);
      success++;

    } catch (err) {
      log('⚠️', `Erro na análise: ${err.message} — usando fallback`);
      analyzed.push({
        ...ad,
        ai: buildFallbackAnalysis(ad),
        _raw: undefined,
      });
      errors++;
    }

    // Rate limit: 1s entre chamadas
    if (i < top30.length - 1) await sleep(1000);
  }

  // Ordenar por score (maior primeiro)
  analyzed.sort((a, b) => (b.ai?.score || 0) - (a.ai?.score || 0));

  // Salvar
  const output = {
    metadata: {
      generatedAt:    new Date().toISOString(),
      totalScraped:   raw.length,
      totalAnalyzed:  analyzed.length,
      successCount:   success,
      errorCount:     errors,
      avgScore:       (analyzed.reduce((s, a) => s + (a.ai?.score || 0), 0) / analyzed.length).toFixed(1),
      highFitCount:   analyzed.filter(a => (a.ai?.score || 0) >= 8).length,
      mediumFitCount: analyzed.filter(a => (a.ai?.score || 0) >= 5 && (a.ai?.score || 0) < 8).length,
      lowFitCount:    analyzed.filter(a => (a.ai?.score || 0) < 5).length,
    },
    ads: analyzed,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');

  log('💾', `\n════════════════════════════════════`);
  log('💾', `Anúncios analisados: ${analyzed.length}`);
  log('💾', `Score médio:         ${output.metadata.avgScore}/10`);
  log('💾', `Alto fit (8-10):     ${output.metadata.highFitCount}`);
  log('💾', `Médio fit (5-7):     ${output.metadata.mediumFitCount}`);
  log('💾', `Baixo fit (1-4):     ${output.metadata.lowFitCount}`);
  log('💾', `Arquivo: ${OUTPUT_FILE}`);
  log('💾', `════════════════════════════════════\n`);

  return output;
}

analyzeAds().catch(err => {
  console.error('\n❌ FATAL:', err.message);
  process.exit(1);
});
