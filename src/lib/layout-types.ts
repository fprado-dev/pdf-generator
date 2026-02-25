import type { ImageBlockParams } from "./types";

export type ElementType =
  | "titulo"
  | "subtitulo"
  | "texto"
  | "imagem"
  | "separador"
  | "tabela";

export type ColumnCount = 1 | 2 | 3 | 4;
export type TextAlign = "left" | "center" | "right";
export type ImageWidth = 25 | 33 | 50 | 66 | 75 | 100;

export interface LayoutElement {
  id: string;
  type: ElementType;
  content: string;
  align?: TextAlign;
  imageWidth?: ImageWidth;
  imageParams?: ImageBlockParams;
  tableData?: string[][];
}

export interface LayoutColumn {
  id: string;
  /** Relative width weight (default 1). For a row with two columns of
   *  weights [1, 2], the first column is 1/3 and the second is 2/3. */
  weight: number;
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
  const base: LayoutElement = { id, type, content: "", align: "left" };

  if (type === "titulo" || type === "subtitulo") {
    base.align = "left";
  }

  if (type === "imagem") {
    base.imageParams = {
      src: "",
      alt: "",
      legenda: "",
      position: "center",
      size: "medium",
    };
    base.imageWidth = 100;
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

function createColumn(weight = 1): LayoutColumn {
  return { id: createId("col"), weight, elements: [] };
}

export function createRow(colCount: ColumnCount = 1): LayoutRow {
  return {
    id: createId("row"),
    columnCount: colCount,
    columns: Array.from({ length: colCount }, () => createColumn(1)),
  };
}

export function createEmptyLayout(): PageLayout {
  return { rows: [] };
}
