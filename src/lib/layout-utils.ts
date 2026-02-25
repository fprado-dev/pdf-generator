import type {
  PageLayout,
  LayoutElement,
  SectionType,
} from "./layout-types";
import type { ReportFrontMatter } from "./types";

/* ---- markdown generation ----------------------------------------- */

export function layoutToMarkdown(
  frontMatter: ReportFrontMatter,
  layout: PageLayout
): string {
  let out = "";

  const fmEntries = Object.entries(frontMatter).filter(
    ([, v]) => v !== undefined && v !== ""
  );
  if (fmEntries.length > 0) {
    out += "---\n";
    for (const [k, v] of fmEntries) out += `${k}: ${v}\n`;
    out += "---\n\n";
  }

  let imgOrder = 1;

  for (const section of layout.sections) {
    for (const row of section.rows) {
      for (const col of row.columns) {
        for (const el of col.elements) {
          switch (el.type) {
            case "titulo":
              if (el.content) out += `# ${el.content}\n\n`;
              break;
            case "subtitulo":
              if (el.content) out += `## ${el.content}\n\n`;
              break;
            case "texto":
              if (el.content) out += `${el.content}\n\n`;
              break;
            case "imagem":
              if (el.imageParams) {
                const img = { ...el.imageParams, order: imgOrder++ };
                const lines: string[] = [];
                if (img.src) lines.push(`src: ${img.src}`);
                if (img.alt) lines.push(`alt: ${img.alt}`);
                if (img.legenda) lines.push(`legenda: ${img.legenda}`);
                if (img.position) lines.push(`position: ${img.position}`);
                if (img.size) lines.push(`size: ${img.size}`);
                lines.push(`order: ${img.order}`);
                out += `:::imagem\n${lines.join("\n")}\n:::\n\n`;
              }
              break;
          }
        }
      }
    }
  }

  return out.trimEnd();
}

/* ---- lookup helpers ---------------------------------------------- */

export interface ElementLocation {
  sectionIdx: number;
  rowIdx: number;
  colIdx: number;
  elementIdx: number;
}

export function findElementLocation(
  layout: PageLayout,
  elementId: string
): ElementLocation | null {
  for (let si = 0; si < layout.sections.length; si++) {
    const sec = layout.sections[si];
    for (let ri = 0; ri < sec.rows.length; ri++) {
      const row = sec.rows[ri];
      for (let ci = 0; ci < row.columns.length; ci++) {
        const col = row.columns[ci];
        const ei = col.elements.findIndex((e) => e.id === elementId);
        if (ei >= 0)
          return { sectionIdx: si, rowIdx: ri, colIdx: ci, elementIdx: ei };
      }
    }
  }
  return null;
}

export function findColumnLocation(
  layout: PageLayout,
  columnId: string
): { sectionIdx: number; rowIdx: number; colIdx: number } | null {
  for (let si = 0; si < layout.sections.length; si++) {
    const sec = layout.sections[si];
    for (let ri = 0; ri < sec.rows.length; ri++) {
      const ci = sec.rows[ri].columns.findIndex((c) => c.id === columnId);
      if (ci >= 0) return { sectionIdx: si, rowIdx: ri, colIdx: ci };
    }
  }
  return null;
}

/* ---- immutable layout mutations ---------------------------------- */

function cloneLayout(layout: PageLayout): PageLayout {
  return JSON.parse(JSON.stringify(layout));
}

export function addElementToColumn(
  layout: PageLayout,
  columnId: string,
  element: LayoutElement,
  afterElementId?: string
): PageLayout {
  const next = cloneLayout(layout);
  const loc = findColumnLocation(next, columnId);
  if (!loc) return layout;

  const col = next.sections[loc.sectionIdx].rows[loc.rowIdx].columns[loc.colIdx];

  if (afterElementId) {
    const idx = col.elements.findIndex((e) => e.id === afterElementId);
    col.elements.splice(idx + 1, 0, element);
  } else {
    col.elements.push(element);
  }

  return next;
}

export function removeElement(
  layout: PageLayout,
  elementId: string
): { layout: PageLayout; element: LayoutElement | null } {
  const next = cloneLayout(layout);
  const loc = findElementLocation(next, elementId);
  if (!loc) return { layout, element: null };

  const col =
    next.sections[loc.sectionIdx].rows[loc.rowIdx].columns[loc.colIdx];
  const [element] = col.elements.splice(loc.elementIdx, 1);
  return { layout: next, element };
}

export function updateElement(
  layout: PageLayout,
  elementId: string,
  updated: LayoutElement
): PageLayout {
  const next = cloneLayout(layout);
  const loc = findElementLocation(next, elementId);
  if (!loc) return layout;

  next.sections[loc.sectionIdx].rows[loc.rowIdx].columns[loc.colIdx].elements[
    loc.elementIdx
  ] = updated;
  return next;
}

export function reorderInColumn(
  layout: PageLayout,
  columnId: string,
  fromId: string,
  toId: string
): PageLayout {
  const next = cloneLayout(layout);
  const loc = findColumnLocation(next, columnId);
  if (!loc) return layout;

  const col = next.sections[loc.sectionIdx].rows[loc.rowIdx].columns[loc.colIdx];
  const fromIdx = col.elements.findIndex((e) => e.id === fromId);
  const toIdx = col.elements.findIndex((e) => e.id === toId);
  if (fromIdx < 0 || toIdx < 0) return layout;

  const [el] = col.elements.splice(fromIdx, 1);
  col.elements.splice(toIdx, 0, el);
  return next;
}

export function addRowToSection(
  layout: PageLayout,
  sectionType: SectionType,
  row: import("./layout-types").LayoutRow
): PageLayout {
  const next = cloneLayout(layout);
  const sec = next.sections.find((s) => s.type === sectionType);
  if (sec) sec.rows.push(row);
  return next;
}

export function removeRow(
  layout: PageLayout,
  rowId: string
): PageLayout {
  const next = cloneLayout(layout);
  for (const sec of next.sections) {
    const idx = sec.rows.findIndex((r) => r.id === rowId);
    if (idx >= 0 && sec.rows.length > 1) {
      sec.rows.splice(idx, 1);
      return next;
    }
  }
  return layout;
}
