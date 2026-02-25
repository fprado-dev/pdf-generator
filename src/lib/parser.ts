/**
 * Parser de Markdown estruturado para relatórios médicos
 */

import type { ParsedReport, ReportBlock, ReportFrontMatter, ImageBlockParams } from "./types";

const BLOCK_REGEX = /^:::(\w+)\n([\s\S]*?):::/gm;
const FRONT_MATTER_REGEX = /^---\s*\n([\s\S]*?)\n---\s*\n?/;

function parseFrontMatter(yaml: string): ReportFrontMatter {
  const result: ReportFrontMatter = {};
  const lines = yaml.trim().split("\n");

  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.*)$/);
    if (match) {
      const [, key, value] = match;
      result[key] = value?.trim().replace(/^["']|["']$/g, "") ?? "";
    }
  }

  return result;
}

function parseBlockParams(paramsStr: string, blockType: string): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  const lines = paramsStr.trim().split("\n");

  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.*)$/);
    if (match) {
      const [, key, value] = match;
      const trimmed = value?.trim().replace(/^["']|["']$/g, "") ?? "";
      params[key] = /^\d+$/.test(trimmed) ? parseInt(trimmed, 10) : trimmed;
    }
  }

  return params as Record<string, string>;
}

export function parseMarkdown(markdown: string): ParsedReport {
  let content = markdown;
  let frontMatter: ReportFrontMatter = {};
  const blocks: ReportBlock[] = [];

  // Extrair front matter
  const fmMatch = content.match(FRONT_MATTER_REGEX);
  if (fmMatch) {
    frontMatter = parseFrontMatter(fmMatch[1]);
    content = content.slice(fmMatch[0].length);
  }

  // Extrair blocos customizados
  const blockMatches = [...content.matchAll(BLOCK_REGEX)];

  for (const match of blockMatches) {
    const [, type, paramsContent] = match;
    const params = parseBlockParams(paramsContent, type);

    blocks.push({
      type: type as "imagem" | "secao",
      params: params as ImageBlockParams & Record<string, string>,
    });
  }

  return {
    frontMatter,
    content,
    blocks,
  };
}

export function extractImageBlocks(parsed: ParsedReport): ImageBlockParams[] {
  return parsed.blocks
    .filter((b) => b.type === "imagem")
    .map((b) => b.params as ImageBlockParams)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
