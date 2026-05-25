/**
 * ╔═══════════════════════════════════════════════════════╗
 * ║  INTEL ENGINE — Módulo 3: Dashboard HTML              ║
 * ║  Gera report.html premium a partir dos dados         ║
 * ╚═══════════════════════════════════════════════════════╝
 */

import fs from 'fs';

const INPUT_FILE  = './ads_analyzed.json';
const OUTPUT_FILE = './report.html';

function log(emoji, msg) {
  console.log(`${emoji}  ${msg}`);
}

function formatDate(dateVal) {
  if (!dateVal) return '—';
  try {
    const d = new Date(typeof dateVal === 'number' ? dateVal * 1000 : dateVal);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return '—'; }
}

function scoreColor(score) {
  if (score >= 8) return '#10b981';
  if (score >= 5) return '#f59e0b';
  return '#ef4444';
}

function fitBadge(label) {
  const map = {
    'Alto':  { bg: 'rgba(16,185,129,0.15)', border: '#10b981', text: '#10b981', icon: '⚡' },
    'Médio': { bg: 'rgba(245,158,11,0.15)', border: '#f59e0b', text: '#f59e0b', icon: '🔶' },
    'Baixo': { bg: 'rgba(239,68,68,0.15)',  border: '#ef4444', text: '#ef4444', icon: '🔴' },
  };
  return map[label] || map['Médio'];
}

