"use client";

import { useState, useCallback } from "react";
import { parseMarkdown, extractImageBlocks } from "@/lib/parser";
import { ReportPreview } from "@/components/report-preview";
import { ImageControlsPanel } from "@/components/image-controls-panel";
import { ImageDropZone } from "@/components/image-drop-zone";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, FileText } from "lucide-react";

const DEFAULT_TEMPLATE = `---
titulo: Relatório - Consulta Pediátrica
paciente_id: REF-2024-001
data: 2024-02-25
medico: Dr(a). Nome do Médico
tipo: consulta
---

# Relatório de Consulta

## Identificação

Paciente em acompanhamento pediátrico.

## Queixa / Motivo da Consulta

[Descreva o motivo da consulta]

## História Clínica

[Anamnese]

## Exame Físico

[Achados do exame]

## Exames Complementares

Para incluir imagens (ultrassom, raio-X, etc.), use o bloco:

:::imagem
src: /caminho/para/imagem.png
alt: Descrição da imagem
legenda: Fig. 1 - Legenda
position: center
size: medium
order: 1
:::

## Conclusão

[Diagnóstico e considerações]

## Conduta

[Recomendações e orientações]
`;

export default function Home() {
  const [markdown, setMarkdown] = useState(DEFAULT_TEMPLATE);

  const parsed = parseMarkdown(markdown);
  const images = extractImageBlocks(parsed);

  const handleExportMd = useCallback(() => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-${parsed.frontMatter.data ?? "sem-data"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [markdown, parsed.frontMatter.data]);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">PDF Generator</h1>
          <Button onClick={handleExportMd} size="sm">
            <Download className="size-4 mr-2" />
            Exportar .md
          </Button>
        </div>
      </header>

      <main className="p-4">
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            <Tabs defaultValue="editor">
              <TabsList>
                <TabsTrigger value="editor">Editor</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="editor" className="mt-4">
                <ImageDropZone
                  markdown={markdown}
                  onMarkdownChange={setMarkdown}
                  className="min-h-[300px]"
                >
                  <Card>
                    <CardHeader>
                      <span className="text-sm font-medium flex items-center gap-2">
                        <FileText className="size-4" />
                        Markdown
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        Arraste imagens aqui ou cole (Ctrl+V) para adicionar
                      </p>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={markdown}
                        onChange={(e) => setMarkdown(e.target.value)}
                        placeholder="Digite ou cole seu relatório em Markdown..."
                        className="min-h-[500px] font-mono text-sm"
                      />
                    </CardContent>
                  </Card>
                </ImageDropZone>
              </TabsContent>

              <TabsContent value="preview" className="mt-4">
                <ScrollArea className="h-[calc(100vh-220px)]">
                  <div className="flex justify-center p-4">
                    <ReportPreview
                      frontMatter={parsed.frontMatter}
                      content={parsed.content}
                    />
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:order-last">
            <div className="sticky top-4 space-y-4">
              <ImageControlsPanel
                images={images}
                markdown={markdown}
                onMarkdownChange={setMarkdown}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
