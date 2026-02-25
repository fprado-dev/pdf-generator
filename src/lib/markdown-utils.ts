/**
 * Utilitários para manipulação de blocos no Markdown
 */

import type { ImageBlockParams } from "./types";
import { generateImageBlock } from "./generator";

/**
 * Atualiza ou insere um bloco de imagem no markdown
 */
export function updateImageBlock(
  markdown: string,
  imageIndex: number,
  newParams: Partial<ImageBlockParams>
): string {
  const blockRegex = /:::imagem\n([\s\S]*?):::/g;
  const matches = [...markdown.matchAll(blockRegex)];

  if (imageIndex >= matches.length) return markdown;

  const match = matches[imageIndex];
  const fullMatch = match[0];
  const paramsStr = match[1];

  // Parse existing params
  const existingParams: Record<string, string | number> = { src: "" };
  for (const line of paramsStr.trim().split("\n")) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (m) {
      const [, key, value] = m;
      const v = value?.trim().replace(/^["']|["']$/g, "") ?? "";
      existingParams[key] = /^\d+$/.test(v) ? parseInt(v, 10) : v;
    }
  }

  const merged: ImageBlockParams = { ...existingParams, ...newParams } as ImageBlockParams;
  const newBlock = generateImageBlock(merged);

  return markdown.replace(fullMatch, newBlock.trim());
}

/**
 * Reordena imagens - move imagem de fromIndex para toIndex
 */
export function reorderImages(
  markdown: string,
  fromIndex: number,
  toIndex: number
): string {
  const blockRegex = /:::imagem\n([\s\S]*?):::/g;
  const matches = [...markdown.matchAll(blockRegex)];
  const blocks = matches.map((m) => ({ full: m[0], params: m[1] }));

  if (fromIndex < 0 || fromIndex >= blocks.length || toIndex < 0 || toIndex >= blocks.length) {
    return markdown;
  }

  const [removed] = blocks.splice(fromIndex, 1);
  blocks.splice(toIndex, 0, removed);

  // Update order in each block and rebuild
  let result = markdown;
  for (let i = 0; i < blocks.length; i++) {
    const paramsStr = blocks[i].params;
    const orderMatch = paramsStr.match(/\border:\s*\d+/);
    const newOrderLine = `order: ${i + 1}`;
    const newParamsStr = orderMatch
      ? paramsStr.replace(/\border:\s*\d+/, newOrderLine)
      : paramsStr.trimEnd() + "\norder: " + (i + 1);
    const newBlock = `:::imagem\n${newParamsStr}\n:::`;
    result = result.replace(blocks[i].full, newBlock);
  }

  return result;
}

/**
 * Insere um novo bloco de imagem no markdown
 * @param insertBefore - Se fornecido, insere antes da primeira ocorrência. Senão, anexa ao final.
 */
export function insertImageBlock(
  markdown: string,
  imageParams: ImageBlockParams,
  insertBefore?: string
): string {
  const block = generateImageBlock(imageParams).trim();
  const trimmed = markdown.trimEnd();

  if (insertBefore) {
    const idx = trimmed.indexOf(insertBefore);
    if (idx !== -1) {
      return trimmed.slice(0, idx) + block + "\n\n" + trimmed.slice(idx);
    }
  }

  return trimmed + "\n\n" + block;
}