function renderAdCard(ad, index) {
  const ai     = ad.ai || {};
  const score  = ai.score  || 0;
  const fit    = ai.fitLabel || 'Médio';
  const badge  = fitBadge(fit);
  const color  = scoreColor(score);
  const angle  = ai.angle || '—';
  const emoji  = ai.angleEmoji || '💡';

  const mediaHtml = ad.videoUrl
    ? `<video
         src="${ad.videoUrl}"
         referrerpolicy="no-referrer"
         crossorigin="anonymous"
         controls muted playsinline
         class="ad-media"
         onerror="this.parentElement.innerHTML='<div class=\\'media-fallback\\'>📹 Vídeo indisponível</div>'"
       ></video>`
    : ad.imageUrl
    ? `<img
         src="${ad.imageUrl}"
         referrerpolicy="no-referrer"
         crossorigin="anonymous"
         class="ad-media"
         alt="Criativo do anúncio"
         onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'400\\' height=\\'200\\'%3E%3Crect fill=\\'%23111827\\' width=\\'400\\' height=\\'200\\'/%3E%3Ctext x=\\'200\\' y=\\'110\\' text-anchor=\\'middle\\' fill=\\'%23374151\\' font-size=\\'14\\'%3EImagem indisponível%3C/text%3E%3C/svg%3E'"
       />`
    : `<div class="media-fallback">📝 Anúncio de texto</div>`;

  const copyText    = (ad.copyText || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const copyPreview = copyText.slice(0, 280);
  const hasMore     = copyText.length > 280;

  const hooks = (ai.hooks || []).map(h =>
    `<span class="hook-tag">"${h.replace(/"/g, '&quot;').slice(0, 80)}"</span>`
  ).join('');

  const emotions = (ai.keyEmotions || []).map(e =>
    `<span class="emotion-tag">${e}</span>`
  ).join('');

  return `
  <article class="ad-card" data-score="${score}" data-fit="${fit}" data-active="${ad.isActive}">
    <!-- HEADER -->
    <div class="card-header">
      <div class="advertiser-info">
        <div class="advertiser-avatar">${(ad.pageName || '?')[0].toUpperCase()}</div>
        <div>
          <div class="advertiser-name">${(ad.pageName || 'Desconhecido').replace(/</g,'&lt;')}</div>
          <div class="advertiser-meta">${ad.country || 'ES'} · ${ad.keyword || ''}</div>
        </div>
      </div>
      <div class="card-badges">
        <span class="duration-badge" title="Dias rodando">
          🗓 ${ad.durationDays || 0}d
        </span>
        <span class="status-dot ${ad.isActive ? 'active' : 'inactive'}" title="${ad.isActive ? 'Ativo' : 'Inativo'}">
          ${ad.isActive ? '● ATIVO' : '○ INATIVO'}
        </span>
      </div>
    </div>

    <!-- CRIATIVO -->
    <div class="media-container">
      ${mediaHtml}
      <div class="media-overlay">
        <span class="media-type-badge">${ad.mediaType === 'video' ? '▶ VIDEO' : ad.mediaType === 'image' ? '🖼 IMAGEM' : '📝 TEXTO'}</span>
      </div>
    </div>

    <!-- COPY -->
    <div class="copy-section">
      ${ad.title ? `<div class="copy-title">${ad.title.replace(/</g,'&lt;').slice(0,100)}</div>` : ''}
      <div class="copy-text" id="copy-${index}">
        <span class="copy-preview">${copyPreview}${hasMore ? '<span class="ellipsis">…</span>' : ''}</span>
        ${hasMore ? `<span class="copy-full" style="display:none">${copyText}</span>
          <button class="expand-btn" onclick="toggleCopy(${index})">Ver mais ↓</button>` : ''}
      </div>
      ${ad.callToAction ? `<div class="cta-pill">→ ${ad.callToAction}</div>` : ''}
    </div>

    <!-- AI INSIGHT BOX -->
    <div class="insight-box">
      <div class="insight-header">
        <span class="insight-label">⚡ INTEL IA</span>
        <div class="fit-badge" style="background:${badge.bg};border-color:${badge.border};color:${badge.text}">
          ${badge.icon} FIT ${fit.toUpperCase()}
        </div>
      </div>

      <!-- Score gauge -->
      <div class="score-section">
        <div class="score-ring-wrapper">
          <svg class="score-ring" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="32" fill="none" stroke="#1f2937" stroke-width="6"/>
            <circle cx="40" cy="40" r="32" fill="none" stroke="${color}" stroke-width="6"
              stroke-dasharray="${(score/10)*201} 201"
              stroke-dashoffset="50"
              stroke-linecap="round"
              transform="rotate(-90 40 40)"/>
          </svg>
          <div class="score-text" style="color:${color}">${score}<span>/10</span></div>
        </div>
        <div class="score-details">
          <div class="angle-badge">${emoji} ${angle}</div>
          ${emotions}
        </div>
      </div>

      <div class="insight-divider"></div>

      <div class="insight-content">
        <div class="insight-row">
          <div class="insight-icon">🎯</div>
          <div>
            <div class="insight-title">Estratégia de copy</div>
            <div class="insight-text">${ai.strategy || '—'}</div>
          </div>
        </div>
        <div class="insight-row">
          <div class="insight-icon">🏆</div>
          <div>
            <div class="insight-title">Por que sobreviveu</div>
            <div class="insight-text">${ai.whyItWorks || '—'}</div>
          </div>
        </div>
        <div class="insight-row">
          <div class="insight-icon">🚀</div>
          <div>
            <div class="insight-title">Aplique ao seu produto</div>
            <div class="insight-text highlight">${ai.applicability || '—'}</div>
          </div>
        </div>
      </div>

      ${hooks ? `<div class="hooks-section"><div class="hooks-label">🪝 Hooks extraídos</div><div class="hooks-list">${hooks}</div></div>` : ''}
      ${ai.redFlags ? `<div class="red-flags">⚠️ <strong>Atenção:</strong> ${ai.redFlags}</div>` : ''}
    </div>

    <div class="card-footer">
      <span>Ativo desde: ${formatDate(ad.startDate)}</span>
      ${ad.endDate ? `<span>até ${formatDate(ad.endDate)}</span>` : '<span class="still-running">▶ ainda rodando</span>'}
    </div>
  </article>`;
}

function generateHTML(data) {
  const { metadata, ads } = data;
  const cards = ads.map((ad, i) => renderAdCard(ad, i)).join('\n');
  const genDate = new Date(metadata.generatedAt).toLocaleString('pt-BR');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Intel Engine — Facebook Ads Report</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com"></script>
<style>
/* ── Reset & Base ───────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:          #040810;
  --bg2:         #080f1a;
  --surface:     rgba(255,255,255,0.028);
  --surface-h:   rgba(255,255,255,0.05);
  --border:      rgba(255,255,255,0.07);
  --border-h:    rgba(99,179,237,0.3);
  --cyan:        #38bdf8;
  --cyan-dim:    rgba(56,189,248,0.15);
  --purple:      #a78bfa;
  --green:       #10b981;
  --amber:       #f59e0b;
  --red:         #ef4444;
  --text-1:      #f1f5f9;
  --text-2:      #94a3b8;
  --text-3:      #475569;
  --font-head:   'Syne', sans-serif;
  --font-body:   'DM Sans', sans-serif;
  --font-mono:   'JetBrains Mono', monospace;
}

html { scroll-behavior: smooth; }
body {
  background: var(--bg);
  color: var(--text-1);
  font-family: var(--font-body);
  font-size: 14px;
  line-height: 1.6;
  min-height: 100vh;
  overflow-x: hidden;
}

/* ── Background grid effect ─────────────────────── */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(rgba(56,189,248,0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(56,189,248,0.025) 1px, transparent 1px);
  background-size: 48px 48px;
  pointer-events: none;
  z-index: 0;
}

/* ── Glow orbs ──────────────────────────────────── */
.orb {
  position: fixed;
  border-radius: 50%;
  filter: blur(120px);
  pointer-events: none;
  z-index: 0;
  opacity: 0.35;
}
.orb-1 { width: 600px; height: 600px; background: #1e3a5f; top: -200px; left: -200px; }
.orb-2 { width: 400px; height: 400px; background: #2d1b69; bottom: 0; right: -100px; }

/* ── Content wrapper ────────────────────────────── */
.content { position: relative; z-index: 1; }

/* ── Header ─────────────────────────────────────── */
.site-header {
  padding: 48px 32px 32px;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(180deg, rgba(56,189,248,0.04) 0%, transparent 100%);
}

.header-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 32px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 14px;
}

.logo-icon {
  width: 48px; height: 48px;
  background: linear-gradient(135deg, var(--cyan), var(--purple));
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px;
  box-shadow: 0 0 24px rgba(56,189,248,0.3);
}

.logo-text h1 {
  font-family: var(--font-head);
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, var(--cyan), var(--purple));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.logo-text p {
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-3);
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-top: 2px;
}

.gen-info {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-3);
  text-align: right;
}
.gen-info span { color: var(--cyan); }

/* ── Stats bar ──────────────────────────────────── */
.stats-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.stat-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px 20px;
  transition: border-color .2s;
}
.stat-card:hover { border-color: var(--border-h); }

