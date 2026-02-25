# Como ver o aplicativo

> **No Cursor Agents (cursor.com/agents)?** A porta 3000 não fica acessível. Veja **[CURSOR_AGENTS.md](CURSOR_AGENTS.md)** para fazer deploy na Vercel e obter um link público.

## Passo 1: Abrir o terminal

No Cursor, abra um terminal integrado (`` Ctrl+` `` ou **Terminal → New Terminal**).

## Passo 2: Iniciar o servidor

```bash
cd /workspace
npm run dev
```

Aguarde até aparecer algo como:

```
✓ Ready in XXXms
- Local:    http://localhost:3000
- Network:  http://0.0.0.0:3000
```

**Se a porta 3000 estiver em uso**, o Next.js usará a **3001**.

## Passo 3: Abrir no navegador

### Opção A – Painel Ports (recomendado)

1. Na barra inferior do Cursor, localize a aba **Ports** (Portas).
2. Se não aparecer: **View** → **Ports** ou **Command Palette** (`Ctrl+Shift+P`) → "Ports: Focus on Ports View".
3. Na lista, procure a porta **3000** ou **3001**.
4. Clique no ícone de **globo** ao lado da porta para abrir no navegador.

### Opção B – Simple Browser

1. `Ctrl+Shift+P` (ou `Cmd+Shift+P` no Mac) para abrir a Command Palette.
2. Digite **Simple Browser**.
3. Selecione **Simple Browser: Show**.
4. Informe a URL: `http://localhost:3000` (ou `http://localhost:3001` se o servidor estiver nessa porta).

### Opção C – Ambiente remoto (Codespaces / Cloud)

Se estiver em GitHub Codespaces ou ambiente similar:

- O Cursor costuma gerar um link como `https://<seu-workspace>-3000.preview.app.github.dev`.
- Clique nele ou copie a URL exibida no painel **Ports**.

## Problemas comuns

**Página em branco?**  
- Aguarde alguns segundos para o app carregar.  
- Atualize a página (`F5` ou `Ctrl+R`).

**Porta em uso?**  
- O Next.js tentará usar outra porta (por exemplo, 3001).  
- Use a URL com a porta indicada no terminal.

**`npm run dev` dá erro?**  
- Rode antes: `npm install`.
