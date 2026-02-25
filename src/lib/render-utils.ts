/**
 * Utilitários para renderização do preview
 */

import type { ImageBlockParams } from "./types";

const BLOCK_REGEX = /:::imagem\n([\s\S]*?):::/g;

export interface ContentSegment {
  type: "markdown" | "imagem";
  content?: string;
  image?: ImageBlockParams;
}

function parseBlockParams(paramsStr: string): ImageBlockParams {
  const params: ImageBlockParams & Record<string, string | number> = { src: "" };

  for (const line of paramsStr.trim().split("\n")) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (m) {
      const [, key, value] = m;
      const v = value?.trim().replace(/^["']|["']$/g, "") ?? "";
      params[key] = /^\d+$/.test(v) ? parseInt(v, 10) : v;
    }
  }

  return params as ImageBlockParams;
}

/**
 * Divide o conteúdo em segmentos para renderização (markdown + blocos de imagem)
 */
export function splitContentForPreview(content: string): ContentSegment[] {
  const segments: ContentSegment[] = [];
  let lastIndex = 0;

  for (const match of content.matchAll(BLOCK_REGEX)) {
    // Markdown antes do bloco
    if (match.index! > lastIndex) {
      const mdContent = content.slice(lastIndex, match.index).trim();
      if (mdContent) {
        segments.push({ type: "markdown", content: mdContent });
      }
    }

    // Bloco de imagem
    const imageParams = parseBlockParams(match[1]);
    segments.push({ type: "imagem", image: imageParams });

    lastIndex = match.index! + match[0].length;
  }

  // Markdown restante
  if (lastIndex < content.length) {
    const mdContent = content.slice(lastIndex).trim();
    if (mdContent) {
      segments.push({ type: "markdown", content: mdContent });
    }
  }

  return segments.length > 0 ? segments : [{ type: "markdown", content }];
}

export function getImageSizeClass(size?: ImageBlockParams["size"]): string {
  switch (size) {
    case "small":
      return "w-1/3";
    case "large":
      return "w-full";
    case "medium":
    default:
      return "w-2/3";
  }
}

export function getImagePositionClass(position?: ImageBlockParams["position"]): string {
  switch (position) {
    case "left":
      return "ml-0 mr-auto";
    case "right":
      return "ml-auto mr-0";
    case "center":
    default:
      return "mx-auto";
  }
}
