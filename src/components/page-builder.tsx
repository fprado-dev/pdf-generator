"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import {
  DndContext,
  closestCenter,
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
  SpanSize,
} from "@/lib/layout-types";
import {
  createElement,
  createDefaultLayout,
  COLUMN_PRESETS,
} from "@/lib/layout-types";
import type { ReportFrontMatter } from "@/lib/types";
import {
  layoutToMarkdown,
  buildElementToColumn,
  buildAllElements,
  buildColumnIds,
  addElementToColumn,
  removeElementById,
  updateElementById,
  reorderInColumn,
  moveElementToColumn,
  addRowToSection,
  removeRowById,
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
  Heading1,
  Heading2,
  AlignLeft,
  ImageIcon,
  Minus,
  Table,
  Download,
  Trash2,
  ImagePlus,
  ChevronDown,
  ChevronUp,
  GripVertical,
  X,
  Rows3,
  Columns3,
} from "lucide-react";

const IMG_ACCEPT = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
];

/* ================================================================== */
/*  Palette items                                                     */
/* ================================================================== */

const PALETTE = [
  { type: "titulo" as const, label: "Título", Icon: Heading1 },
  { type: "subtitulo" as const, label: "Subtítulo", Icon: Heading2 },
  { type: "texto" as const, label: "Texto", Icon: AlignLeft },
  { type: "imagem" as const, label: "Imagem", Icon: ImageIcon },
  { type: "separador" as const, label: "Separador", Icon: Minus },
  { type: "tabela" as const, label: "Tabela", Icon: Table },
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
/*  Sortable element (within a column)                                */
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

  const addTableRow = () => {
    if (!element.tableData) return;
    const cols = element.tableData[0]?.length ?? 2;
    onUpdate({
      ...element,
      tableData: [...element.tableData, Array(cols).fill("")],
    });
  };

  const addTableCol = () => {
    if (!element.tableData) return;
    onUpdate({
      ...element,
      tableData: element.tableData.map((row, ri) => [
        ...row,
        ri === 0 ? `Col ${row.length + 1}` : "",
      ]),
    });
  };

  const updateCell = (ri: number, ci: number, value: string) => {
    if (!element.tableData) return;
    const next = element.tableData.map((r) => [...r]);
    next[ri][ci] = value;
    onUpdate({ ...element, tableData: next });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group/el relative rounded-md border border-transparent p-1.5 transition-all",
        "hover:border-border/50 hover:bg-white",
        isDragging && "opacity-30 ring-2 ring-primary/30 z-10"
      )}
    >
      {/* top toolbar */}
      <div className="absolute -top-2.5 right-1 flex items-center gap-0.5 bg-white rounded-full border shadow-sm px-1 py-0.5 opacity-0 group-hover/el:opacity-100 transition-opacity z-10">
        <button
          type="button"
          className="p-0.5 rounded cursor-grab active:cursor-grabbing hover:bg-muted touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-3 text-muted-foreground" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-0.5 rounded hover:bg-destructive/10"
        >
          <Trash2 className="size-3 text-muted-foreground hover:text-destructive" />
        </button>
      </div>

      {/* content by type */}
      {element.type === "titulo" && (
        <input
          value={element.content}
          onChange={(e) => onUpdate({ ...element, content: e.target.value })}
          placeholder="Título..."
          className="w-full bg-transparent border-0 outline-none text-base font-bold placeholder:text-muted-foreground/40"
        />
      )}

      {element.type === "subtitulo" && (
        <input
          value={element.content}
          onChange={(e) => onUpdate({ ...element, content: e.target.value })}
          placeholder="Subtítulo..."
          className="w-full bg-transparent border-0 outline-none text-sm font-semibold placeholder:text-muted-foreground/40"
        />
      )}

      {element.type === "texto" && (
        <textarea
          value={element.content}
          onChange={(e) => onUpdate({ ...element, content: e.target.value })}
          placeholder="Texto..."
          className="w-full bg-transparent border-0 outline-none text-xs resize-y min-h-[28px] placeholder:text-muted-foreground/40"
          rows={2}
        />
      )}

      {element.type === "separador" && (
        <hr className="border-t-2 border-border my-1" />
      )}

      {element.type === "imagem" && (
        <div className="space-y-1">
          {element.imageParams?.src ? (
            <div className="relative rounded overflow-hidden bg-muted/20 border border-border/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={element.imageParams.src}
                alt={element.imageParams.alt ?? ""}
                className="max-h-[120px] w-full object-contain"
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
                  IMG_ACCEPT.includes(f.type)
                );
                if (files[0]) handleFile(files[0]);
              }}
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center gap-1 rounded border border-dashed border-border p-4 cursor-pointer hover:border-primary/40 hover:bg-accent/20 transition-colors"
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
              className="w-full bg-transparent border-0 outline-none text-[9px] italic text-center text-muted-foreground"
            />
          )}
        </div>
      )}

      {element.type === "tabela" && element.tableData && (
        <div className="space-y-1">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr>
                  {element.tableData[0]?.map((cell, ci) => (
                    <th
                      key={ci}
                      className="border border-border/60 p-1 bg-muted/40 font-medium"
                    >
                      <input
                        value={cell}
                        onChange={(e) => updateCell(0, ci, e.target.value)}
                        className="w-full bg-transparent border-0 outline-none text-center font-medium"
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {element.tableData.slice(1).map((row, ri) => (
                  <tr key={ri + 1}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="border border-border/60 p-1">
                        <input
                          value={cell}
                          onChange={(e) =>
                            updateCell(ri + 1, ci, e.target.value)
                          }
                          className="w-full bg-transparent border-0 outline-none"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-1 justify-end">
            <button
              type="button"
              onClick={addTableRow}
              className="text-[9px] text-muted-foreground hover:text-foreground px-1"
            >
              + linha
            </button>
            <button
              type="button"
              onClick={addTableCol}
              className="text-[9px] text-muted-foreground hover:text-foreground px-1"
            >
              + coluna
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Green column drop zone                                            */
/* ================================================================== */

function ColumnDropZone({
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
    data: { type: "column", columnId: column.id },
  });

  const lit = isOver || highlighted;
  const empty = column.elements.length === 0;

  return (
    <div
      ref={setNodeRef}
      style={{ gridColumn: `span ${column.span}` }}
      className={cn(
        "rounded-lg border-2 border-dashed min-h-[52px] transition-all",
        lit
          ? "border-emerald-400 bg-emerald-100/60 shadow-inner"
          : empty
            ? "border-emerald-200/70 bg-emerald-50/50"
            : "border-emerald-100/50 bg-emerald-50/20"
      )}
    >
      <SortableContext
        items={column.elements.map((e) => e.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="p-1 space-y-0.5">
          {column.elements.map((el) => (
            <SortableElement
              key={el.id}
              element={el}
              onUpdate={(u) => onUpdateElement(el.id, u)}
              onDelete={() => onDeleteElement(el.id)}
            />
          ))}
        </div>
      </SortableContext>

      {/* always show a drop indicator */}
      <div
        className={cn(
          "flex items-center justify-center transition-all rounded-md mx-1 mb-1",
          empty ? "min-h-[44px]" : "min-h-[24px]",
          lit
            ? "bg-emerald-200/40"
            : empty
              ? ""
              : "bg-emerald-50/60 opacity-0 hover:opacity-100"
        )}
      >
        <span
          className={cn(
            "text-[10px] select-none transition-colors",
            lit ? "text-emerald-600 font-medium" : "text-emerald-300"
          )}
        >
          {lit ? "↓ Soltar" : "+"}
        </span>
      </div>
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
    <div className="group/row relative">
      <div className="grid grid-cols-4 gap-2 p-1">
        {row.columns.map((col) => (
          <ColumnDropZone
            key={col.id}
            column={col}
            onUpdateElement={onUpdateElement}
            onDeleteElement={onDeleteElement}
            highlighted={overColumnId === col.id}
          />
        ))}
      </div>

      {canDelete && (
        <button
          type="button"
          onClick={onDeleteRow}
          className="absolute -right-5 top-1/2 -translate-y-1/2 rounded p-0.5 opacity-0 group-hover/row:opacity-100 hover:bg-destructive/10 transition-opacity"
          title="Remover linha"
        >
          <X className="size-3 text-muted-foreground hover:text-destructive" />
        </button>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Section                                                           */
/* ================================================================== */

const SEC_COLORS: Record<
  SectionType,
  { border: string; label: string; bg: string }
> = {
  topo: {
    border: "border-blue-200/60",
    label: "text-blue-400",
    bg: "bg-blue-50/20",
  },
  corpo: {
    border: "border-gray-200/60",
    label: "text-gray-400",
    bg: "bg-transparent",
  },
  rodape: {
    border: "border-stone-200/60",
    label: "text-stone-400",
    bg: "bg-stone-50/20",
  },
};

function ColumnPreviewIcon({ spans }: { spans: number[] }) {
  return (
    <div className="flex gap-0.5 h-3.5">
      {spans.map((s, i) => (
        <div
          key={i}
          className="bg-muted-foreground/25 rounded-[2px]"
          style={{ width: `${(s / 4) * 36}px`, height: "100%" }}
        />
      ))}
    </div>
  );
}

function SectionComponent({
  section,
  onUpdateElement,
  onDeleteElement,
  onDeleteRow,
  onAddLine,
  onAddColumns,
  overColumnId,
}: {
  section: LayoutSection;
  onUpdateElement: (id: string, el: LayoutElement) => void;
  onDeleteElement: (id: string) => void;
  onDeleteRow: (rowId: string) => void;
  onAddLine: () => void;
  onAddColumns: (spans: SpanSize[]) => void;
  overColumnId: string | null;
}) {
  const [colPickerOpen, setColPickerOpen] = useState(false);
  const colors = SEC_COLORS[section.type];

  return (
    <div
      className={cn(
        "rounded-xl border-2 border-dashed mb-4 relative",
        colors.border,
        colors.bg
      )}
    >
      <div
        className={cn(
          "absolute -top-2.5 left-3 px-2 text-[9px] font-bold uppercase tracking-widest bg-white rounded",
          colors.label
        )}
      >
        {section.label}
      </div>

      <div className="pt-4 pb-2 px-2 space-y-1">
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

        {/* + Linha / + Coluna buttons */}
        <div className="flex justify-center items-center gap-3 py-1.5">
          <button
            type="button"
            onClick={onAddLine}
            className="flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            <Rows3 className="size-3" />
            <span>Linha</span>
          </button>

          <span className="text-muted-foreground/20 text-[10px]">|</span>

          {!colPickerOpen ? (
            <button
              type="button"
              onClick={() => setColPickerOpen(true)}
              className="flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              <Columns3 className="size-3" />
              <span>Colunas</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 bg-card border border-border rounded-lg px-2 py-1 shadow-sm">
              {COLUMN_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    onAddColumns(preset.spans);
                    setColPickerOpen(false);
                  }}
                  className="rounded px-1.5 py-1 hover:bg-accent transition-colors"
                  title={preset.label}
                >
                  <ColumnPreviewIcon spans={preset.spans} />
                </button>
              ))}
              <button
                type="button"
                onClick={() => setColPickerOpen(false)}
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

/* ================================================================== */
/*  Drag overlay                                                      */
/* ================================================================== */

function PaletteOverlay({ type }: { type: ElementType }) {
  const item = PALETTE.find((p) => p.type === type);
  if (!item) return null;
  return (
    <div className="flex items-center gap-2 rounded-lg border-2 border-emerald-400 bg-emerald-50 px-4 py-2.5 shadow-lg">
      <item.Icon className="size-4 text-emerald-600" />
      <span className="text-sm font-medium text-emerald-700">{item.label}</span>
    </div>
  );
}

function ElementOverlay({ element }: { element: LayoutElement }) {
  const labels: Record<ElementType, string> = {
    titulo: "Título",
    subtitulo: "Subtítulo",
    texto: "Texto",
    imagem: "Imagem",
    separador: "Separador",
    tabela: "Tabela",
  };
  return (
    <div className="flex items-center gap-2 rounded-lg border border-primary/50 bg-card px-3 py-2 shadow-lg max-w-[220px]">
      <GripVertical className="size-3.5 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">{labels[element.type]}</span>
      {element.content && (
        <span className="text-sm truncate">{element.content}</span>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Metadata                                                          */
/* ================================================================== */

function MetadataPanel({
  fm,
  onUpdate,
}: {
  fm: ReportFrontMatter;
  onUpdate: (key: string, value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border bg-card text-xs">
      <button
        type="button"
        className="flex items-center justify-between w-full px-3 py-2 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="font-medium text-xs">Metadados</span>
        {open ? (
          <ChevronUp className="size-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-3.5 text-muted-foreground" />
        )}
      </button>
      {!open && fm.titulo && (
        <p className="text-[10px] text-muted-foreground px-3 pb-2 -mt-1 truncate">
          {fm.titulo}
        </p>
      )}
      {open && (
        <div className="px-3 pb-3 space-y-2 border-t pt-2">
          <MiniField label="Título" value={fm.titulo ?? ""} onChange={(v) => onUpdate("titulo", v)} />
          <MiniField label="Paciente ID" value={fm.paciente_id ?? ""} onChange={(v) => onUpdate("paciente_id", v)} />
          <MiniField label="Data" value={fm.data ?? ""} onChange={(v) => onUpdate("data", v)} type="date" />
          <MiniField label="Médico" value={fm.medico ?? ""} onChange={(v) => onUpdate("medico", v)} />
          <div className="space-y-1">
            <Label className="text-[10px]">Tipo</Label>
            <Select value={fm.tipo ?? "consulta"} onValueChange={(v) => onUpdate("tipo", v)}>
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

function MiniField({
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
/*  Page Builder (main)                                               */
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
  const [overColId, setOverColId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  /* ---- derived lookups ------------------------------------------- */

  const elToCol = useMemo(() => buildElementToColumn(layout), [layout]);
  const allEls = useMemo(() => buildAllElements(layout), [layout]);
  const colIds = useMemo(() => buildColumnIds(layout), [layout]);

  const resolveColId = useCallback(
    (id: string): string | null => {
      if (colIds.has(id)) return id;
      return elToCol[id] ?? null;
    },
    [colIds, elToCol]
  );

  /* ---- DnD ------------------------------------------------------- */

  const handleDragStart = useCallback((e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  }, []);

  const handleDragOver = useCallback(
    (e: DragOverEvent) => {
      setOverColId(e.over ? resolveColId(String(e.over.id)) : null);
    },
    [resolveColId]
  );

  const handleDragEnd = useCallback(
    (e: DragEndEvent) => {
      setActiveId(null);
      setOverColId(null);
      if (!e.over) return;

      const aId = String(e.active.id);
      const oId = String(e.over.id);

      /* palette → column */
      if (aId.startsWith("palette-")) {
        const elType = e.active.data.current?.elementType as ElementType;
        const targetCol = resolveColId(oId);
        if (!targetCol) return;
        setLayout((prev) =>
          addElementToColumn(prev, targetCol, createElement(elType))
        );
        return;
      }

      /* element → reorder / move */
      const srcCol = elToCol[aId];
      const tgtCol = resolveColId(oId);
      if (!srcCol || !tgtCol) return;

      if (srcCol === tgtCol) {
        if (aId !== oId) {
          setLayout((prev) => reorderInColumn(prev, srcCol, aId, oId));
        }
      } else {
        setLayout((prev) => moveElementToColumn(prev, aId, tgtCol));
      }
    },
    [resolveColId, elToCol]
  );

  /* ---- actions --------------------------------------------------- */

  const handleUpdateElement = useCallback((id: string, el: LayoutElement) => {
    setLayout((prev) => updateElementById(prev, id, el));
  }, []);

  const handleDeleteElement = useCallback((id: string) => {
    setLayout((prev) => removeElementById(prev, id).layout);
  }, []);

  const handleDeleteRow = useCallback((rowId: string) => {
    setLayout((prev) => removeRowById(prev, rowId));
  }, []);

  const handleAddLine = useCallback((sec: SectionType) => {
    setLayout((prev) => addRowToSection(prev, sec, [4]));
  }, []);

  const handleAddColumns = useCallback(
    (sec: SectionType, spans: SpanSize[]) => {
      setLayout((prev) => addRowToSection(prev, sec, spans));
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
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-${frontMatter.data ?? "sem-data"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [markdown, frontMatter.data]);

  /* ---- overlay --------------------------------------------------- */

  const activePaletteType = activeId?.startsWith("palette-")
    ? (activeId.replace("palette-", "") as ElementType)
    : null;
  const activeElement = activeId ? allEls[activeId] ?? null : null;

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
          {/* sidebar */}
          <aside className="w-[190px] shrink-0 border-r bg-background overflow-y-auto p-3 space-y-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
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

            <MetadataPanel fm={frontMatter} onUpdate={handleUpdateFM} />
          </aside>

          {/* canvas */}
          <main className="flex-1 overflow-y-auto p-6">
            <div
              className="mx-auto bg-white rounded-xl shadow-sm border border-border/40 p-8"
              style={{ width: "210mm", minHeight: "297mm" }}
            >
              {layout.sections.map((section) => (
                <SectionComponent
                  key={section.type}
                  section={section}
                  onUpdateElement={handleUpdateElement}
                  onDeleteElement={handleDeleteElement}
                  onDeleteRow={handleDeleteRow}
                  onAddLine={() => handleAddLine(section.type)}
                  onAddColumns={(spans) =>
                    handleAddColumns(section.type, spans)
                  }
                  overColumnId={overColId}
                />
              ))}
            </div>
          </main>
        </div>
      </div>

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
