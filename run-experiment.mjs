#!/usr/bin/env node
// Hinglish vs English GEO buying-prompt study — experiment runner.
//
// Calls the same DataForSEO surfaces Depra uses in production:
//   chatgpt    → /v3/ai_optimization/chat_gpt/llm_scraper/live/advanced  (chatgpt.com UI, force_web_search)
//   gemini     → /v3/ai_optimization/gemini/llm_scraper/live/advanced    (gemini.google.com UI)
//   perplexity → /v3/ai_optimization/perplexity/llm_responses/live       (sonar + web_search, IN)
//
// Design constants held fixed across conditions: location_code 2356 (India),
// language_code 'en' (interface hint; the manipulated variable is prompt text only).
//
// Resumable: each cell writes data/raw/<promptId>_<lang>_<engine>_r<rep>.json on
// success; failures write .failed.json and are retried on the next invocation.
//
// Usage:
//   node run-experiment.mjs --reps 5                    # full run
//   node run-experiment.mjs --prompts S01 --reps 1      # pilot
//   node run-experiment.mjs --engines perplexity --reps 5

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.join(HERE, 'data', 'raw');
const LOG_FILE = path.join(HERE, 'data', 'run.log');

// ---------- config ----------
const args = process.argv.slice(2);
function argVal(name, fallback) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}
const REPS = parseInt(argVal('reps', '5'), 10);
const ENGINES = argVal('engines', 'chatgpt,gemini,perplexity').split(',');
const LANGS = argVal('langs', 'en,hg').split(',');
const PROMPT_FILTER = argVal('prompts', '').split(',').filter(Boolean);
const CONCURRENCY = parseInt(argVal('concurrency', '3'), 10);
const MAX_ATTEMPTS = parseInt(argVal('max-attempts', '5'), 10);
const SEED = parseInt(argVal('seed', '20260814'), 10);
const LOCATION_CODE = 2356; // India
const COUNTRY_ISO = 'IN';

// ---------- env ----------
// Credentials come from the environment, or from a .env file next to this
// script. Nothing here is committed: see .env.example for the two keys needed.
function readDotEnv() {
  const file = path.join(HERE, '.env');
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(file, 'utf8')
      .split('\n')
      .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
      .map((l) => {
        const i = l.indexOf('=');
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      }),
  );
}
const env = { ...readDotEnv(), ...process.env };
const LOGIN = env.DATAFORSEO_LOGIN;
const PASSWORD = env.DATAFORSEO_PASSWORD;
if (!LOGIN || !PASSWORD) {
  console.error(
    'Missing DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD.\n' +
      'Set them as environment variables, or copy .env.example to .env and fill them in.\n' +
      'Collecting fresh data requires a DataForSEO account (https://dataforseo.com).\n' +
      'Note: re-collection produces NEW data, it does not reproduce the published corpus,\n' +
      'because engine answers change over time. To reproduce the published numbers,\n' +
      'run: node analyze.mjs (no credentials needed).',
  );
  process.exit(1);
}
const AUTH = Buffer.from(`${LOGIN}:${PASSWORD}`).toString('base64');

// ---------- prompts ----------
const promptFile = JSON.parse(fs.readFileSync(path.join(HERE, 'prompts.json'), 'utf8'));
const prompts = promptFile.prompts.filter((p) => !PROMPT_FILTER.length || PROMPT_FILTER.includes(p.id));

// ---------- cells ----------
const cells = [];
for (const p of prompts)
  for (const lang of LANGS)
    for (const engine of ENGINES)
      for (let rep = 1; rep <= REPS; rep++)
        cells.push({ promptId: p.id, category: p.category, lang, engine, rep, promptText: p[lang] });

// Seeded shuffle (mulberry32) so execution order is interleaved across
// language/engine, not confounded with wall-clock time, and reproducible.
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(SEED);
for (let i = cells.length - 1; i > 0; i--) {
  const j = Math.floor(rand() * (i + 1));
  [cells[i], cells[j]] = [cells[j], cells[i]];
}

const cellId = (c) => `${c.promptId}_${c.lang}_${c.engine}_r${c.rep}`;
const okPath = (c) => path.join(RAW_DIR, `${cellId(c)}.json`);
const failedPath = (c) => path.join(RAW_DIR, `${cellId(c)}.failed.json`);

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

