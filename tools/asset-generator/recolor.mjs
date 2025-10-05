#!/usr/bin/env node
/*
  Palette-adaptive recolor pipeline using sharp.
  - Reads reference images from design/platforms photo ideas
  - Applies color grading to match each platform palette
  - Outputs to design/generated/<platform>/background.webp
  Notes: This is heuristic color grading (tone curves, overlays, and LUT-like mapping)
*/
import sharp from 'sharp';
import { mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC_DIR = 'design/platforms photo ideas';
const OUT_DIR = 'design/generated';

const palettes = {
  novaos: {
    // deep blues/teals
    overlay: '#0b2e40',
    secondary: '#0f3f54',
    highlight: '#66e0ff',
    curves: { shadows: 0.9, midtones: 1.0, highlights: 1.05, saturation: 1.08 },
  },
  'black-rose': {
    overlay: '#1a1316',
    secondary: '#0b0b0c',
    highlight: '#d4a5a5',
    curves: { shadows: 0.95, midtones: 0.98, highlights: 0.96, saturation: 0.85 },
  },
  gypsycove: {
    overlay: '#461f58',
    secondary: '#6b2a5f',
    highlight: '#ff7f7f',
    curves: { shadows: 0.95, midtones: 1.03, highlights: 1.08, saturation: 1.12 },
  },
};

function applyCurves(img, c){
  // Approximate tone curves: multiplicative shadows/mid/high by HSL brightness regions.
  // Sharp lacks region-based curves; we emulate via linear + saturation tweaks and overlays.
  return img
    .modulate({ saturation: Math.max(0.2, c.saturation), brightness: 1.0 })
    .linear(c.midtones, 0)
    .linear(c.highlights, 0)
    .linear(c.shadows, 0);
}

async function recolorOne(srcPath, variant, cfg){
  const base = sharp(srcPath).resize(1920, 1080, { fit: 'cover' }).toColorspace('srgb');
  const graded = applyCurves(base, cfg.curves);

  // Colorize via soft overlays
  const overlay = await sharp({
    create: { width: 1920, height: 1080, channels: 4, background: cfg.overlay + 'cc' }, // ~80% alpha
  }).png().toBuffer();
  const secondary = await sharp({
    create: { width: 1920, height: 1080, channels: 4, background: cfg.secondary + '88' }, // ~53% alpha
  }).png().toBuffer();

  let composed = await graded
    .composite([
      { input: overlay, blend: 'overlay' },
      { input: secondary, blend: 'soft-light' },
    ])
    .sharpen()
    .toColorspace('srgb')
    .toBuffer();

  // Highlight dodge
  const highlight = await sharp({
    create: { width: 1920, height: 1080, channels: 4, background: cfg.highlight + '22' }, // subtle
  }).png().toBuffer();
  composed = await sharp(composed).composite([{ input: highlight, blend: 'color-dodge' }]).toBuffer();

  const outDir = join(OUT_DIR, variant);
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, 'background.webp');
  await sharp(composed).webp({ quality: 92 }).toFile(outPath);
  console.log('wrote', outPath);
}

async function main(){
  const files = readdirSync(SRC_DIR).filter(f=>/\.(png|jpg|jpeg|webp)$/i.test(f));
  if (!files.length){
    console.error('No images found in', SRC_DIR);
    process.exit(1);
  }
  // Use the most descriptive candidate if present; else first file
  const pick = (namePart) => files.find(f=>f.toLowerCase().includes(namePart)) || files[0];

  const srcNova = join(SRC_DIR, pick('nova') || pick('cosmic') || files[0]);
  const srcRose = join(SRC_DIR, pick('black') || pick('rose') || pick('dark') || files[0]);
  const srcGypsy = join(SRC_DIR, pick('gypsy') || pick('academy') || pick('library') || files[0]);

  await recolorOne(srcNova, 'novaos', palettes.novaos);
  await recolorOne(srcRose, 'black-rose', palettes['black-rose']);
  await recolorOne(srcGypsy, 'gypsycove', palettes.gypsycove);
}

main().catch(e=>{ console.error(e); process.exit(1); });
