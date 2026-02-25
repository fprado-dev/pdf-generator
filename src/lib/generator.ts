/**
 * Gerador de Markdown estruturado a partir de dados estruturados
 */

import type {
  ReportFrontMatter,
  ReportStructure,
  ImageBlockParams,
} from "./types";

function escapeYamlValue(value: string): string {
  if (value.includes(":") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  return value;
}

export function generateFrontMatter(fm: ReportFrontMatter): string {
  const lines = Object.entries(fm)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `  ${k}: ${escapeYamlValue(String(v))}`);

  if (lines.length === 0) return "";

  return `---\n${lines.join("\n")}\n---\n\n`;
}

export function generateImageBlock(img: ImageBlockParams): string {
  const lines = [
    `src: ${img.src}`,
    img.alt ? `alt: ${escapeYamlValue(img.alt)}` : null,
    img.legenda ? `legenda: ${escapeYamlValue(img.legenda)}` : null,
    img.position ? `position: ${img.position}` : null,
    img.size ? `size: ${img.size}` : null,
    img.order !== undefined ? `order: ${img.order}` : null,
  ].filter(Boolean);

  return `:::imagem\n${lines.join("\n")}\n:::\n\n`;
}

export function generateMarkdown(structure: ReportStructure): string {
  let output = generateFrontMatter(structure.frontMatter);

  for (const section of structure.sections) {
    if (section.type === "markdown" && section.content) {
      output += section.content;
      if (!section.content.endsWith("\n\n")) {
        output += "\n\n";
      }
    } else if (section.type === "imagem" && section.image) {
      output += generateImageBlock(section.image);
    }
  }

  return output.trimEnd();
}