.stat-value {
  font-family: var(--font-head);
  font-size: 28px;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 4px;
}
.stat-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-3);
  font-family: var(--font-mono);
}

/* ── Controls bar ───────────────────────────────── */
.controls {
  padding: 20px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  background: rgba(4,8,16,0.92);
  backdrop-filter: blur(16px);
  z-index: 100;
}

.filter-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-2);
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all .2s;
  white-space: nowrap;
}
.filter-btn:hover { border-color: var(--cyan); color: var(--cyan); }
.filter-btn.active {
  background: var(--cyan-dim);
  border-color: var(--cyan);
  color: var(--cyan);
}

.search-wrap {
  position: relative;
}
.search-icon {
  position: absolute;
  left: 12px; top: 50%;
  transform: translateY(-50%);
  color: var(--text-3);
  font-size: 13px;
  pointer-events: none;
}
.search-input {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 7px 12px 7px 34px;
  color: var(--text-1);
  font-family: var(--font-body);
  font-size: 13px;
  width: 240px;
  outline: none;
  transition: border-color .2s;
}
.search-input:focus { border-color: var(--cyan); }
.search-input::placeholder { color: var(--text-3); }

/* ── Grid ───────────────────────────────────────── */
.ads-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
  padding: 28px 32px;
  max-width: 1600px;
  margin: 0 auto;
}

/* ── Card ───────────────────────────────────────── */
.ad-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform .25s, border-color .25s, box-shadow .25s;
}
.ad-card:hover {
  transform: translateY(-3px);
  border-color: rgba(56,189,248,0.2);
  box-shadow: 0 8px 32px rgba(56,189,248,0.08);
}
.ad-card.hidden { display: none; }

