#!/usr/bin/env node
/**
 * NovaOS | Black Rose | GypsyCove
 * Master Palette Builder & Tailwind Wiring — Sovereign Standard
 *
 * What this does:
 * 1) Scans the repo for color tokens in:
 *    - tailwind.config.{js,ts,mjs,cjs}
 *    - *.css / *.scss / *.sass (CSS variables + hex)
 *    - *.js / *.ts / *.tsx / *.jsx (JS objects with hex)
 * 2) Produces:
 *    - apps/shared/tokens/colors.json   (canonical token registry)
 *    - apps/shared/tailwind.colors.js   (Tailwind-ready nested palette)
 *    - design/PaletteMap.md             (how tokens map to UI sections)
 * 3) Patches tailwind configs for each app (safe, with .bak backups)
 *
 * No placeholders. No guessing your palette. It ingests what you already have.
 */

import fs from 'fs';
import path from 'path';
import url from 'url';

const repoRoot = process.cwd();
const IGNORES = new Set([
  'node_modules', '.git', '.next', 'build', 'dist', '.turbo', '.vercel', '.cache', 'coverage'
]);

const APP_TAILWIND_CANDIDATES = [
  'apps/web-shell/tailwind.config.js',
  'apps/web-shell/tailwind.config.ts',
  'apps/novaos/tailwind.config.js',
  'apps/novaos/tailwind.config.ts',
  'apps/gypsy-cove/tailwind.config.js',
  'apps/gypsy-cove/tailwind.config.ts',
];

const OUTPUT_TOKENS = path.join(repoRoot, 'apps', 'shared', 'tokens', 'colors.json');
const OUTPUT_TW      = path.join(repoRoot, 'apps', 'shared', 'tailwind.colors.js');
const OUTPUT_MAP     = path.join(repoRoot, 'design', 'PaletteMap.md');

function ensureDir(p) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
}

function* walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (IGNORES.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      yield* walk(p);
    } else {
      yield p;
    }
  }
}

