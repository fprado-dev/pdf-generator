"use client";

import { useState, useCallback, useMemo } from "react";
import { BlockEditor } from "@/components/block-editor";
import { ReportPreview } from "@/components/report-preview";
import { blocksToMarkdown, markdownToBlocks } from "@/lib/block-utils";
import type { EditorBlock } from "@/lib/block-types";
import type { ReportFrontMatter } from "@/lib/types";
import { parseMarkdown } from "@/lib/parser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileText, ChevronDown, ChevronUp } from "lucide-react";

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

const initial = markdownToBlocks(DEFAULT_TEMPLATE);

export default function Home() {
  const [blocks, setBlocks] = useState<EditorBlock[]>(initial.blocks);
  const [frontMatter, setFrontMatter] = useState<ReportFrontMatter>(
    initial.frontMatter
  );
  const [metadataOpen, setMetadataOpen] = useState(false);

  const markdown = useMemo(
    () => blocksToMarkdown(frontMatter, blocks),
    [frontMatter, blocks]
  );

  const parsed = useMemo(() => parseMarkdown(markdown), [markdown]);

  const handleExportMd = useCallback(() => {
    const blob = new Blob([markdown], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-${frontMatter.data ?? "sem-data"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [markdown, frontMatter.data]);

  const updateFM = useCallback(
    (key: string, value: string) => {
      setFrontMatter((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  return (
    <div className="min-h-screen bg-muted/50">
      <header className="border-b bg-background/95 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-medium tracking-tight">PDF Generator</h1>
          <Button onClick={handleExportMd} size="sm" variant="outline">
            <Download className="size-4 mr-2" />
            Exportar .md
          </Button>
        </div>
      </header>

      <main className="p-4">
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            <Tabs defaultValue="blocos">
              <TabsList className="rounded-xl bg-muted/70 p-1">
                <TabsTrigger value="blocos">Blocos</TabsTrigger>
                <TabsTrigger value="markdown">Markdown</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="blocos" className="mt-4">
                <BlockEditor blocks={blocks} onBlocksChange={setBlocks} />
              </TabsContent>

              <TabsContent value="markdown" className="mt-4">
                <Card>
                  <CardHeader>
                    <span className="text-sm font-medium flex items-center gap-2">
                      <FileText className="size-4" />
                      Markdown gerado
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      Gerado automaticamente a partir dos blocos
                    </p>
                  </CardHeader>
                  <CardContent>
                    <pre className="whitespace-pre-wrap text-sm font-mono bg-muted/30 p-4 rounded-lg border border-border/60 max-h-[600px] overflow-auto">
                      {markdown}
                    </pre>
                  </CardContent>
                </Card>
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

          {/* Sidebar – Metadata */}
          <div className="lg:order-last">
            <div className="sticky top-4">
              <Card>
                <CardHeader
                  className="cursor-pointer select-none"
                  onClick={() => setMetadataOpen((v) => !v)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Metadados</span>
                    {metadataOpen ? (
                      <ChevronUp className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    )}
                  </div>
                  {!metadataOpen && frontMatter.titulo && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {frontMatter.titulo}
                    </p>
                  )}
                </CardHeader>
                {metadataOpen && (
                  <CardContent className="space-y-3 pt-0">
                    <div className="space-y-1">
                      <Label className="text-xs">Título</Label>
                      <Input
                        value={frontMatter.titulo ?? ""}
                        onChange={(e) => updateFM("titulo", e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Paciente ID</Label>
                      <Input
                        value={frontMatter.paciente_id ?? ""}
                        onChange={(e) =>
                          updateFM("paciente_id", e.target.value)
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Data</Label>
                      <Input
                        type="date"
                        value={frontMatter.data ?? ""}
                        onChange={(e) => updateFM("data", e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Médico</Label>
                      <Input
                        value={frontMatter.medico ?? ""}
                        onChange={(e) => updateFM("medico", e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Tipo</Label>
                      <Select
                        value={frontMatter.tipo ?? "consulta"}
                        onValueChange={(v) => updateFM("tipo", v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="consulta">Consulta</SelectItem>
                          <SelectItem value="retorno">Retorno</SelectItem>
                          <SelectItem value="emergencia">Emergência</SelectItem>
                          <SelectItem value="exame">Exame</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
