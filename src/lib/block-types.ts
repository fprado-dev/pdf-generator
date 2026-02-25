import type { ImageBlockParams } from "./types";

export type EditorBlockType = "heading" | "paragraph" | "image";

export interface EditorBlock {
  id: string;
  type: EditorBlockType;
  content: string;
  level?: 1 | 2 | 3;
  imageParams?: ImageBlockParams;
}

let blockCounter = 0;

export function generateBlockId(): string {
  return `blk-${Date.now()}-${++blockCounter}`;
}

export function createBlock(type: EditorBlockType): EditorBlock {
  const id = generateBlockId();
  switch (type) {
    case "heading":
      return { id, type, content: "", level: 2 };
    case "paragraph":
      return { id, type, content: "" };
    case "image":
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
