"use client";

import { useState } from "react";
import type { ImageBlockParams } from "@/lib/types";
import { updateImageBlock, reorderImages } from "@/lib/markdown-utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChevronUp, ChevronDown, ImageIcon } from "lucide-react";

interface ImageControlsPanelProps {
  images: ImageBlockParams[];
  markdown: string;
  onMarkdownChange: (md: string) => void;
}

export function ImageControlsPanel({
  images,
  markdown,
  onMarkdownChange,
}: ImageControlsPanelProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  if (images.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <span className="text-sm font-medium flex items-center gap-2">
            <ImageIcon className="size-4" />
            Imagens
          </span>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhuma imagem no documento. Adicione blocos :::imagem no Markdown.
          </p>
        </CardContent>
      </Card>
    );
  }

  const updateImage = (index: number, params: Partial<ImageBlockParams>) => {
    const newMd = updateImageBlock(markdown, index, params);
    onMarkdownChange(newMd);
  };

  const moveImage = (from: number, direction: "up" | "down") => {
    const to = direction === "up" ? from - 1 : from + 1;
    if (to < 0 || to >= images.length) return;
    const newMd = reorderImages(markdown, from, to);
    onMarkdownChange(newMd);
    setExpandedIndex(to);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <span className="text-sm font-medium flex items-center gap-2">
          <ImageIcon className="size-4" />
          Imagens ({images.length})
        </span>
      </CardHeader>
      <CardContent className="space-y-3">
        {images.map((img, index) => (
          <div
            key={index}
            className="rounded-lg border p-3 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium truncate max-w-[140px]">
                {img.legenda || img.alt || `Imagem ${index + 1}`}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => moveImage(index, "up")}
                  disabled={index === 0}
                >
                  <ChevronUp className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => moveImage(index, "down")}
                  disabled={index === images.length - 1}
                >
                  <ChevronDown className="size-4" />
                </Button>
              </div>
            </div>

            <div
              className="cursor-pointer"
              onClick={() =>
                setExpandedIndex(expandedIndex === index ? null : index)
              }
            >
              {expandedIndex !== index && (
                <p className="text-xs text-muted-foreground py-1">
                  Clique para configurar posição e tamanho
                </p>
              )}
              {expandedIndex === index && (
                <div className="space-y-3 pt-2 border-t">
                  <div className="space-y-2">
                    <Label className="text-xs">Posição</Label>
                    <Select
                      value={img.position ?? "center"}
                      onValueChange={(v) =>
                        updateImage(index, {
                          position: v as ImageBlockParams["position"],
                        })
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Esquerda</SelectItem>
                        <SelectItem value="center">Centro</SelectItem>
                        <SelectItem value="right">Direita</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Tamanho</Label>
                    <Select
                      value={img.size ?? "medium"}
                      onValueChange={(v) =>
                        updateImage(index, {
                          size: v as ImageBlockParams["size"],
                        })
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Pequeno (33%)</SelectItem>
                        <SelectItem value="medium">Médio (66%)</SelectItem>
                        <SelectItem value="large">Grande (100%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
