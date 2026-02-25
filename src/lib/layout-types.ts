import type { ImageBlockParams } from "./types";

export type ElementType =
  | "titulo"
  | "subtitulo"
  | "texto"
  | "imagem"
  | "separador"
  | "tabela";

export type ColumnCount = 1 | 2 | 3 | 4;

export interface LayoutElement {
  id: string;
  type: ElementType;
  content: string;
  imageParams?: ImageBlockParams;
  tableData?: string[][];
}

export interface LayoutColumn {
  id: string;
  elements: LayoutElement[];
}

export interface LayoutRow {
  id: string;
  columnCount: ColumnCount;
  columns: LayoutColumn[];
}

export interface PageLayout {
  rows: LayoutRow[];
}

/* ---- helpers ----------------------------------------------------- */

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

function createColumn(): LayoutColumn {
  return { id: createId("col"), elements: [] };
}

export function createRow(colCount: ColumnCount = 1): LayoutRow {
  return {
    id: createId("row"),
    columnCount: colCount,
    columns: Array.from({ length: colCount }, () => createColumn()),
  };
}

export function createEmptyLayout(): PageLayout {
  return { rows: [] };
}
