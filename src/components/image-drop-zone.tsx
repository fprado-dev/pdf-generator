"use client";

import { useState, useCallback } from "react";
import { insertImageBlock } from "@/lib/markdown-utils";
import type { ImageBlockParams } from "@/lib/types";
import { ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];

interface ImageDropZoneProps {
  markdown: string;
  onMarkdownChange: (md: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function ImageDropZone({
  markdown,
  onMarkdownChange,
  children,
  className,
}: ImageDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const getNextOrder = useCallback(() => {
    const regex = /:::imagem[\s\S]*?order:\s*(\d+)/g;
    let max = 0;
    let m;
    while ((m = regex.exec(markdown)) !== null) {
      max = Math.max(max, parseInt(m[1], 10));
    }
    return max + 1;
  }, [markdown]);

  const processFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const imageFiles = Array.from(files).filter((f) =>
        IMAGE_TYPES.includes(f.type)
      );
      if (imageFiles.length === 0) return;

      const order = getNextOrder();
      const insertMarker = markdown.includes("## Conclusão")
        ? "## Conclusão"
        : undefined;

      const processNext = (index: number, accumulatedMd: string) => {
        if (index >= imageFiles.length) {
          onMarkdownChange(accumulatedMd);
          return;
        }

        const file = imageFiles[index];
        const reader = new FileReader();

        reader.onload = () => {
          const dataUrl = reader.result as string;
          const params: ImageBlockParams = {
            src: dataUrl,
            alt: file.name,
            legenda: file.name.replace(/\.[^/.]+$/, ""),
            position: "center",
            size: "medium",
            order: order + index,
          };

          const newMd = insertImageBlock(accumulatedMd, params, insertMarker);
          processNext(index + 1, newMd);
        };

        reader.readAsDataURL(file);
      };

      processNext(0, markdown);
    },
    [markdown, getNextOrder, onMarkdownChange]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const hasImages = Array.from(e.dataTransfer.items).some((item) =>
      IMAGE_TYPES.includes(item.type)
    );
    if (hasImages) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const related = e.relatedTarget as Node | null;
    if (!related || !e.currentTarget.contains(related)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === "file" && IMAGE_TYPES.includes(item.type)) {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }

    if (files.length > 0) {
      e.preventDefault();
      const dt = new DataTransfer();
      files.forEach((f) => dt.items.add(f));
      processFiles(dt.files);
    }
  };

  return (
    <div
      className={cn("relative", className)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
    >
      {isDragging && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl border border-dashed border-border bg-background/90 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <ImagePlus className="size-10" />
            <p className="text-sm font-medium">Solte as imagens aqui</p>
            <p className="text-xs">
              PNG, JPEG, GIF ou WebP
            </p>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
