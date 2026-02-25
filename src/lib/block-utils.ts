import type { EditorBlock } from "./block-types";
import type { ReportFrontMatter } from "./types";
import { generateBlockId } from "./block-types";

export function blocksToMarkdown(
  frontMatter: ReportFrontMatter,
  blocks: EditorBlock[]
): string {
  let output = "";

  const fmEntries = Object.entries(frontMatter).filter(
    ([, v]) => v !== undefined && v !== ""
  );
  if (fmEntries.length > 0) {
    output += "---\n";
    for (const [key, value] of fmEntries) {
      output += `${key}: ${value}\n`;
    }
    output += "---\n\n";
  }

  let imageOrder = 1;
  for (const block of blocks) {
    switch (block.type) {
      case "heading": {
        const prefix = "#".repeat(block.level ?? 2);
        if (block.content) output += `${prefix} ${block.content}\n\n`;
        break;
      }
      case "paragraph":
        if (block.content) output += `${block.content}\n\n`;
        break;
      case "image":
        if (block.imageParams) {
          const img = { ...block.imageParams, order: imageOrder++ };
          const lines: string[] = [];
          if (img.src) lines.push(`src: ${img.src}`);
          if (img.alt) lines.push(`alt: ${img.alt}`);
          if (img.legenda) lines.push(`legenda: ${img.legenda}`);
          if (img.position) lines.push(`position: ${img.position}`);
          if (img.size) lines.push(`size: ${img.size}`);
          lines.push(`order: ${img.order}`);
          output += `:::imagem\n${lines.join("\n")}\n:::\n\n`;
        }
        break;
    }
  }

  return output.trimEnd();
}

function parseFrontMatterYaml(yaml: string): ReportFrontMatter {
  const result: ReportFrontMatter = {};
  for (const line of yaml.trim().split("\n")) {
    const match = line.match(/^(\w[\w_]*):\s*(.*)$/);
    if (match) {
      result[match[1]] = match[2]?.trim().replace(/^["']|["']$/g, "") ?? "";
    }
  }
  return result;
}

function parseImageParams(
  paramsStr: string
): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  for (const line of paramsStr.trim().split("\n")) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (m) {
      const v = m[2]?.trim().replace(/^["']|["']$/g, "") ?? "";
      params[m[1]] = /^\d+$/.test(v) ? parseInt(v, 10) : v;
    }
  }
  return params;
}

export function markdownToBlocks(markdown: string): {
  frontMatter: ReportFrontMatter;
  blocks: EditorBlock[];
} {
  let content = markdown;
  let frontMatter: ReportFrontMatter = {};
  const blocks: EditorBlock[] = [];

  const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (fmMatch) {
    frontMatter = parseFrontMatterYaml(fmMatch[1]);
    content = content.slice(fmMatch[0].length);
  }

  const lines = content.split("\n");
  let i = 0;
  let paragraphLines: string[] = [];

  const flushParagraph = () => {
    const text = paragraphLines.join("\n").trim();
    if (text) {
      blocks.push({ id: generateBlockId(), type: "paragraph", content: text });
    }
    paragraphLines = [];
  };

  while (i < lines.length) {
    const line = lines[i];

    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      blocks.push({
        id: generateBlockId(),
        type: "heading",
        content: headingMatch[2],
        level: headingMatch[1].length as 1 | 2 | 3,
      });
      i++;
      continue;
    }

    if (line.trim() === ":::imagem") {
      flushParagraph();
      const blockLines: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ":::") {
        blockLines.push(lines[i]);
        i++;
      }
      i++;
      const imgParams = parseImageParams(blockLines.join("\n"));
      blocks.push({
        id: generateBlockId(),
        type: "image",
        content: "",
        imageParams: {
          src: (imgParams.src as string) ?? "",
          alt: (imgParams.alt as string) ?? "",
          legenda: (imgParams.legenda as string) ?? "",
          position: (imgParams.position as "left" | "center" | "right") ?? "center",
          size: (imgParams.size as "small" | "medium" | "large") ?? "medium",
          order: typeof imgParams.order === "number" ? imgParams.order : undefined,
        },
      });
      continue;
    }

    paragraphLines.push(line);
    i++;
  }

  flushParagraph();
  return { frontMatter, blocks };
}