// ---------- API calls ----------
async function fetchJson(url, body, timeoutMs = 100_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${AUTH}` },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const detail = (await res.text().catch(() => '')).slice(0, 300);
      throw new Error(`HTTP ${res.status}: ${detail}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function callScraper(endpoint, promptText, extra = {}) {
  const data = await fetchJson(
    `https://api.dataforseo.com/v3/ai_optimization/${endpoint}/llm_scraper/live/advanced`,
    [{ keyword: promptText.slice(0, 2000), location_code: LOCATION_CODE, language_code: 'en', ...extra }],
  );
  const task = data.tasks?.[0];
  if (task?.status_code && task.status_code >= 40000)
    throw new Error(`DataForSEO ${endpoint} task error ${task.status_code}: ${task.status_message}`);
  const result = task?.result?.[0];
  const answerItem = (result?.items ?? []).find((i) => typeof i?.markdown === 'string');
  const text = result?.markdown ?? answerItem?.markdown ?? '';
  const sources = result?.sources ?? answerItem?.sources ?? [];
  return {
    text,
    citations: sources.map((s, i) => ({ url: s.url, source_name: s.source_name, position: i + 1 })).filter((c) => !!c.url),
    costUsd: task?.cost ?? 0.004,
    raw: data,
  };
}

async function callPerplexity(promptText) {
  const data = await fetchJson('https://api.dataforseo.com/v3/ai_optimization/perplexity/llm_responses/live', [
    { user_prompt: promptText.slice(0, 4000), model_name: 'sonar', web_search: true, web_search_country_iso_code: COUNTRY_ISO },
  ]);
  const task = data.tasks?.[0];
  if (task?.status_code && task.status_code >= 40000)
    throw new Error(`DataForSEO perplexity task error ${task.status_code}: ${task.status_message}`);
  const result = task?.result?.[0];
  const sections = (result?.items ?? []).flatMap((i) => i?.sections ?? []);
  const text = sections.map((s) => s?.text ?? '').join('');
  const seen = new Set();
  const citations = sections
    .flatMap((s) => s?.annotations ?? [])
    .filter((a) => !!a?.url && !seen.has(a.url) && !!seen.add(a.url))
    .map((a, i) => ({ url: a.url, position: i + 1 }));
  return { text, citations, costUsd: result?.money_spent ?? task?.cost ?? 0.006, raw: data };
}

function callEngine(engine, promptText) {
  if (engine === 'chatgpt') return callScraper('chat_gpt', promptText, { force_web_search: true });
  if (engine === 'gemini') return callScraper('gemini', promptText);
  if (engine === 'perplexity') return callPerplexity(promptText);
  throw new Error(`unknown engine ${engine}`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runCell(c) {
  const id = cellId(c);
  if (fs.existsSync(okPath(c))) {
    log(`SKIP ${id} (already done)`);
    return { id, status: 'skipped' };
  }
  const attemptsLog = [];
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const startedAt = new Date().toISOString();
    const t0 = Date.now();
    try {
      const r = await callEngine(c.engine, c.promptText);
      const durationMs = Date.now() - t0;
      if (!r.text || r.text.trim().length < 40) throw new Error(`empty/short answer (${(r.text ?? '').length} chars)`);
      const record = {
        meta: {
          study: 'hinglish-geo-study', promptsVersion: promptFile.version,
          ...c, cellId: id, startedAt, finishedAt: new Date().toISOString(),
          durationMs, attempt, attemptsLog, locationCode: LOCATION_CODE, countryIso: COUNTRY_ISO,
        },
        response: { text: r.text, citations: r.citations, costUsd: r.costUsd },
        rawApi: r.raw,
      };
      fs.writeFileSync(okPath(c), JSON.stringify(record, null, 1));
      if (fs.existsSync(failedPath(c))) fs.unlinkSync(failedPath(c));
      log(`OK   ${id} attempt=${attempt} ${durationMs}ms text=${r.text.length}ch cites=${r.citations.length} $${r.costUsd}`);
      return { id, status: 'ok' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      attemptsLog.push({ attempt, startedAt, error: msg.slice(0, 300) });
      log(`ERR  ${id} attempt=${attempt}/${MAX_ATTEMPTS}: ${msg.slice(0, 200)}`);
      if (attempt < MAX_ATTEMPTS) {
        const backoff = [10_000, 30_000, 60_000, 120_000][attempt - 1] ?? 120_000;
        await sleep(backoff + Math.floor(rand() * 5000));
      }
    }
  }
  fs.writeFileSync(failedPath(c), JSON.stringify({ meta: { ...c, cellId: id }, attemptsLog }, null, 1));
  log(`FAIL ${id} after ${MAX_ATTEMPTS} attempts`);
  return { id, status: 'failed' };
}

// ---------- worker pool ----------
async function main() {
  fs.mkdirSync(RAW_DIR, { recursive: true });
  log(`RUN start: ${cells.length} cells, engines=${ENGINES}, langs=${LANGS}, reps=${REPS}, seed=${SEED}, concurrency=${CONCURRENCY}`);
  let i = 0;
  const counts = { ok: 0, failed: 0, skipped: 0 };
  async function worker(w) {
    while (i < cells.length) {
      const c = cells[i++];
      const r = await runCell(c);
      counts[r.status]++;
      const done = counts.ok + counts.failed + counts.skipped;
      if (done % 10 === 0) log(`PROGRESS ${done}/${cells.length} ok=${counts.ok} failed=${counts.failed} skipped=${counts.skipped}`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, (_, w) => worker(w)));
  log(`RUN done: ok=${counts.ok} failed=${counts.failed} skipped=${counts.skipped}`);
  const failed = fs.readdirSync(RAW_DIR).filter((f) => f.endsWith('.failed.json'));
  if (failed.length) log(`REMAINING FAILURES: ${failed.join(', ')}`);
}

main().catch((e) => {
  log(`FATAL ${e?.stack ?? e}`);
  process.exit(1);
});