/* Card header */
.card-header {
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border);
  gap: 10px;
}
.advertiser-info { display: flex; align-items: center; gap: 10px; min-width: 0; }
.advertiser-avatar {
  width: 34px; height: 34px;
  border-radius: 8px;
  background: linear-gradient(135deg, #1e3a5f, #2d1b69);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-head);
  font-weight: 700;
  font-size: 14px;
  color: var(--cyan);
  flex-shrink: 0;
  border: 1px solid rgba(56,189,248,0.2);
}
.advertiser-name {
  font-weight: 600;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}
.advertiser-meta {
  font-size: 11px;
  color: var(--text-3);
  font-family: var(--font-mono);
  white-space: nowrap;
}
.card-badges { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.duration-badge {
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 20px;
  background: rgba(167,139,250,0.12);
  border: 1px solid rgba(167,139,250,0.25);
  color: var(--purple);
  white-space: nowrap;
}
.status-dot {
  font-family: var(--font-mono);
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 20px;
  white-space: nowrap;
}
.status-dot.active {
  background: rgba(16,185,129,0.1);
  border: 1px solid rgba(16,185,129,0.3);
  color: var(--green);
}
.status-dot.inactive {
  background: rgba(71,85,105,0.2);
  border: 1px solid rgba(71,85,105,0.3);
  color: var(--text-3);
}

/* Media */
.media-container {
  position: relative;
  width: 100%;
  height: 220px;
  overflow: hidden;
  background: #0a0f1a;
}
.ad-media {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.media-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-3);
  font-size: 13px;
  background: #080d18;
}
.media-overlay {
  position: absolute;
  top: 8px; left: 8px;
}
.media-type-badge {
  font-family: var(--font-mono);
  font-size: 9px;
  padding: 3px 8px;
  border-radius: 4px;
  background: rgba(4,8,16,0.75);
  border: 1px solid var(--border);
  color: var(--text-2);
  letter-spacing: 0.5px;
  backdrop-filter: blur(4px);
}

/* Copy */
.copy-section {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  flex: 1;
}
.copy-title {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 6px;
  color: var(--text-1);
}
.copy-text {
  font-size: 12.5px;
  color: var(--text-2);
  line-height: 1.65;
}
.expand-btn {
  background: none;
  border: none;
  color: var(--cyan);
  font-size: 11px;
  cursor: pointer;
  padding: 4px 0;
  font-family: var(--font-mono);
  display: block;
  margin-top: 4px;
}
.expand-btn:hover { opacity: 0.7; }
.cta-pill {
  display: inline-block;
  margin-top: 10px;
  padding: 4px 12px;
  border-radius: 20px;
  background: var(--cyan-dim);
  border: 1px solid rgba(56,189,248,0.25);
  color: var(--cyan);
  font-size: 11px;
  font-family: var(--font-mono);
}

/* AI Insight Box */
.insight-box {
  background: rgba(56,189,248,0.03);
  border-top: 1px solid rgba(56,189,248,0.12);
  padding: 16px;
}
.insight-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.insight-label {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--cyan);
  font-weight: 600;
}
.fit-badge {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid;
  letter-spacing: 0.5px;
}

/* Score */
.score-section {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 14px;
}
.score-ring-wrapper {
  position: relative;
  width: 80px; height: 80px;
  flex-shrink: 0;
}
.score-ring { width: 80px; height: 80px; }
.score-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-head);
  font-size: 18px;
  font-weight: 800;
}
.score-text span { font-size: 11px; color: var(--text-3); }
.score-details { flex: 1; min-width: 0; }
.angle-badge {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-1);
  margin-bottom: 8px;
  background: rgba(255,255,255,0.05);
  padding: 4px 10px;
  border-radius: 6px;
  display: inline-block;
}
.emotion-tag {
  display: inline-block;
  font-size: 10px;
  padding: 2px 8px;
  margin: 2px;
  border-radius: 20px;
  background: rgba(167,139,250,0.1);
  border: 1px solid rgba(167,139,250,0.2);
  color: var(--purple);
  font-family: var(--font-mono);
}

.insight-divider {
  height: 1px;
  background: var(--border);
  margin: 12px 0;
}

