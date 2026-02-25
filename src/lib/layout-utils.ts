import type {
  PageLayout,
  LayoutElement,
  SectionType,
  SpanSize,
} from "./layout-types";
import { createRow } from "./layout-types";
import type { ReportFrontMatter } from "./types";

/* ================================================================== */
/*  Markdown generation                                               */
/* ================================================================== */

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
            case "separador":
              out += "---\n\n";
              break;
            case "tabela":
              if (el.tableData && el.tableData.length > 0) {
                const hdr = el.tableData[0];
                out += `| ${hdr.join(" | ")} |\n`;
                out += `| ${hdr.map(() => "---").join(" | ")} |\n`;
                for (let r = 1; r < el.tableData.length; r++) {
                  out += `| ${el.tableData[r].join(" | ")} |\n`;
                }
                out += "\n";
              }
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

/* ================================================================== */
/*  Immutable helpers                                                 */
/* ================================================================== */

function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/* ---- lookups ----------------------------------------------------- */

export function findColumn(
  layout: PageLayout,
  columnId: string
): { si: number; ri: number; ci: number } | null {
  for (let si = 0; si < layout.sections.length; si++)
    for (let ri = 0; ri < layout.sections[si].rows.length; ri++) {
      const ci = layout.sections[si].rows[ri].columns.findIndex(
        (c) => c.id === columnId
      );
      if (ci >= 0) return { si, ri, ci };
    }
  return null;
}

export function findElement(
  layout: PageLayout,
  elementId: string
): { si: number; ri: number; ci: number; ei: number } | null {
  for (let si = 0; si < layout.sections.length; si++)
    for (let ri = 0; ri < layout.sections[si].rows.length; ri++)
      for (
        let ci = 0;
        ci < layout.sections[si].rows[ri].columns.length;
        ci++
      ) {
        const ei = layout.sections[si].rows[ri].columns[ci].elements.findIndex(
          (e) => e.id === elementId
        );
        if (ei >= 0) return { si, ri, ci, ei };
      }
  return null;
}

/* ---- element → column mapping ------------------------------------ */

export function buildElementToColumn(
  layout: PageLayout
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const sec of layout.sections)
    for (const row of sec.rows)
      for (const col of row.columns)
        for (const el of col.elements) map[el.id] = col.id;
  return map;
}

export function buildAllElements(
  layout: PageLayout
): Record<string, LayoutElement> {
  const map: Record<string, LayoutElement> = {};
  for (const sec of layout.sections)
    for (const row of sec.rows)
      for (const col of row.columns)
        for (const el of col.elements) map[el.id] = el;
  return map;
}

export function buildColumnIds(layout: PageLayout): Set<string> {
  const set = new Set<string>();
  for (const sec of layout.sections)
    for (const row of sec.rows) for (const col of row.columns) set.add(col.id);
  return set;
}

/* ---- mutations --------------------------------------------------- */

export function addElementToColumn(
  layout: PageLayout,
  columnId: string,
  element: LayoutElement
): PageLayout {
  const next = clone(layout);
  const loc = findColumn(next, columnId);
  if (!loc) return layout;
  next.sections[loc.si].rows[loc.ri].columns[loc.ci].elements.push(element);
  return next;
}

export function removeElementById(
  layout: PageLayout,
  elementId: string
): { layout: PageLayout; element: LayoutElement | null } {
  const next = clone(layout);
  const loc = findElement(next, elementId);
  if (!loc) return { layout, element: null };
  const [element] = next.sections[loc.si].rows[loc.ri].columns[
    loc.ci
  ].elements.splice(loc.ei, 1);
  return { layout: next, element };
}

export function updateElementById(
  layout: PageLayout,
  elementId: string,
  updated: LayoutElement
): PageLayout {
  const next = clone(layout);
  const loc = findElement(next, elementId);
  if (!loc) return layout;
  next.sections[loc.si].rows[loc.ri].columns[loc.ci].elements[loc.ei] =
    updated;
  return next;
}

export function reorderInColumn(
  layout: PageLayout,
  columnId: string,
  fromId: string,
  toId: string
): PageLayout {
  const next = clone(layout);
  const loc = findColumn(next, columnId);
  if (!loc) return layout;
  const els = next.sections[loc.si].rows[loc.ri].columns[loc.ci].elements;
  const fi = els.findIndex((e) => e.id === fromId);
  const ti = els.findIndex((e) => e.id === toId);
  if (fi < 0 || ti < 0) return layout;
  const [el] = els.splice(fi, 1);
  els.splice(ti, 0, el);
  return next;
}

export function moveElementToColumn(
  layout: PageLayout,
  elementId: string,
  targetColumnId: string
): PageLayout {
  const { layout: without, element } = removeElementById(layout, elementId);
  if (!element) return layout;
  return addElementToColumn(without, targetColumnId, element);
}

/* ---- row / section management ------------------------------------ */

export function addRowToSection(
  layout: PageLayout,
  sectionType: SectionType,
  spans: SpanSize[]
): PageLayout {
  const next = clone(layout);
  const sec = next.sections.find((s) => s.type === sectionType);
  if (sec) sec.rows.push(createRow(spans));
  return next;
}

export function removeRowById(
  layout: PageLayout,
  rowId: string
): PageLayout {
  const next = clone(layout);
  for (const sec of next.sections) {
    const idx = sec.rows.findIndex((r) => r.id === rowId);
    if (idx >= 0 && sec.rows.length > 1) {
      sec.rows.splice(idx, 1);
      return next;
    }
  }
  return layout;
}
