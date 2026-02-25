"use client";

import { useState, useMemo, useCallback, useRef } from "react";
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
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type {
  ElementType,
  LayoutElement,
  LayoutColumn,
  LayoutRow,
  LayoutSection,
  SectionType,
  PageLayout,
} from "@/lib/layout-types";
import {
  createElement,
  createRow,
  createDefaultLayout,
  ROW_PRESETS,
} from "@/lib/layout-types";
import type { ReportFrontMatter } from "@/lib/types";
import {
  layoutToMarkdown,
  addElementToColumn,
  removeElement,
  updateElement,
  reorderInColumn,
  addRowToSection,
  removeRow,
} from "@/lib/layout-utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  GripVertical,
  Trash2,
  Heading1,
  Heading2,
  AlignLeft,
  ImageIcon,
  ImagePlus,
  Plus,
  Download,
  X,
  ChevronDown,
  ChevronUp,
  Columns3,
} from "lucide-react";

const IMAGE_ACCEPT = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
];

/* ================================================================== */
/*  Palette – draggable element types                                 */
/* ================================================================== */

const PALETTE = [
  { type: "titulo" as const, label: "Título", Icon: Heading1 },
  { type: "subtitulo" as const, label: "Subtítulo", Icon: Heading2 },
  { type: "texto" as const, label: "Texto", Icon: AlignLeft },
  { type: "imagem" as const, label: "Imagem", Icon: ImageIcon },
];

function PaletteItem({
  type,
  label,
  Icon,
}: {
  type: ElementType;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { fromPalette: true, elementType: type },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "flex items-center gap-2.5 rounded-lg border border-dashed border-border bg-card px-3 py-2.5",
        "cursor-grab active:cursor-grabbing select-none",
        "hover:border-primary/40 hover:bg-accent/50 transition-colors",
        isDragging && "opacity-30"
      )}
    >
      <Icon className="size-4 text-muted-foreground shrink-0" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

/* ================================================================== */
/*  Sortable element inside a column                                  */
/* ================================================================== */

function SortableElement({
  element,
  onUpdate,
  onDelete,
}: {
  element: LayoutElement;
  onUpdate: (el: LayoutElement) => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: element.id, data: { type: "element" } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        onUpdate({
          ...element,
          imageParams: {
            ...element.imageParams!,
            src: reader.result as string,
            alt: element.imageParams?.alt || file.name,
            legenda:
              element.imageParams?.legenda ||
              file.name.replace(/\.[^/.]+$/, ""),
          },
        });
      };
      reader.readAsDataURL(file);
    },
    [element, onUpdate]
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex items-start gap-1 rounded-md p-1 transition-all",
        "hover:bg-accent/40",
        isDragging && "opacity-30 ring-2 ring-primary/30 z-10"
      )}
    >
      {/* drag handle */}
      <button
        type="button"
        className="mt-0.5 shrink-0 touch-none cursor-grab active:cursor-grabbing rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity"
        {...attributes}
        {...listeners}
        aria-label="Arrastar"
      >
        <GripVertical className="size-3.5 text-muted-foreground" />
      </button>

      {/* content */}
      <div className="flex-1 min-w-0">
        {element.type === "titulo" && (
          <input
            value={element.content}
            onChange={(e) =>
              onUpdate({ ...element, content: e.target.value })
            }
            placeholder="Título..."
            className="w-full bg-transparent border-0 outline-none text-lg font-bold placeholder:text-muted-foreground/40"
          />
        )}

        {element.type === "subtitulo" && (
          <input
            value={element.content}
            onChange={(e) =>
              onUpdate({ ...element, content: e.target.value })
            }
            placeholder="Subtítulo..."
            className="w-full bg-transparent border-0 outline-none text-sm font-semibold placeholder:text-muted-foreground/40"
          />
        )}

        {element.type === "texto" && (
          <textarea
            value={element.content}
            onChange={(e) =>
              onUpdate({ ...element, content: e.target.value })
            }
            placeholder="Texto..."
            className="w-full bg-transparent border-0 outline-none text-sm resize-y min-h-[22px] placeholder:text-muted-foreground/40"
            rows={1}
          />
        )}

        {element.type === "imagem" && (
          <div className="space-y-1">
            {element.imageParams?.src ? (
              <div className="relative rounded border border-border/50 overflow-hidden bg-muted/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={element.imageParams.src}
                  alt={element.imageParams.alt ?? ""}
                  className="max-h-[100px] w-full object-contain"
                />
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const files = Array.from(e.dataTransfer.files).filter((f) =>
                    IMAGE_ACCEPT.includes(f.type)
                  );
                  if (files[0]) handleFile(files[0]);
                }}
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center gap-1 rounded border border-dashed border-border p-3 cursor-pointer hover:border-primary/40 hover:bg-accent/20 transition-colors"
              >
                <ImagePlus className="size-5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">
                  Clique ou arraste
                </span>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
              </div>
            )}
            {element.imageParams?.src && (
              <input
                value={element.imageParams.legenda ?? ""}
                onChange={(e) =>
                  onUpdate({
                    ...element,
                    imageParams: {
                      ...element.imageParams!,
                      legenda: e.target.value,
                    },
                  })
                }
                placeholder="Legenda..."
                className="w-full bg-transparent border-0 outline-none text-[10px] italic text-center text-muted-foreground placeholder:text-muted-foreground/30"
              />
            )}
          </div>
        )}
      </div>

      {/* delete */}
      <button
        type="button"
        onClick={onDelete}
        className="mt-0.5 shrink-0 rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-opacity"
        aria-label="Remover"
      >
        <X className="size-3 text-muted-foreground hover:text-destructive" />
      </button>
    </div>
  );
}

