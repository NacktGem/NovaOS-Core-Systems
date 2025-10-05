#!/usr/bin/env node
/*
  Dependency-free approximate recolor via SVG filters:
  - Loads a picked reference bitmap as <image> and applies SVG feColorMatrix/feComponentTransfer
  - Emits a tinted SVG matching each palette, preserving composition of the source image
  Limitations: not as strong as Sharp, but no native deps needed.
*/
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC_DIR = 'design/platforms photo ideas';
const OUT_DIR = 'design/generated';

const palettes = {
  novaos: { mat: [0.1,0.2,0.3], sat: 1.08, bright: 1.0 },
  'black-rose': { mat: [0.2,0.1,0.15], sat: 0.85, bright: 0.95 },
  gypsycove: { mat: [0.35,0.15,0.4], sat: 1.12, bright: 1.05 },
};

function pickSource(){
  // choose a deterministic file (first alphabetically) so the command is stable
  const files = readdirSync(SRC_DIR).filter(f=>/\.(png|jpg|jpeg|webp)$/i.test(f)).sort();
  if (!files.length) throw new Error('No bitmap references in '+SRC_DIR);
  return join(SRC_DIR, files[0]);
}

function toDataURL(path){
  const b = readFileSync(path);
  // naive sniffer based on extension
  const ext = path.toLowerCase().split('.').pop();
  const mime = ext==='jpg'||ext==='jpeg'? 'image/jpeg' : ext==='webp'? 'image/webp':'image/png';
  return `data:${mime};base64,${b.toString('base64')}`;
}

function svgTint({ w, h, href, mat, sat, bright }){
  // Color matrix weights applied with feColorMatrix (type='matrix'), plus saturation via feColorMatrix(type='saturate')
  // and brightness via feComponentTransfer
  const [r,g,b] = mat;
  const matStr = `${r} ${g} ${b} 0 0  ${g} ${b} ${r} 0 0  ${b} ${r} ${g} 0 0  0 0 0 1 0`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>
    <filter id="f">
      <feColorMatrix type="matrix" values="${matStr}"/>
      <feColorMatrix type="saturate" values="${sat}"/>
      <feComponentTransfer>
        <feFuncR type="linear" slope="${bright}"/>
        <feFuncG type="linear" slope="${bright}"/>
        <feFuncB type="linear" slope="${bright}"/>
      </feComponentTransfer>
    </filter>
  </defs>
  <image href="${href}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" filter="url(#f)"/>
</svg>`;
}

function run(){
  const src = pickSource();
  const data = toDataURL(src);
  const size = { w: 1920, h: 1080 };
  Object.entries(palettes).forEach(([name, cfg])=>{
    const svg = svgTint({ ...size, href: data, ...cfg });
    const outDir = join(OUT_DIR, name);
    mkdirSync(outDir, { recursive: true });
    const outPath = join(outDir, 'background-tinted.svg');
    writeFileSync(outPath, svg, 'utf8');
    console.log('wrote', outPath);
  });
}

run();
