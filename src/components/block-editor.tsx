"use client";

import { useState, useCallback, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  DragOverlay,
  type DragStartEvent,
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
import type { EditorBlock, EditorBlockType } from "@/lib/block-types";
import type { ImageBlockParams } from "@/lib/types";
import { createBlock } from "@/lib/block-types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GripVertical,
  Trash2,
  Heading,
  AlignLeft,
  ImageIcon,
  Plus,
  ImagePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Palette                                                           */
/* ------------------------------------------------------------------ */

const PALETTE = [
  { type: "heading" as const, label: "Título", Icon: Heading },
  { type: "paragraph" as const, label: "Texto", Icon: AlignLeft },
  { type: "image" as const, label: "Imagem", Icon: ImageIcon },
];

function PaletteItem({
  type,
  label,
  Icon,
}: {
  type: EditorBlockType;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { fromPalette: true, blockType: type },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "flex items-center gap-2 rounded-xl border border-dashed border-border/80 bg-card px-3 py-2",
        "cursor-grab active:cursor-grabbing select-none",
        "hover:border-primary/40 hover:bg-accent/50 transition-colors",
        isDragging && "opacity-40"
      )}
    >
      <Icon className="size-4 text-muted-foreground" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

function PaletteOverlay({
  type,
}: {
  type: EditorBlockType;
}) {
  const item = PALETTE.find((p) => p.type === type);
  if (!item) return null;
  const { label, Icon } = item;
  return (
    <div className="flex items-center gap-2 rounded-xl border border-primary/50 bg-card px-3 py-2 shadow-lg">
      <Icon className="size-4 text-primary" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sortable Block                                                    */
/* ------------------------------------------------------------------ */

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];

function SortableBlock({
  block,
  onUpdate,
  onDelete,
}: {
  block: EditorBlock;
  onUpdate: (b: EditorBlock) => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        onUpdate({
          ...block,
          imageParams: {
            ...block.imageParams!,
            src: reader.result as string,
            alt: block.imageParams?.alt || file.name,
            legenda:
              block.imageParams?.legenda ||
              file.name.replace(/\.[^/.]+$/, ""),
          },
        });
      };
      reader.readAsDataURL(file);
    },
    [block, onUpdate]
  );

  const handleImageDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        IMAGE_TYPES.includes(f.type)
      );
      if (files[0]) handleImageFile(files[0]);
    },
    [handleImageFile]
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex gap-2 rounded-xl border border-border/60 bg-card p-3 transition-all",
        isDragging && "opacity-50 shadow-lg ring-2 ring-primary/20 z-10",
        !isDragging && "hover:border-border"
      )}
    >
      {/* Drag handle */}
      <button
        type="button"
        className="mt-1 flex-shrink-0 touch-none cursor-grab active:cursor-grabbing rounded p-1 hover:bg-muted"
        {...attributes}
        {...listeners}
        aria-label="Arrastar para reordenar"
      >
        <GripVertical className="size-4 text-muted-foreground" />
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        {block.type === "heading" && (
          <div className="flex items-center gap-2">
            <Select
              value={String(block.level ?? 2)}
              onValueChange={(v) =>
                onUpdate({ ...block, level: parseInt(v) as 1 | 2 | 3 })
              }
            >
              <SelectTrigger className="h-8 w-[70px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">H1</SelectItem>
                <SelectItem value="2">H2</SelectItem>
                <SelectItem value="3">H3</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={block.content}
              onChange={(e) => onUpdate({ ...block, content: e.target.value })}
              placeholder="Título da seção..."
              className={cn(
                "flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 px-0",
                block.level === 1 && "text-xl font-bold",
                block.level === 2 && "text-lg font-semibold",
                block.level === 3 && "text-base font-semibold"
              )}
            />
          </div>
        )}

        {block.type === "paragraph" && (
          <Textarea
            value={block.content}
            onChange={(e) => onUpdate({ ...block, content: e.target.value })}
            placeholder="Digite o texto..."
            className="min-h-[60px] border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 resize-y text-sm"
            rows={2}
          />
        )}

        {block.type === "image" && (
          <div className="space-y-3">
            {block.imageParams?.src ? (
              <div className="relative rounded-lg border border-border/60 overflow-hidden bg-muted/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={block.imageParams.src}
                  alt={block.imageParams.alt ?? ""}
                  className="max-h-[200px] w-full object-contain"
                />
                <button
                  type="button"
                  onClick={() =>
                    onUpdate({
                      ...block,
                      imageParams: { ...block.imageParams!, src: "" },
                    })
                  }
                  className="absolute top-2 right-2 rounded-full bg-background/80 p-1 hover:bg-destructive/20"
                >
                  <Trash2 className="size-3 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={handleImageDrop}
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-6 cursor-pointer hover:border-primary/40 hover:bg-accent/30 transition-colors"
              >
                <ImagePlus className="size-8 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Clique ou arraste uma imagem
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageFile(file);
                  }}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Legenda</Label>
                <Input
                  value={block.imageParams?.legenda ?? ""}
                  onChange={(e) =>
                    onUpdate({
                      ...block,
                      imageParams: {
                        ...block.imageParams!,
                        legenda: e.target.value,
                      },
                    })
                  }
                  placeholder="Fig. 1 - ..."
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Alt</Label>
                <Input
                  value={block.imageParams?.alt ?? ""}
                  onChange={(e) =>
                    onUpdate({
                      ...block,
                      imageParams: {
                        ...block.imageParams!,
                        alt: e.target.value,
                      },
                    })
                  }
                  placeholder="Descrição..."
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Posição</Label>
                <Select
                  value={block.imageParams?.position ?? "center"}
                  onValueChange={(v) =>
                    onUpdate({
                      ...block,
                      imageParams: {
                        ...block.imageParams!,
                        position: v as ImageBlockParams["position"],
                      },
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
              <div className="space-y-1">
                <Label className="text-xs">Tamanho</Label>
                <Select
                  value={block.imageParams?.size ?? "medium"}
                  onValueChange={(v) =>
                    onUpdate({
                      ...block,
                      imageParams: {
                        ...block.imageParams!,
                        size: v as ImageBlockParams["size"],
                      },
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
          </div>
        )}
      </div>

      {/* Delete */}
      <button
        type="button"
        onClick={onDelete}
        className="mt-1 flex-shrink-0 rounded p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-opacity"
        aria-label="Remover bloco"
      >
        <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Block Overlay (during drag)                                       */
/* ------------------------------------------------------------------ */

function BlockOverlay({ block }: { block: EditorBlock }) {
  const typeLabel =
    block.type === "heading"
      ? `H${block.level ?? 2}`
      : block.type === "paragraph"
        ? "Texto"
        : "Imagem";

  return (
    <div className="flex items-center gap-2 rounded-xl border border-primary/50 bg-card px-3 py-2 shadow-lg max-w-[320px]">
      <GripVertical className="size-4 text-muted-foreground" />
      <span className="text-xs text-muted-foreground font-medium">
        {typeLabel}
      </span>
      {block.content && (
        <span className="text-sm truncate">{block.content}</span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Editor Empty State                                                */
/* ------------------------------------------------------------------ */

function EmptyEditorDrop() {
  const { setNodeRef, isOver } = useDroppable({ id: "editor-empty" });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-12 transition-colors",
        isOver
          ? "border-primary/50 bg-primary/5"
          : "border-border/60 bg-muted/20"
      )}
    >
      <Plus className="size-10 text-muted-foreground" />
      <p className="text-sm text-muted-foreground font-medium">
        Arraste elementos aqui ou use os botões acima
      </p>
      <p className="text-xs text-muted-foreground">
        Título, Texto ou Imagem
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Block Editor                                                 */
/* ------------------------------------------------------------------ */

interface BlockEditorProps {
  blocks: EditorBlock[];
  onBlocksChange: (blocks: EditorBlock[]) => void;
}

export function BlockEditor({ blocks, onBlocksChange }: BlockEditorProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addBlock = useCallback(
    (type: EditorBlockType) => {
      onBlocksChange([...blocks, createBlock(type)]);
    },
    [blocks, onBlocksChange]
  );

  const updateBlock = useCallback(
    (index: number, updated: EditorBlock) => {
      const next = [...blocks];
      next[index] = updated;
      onBlocksChange(next);
    },
    [blocks, onBlocksChange]
  );

  const deleteBlock = useCallback(
    (index: number) => {
      onBlocksChange(blocks.filter((_, i) => i !== index));
    },
    [blocks, onBlocksChange]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over) return;

      const activeIdStr = String(active.id);
      const overIdStr = String(over.id);

      if (activeIdStr.startsWith("palette-")) {
        const blockType = active.data.current
          ?.blockType as EditorBlockType;
        const newBlock = createBlock(blockType);
        const overIndex = blocks.findIndex((b) => b.id === overIdStr);

        if (overIndex >= 0) {
          const next = [...blocks];
          next.splice(overIndex + 1, 0, newBlock);
          onBlocksChange(next);
        } else {
          onBlocksChange([...blocks, newBlock]);
        }
        return;
      }

      if (activeIdStr !== overIdStr) {
        const fromIndex = blocks.findIndex((b) => b.id === activeIdStr);
        const toIndex = blocks.findIndex((b) => b.id === overIdStr);
        if (fromIndex >= 0 && toIndex >= 0) {
          onBlocksChange(arrayMove(blocks, fromIndex, toIndex));
        }
      }
    },
    [blocks, onBlocksChange]
  );

  const activeBlock = activeId
    ? blocks.find((b) => b.id === activeId)
    : null;
  const activePaletteType =
    activeId?.startsWith("palette-")
      ? (activeId.replace("palette-", "") as EditorBlockType)
      : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Palette */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-2">
          Arraste para o editor ou clique para adicionar:
        </p>
        <div className="flex flex-wrap gap-2">
          {PALETTE.map(({ type, label, Icon }) => (
            <div key={type} className="flex items-center gap-1">
              <PaletteItem type={type} label={label} Icon={Icon} />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => addBlock(type)}
                aria-label={`Adicionar ${label}`}
              >
                <Plus className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Blocks */}
      {blocks.length === 0 ? (
        <EmptyEditorDrop />
      ) : (
        <SortableContext
          items={blocks.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {blocks.map((block, index) => (
              <SortableBlock
                key={block.id}
                block={block}
                onUpdate={(b) => updateBlock(index, b)}
                onDelete={() => deleteBlock(index)}
              />
            ))}
          </div>
        </SortableContext>
      )}

      {/* Add block at end */}
      {blocks.length > 0 && (
        <div className="mt-3 flex justify-center">
          <div className="flex gap-1">
            {PALETTE.map(({ type, label, Icon }) => (
              <Button
                key={type}
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => addBlock(type)}
              >
                <Icon className="size-3.5 mr-1" />
                {label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Drag overlay */}
      <DragOverlay>
        {activePaletteType ? (
          <PaletteOverlay type={activePaletteType} />
        ) : activeBlock ? (
          <BlockOverlay block={activeBlock} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
