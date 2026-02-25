"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ImageBlockParams } from "@/lib/types";
import { updateImageBlock, reorderImages } from "@/lib/markdown-utils";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ImageIcon, GripVertical } from "lucide-react";

interface ImageControlsPanelProps {
  images: ImageBlockParams[];
  markdown: string;
  onMarkdownChange: (md: string) => void;
}

function SortableImageItem({
  img,
  index,
  isExpanded,
  onExpandToggle,
  onUpdate,
  markdown,
  onMarkdownChange,
}: {
  img: ImageBlockParams;
  index: number;
  isExpanded: boolean;
  onExpandToggle: () => void;
  onUpdate: (params: Partial<ImageBlockParams>) => void;
  markdown: string;
  onMarkdownChange: (md: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `image-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border p-3 space-y-3 ${isDragging ? "opacity-50 shadow-lg bg-background z-10" : ""}`}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="touch-none cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-muted"
          {...attributes}
          {...listeners}
          aria-label="Arrastar para reordenar"
        >
          <GripVertical className="size-4 text-muted-foreground" />
        </button>
        <span className="flex-1 text-sm font-medium truncate max-w-[120px]">
          {img.legenda || img.alt || `Imagem ${index + 1}`}
        </span>
      </div>

      <div
        className="cursor-pointer"
        onClick={onExpandToggle}
      >
        {!isExpanded && (
          <p className="text-xs text-muted-foreground py-1">
            Clique para configurar posição e tamanho
          </p>
        )}
        {isExpanded && (
          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-2">
              <Label className="text-xs">Posição</Label>
              <Select
                value={img.position ?? "center"}
                onValueChange={(v) =>
                  onUpdate({ position: v as ImageBlockParams["position"] })
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
                  onUpdate({ size: v as ImageBlockParams["size"] })
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
  );
}

export function ImageControlsPanel({
  images,
  markdown,
  onMarkdownChange,
}: ImageControlsPanelProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updateImage = (index: number, params: Partial<ImageBlockParams>) => {
    const newMd = updateImageBlock(markdown, index, params);
    onMarkdownChange(newMd);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const fromIndex = parseInt(String(active.id).replace("image-", ""), 10);
    const toIndex = parseInt(String(over.id).replace("image-", ""), 10);

    if (Number.isNaN(fromIndex) || Number.isNaN(toIndex)) return;

    const newMd = reorderImages(markdown, fromIndex, toIndex);
    onMarkdownChange(newMd);
    setExpandedIndex(toIndex);
  };

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
            Arraste imagens para a área do editor ou adicione blocos :::imagem no Markdown.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <span className="text-sm font-medium flex items-center gap-2">
          <ImageIcon className="size-4" />
          Imagens ({images.length})
        </span>
        <p className="text-xs text-muted-foreground mt-1">
          Arraste para reordenar
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={images.map((_, i) => `image-${i}`)}
            strategy={verticalListSortingStrategy}
          >
            {images.map((img, index) => (
              <SortableImageItem
                key={`${img.src}-${index}`}
                img={img}
                index={index}
                isExpanded={expandedIndex === index}
                onExpandToggle={() =>
                  setExpandedIndex(expandedIndex === index ? null : index)
                }
                onUpdate={(params) => updateImage(index, params)}
                markdown={markdown}
                onMarkdownChange={onMarkdownChange}
              />
            ))}
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
}