// ---------- parsers ----------
const hexRe = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;
const cssVarRe = /--([a-z0-9\-_]+)\s*:\s*([^;]+);/gi;
const jsPropHexRe = /([A-Za-z0-9_\-]+)\s*:\s*['"`](#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}))['"`]/g;

// very naive Tailwind colors object extractor (balanced braces after "colors:")
function extractTailwindColorsObject(txt) {
  const idx = txt.indexOf('colors');
  if (idx === -1) return null;
  const colon = txt.indexOf(':', idx);
  if (colon === -1) return null;
  let i = txt.indexOf('{', colon);
  if (i === -1) return null;
  let depth = 0, start = i, end = -1;
  for (; i < txt.length; i++) {
    if (txt[i] === '{') depth++;
    if (txt[i] === '}') {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  if (end === -1) return null;
  const objText = txt.slice(start, end + 1);
  // attempt to convert to JSON-ish: quote keys that look like identifiers
  let safe = objText
    .replace(/([,{]\s*)([A-Za-z0-9_\-]+)\s*:/g, '$1"$2":')
    .replace(/'/g, '"')
    // remove function refs or spreads to avoid JSON parse
    .replace(/\.\.\.[^,}]+/g, '')
    .replace(/\b(require|import|theme)\([^)]*\)/g, 'null');
  try {
    return JSON.parse(safe);
  } catch {
    return null;
  }
}

// ---------- collection ----------
const tokens = {}; // { tokenName: { value:"#A33...", sources:[file], tags:Set } }
function addToken(name, value, source, tag) {
  const key = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  if (!tokens[key]) tokens[key] = { value, sources: new Set(), tags: new Set() };
  tokens[key].value = value;
  tokens[key].sources.add(path.relative(repoRoot, source));
  if (tag) tokens[key].tags.add(tag);
}

function collectFromCSS(p, txt) {
  // CSS variables
  for (const m of txt.matchAll(cssVarRe)) {
    const varName = m[1];
    const val = m[2].trim();
    const hex = (val.match(hexRe) || [])[0];
    if (hex) addToken(varName, hex, p, 'css-var');
  }
  // bare hexes (fallback)
  const set = new Set(txt.match(hexRe) || []);
  let idx = 0;
  for (const hx of set) addToken(`css_hex_${idx++}`, hx, p, 'hex');
}

function collectFromJS(p, txt) {
  // JS object properties with hex
  for (const m of txt.matchAll(jsPropHexRe)) {
    const name = m[1];
    const hex = m[2];
    addToken(name, hex, p, 'js-prop');
  }
  // try tailwind colors object
  if (/tailwind\.config|module\.exports|export\s+default/.test(txt) || /extend\s*:\s*{/.test(txt)) {
    const obj = extractTailwindColorsObject(txt);
    if (obj && typeof obj === 'object') {
      const stack = [{prefix:'', node:obj}];
      while (stack.length) {
        const {prefix, node} = stack.pop();
        for (const [k, v] of Object.entries(node)) {
          const name = prefix ? `${prefix}_${k}` : k;
          if (typeof v === 'string' && hexRe.test(v)) {
            const hx = (v.match(hexRe) || [])[0];
            addToken(name, hx, p, 'tw-colors');
          } else if (v && typeof v === 'object') {
            stack.push({prefix:name, node:v});
          }
        }
      }
    }
  }
}

// walk repo and collect
for (const file of walk(repoRoot)) {
  const ext = path.extname(file).toLowerCase();
  if (!/\.(js|ts|tsx|jsx|css|scss|sass|json|mjs|cjs)$/.test(ext)) continue;
  let txt;
  try { txt = fs.readFileSync(file, 'utf8'); } catch { continue; }
  try {
    if (/\.(css|scss|sass)$/.test(ext)) collectFromCSS(file, txt);
    else collectFromJS(file, txt);
  } catch (e) {
    // skip noisy parse failures
  }
}

// Deduplicate by value and prefer meaningful names
// Build groups by brand heuristics you already use
const groups = {
  blackRose: {},    // dark global
  novaOS: {},       // light global
  studios: {        // studio families
    scarletStudio: {},
    lightboxStudio: {},
    inkSteel: {},
    expression: {},
    cipherCore: {}
  },
  status: { success:{}, warning:{}, danger:{}, info:{} },
  phantom: {},      // phantom identity accents
  admin: {},        // admin alerts/controls
  unassigned: {}    // anything not matched
};

function pushToGroup(name, hex) {
  const n = name.toLowerCase();
  const assign = (bucket, key) => { bucket[key] = hex; };
  if (n.includes('rosemauve') || n.includes('deep_rosewood') || n.includes('blood_brown') || n.includes('true_black') || n.includes('midnight_navy') || n.includes('deep_teal')) {
    return assign(groups.blackRose, name);
  }
  if (n.includes('nova') || n.includes('blue_dark') || n.includes('lavender') || n.includes('coral') || n.includes('peach')) {
    return assign(groups.novaOS, name);
  }
  if (n.includes('scarlet') || n.includes('crimson') || n.includes('wine') || n.includes('blush')) {
    return assign(groups.studios.scarletStudio, name);
  }
  if (n.includes('lightbox') || n.includes('platinum') || n.includes('pearl') || n.includes('photo') || n.includes('studio_light')) {
    return assign(groups.studios.lightboxStudio, name);
  }
  if (n.includes('ink') || n.includes('steel') || n.includes('iron') || n.includes('graphite') || n.includes('silver')) {
    return assign(groups.studios.inkSteel, name);
  }
  if (n.includes('expression') || n.includes('orchid') || n.includes('violet') || n.includes('ivory')) {
    return assign(groups.studios.expression, name);
  }
  if (n.includes('cipher') || n.includes('cyber') || n.includes('neon') || n.includes('slate')) {
    return assign(groups.studios.cipherCore, name);
  }
  if (n.includes('success')) return assign(groups.status.success, name);
  if (n.includes('warning')) return assign(groups.status.warning, name);
  if (n.includes('danger') || n.includes('error')) return assign(groups.status.danger, name);
  if (n.includes('info')) return assign(groups.status.info, name);
  if (n.includes('phantom')) return assign(groups.phantom, name);
  if (n.includes('admin')) return assign(groups.admin, name);
  return assign(groups.unassigned, name);
}

for (const [name, rec] of Object.entries(tokens)) {
  pushToGroup(name, rec.value);
}

// write tokens.json (with provenance)
ensureDir(OUTPUT_TOKENS);
const jsonOut = Object.fromEntries(Object.entries(tokens).map(([k,v]) => [k, { value:v.value, sources:[...v.sources], tags:[...v.tags] }]));
fs.writeFileSync(OUTPUT_TOKENS, JSON.stringify(jsonOut, null, 2), 'utf8');

// write tailwind.colors.js (nested)
ensureDir(OUTPUT_TW);
const twJS = `/* Auto-generated by scripts/palette_sync.mjs — DO NOT EDIT BY HAND */
module.exports = ${JSON.stringify(groups, null, 2)};
`;
fs.writeFileSync(OUTPUT_TW, twJS, 'utf8');

// write PaletteMap.md (usage guidance)
ensureDir(OUTPUT_MAP);
const mapMd = `# Palette Map — Sovereign Standard

This file is auto-generated. Your discovered tokens were grouped into brand families.
Use classes like:

- **Black Rose (dark global)** → backgrounds, app frames
  - \`bg-[color:var(--tw-color-blackRose.trueBlack)]\` (or via theme key \`bg-blackRose-trueBlack\` if you map in tailwind)
- **NovaOS (light global)** → light theme toggle
- **Studios** → page/section theming: scarletStudio, lightboxStudio, inkSteel, expression, cipherCore
- **Status** → success, warning, danger, info
- **Phantom** → phantom accents
- **Admin** → admin controls
- **Unassigned** → pending review

> Tailwind wiring: Each app's tailwind.config should \`extend.colors = require("../shared/tailwind.colors.js")\`.
> Then you can use utilities like \`bg-blackRose-trueBlack\`, \`text-studios-scarletStudio-crimson\`, etc.

This file points to the canonical source of truth: \`apps/shared/tokens/colors.json\`.
`;
fs.writeFileSync(OUTPUT_MAP, mapMd, 'utf8');

// patch tailwind configs
function patchTailwindConfig(file) {
  if (!fs.existsSync(file)) return false;
  const original = fs.readFileSync(file, 'utf8');
  const bak = file + '.bak';
  fs.writeFileSync(bak, original, 'utf8');

  let content = original;
  // ensure require line
  if (!/shared\/tailwind\.colors\.js/.test(content)) {
    const requireLine = `const brcColors = require("../shared/tailwind.colors.js");\n`;
    // insert after first line or 'module.exports' start
    content = requireLine + content;
  }

  // ensure extend.colors assignment
  if (/extend\s*:\s*{/.test(content)) {
    // insert or replace colors inside extend
    if (!/extend\s*:\s*{[^}]*colors\s*:/.test(content)) {
      content = content.replace(/extend\s*:\s*{/, match => `${match}\n      colors: brcColors,`);
    } else {
      // crude replace existing colors object with brcColors reference
      content = content.replace(/colors\s*:\s*[^,}]+/, 'colors: brcColors');
    }
  } else {
    // inject extend block
    content = content.replace(/theme\s*:\s*{/, m => `${m}\n    extend: { colors: brcColors },`);
  }

  fs.writeFileSync(file, content, 'utf8');
  return true;
}

let patched = 0;
for (const p of APP_TAILWIND_CANDIDATES) {
  if (patchTailwindConfig(path.join(repoRoot, p))) patched++;
}

console.log(`✔ Palette extraction complete.
- tokens: ${path.relative(repoRoot, OUTPUT_TOKENS)}
- tailwind: ${path.relative(repoRoot, OUTPUT_TW)}
- map: ${path.relative(repoRoot, OUTPUT_MAP)}
- tailwind configs patched: ${patched}
`);
