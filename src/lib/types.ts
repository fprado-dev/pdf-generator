/**
 * Tipos para o sistema de geração de relatórios em Markdown
 */

export interface ReportFrontMatter {
  titulo?: string;
  paciente_id?: string;
  data?: string;
  medico?: string;
  tipo?: "consulta" | "retorno" | "emergencia" | "exame";
  [key: string]: string | undefined;
}

export type ImagePosition = "left" | "center" | "right";
export type ImageSize = "small" | "medium" | "large";

export interface ImageBlockParams {
  src: string;
  alt?: string;
  legenda?: string;
  position?: ImagePosition;
  size?: ImageSize;
  order?: number;
}

export type BlockType = "imagem" | "secao";

export interface ReportBlock {
  type: BlockType;
  params: ImageBlockParams | Record<string, string>;
  rawContent?: string;
}

export interface ParsedReport {
  frontMatter: ReportFrontMatter;
  content: string;
  blocks: ReportBlock[];
}

export interface ReportStructure {
  frontMatter: ReportFrontMatter;
  sections: Array<{
    type: "markdown" | "imagem";
    content?: string;
    image?: ImageBlockParams;
  }>;
}
