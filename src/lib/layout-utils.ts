import type {
  PageLayout,
  LayoutElement,
  SectionType,
  ElementSpan,
} from "./layout-types";
import { rowRemaining, createRow } from "./layout-types";
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
      for (const el of row.elements) {
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

  return out.trimEnd();
}

/* ================================================================== */
/*  Immutable layout helpers                                          */
/* ================================================================== */

function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/* ---- find -------------------------------------------------------- */

export function findElement(
  layout: PageLayout,
  elementId: string
): { sectionIdx: number; rowIdx: number; elementIdx: number } | null {
  for (let si = 0; si < layout.sections.length; si++) {
    const sec = layout.sections[si];
    for (let ri = 0; ri < sec.rows.length; ri++) {
      const ei = sec.rows[ri].elements.findIndex((e) => e.id === elementId);
      if (ei >= 0) return { sectionIdx: si, rowIdx: ri, elementIdx: ei };
    }
  }
  return null;
}

export function findRow(
  layout: PageLayout,
  rowId: string
): { sectionIdx: number; rowIdx: number } | null {
  for (let si = 0; si < layout.sections.length; si++) {
    const ri = layout.sections[si].rows.findIndex((r) => r.id === rowId);
    if (ri >= 0) return { sectionIdx: si, rowIdx: ri };
  }
  return null;
}

/* ---- add element to row ------------------------------------------ */

export function addElementToRow(
  layout: PageLayout,
  rowId: string,
  element: LayoutElement
): PageLayout {
  const next = clone(layout);
  const loc = findRow(next, rowId);
  if (!loc) return layout;

  const row = next.sections[loc.sectionIdx].rows[loc.rowIdx];
  const remaining = rowRemaining(row);
  if (remaining <= 0) return layout;

  const el = { ...element, span: Math.min(element.span, remaining) as ElementSpan };
  row.elements.push(el);
  return next;
}

/* ---- remove element ---------------------------------------------- */

export function removeElement(
  layout: PageLayout,
  elementId: string
): { layout: PageLayout; element: LayoutElement | null } {
  const next = clone(layout);
  const loc = findElement(next, elementId);
  if (!loc) return { layout, element: null };

  const [element] = next.sections[loc.sectionIdx].rows[loc.rowIdx].elements.splice(
    loc.elementIdx,
    1
  );
  return { layout: next, element };
}

/* ---- update element ---------------------------------------------- */

export function updateElement(
  layout: PageLayout,
  elementId: string,
  updated: LayoutElement
): PageLayout {
  const next = clone(layout);
  const loc = findElement(next, elementId);
  if (!loc) return layout;
  next.sections[loc.sectionIdx].rows[loc.rowIdx].elements[loc.elementIdx] =
    updated;
  return next;
}

/* ---- resize element ---------------------------------------------- */

export function resizeElement(
  layout: PageLayout,
  elementId: string,
  newSpan: ElementSpan
): PageLayout {
  const next = clone(layout);
  const loc = findElement(next, elementId);
  if (!loc) return layout;

  const row = next.sections[loc.sectionIdx].rows[loc.rowIdx];
  const el = row.elements[loc.elementIdx];
  const othersSpan = rowRemaining(row) + el.span;
  if (newSpan > othersSpan) return layout;

  el.span = newSpan;
  return next;
}

/* ---- move element between rows ----------------------------------- */

export function moveElementToRow(
  layout: PageLayout,
  elementId: string,
  targetRowId: string
): PageLayout {
  const { layout: withoutEl, element } = removeElement(layout, elementId);
  if (!element) return layout;
  return addElementToRow(withoutEl, targetRowId, element);
}

/* ---- row management ---------------------------------------------- */

export function addRow(
  layout: PageLayout,
  sectionType: SectionType
): PageLayout {
  const next = clone(layout);
  const sec = next.sections.find((s) => s.type === sectionType);
  if (sec) sec.rows.push(createRow());
  return next;
}

export function removeRow(
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

/* ---- reorder within row ------------------------------------------ */

export function moveElementInRow(
  layout: PageLayout,
  elementId: string,
  direction: "left" | "right"
): PageLayout {
  const next = clone(layout);
  const loc = findElement(next, elementId);
  if (!loc) return layout;

  const els = next.sections[loc.sectionIdx].rows[loc.rowIdx].elements;
  const idx = loc.elementIdx;
  const swapIdx = direction === "left" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= els.length) return layout;

  [els[idx], els[swapIdx]] = [els[swapIdx], els[idx]];
  return next;
}
