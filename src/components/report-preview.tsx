"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  splitContentForPreview,
  getImageSizeClass,
  getImagePositionClass,
} from "@/lib/render-utils";
import type { ReportFrontMatter } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface ReportPreviewProps {
  frontMatter: ReportFrontMatter;
  content: string;
  className?: string;
}

export function ReportPreview({ frontMatter, content, className }: ReportPreviewProps) {
  const segments = splitContentForPreview(content);

  return (
    <Card className={className}>
      <div className="min-h-[297mm] w-[210mm] bg-white p-8 rounded-2xl print:shadow-none print:p-8" style={{ aspectRatio: "210/297" }}>
        {/* Cabeçalho - Front Matter */}
        {(frontMatter.titulo || frontMatter.medico || frontMatter.data) && (
          <>
            <div className="mb-6 space-y-1 border-b border-border/60 pb-4">
              {frontMatter.titulo && (
                <h1 className="text-xl font-bold text-gray-900">{frontMatter.titulo}</h1>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                {frontMatter.paciente_id && (
                  <span>Paciente: {frontMatter.paciente_id}</span>
                )}
                {frontMatter.data && <span>Data: {frontMatter.data}</span>}
                {frontMatter.medico && <span>Médico: {frontMatter.medico}</span>}
                {frontMatter.tipo && <span>Tipo: {frontMatter.tipo}</span>}
              </div>
            </div>
            <Separator className="mb-6" />
          </>
        )}

        <CardContent className="p-0 space-y-6">
          {segments.map((segment, i) => {
            if (segment.type === "markdown" && segment.content) {
              return (
                <div
                  key={i}
                  className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700"
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {segment.content}
                  </ReactMarkdown>
                </div>
              );
            }

            if (segment.type === "imagem" && segment.image) {
              const sizeClass = getImageSizeClass(segment.image.size);
              const positionClass = getImagePositionClass(segment.image.position);

              return (
                <div key={i} className={`flex ${positionClass}`}>
                  <div className={`${sizeClass} min-w-0`}>
                    <figure className="space-y-2">
                      <div className="relative overflow-hidden rounded-xl border border-border/80 bg-muted/30 aspect-video">
                        {segment.image.src ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={segment.image.src}
                            alt={segment.image.alt ?? "Imagem do exame"}
                            className="h-full w-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-gray-400 text-sm">
                            Imagem não carregada
                          </div>
                        )}
                      </div>
                      {segment.image.legenda && (
                        <figcaption className="text-center text-sm text-gray-600 italic">
                          {segment.image.legenda}
                        </figcaption>
                      )}
                    </figure>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </CardContent>
      </div>
    </Card>
  );
}