.insight-content { display: flex; flex-direction: column; gap: 12px; }
.insight-row { display: flex; gap: 10px; align-items: flex-start; }
.insight-icon { font-size: 14px; flex-shrink: 0; margin-top: 1px; }
.insight-title {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-3);
  font-family: var(--font-mono);
  margin-bottom: 3px;
}
.insight-text { font-size: 12px; color: var(--text-2); line-height: 1.55; }
.insight-text.highlight {
  color: var(--text-1);
  background: rgba(56,189,248,0.06);
  border-left: 2px solid var(--cyan);
  padding: 6px 10px;
  border-radius: 0 6px 6px 0;
}

/* Hooks */
.hooks-section { margin-top: 12px; }
.hooks-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-3);
  font-family: var(--font-mono);
  margin-bottom: 6px;
}
.hook-tag {
  display: block;
  font-size: 11px;
  font-style: italic;
  color: var(--amber);
  margin-bottom: 4px;
  background: rgba(245,158,11,0.06);
  border-left: 2px solid rgba(245,158,11,0.4);
  padding: 4px 8px;
  border-radius: 0 4px 4px 0;
}
.red-flags {
  margin-top: 10px;
  font-size: 11px;
  color: #fca5a5;
  background: rgba(239,68,68,0.08);
  border: 1px solid rgba(239,68,68,0.2);
  border-radius: 6px;
  padding: 8px 10px;
}

/* Card footer */
.card-footer {
  padding: 10px 16px;
  display: flex;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-3);
  border-top: 1px solid var(--border);
  background: rgba(0,0,0,0.2);
}
.still-running { color: var(--green); }

/* ── Empty state ────────────────────────────────── */
.empty-state {
  grid-column: 1/-1;
  text-align: center;
  padding: 60px 20px;
  color: var(--text-3);
  font-family: var(--font-mono);
}

/* ── Footer ─────────────────────────────────────── */
.site-footer {
  margin-top: 40px;
  padding: 24px 32px;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.footer-text {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-3);
}
.footer-text span { color: var(--cyan); }

/* ── Scrollbar ──────────────────────────────────── */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #334155; }

/* ── Responsive ─────────────────────────────────── */
@media (max-width: 640px) {
  .site-header { padding: 24px 16px 20px; }
  .controls { padding: 12px 16px; }
  .ads-grid { padding: 16px; gap: 14px; grid-template-columns: 1fr; }
  .header-top { flex-direction: column; }
  .search-input { width: 100%; }
}
</style>
</head>
<body>
<div class="orb orb-1"></div>
<div class="orb orb-2"></div>
<div class="content">

<!-- ── HEADER ──────────────────────────────────── -->
<header class="site-header">
  <div class="header-top">
    <div class="logo">
      <div class="logo-icon">⚡</div>
      <div class="logo-text">
        <h1>INTEL ENGINE</h1>
        <p>Facebook Ads Intelligence · Suplementos · ES/EU</p>
      </div>
    </div>
    <div class="gen-info">
      Gerado em <span>${genDate}</span><br/>
      <span>${metadata.totalScraped}</span> anúncios coletados · top <span>${metadata.totalAnalyzed}</span> analisados
    </div>
  </div>

  <div class="stats-bar">
    <div class="stat-card">
      <div class="stat-value" style="color:var(--cyan)">${metadata.totalAnalyzed}</div>
      <div class="stat-label">anúncios analisados</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color:var(--green)">${metadata.highFitCount}</div>
      <div class="stat-label">⚡ Alto fit (8-10)</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color:var(--amber)">${metadata.mediumFitCount}</div>
      <div class="stat-label">🔶 Médio fit (5-7)</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color:var(--red)">${metadata.lowFitCount}</div>
      <div class="stat-label">🔴 Baixo fit (1-4)</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="background:linear-gradient(135deg,var(--cyan),var(--purple));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">${metadata.avgScore}</div>
      <div class="stat-label">score médio</div>
    </div>
  </div>
</header>

