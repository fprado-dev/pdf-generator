import type { ImageBlockParams } from "./types";

export type ElementType = "titulo" | "subtitulo" | "texto" | "imagem";

export interface LayoutElement {
  id: string;
  type: ElementType;
  content: string;
  imageParams?: ImageBlockParams;
}

export interface LayoutColumn {
  id: string;
  span: number; // 1–12 grid units
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

/* ---- id helpers -------------------------------------------------- */

let _seq = 0;
function uid(): string {
  return `${Date.now().toString(36)}-${(++_seq).toString(36)}`;
}

export function createId(prefix: string): string {
  return `${prefix}_${uid()}`;
}

/* ---- factory functions ------------------------------------------- */

export function createElement(type: ElementType): LayoutElement {
  const id = createId("el");
  switch (type) {
    case "titulo":
      return { id, type, content: "" };
    case "subtitulo":
      return { id, type, content: "" };
    case "texto":
      return { id, type, content: "" };
    case "imagem":
      return {
        id,
        type,
        content: "",
        imageParams: {
          src: "",
          alt: "",
          legenda: "",
          position: "center",
          size: "medium",
        },
      };
  }
}

export function createRow(colSpans: number[]): LayoutRow {
  return {
    id: createId("row"),
    columns: colSpans.map((span) => ({
      id: createId("col"),
      span,
      elements: [],
    })),
  };
}

export function createDefaultLayout(): PageLayout {
  return {
    sections: [
      { type: "topo", label: "Topo", rows: [createRow([12])] },
      { type: "corpo", label: "Corpo", rows: [createRow([12])] },
      { type: "rodape", label: "Rodapé", rows: [createRow([12])] },
    ],
  };
}

/* ---- row presets ------------------------------------------------- */

export interface RowPreset {
  label: string;
  spans: number[];
}

export const ROW_PRESETS: RowPreset[] = [
  { label: "1 coluna", spans: [12] },
  { label: "2 colunas", spans: [6, 6] },
  { label: "⅓ + ⅔", spans: [4, 8] },
  { label: "⅔ + ⅓", spans: [8, 4] },
  { label: "3 colunas", spans: [4, 4, 4] },
];
