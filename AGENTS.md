# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

PDF Generator — a client-side Next.js 16 (TypeScript, Tailwind CSS, shadcn/ui) page builder for pediatric medical reports. No backend, no database, no external APIs. Everything runs in the browser. PDF export is TBD; current focus is the React component layout structure.

### Running the app

```bash
npm run dev        # starts Next.js dev server on port 3000 (bound to 0.0.0.0)
npm run build      # production build
npm run lint       # ESLint (eslint-config-next)
```

See `README.md` and `COMO_RODAR.md` for detailed instructions.

### Key caveats

- **No test framework** is installed. No automated tests. Validate with `npm run build` + `npm run lint` + manual browser testing.
- **Port 3000 not exposed** in cloud VMs. Use `ngrok http 3000` (requires `NGROK_AUTHTOKEN` secret). Config lives in `~/.config/ngrok/ngrok.yml`.
- The app uses `@dnd-kit` for drag-and-drop. DnD via the `computerUse` subagent is unreliable — use the **click-to-add** fallback instead (click the green `+` zone in any column to open the element picker).
- The row column toolbar (Full/2col/3col/4col) appears **on hover** over a row — the `computerUse` agent may have difficulty triggering it.
- All source code labels and domain objects are in Portuguese.
