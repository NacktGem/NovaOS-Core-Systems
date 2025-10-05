import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const palettes = {
  novaos: ['#003366', '#00CCCC'],
  blackRose: ['#8B0000', '#000000'],
  gypsyCove: ['#FF7F50', '#800080']
};

const inputDir = path.resolve('design/platforms photo ideas');
const outputDir = path.resolve('design/generated');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const recolorImage = async (fileName, palette) => {
  const inputPath = path.join(inputDir, fileName);
  const outputPath = path.join(outputDir, `${palette.name}-${fileName}`);

  try {
    await sharp(inputPath)
      .tint(palette.colors[0])
      .toFile(outputPath);
    console.log(`Recolored image saved to ${outputPath}`);
  } catch (error) {
    console.error(`Failed to recolor ${fileName}:`, error);
  }
};

fs.readdirSync(inputDir).forEach((file) => {
  if (file.endsWith('.png')) {
    Object.entries(palettes).forEach(([name, colors]) => {
      recolorImage(file, { name, colors });
    });
  }
});
