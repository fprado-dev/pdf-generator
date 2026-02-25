# Formato de Estrutura Markdown - Relatórios Médicos Pediátricos

Este documento define o formato padrão para relatórios médicos pediátricos em arquivos `.md`.

## Estrutura Geral

```
---
front matter (YAML)
---

# Título do Relatório

Conteúdo em Markdown padrão...

:::bloco_customizado
parâmetros
:::
```

## 1. Front Matter (Metadados)

Bloco YAML no topo do arquivo, delimitado por `---`:

```yaml
---
titulo: "Relatório de Consulta Pediátrica"
paciente_id: "REF-2024-001"
data: "2024-02-25"
medico: "Dr. João Silva"
tipo: "consulta" | "retorno" | "emergencia" | "exame"
---
```

## 2. Blocos Customizados

### 2.1 Bloco de Imagem

Controle de posição, tamanho e ordem de imagens (ex.: ultrassom, raio-X).

```
:::imagem
src: /caminho/ou/url-da-imagem.png
alt: Descrição acessível da imagem
legenda: Legenda opcional exibida abaixo
position: left | center | right
size: small | medium | large
order: 1
:::
```

**Parâmetros:**
- `src` (obrigatório): URL ou caminho da imagem
- `alt` (opcional): Texto alternativo
- `legenda` (opcional): Legenda exibida abaixo da imagem
- `position`: Alinhamento horizontal (`left` | `center` | `right`)
- `size`: Tamanho em % da largura (`small`: 33% | `medium`: 66% | `large`: 100%)
- `order`: Ordem de exibição (número inteiro)

### 2.2 Bloco de Seção Estruturada

Para seções com campos pré-definidos:

```
:::secao
tipo: identificacao | exame_fisico | conclusao
titulo: Nome da Seção
:::

Conteúdo Markdown da seção aqui...
:::
```

### 2.3 Markdown Padrão

Todo texto fora dos blocos `:::` segue Markdown padrão (headers, listas, negrito, tabelas).

## 3. Seções Sugeridas para Relatórios Pediátricos

1. **Identificação** - Dados do paciente (anonimizados)
2. **Queixa/Motivo** - Motivo da consulta
3. **História Clínica** - Anamnese
4. **Exame Físico** - Achados do exame
5. **Exames Complementares** - Imagens com blocos `:::imagem`
6. **Conclusão/Diagnóstico**
7. **Conduta/Recomendações**

## 4. Exemplo Completo

```md
---
titulo: Relatório - Ultrassom Abdominal
paciente_id: REF-2024-001
data: 2024-02-25
medico: Dr. Maria Santos
tipo: exame
---

# Relatório de Ultrassom Abdominal

## Identificação

Paciente em acompanhamento para investigação de dor abdominal.

## Exame Realizado

Ultrassom de abdome completo.

:::imagem
src: /exames/usg-abdome-001.png
alt: Corte longitudinal
legenda: Fig. 1 - Aspecto hepático
position: center
size: large
order: 1
:::

:::imagem
src: /exames/usg-abdome-002.png
alt: Corte transversal
legenda: Fig. 2 - Vesícula biliar
position: left
size: medium
order: 2
:::

## Conclusão

Achados dentro da normalidade para a idade.
```
