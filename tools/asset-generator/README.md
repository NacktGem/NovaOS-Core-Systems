# Asset Generator (Local SVG)

This small utility generates procedural SVG backgrounds for each NovaOS platform without external AI tools. Outputs are brand-aligned, scalable, and lightweight.

## Palettes

- NovaOS: cosmic blues/teals
- Black Rose: rose mauve / deep black
- GypsyCove: warm coral / deep purple

## Usage

Use the Node script `generate.mjs` to emit SVGs into `design/generated/`.

```bash
pnpm node tools/asset-generator/generate.mjs
```

Artifacts:

- design/generated/novaos/background.svg
- design/generated/black-rose/background.svg
- design/generated/gypsycove/background.svg

You can tweak noise density, hex grid, gradients, and sparkles inside the script.
