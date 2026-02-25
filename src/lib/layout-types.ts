import type { ImageBlockParams } from "./types";

export type ElementType =
  | "titulo"
  | "subtitulo"
  | "texto"
  | "imagem"
  | "separador"
  | "tabela";

export type SpanSize = 1 | 2 | 3 | 4;

export interface LayoutElement {
  id: string;
  type: ElementType;
  content: string;
  imageParams?: ImageBlockParams;
  tableData?: string[][];
}

export interface LayoutColumn {
  id: string;
  span: SpanSize;
  elements: LayoutElement[];
}

export interface LayoutRow {
  id: string;
  columns: LayoutColumn[];
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

/* ---- id helper --------------------------------------------------- */

let _seq = 0;
function uid(): string {
  return `${Date.now().toString(36)}${(++_seq).toString(36)}`;
}
export function createId(prefix: string): string {
  return `${prefix}_${uid()}`;
}

/* ---- factories --------------------------------------------------- */

export function createElement(type: ElementType): LayoutElement {
  const id = createId("el");
  const base: LayoutElement = { id, type, content: "" };

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

export function createColumn(span: SpanSize): LayoutColumn {
  return { id: createId("col"), span, elements: [] };
}

export function createRow(spans: SpanSize[]): LayoutRow {
  return {
    id: createId("row"),
    columns: spans.map((s) => createColumn(s)),
  };
}

export function createDefaultLayout(): PageLayout {
  return {
    sections: [
      { type: "topo", label: "Topo", rows: [createRow([4])] },
      { type: "corpo", label: "Corpo", rows: [createRow([4])] },
      { type: "rodape", label: "Rodapé", rows: [createRow([4])] },
    ],
  };
}

/* ---- column presets ---------------------------------------------- */

export interface ColumnPreset {
  label: string;
  spans: SpanSize[];
}

export const COLUMN_PRESETS: ColumnPreset[] = [
  { label: "2 colunas", spans: [2, 2] },
  { label: "⅓ + ⅔", spans: [1, 3] },
  { label: "⅔ + ⅓", spans: [3, 1] },
  { label: "3 colunas", spans: [1, 1, 2] },
  { label: "4 colunas", spans: [1, 1, 1, 1] },
];
