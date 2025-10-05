#!/usr/bin/env node
/*
  Procedural SVG background generator for NovaOS platforms.
  - Zero dependencies, Node-only
  - Emits brand-aligned backgrounds
*/

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const out = (p, s) => {
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, s, 'utf8');
  console.log('wrote', p);
};

function gradient(id, stops) {
  const s = stops
    .map(({ offset, color, opacity }) =>
      `<stop offset="${offset}%" stop-color="${color}"${opacity!=null?` stop-opacity="${opacity}"`:''}/>`
    )
    .join('');
  return `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">${s}</linearGradient>`;
}

function hexGrid({ w, h, r=20, stroke='#ffffff0f' }) {
  const hexW = r*2; const hexH = Math.sqrt(3)*r;
  let paths = '';
  for (let y = 0; y < h + hexH; y += hexH) {
    for (let x = 0; x < w + hexW; x += hexW*0.75) {
      const xOffset = ((Math.round(y/hexH)%2) ? hexW*0.375 : 0);
      const cx = x + xOffset; const cy = y;
      const pts = Array.from({length:6}, (_,i)=>{
        const a = Math.PI/3 * i + Math.PI/6;
        return [cx + r*Math.cos(a), cy + r*Math.sin(a)];
      }).map(([px,py])=>`${px.toFixed(1)},${py.toFixed(1)}`).join(' ');
      paths += `<polygon points="${pts}" fill="none" stroke="${stroke}" stroke-width="1"/>`;
    }
  }
  return `<g opacity="0.8">${paths}</g>`;
}

function stars({ w, h, count=120, color='#ffffff', min=0.2, max=0.9 }) {
  let c = '';
  for (let i=0;i<count;i++){
    const x = Math.random()*w;
    const y = Math.random()*h;
    const r = Math.random()*1.4+0.2;
    const o = (Math.random()*(max-min)+min).toFixed(2);
    c += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${color}" opacity="${o}"/>`;
  }
  return c;
}

function noiseDots({ w, h, count=800, color='#000000', opacity=0.08 }){
  let c = '';
  for (let i=0;i<count;i++){
    const x = Math.random()*w;
    const y = Math.random()*h;
    const r = Math.random()*1.2;
    c += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${color}" opacity="${opacity}"/>`;
  }
  return c;
}

function roseVines({ w, h, color='#d4a5a5', opacity=0.15 }){
  let p = '';
  for (let i=0;i<5;i++){
    const x0 = Math.random()*w*0.2;
    const y0 = Math.random()*h;
    const x1 = w*(0.4+Math.random()*0.3);
    const y1 = Math.random()*h;
    const x2 = w*(0.7+Math.random()*0.2);
    const y2 = Math.random()*h;
    p += `<path d="M ${x0.toFixed(1)} ${y0.toFixed(1)} C ${x1.toFixed(1)} ${y1.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}, ${w.toFixed(1)} ${(Math.random()*h).toFixed(1)}" stroke="${color}" stroke-opacity="${opacity}" fill="none" stroke-width="2"/>`;
  }
  return p;
}

function floatingGlyphs({ w, h, items=20, color='#ffd1b3', alt='#c59eff' }){
  let c = '';
  for (let i=0;i<items;i++){
    const x = Math.random()*w; const y = Math.random()*h;
    const r = 6+Math.random()*10; const rot = Math.random()*360;
    const hue = Math.random()<0.5?color:alt;
    c += `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${rot.toFixed(1)})" opacity="0.25">
      <rect x="${(-r/2).toFixed(1)}" y="${(-r/2).toFixed(1)}" width="${r.toFixed(1)}" height="${r.toFixed(1)}" rx="2" ry="2" fill="${hue}"/>
    </g>`;
  }
  return c;
}

function svgBase({ w, h, defs, content }){
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">\n  <defs>${defs}</defs>\n  ${content}\n</svg>`;
}

function novaOS({ w, h }){
  const defs = [
    gradient('g', [
      { offset: 0, color: '#071a2a' },
      { offset: 50, color: '#0b2e40' },
      { offset: 100, color: '#0f3f54' },
    ]),
  ].join('');
  const bg = `<rect width="${w}" height="${h}" fill="url(#g)"/>`;
  const grid = hexGrid({ w, h, r: 18, stroke: '#66e0ff18' });
  const dust = noiseDots({ w, h, count: 1200, color:'#66e0ff', opacity:0.05 });
  const sparkle = stars({ w, h, count: 140, color:'#a9f1ff', min:0.15, max:0.7 });
  const content = `${bg}${grid}<g>${dust}${sparkle}</g>`;
  return svgBase({ w, h, defs, content });
}

function blackRose({ w, h }){
  const defs = [
    gradient('g', [
      { offset: 0, color: '#0b0b0c' },
      { offset: 60, color: '#131013' },
      { offset: 100, color: '#1a1316' },
    ]),
  ].join('');
  const bg = `<rect width="${w}" height="${h}" fill="url(#g)"/>`;
  const texture = noiseDots({ w, h, count: 1400, color:'#d4a5a5', opacity:0.05 });
  const vines = roseVines({ w, h, color:'#d4a5a5', opacity:0.18 });
  const veil = `<rect width="${w}" height="${h}" fill="#000" opacity="0.25"/>`;
  const content = `${bg}${texture}${vines}${veil}`;
  return svgBase({ w, h, defs, content });
}

function gypsyCove({ w, h }){
  const defs = [
    gradient('g', [
      { offset: 0, color: '#2a153a' },
      { offset: 55, color: '#461f58' },
      { offset: 100, color: '#6b2a5f' },
    ]),
    gradient('glow', [
      { offset: 0, color: '#ffb199', opacity: 0.9 },
      { offset: 100, color: '#ff7f7f', opacity: 0.1 },
    ]),
  ].join('');
  const bg = `<rect width="${w}" height="${h}" fill="url(#g)"/>`;
  const glyphs = floatingGlyphs({ w, h, items: 28, color:'#ffb199', alt:'#c59eff' });
  const lantern = `<circle cx="${w*0.8}" cy="${h*0.25}" r="120" fill="url(#glow)" opacity="0.35"/>`;
  const starscape = stars({ w, h, count: 160, color:'#ffd1b3', min:0.1, max:0.6 });
  const content = `${bg}${lantern}${glyphs}${starscape}`;
  return svgBase({ w, h, defs, content });
}

function main(){
  const w = 1920, h = 1080;
  out('design/generated/novaos/background.svg', novaOS({ w, h }));
  out('design/generated/black-rose/background.svg', blackRose({ w, h }));
  out('design/generated/gypsycove/background.svg', gypsyCove({ w, h }));
}

main();
