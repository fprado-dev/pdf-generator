import type { ImageBlockParams } from "./types";

export type ElementType =
  | "titulo"
  | "subtitulo"
  | "texto"
  | "imagem"
  | "separador"
  | "tabela";

export type ElementSpan = 1 | 2 | 3 | 4;

export interface LayoutElement {
  id: string;
  type: ElementType;
  content: string;
  span: ElementSpan;
  imageParams?: ImageBlockParams;
  tableData?: string[][];
}

export interface LayoutRow {
  id: string;
  elements: LayoutElement[];
}

export type SectionType = "topo" | "corpo" | "rodape";

export interface LayoutSection {
  type: SectionType;
  label: string;
  rows: LayoutRow[];
}

export interface PageLayout {
  sections: LayoutSection[];
}

/* ---- helpers ----------------------------------------------------- */

let _seq = 0;
function uid(): string {
  return `${Date.now().toString(36)}${(++_seq).toString(36)}`;
}
export function createId(prefix: string): string {
  return `${prefix}_${uid()}`;
}

export function rowUsed(row: LayoutRow): number {
  return row.elements.reduce((s, e) => s + e.span, 0);
}
export function rowRemaining(row: LayoutRow): number {
  return Math.max(0, 4 - rowUsed(row));
}

/* ---- default spans per type -------------------------------------- */

const DEFAULT_SPAN: Record<ElementType, ElementSpan> = {
  titulo: 4,
  subtitulo: 4,
  texto: 2,
  imagem: 1,
  separador: 4,
  tabela: 2,
};

/* ---- factory ----------------------------------------------------- */

export function createElement(type: ElementType, maxSpan?: number): LayoutElement {
  const id = createId("el");
  const span = Math.min(DEFAULT_SPAN[type], maxSpan ?? 4) as ElementSpan;

  const base: LayoutElement = { id, type, content: "", span };

  if (type === "imagem") {
    base.imageParams = {
      src: "",
      alt: "",
      legenda: "",
      position: "center",
      size: "medium",
    };
  }

  if (type === "tabela") {
    base.tableData = [
      ["Coluna 1", "Coluna 2"],
      ["", ""],
      ["", ""],
    ];
  }

  return base;
}

export function createRow(): LayoutRow {
  return { id: createId("row"), elements: [] };
}

export function createDefaultLayout(): PageLayout {
  return {
    sections: [
      { type: "topo", label: "Topo", rows: [createRow()] },
      { type: "corpo", label: "Corpo", rows: [createRow()] },
      { type: "rodape", label: "Rodapé", rows: [createRow()] },
    ],
  };
}