<!-- ── CONTROLS ─────────────────────────────────── -->
<div class="controls">
  <div class="filter-tabs">
    <button class="filter-btn active" data-filter="all">Todos (${metadata.totalAnalyzed})</button>
    <button class="filter-btn" data-filter="alto">⚡ Alto Fit (${metadata.highFitCount})</button>
    <button class="filter-btn" data-filter="médio">🔶 Médio Fit (${metadata.mediumFitCount})</button>
    <button class="filter-btn" data-filter="baixo">🔴 Baixo Fit (${metadata.lowFitCount})</button>
    <button class="filter-btn" data-filter="ativo">● Ativos</button>
  </div>
  <div class="search-wrap">
    <span class="search-icon">🔍</span>
    <input type="text" class="search-input" placeholder="Buscar anunciante, copy..." id="searchInput"/>
  </div>
</div>

<!-- ── ADS GRID ──────────────────────────────────── -->
<main class="ads-grid" id="adsGrid">
  ${cards}
  <div class="empty-state" id="emptyState" style="display:none">
    Nenhum anúncio encontrado para este filtro.
  </div>
</main>

<!-- ── FOOTER ────────────────────────────────────── -->
<footer class="site-footer">
  <div class="footer-text">
    Intel Engine · <span>Facebook Ads Intelligence</span> · Nicho: Suplementos ES/EU
  </div>
  <div class="footer-text">
    Dados coletados via <span>Apify</span> · Análise via <span>Claude AI</span>
  </div>
</footer>

</div><!-- /content -->

<script>
// ── Toggle copy expand ───────────────────────────────────
function toggleCopy(i) {
  const el  = document.getElementById('copy-' + i);
  const pre = el.querySelector('.copy-preview');
  const ful = el.querySelector('.copy-full');
  const btn = el.querySelector('.expand-btn');
  const ellipsis = el.querySelector('.ellipsis');
  if (!ful) return;

  const isCollapsed = ful.style.display === 'none';
  pre.style.display   = isCollapsed ? 'none' : '';
  ful.style.display   = isCollapsed ? '' : 'none';
  if (ellipsis) ellipsis.style.display = isCollapsed ? 'none' : '';
  btn.textContent     = isCollapsed ? 'Ver menos ↑' : 'Ver mais ↓';
}

// ── Filter & Search ──────────────────────────────────────
const cards = document.querySelectorAll('.ad-card');
const emptyState = document.getElementById('emptyState');

function applyFilters() {
  const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
  const query = document.getElementById('searchInput').value.toLowerCase();

  let visible = 0;
  cards.forEach(card => {
    const fit    = (card.dataset.fit || '').toLowerCase();
    const active = card.dataset.active === 'true';
    const text   = card.textContent.toLowerCase();

    let show = true;
    if (activeFilter === 'alto'  && fit !== 'alto')   show = false;
    if (activeFilter === 'médio' && fit !== 'médio')  show = false;
    if (activeFilter === 'baixo' && fit !== 'baixo')  show = false;
    if (activeFilter === 'ativo' && !active)           show = false;
    if (query && !text.includes(query))                show = false;

    card.classList.toggle('hidden', !show);
    if (show) visible++;
  });

  emptyState.style.display = visible === 0 ? '' : 'none';
}

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyFilters();
  });
});

document.getElementById('searchInput').addEventListener('input', applyFilters);

// ── Animate stats on load ────────────────────────────────
document.querySelectorAll('.stat-value').forEach(el => {
  const target = parseFloat(el.textContent);
  if (isNaN(target)) return;
  let start = 0;
  const step = target / 40;
  const timer = setInterval(() => {
    start += step;
    if (start >= target) { el.textContent = el.textContent.includes('.') ? target.toFixed(1) : Math.round(target); clearInterval(timer); }
    else el.textContent = el.textContent.includes('.') ? start.toFixed(1) : Math.round(start);
  }, 20);
});
</script>
</body>
</html>`;
}

// ── Main ─────────────────────────────────────────────────
function generateReport() {
  log('📊', 'Gerando dashboard HTML...\n');

  if (!fs.existsSync(INPUT_FILE)) {
    log('❌', `Arquivo ${INPUT_FILE} não encontrado. Execute: node analyze.js`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  const html = generateHTML(data);

  fs.writeFileSync(OUTPUT_FILE, html, 'utf-8');

  log('✅', `Dashboard gerado: ${OUTPUT_FILE}`);
  log('🌐', `Abra no browser: open ${OUTPUT_FILE}\n`);
}

generateReport();