/* ================================================================== */
/*  Droppable column                                                  */
/* ================================================================== */

function DroppableColumn({
  column,
  onUpdateElement,
  onDeleteElement,
  highlighted,
}: {
  column: LayoutColumn;
  onUpdateElement: (id: string, el: LayoutElement) => void;
  onDeleteElement: (id: string) => void;
  highlighted: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column" },
  });

  const active = isOver || highlighted;

  return (
    <div
      ref={setNodeRef}
      style={{ width: `${(column.span / 12) * 100}%` }}
      className={cn(
        "rounded-md border border-dashed min-h-[48px] p-1.5 transition-all",
        active
          ? "border-primary/60 bg-primary/5 shadow-sm"
          : "border-border/30"
      )}
    >
      <SortableContext
        items={column.elements.map((e) => e.id)}
        strategy={verticalListSortingStrategy}
      >
        {column.elements.map((el) => (
          <SortableElement
            key={el.id}
            element={el}
            onUpdate={(u) => onUpdateElement(el.id, u)}
            onDelete={() => onDeleteElement(el.id)}
          />
        ))}
      </SortableContext>

      {column.elements.length === 0 && !active && (
        <div className="flex items-center justify-center h-full min-h-[40px]">
          <span className="text-[10px] text-muted-foreground/40 select-none">
            Solte aqui
          </span>
        </div>
      )}
      {active && column.elements.length === 0 && (
        <div className="flex items-center justify-center h-full min-h-[40px]">
          <span className="text-xs text-primary/60 font-medium select-none">
            ↓ Soltar
          </span>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Row                                                               */
/* ================================================================== */

function RowComponent({
  row,
  onUpdateElement,
  onDeleteElement,
  onDeleteRow,
  canDelete,
  overColumnId,
}: {
  row: LayoutRow;
  onUpdateElement: (id: string, el: LayoutElement) => void;
  onDeleteElement: (id: string) => void;
  onDeleteRow: () => void;
  canDelete: boolean;
  overColumnId: string | null;
}) {
  return (
    <div className="group/row relative flex gap-1.5 p-1">
      {row.columns.map((col) => (
        <DroppableColumn
          key={col.id}
          column={col}
          onUpdateElement={onUpdateElement}
          onDeleteElement={onDeleteElement}
          highlighted={overColumnId === col.id}
        />
      ))}

      {canDelete && (
        <button
          type="button"
          onClick={onDeleteRow}
          className="absolute -right-6 top-1/2 -translate-y-1/2 rounded p-0.5 opacity-0 group-hover/row:opacity-100 hover:bg-destructive/10 transition-opacity"
          aria-label="Remover linha"
        >
          <Trash2 className="size-3 text-muted-foreground hover:text-destructive" />
        </button>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Section (topo / corpo / rodapé)                                   */
/* ================================================================== */

const SECTION_STYLES: Record<SectionType, string> = {
  topo: "border-blue-300/50 bg-blue-50/20",
  corpo: "border-border/50 bg-transparent",
  rodape: "border-stone-300/50 bg-stone-50/20",
};

const SECTION_LABEL_STYLES: Record<SectionType, string> = {
  topo: "text-blue-500/70",
  corpo: "text-muted-foreground/60",
  rodape: "text-stone-500/70",
};

function SectionComponent({
  section,
  onUpdateElement,
  onDeleteElement,
  onDeleteRow,
  onAddRow,
  overColumnId,
}: {
  section: LayoutSection;
  onUpdateElement: (id: string, el: LayoutElement) => void;
  onDeleteElement: (id: string) => void;
  onDeleteRow: (rowId: string) => void;
  onAddRow: (spans: number[]) => void;
  overColumnId: string | null;
}) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div
      className={cn(
        "rounded-lg border-2 border-dashed mb-3 relative",
        SECTION_STYLES[section.type]
      )}
    >
      {/* Section label */}
      <div
        className={cn(
          "absolute -top-2.5 left-3 px-1.5 text-[10px] font-semibold uppercase tracking-wider bg-background",
          SECTION_LABEL_STYLES[section.type]
        )}
      >
        {section.label}
      </div>

      <div className="pt-3 pb-1 px-1">
        {section.rows.map((row) => (
          <RowComponent
            key={row.id}
            row={row}
            onUpdateElement={onUpdateElement}
            onDeleteElement={onDeleteElement}
            onDeleteRow={() => onDeleteRow(row.id)}
            canDelete={section.rows.length > 1}
            overColumnId={overColumnId}
          />
        ))}

        {/* Add row */}
        <div className="flex justify-center py-1">
          {!addOpen ? (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              <Plus className="size-3" />
              linha
            </button>
          ) : (
            <div className="flex items-center gap-1 bg-card border border-border rounded-lg px-2 py-1 shadow-sm">
              {ROW_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    onAddRow(preset.spans);
                    setAddOpen(false);
                  }}
                  className="flex items-center gap-1 rounded px-2 py-1 text-[10px] hover:bg-accent transition-colors"
                  title={preset.label}
                >
                  <ColumnPreview spans={preset.spans} />
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="ml-1 p-0.5 rounded hover:bg-muted"
              >
                <X className="size-3 text-muted-foreground" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ColumnPreview({ spans }: { spans: number[] }) {
  return (
    <div className="flex gap-0.5 h-3">
      {spans.map((s, i) => (
        <div
          key={i}
          className="bg-muted-foreground/30 rounded-[2px]"
          style={{ width: `${(s / 12) * 32}px`, height: "100%" }}
        />
      ))}
    </div>
  );
}

/* ================================================================== */
/*  Drag overlay                                                      */
/* ================================================================== */

function PaletteOverlay({ type }: { type: ElementType }) {
  const item = PALETTE.find((p) => p.type === type);
  if (!item) return null;
  return (
    <div className="flex items-center gap-2 rounded-lg border border-primary/50 bg-card px-3 py-2 shadow-lg">
      <item.Icon className="size-4 text-primary" />
      <span className="text-sm font-medium">{item.label}</span>
    </div>
  );
}

function ElementOverlay({ element }: { element: LayoutElement }) {
  const typeLabels: Record<ElementType, string> = {
    titulo: "Título",
    subtitulo: "Subtítulo",
    texto: "Texto",
    imagem: "Imagem",
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border border-primary/50 bg-card px-3 py-2 shadow-lg max-w-[280px]">
      <GripVertical className="size-3.5 text-muted-foreground" />
      <span className="text-[10px] text-muted-foreground">
        {typeLabels[element.type]}
      </span>
      {element.content && (
        <span className="text-sm truncate">{element.content}</span>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Metadata sidebar card                                             */
/* ================================================================== */

function MetadataPanel({
  frontMatter,
  onUpdate,
}: {
  frontMatter: ReportFrontMatter;
  onUpdate: (key: string, value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-card">
      <button
        type="button"
        className="flex items-center justify-between w-full px-3 py-2 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-xs font-medium">Metadados</span>
        {open ? (
          <ChevronUp className="size-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-3.5 text-muted-foreground" />
        )}
      </button>

      {!open && frontMatter.titulo && (
        <p className="text-[10px] text-muted-foreground px-3 pb-2 -mt-1 truncate">
          {frontMatter.titulo}
        </p>
      )}

      {open && (
        <div className="px-3 pb-3 space-y-2 border-t pt-2">
          <Field label="Título" value={frontMatter.titulo ?? ""} onChange={(v) => onUpdate("titulo", v)} />
          <Field label="Paciente ID" value={frontMatter.paciente_id ?? ""} onChange={(v) => onUpdate("paciente_id", v)} />
          <Field label="Data" value={frontMatter.data ?? ""} onChange={(v) => onUpdate("data", v)} type="date" />
          <Field label="Médico" value={frontMatter.medico ?? ""} onChange={(v) => onUpdate("medico", v)} />
          <div className="space-y-1">
            <Label className="text-[10px]">Tipo</Label>
            <Select
              value={frontMatter.tipo ?? "consulta"}
              onValueChange={(v) => onUpdate("tipo", v)}
            >
              <SelectTrigger className="h-7 text-[11px]">
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
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px]">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 text-[11px]"
      />
    </div>
  );
}

/* ================================================================== */
/*  Main PageBuilder                                                  */
/* ================================================================== */

export function PageBuilder() {
  const [layout, setLayout] = useState<PageLayout>(createDefaultLayout());
  const [frontMatter, setFrontMatter] = useState<ReportFrontMatter>({
    titulo: "Relatório - Consulta Pediátrica",
    paciente_id: "REF-2024-001",
    data: "2024-02-25",
    medico: "Dr(a). Nome do Médico",
    tipo: "consulta",
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /* ---- lookups --------------------------------------------------- */

  const elementToColumn = useMemo(() => {
    const map: Record<string, string> = {};
    for (const sec of layout.sections)
      for (const row of sec.rows)
        for (const col of row.columns)
          for (const el of col.elements) map[el.id] = col.id;
    return map;
  }, [layout]);

  const columnIds = useMemo(() => {
    const set = new Set<string>();
    for (const sec of layout.sections)
      for (const row of sec.rows)
        for (const col of row.columns) set.add(col.id);
    return set;
  }, [layout]);

  const allElements = useMemo(() => {
    const map: Record<string, LayoutElement> = {};
    for (const sec of layout.sections)
      for (const row of sec.rows)
        for (const col of row.columns)
          for (const el of col.elements) map[el.id] = el;
    return map;
  }, [layout]);

  /* ---- resolve target column ------------------------------------- */

  const resolveColumnId = useCallback(
    (id: string): string | null => {
      if (columnIds.has(id)) return id;
      return elementToColumn[id] ?? null;
    },
    [columnIds, elementToColumn]
  );

  /* ---- DnD handlers ---------------------------------------------- */

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { over } = event;
      if (!over) {
        setOverColumnId(null);
        return;
      }
      setOverColumnId(resolveColumnId(String(over.id)));
    },
    [resolveColumnId]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      setOverColumnId(null);
      if (!over) return;

      const aId = String(active.id);
      const oId = String(over.id);

      /* palette → layout */
      if (aId.startsWith("palette-")) {
        const elType = active.data.current?.elementType as ElementType;
        const targetCol = resolveColumnId(oId);
        if (!targetCol) return;

        const newEl = createElement(elType);
        const afterEl = columnIds.has(oId) ? undefined : oId;
        setLayout((prev) =>
          addElementToColumn(prev, targetCol, newEl, afterEl)
        );
        return;
      }

      /* element move/reorder */
      const sourceCol = elementToColumn[aId];
      const targetCol = resolveColumnId(oId);
      if (!sourceCol || !targetCol) return;

      if (sourceCol === targetCol) {
        /* same column → reorder */
        if (aId !== oId) {
          setLayout((prev) => reorderInColumn(prev, sourceCol, aId, oId));
        }
      } else {
        /* different column → move */
        setLayout((prev) => {
          const { layout: withoutEl, element } = removeElement(prev, aId);
          if (!element) return prev;
          const afterEl = columnIds.has(oId) ? undefined : oId;
          return addElementToColumn(withoutEl, targetCol, element, afterEl);
        });
      }
    },
    [elementToColumn, columnIds, resolveColumnId]
  );

  /* ---- layout mutations ------------------------------------------ */

  const handleUpdateElement = useCallback(
    (id: string, el: LayoutElement) => {
      setLayout((prev) => updateElement(prev, id, el));
    },
    []
  );

  const handleDeleteElement = useCallback((id: string) => {
    setLayout((prev) => removeElement(prev, id).layout);
  }, []);

  const handleDeleteRow = useCallback((rowId: string) => {
    setLayout((prev) => removeRow(prev, rowId));
  }, []);

  const handleAddRow = useCallback(
    (sectionType: SectionType, spans: number[]) => {
      setLayout((prev) => addRowToSection(prev, sectionType, createRow(spans)));
    },
    []
  );

  const handleUpdateFM = useCallback((key: string, value: string) => {
    setFrontMatter((prev) => ({ ...prev, [key]: value }));
  }, []);

  /* ---- export ---------------------------------------------------- */

  const markdown = useMemo(
    () => layoutToMarkdown(frontMatter, layout),
    [frontMatter, layout]
  );

  const handleExport = useCallback(() => {
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

  /* ---- active item for overlay ----------------------------------- */

  const activePaletteType = activeId?.startsWith("palette-")
    ? (activeId.replace("palette-", "") as ElementType)
    : null;
  const activeElement = activeId ? allElements[activeId] ?? null : null;

  /* ---- render ---------------------------------------------------- */

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col min-h-screen bg-muted/50">
        {/* header */}
        <header className="flex items-center justify-between border-b bg-background/95 backdrop-blur-sm px-4 py-2.5 shrink-0">
          <h1 className="text-base font-medium tracking-tight">
            PDF Generator
          </h1>
          <Button onClick={handleExport} size="sm" variant="outline">
            <Download className="size-4 mr-2" />
            Exportar .md
          </Button>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* ---- left sidebar ---- */}
          <aside className="w-[200px] shrink-0 border-r bg-background overflow-y-auto p-3 space-y-4">
            {/* palette */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Elementos
              </p>
              <div className="space-y-1.5">
                {PALETTE.map(({ type, label, Icon }) => (
                  <PaletteItem
                    key={type}
                    type={type}
                    label={label}
                    Icon={Icon}
                  />
                ))}
              </div>
            </div>

            {/* row presets */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                <Columns3 className="size-3 inline mr-1 -mt-0.5" />
                Layouts de linha
              </p>
              <div className="space-y-1">
                {ROW_PRESETS.map((preset) => (
                  <div
                    key={preset.label}
                    className="flex items-center gap-2 text-[11px] text-muted-foreground"
                  >
                    <ColumnPreview spans={preset.spans} />
                    <span>{preset.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-muted-foreground/50 mt-1.5">
                Use o botão <span className="font-medium">+ linha</span> em
                cada seção
              </p>
            </div>

            {/* metadata */}
            <MetadataPanel
              frontMatter={frontMatter}
              onUpdate={handleUpdateFM}
            />
          </aside>

          {/* ---- page canvas ---- */}
          <main className="flex-1 overflow-y-auto p-6">
            <div
              className="mx-auto bg-white rounded-xl shadow-sm border border-border/40 p-8"
              style={{
                width: "210mm",
                minHeight: "297mm",
              }}
            >
              {layout.sections.map((section) => (
                <SectionComponent
                  key={section.type}
                  section={section}
                  onUpdateElement={handleUpdateElement}
                  onDeleteElement={handleDeleteElement}
                  onDeleteRow={handleDeleteRow}
                  onAddRow={(spans) => handleAddRow(section.type, spans)}
                  overColumnId={overColumnId}
                />
              ))}
            </div>
          </main>
        </div>
      </div>

      {/* drag overlay */}
      <DragOverlay>
        {activePaletteType ? (
          <PaletteOverlay type={activePaletteType} />
        ) : activeElement ? (
          <ElementOverlay element={activeElement} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
