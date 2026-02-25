# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

PDF Generator — a client-side Next.js 16 (TypeScript, Tailwind CSS, shadcn/ui) page builder for pediatric medical reports in `.md` format. No backend, no database, no external APIs. Everything runs in the browser.

### Running the app

```bash
npm run dev        # starts Next.js dev server on port 3000 (bound to 0.0.0.0)
npm run build      # production build
npm run lint       # ESLint (eslint-config-next)
```

See `README.md` and `COMO_RODAR.md` for detailed instructions.

### Key caveats

- **No test framework** is installed. There are no automated tests to run. Validate changes with `npm run build` + `npm run lint` + manual browser testing.
- **Port 3000 not exposed** in cloud agent VMs. Use `ngrok http 3000` to get a public URL (requires `NGROK_AUTHTOKEN` secret). The token is configured in `~/.config/ngrok/ngrok.yml`.
- The app uses `@dnd-kit` for drag-and-drop. DnD state is complex — when modifying layout types or the page builder component, always verify drag-from-palette and within-editor drag both still work.
- All source code is in Portuguese (comments, labels, variable names for domain objects).
