# Usando no Cursor Agents (cursor.com/agents)

**O Cursor Cloud Agents não expõe portas** — não há port forwarding na nuvem. A rota 3000 não fica acessível por isso.

## Solução: Deploy na Vercel (grátis)

A forma mais simples de ver o app no Cursor Agents é fazer o deploy na Vercel. Cada push gera um link público.

### Passo 1: Conectar o repositório na Vercel

1. Acesse **[vercel.com](https://vercel.com)** e faça login (pode usar conta GitHub).
2. Clique em **Add New** → **Project**.
3. Escolha o repositório **fprado-dev/pdf-generator**.
4. Confirme as configurações (Next.js é detectado automaticamente).
5. Clique em **Deploy**.

### Passo 2: Acessar o app

- **Produção:** `https://pdf-generator-xxxxx.vercel.app` (ou seu domínio)
- **Branch atual:** após o primeiro deploy, a Vercel mostra um link de preview para o branch `cursor/pdf-generator-md-structures-994c` no dashboard ou no PR.

### Passo 3: Deploys automáticos

Depois de conectar, cada **push** para o GitHub dispara um novo deploy na Vercel. O link de preview fica sempre atualizado.

---

## Resumo

| Ambiente           | Porta 3000   | Como acessar                    |
|--------------------|-------------|----------------------------------|
| Cursor local       | Funciona    | http://localhost:3000           |
| Cursor Agents      | Não expõe   | Usar link da Vercel após deploy |
