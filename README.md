# PDF Generator

Sistema full-custom para gerar estruturas em arquivos `.md` para relatórios médicos pediátricos.

> **Cursor Agents (cursor.com/agents):** A porta 3000 não é exposta. Use o deploy na Vercel — veja [CURSOR_AGENTS.md](CURSOR_AGENTS.md).

## Stack

- **Next.js 16** + TypeScript
- **Tailwind CSS** + shadcn/ui
- **react-markdown** + remark-gfm

## Funcionalidades

- Editor de Markdown com preview em tempo real
- Formato estruturado com front matter (metadados) e blocos customizados
- Controle de imagens: ordem, posição (esquerda/centro/direita), tamanho (pequeno/médio/grande)
- Exportação do documento em `.md`
- Layout A4 preparado para futura conversão em PDF

## Formato das Estruturas em .md

Consulte [docs/FORMATO_MD.md](docs/FORMATO_MD.md) para a especificação completa.

### Exemplo Rápido

```md
---
titulo: Relatório - Consulta Pediátrica
paciente_id: REF-2024-001
data: 2024-02-25
medico: Dr(a). Nome
tipo: consulta
---

# Relatório

## Exames Complementares

:::imagem
src: /caminho/imagem.png
legenda: Fig. 1 - Descrição
position: center
size: large
order: 1
:::
```

## Desenvolvimento

```bash
npm install
npm run dev
```

Acesse **http://localhost:3000** no navegador.

### No Cursor / Ambiente Remoto

1. Rode `npm run dev` no terminal
2. Abra o painel **Ports** (View → Portas) na barra inferior
3. Clique no ícone de globo na linha da porta 3000 (ou 3001) para abrir no navegador
4. Ou use **Simple Browser** (Ctrl+Shift+P → "Simple Browser") e digite `http://localhost:3000`

## Build

```bash
npm run build
npm start
```
