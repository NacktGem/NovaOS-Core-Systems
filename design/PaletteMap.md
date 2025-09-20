# Palette Map — Sovereign Standard

This file is auto-generated. Your discovered tokens were grouped into brand families.
Use classes like:

- **Black Rose (dark global)** → backgrounds, app frames
  - `bg-[color:var(--tw-color-blackRose.trueBlack)]` (or via theme key `bg-blackRose-trueBlack` if you map in tailwind)
- **NovaOS (light global)** → light theme toggle
- **Studios** → page/section theming: scarletStudio, lightboxStudio, inkSteel, expression, cipherCore
- **Status** → success, warning, danger, info
- **Phantom** → phantom accents
- **Admin** → admin controls
- **Unassigned** → pending review

> Tailwind wiring: Each app's tailwind.config should `extend.colors = require("../shared/tailwind.colors.js")`.
> Then you can use utilities like `bg-blackRose-trueBlack`, `text-studios-scarletStudio-crimson`, etc.

This file points to the canonical source of truth: `apps/shared/tokens/colors.json`.
