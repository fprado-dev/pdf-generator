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
import type {
  ElementType,
  LayoutElement,
  LayoutRow,
  LayoutSection,
  SectionType,
  PageLayout,
  ElementSpan,
} from "@/lib/layout-types";
import {
  createElement,
  createDefaultLayout,
  rowRemaining,
} from "@/lib/layout-types";
import type { ReportFrontMatter } from "@/lib/types";
import {
  layoutToMarkdown,
  addElementToRow,
  removeElement,
  updateElement,
  resizeElement,
  moveElementToRow,
  addRow,
  removeRow,
  moveElementInRow,
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
  Plus,
  Trash2,
  ImagePlus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  GripVertical,
} from "lucide-react";

const IMG_ACCEPT = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];

/* ================================================================== */
/*  Palette                                                           */
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
/*  Element card (rendered inside the grid)                           */
/* ================================================================== */

function ElementCard({
  element,
  onUpdate,
  onDelete,
  onResize,
  onMoveLeft,
  onMoveRight,
  maxSpan,
}: {
  element: LayoutElement;
  onUpdate: (el: LayoutElement) => void;
  onDelete: () => void;
  onResize: (span: ElementSpan) => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  maxSpan: number;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: element.id,
    data: { type: "element", elementId: element.id },
  });

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

  const spansAvailable = Array.from({ length: maxSpan }, (_, i) => (i + 1) as ElementSpan);

  return (
    <div
      ref={setNodeRef}
      style={{ gridColumn: `span ${element.span}` }}
      className={cn(
        "group relative rounded-lg border bg-white p-2 transition-all min-h-[48px]",
        isDragging && "opacity-30 ring-2 ring-primary/30"
      )}
    >
      {/* drag handle + controls overlay */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-white rounded-full border shadow-sm px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          type="button"
          onClick={onMoveLeft}
          className="p-0.5 rounded hover:bg-muted"
          title="Mover esquerda"
        >
          <ChevronLeft className="size-3 text-muted-foreground" />
        </button>
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
          onClick={onMoveRight}
          className="p-0.5 rounded hover:bg-muted"
          title="Mover direita"
        >
          <ChevronRight className="size-3 text-muted-foreground" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-0.5 rounded hover:bg-destructive/10"
          title="Remover"
        >
          <Trash2 className="size-3 text-muted-foreground hover:text-destructive" />
        </button>
      </div>

      {/* content */}
      <div className="min-h-[24px]">
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
          <div className="flex items-center py-1">
            <hr className="flex-1 border-t-2 border-border" />
          </div>
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
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
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
                <ImagePlus className="size-6 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Clique ou arraste</span>
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
                    imageParams: { ...element.imageParams!, legenda: e.target.value },
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
                      <th key={ci} className="border border-border/60 p-1 bg-muted/40 font-medium">
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
                            onChange={(e) => updateCell(ri + 1, ci, e.target.value)}
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

      {/* resize bar */}
      <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-px bg-white rounded-full border shadow-sm px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {spansAvailable.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onResize(s)}
            className={cn(
              "px-1.5 py-0.5 rounded text-[9px] font-medium transition-colors",
              element.span === s
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {s}/4
          </button>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Green drop zone                                                   */
/* ================================================================== */

function GreenZone({
  rowId,
  span,
  isActive,
}: {
  rowId: string;
  span: number;
  isActive: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `zone_${rowId}`,
    data: { type: "zone", rowId },
  });

  const lit = isOver || isActive;

  return (
    <div
      ref={setNodeRef}
      style={{ gridColumn: `span ${span}` }}
      className={cn(
        "rounded-lg border-2 border-dashed min-h-[48px] flex items-center justify-center transition-all",
        lit
          ? "border-emerald-400 bg-emerald-100/80 shadow-inner"
          : "border-emerald-200/70 bg-emerald-50/60"
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
  );
}

/* ================================================================== */
/*  Row                                                               */
/* ================================================================== */

function RowComponent({
  row,
  onUpdateElement,
  onDeleteElement,
  onResizeElement,
  onMoveElement,
  onDeleteRow,
  canDelete,
  activeOverRowId,
}: {
  row: LayoutRow;
  onUpdateElement: (id: string, el: LayoutElement) => void;
  onDeleteElement: (id: string) => void;
  onResizeElement: (id: string, span: ElementSpan) => void;
  onMoveElement: (id: string, dir: "left" | "right") => void;
  onDeleteRow: () => void;
  canDelete: boolean;
  activeOverRowId: string | null;
}) {
  const remaining = rowRemaining(row);

  return (
    <div className="group/row relative">
      <div className="grid grid-cols-4 gap-2 p-1.5">
        {row.elements.map((el) => (
          <ElementCard
            key={el.id}
            element={el}
            onUpdate={(u) => onUpdateElement(el.id, u)}
            onDelete={() => onDeleteElement(el.id)}
            onResize={(s) => onResizeElement(el.id, s)}
            onMoveLeft={() => onMoveElement(el.id, "left")}
            onMoveRight={() => onMoveElement(el.id, "right")}
            maxSpan={remaining + el.span}
          />
        ))}

        {remaining > 0 && (
          <GreenZone
            rowId={row.id}
            span={remaining}
            isActive={activeOverRowId === row.id}
          />
        )}
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

const SECTION_COLORS: Record<SectionType, { border: string; label: string; bg: string }> = {
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

function SectionComponent({
  section,
  onUpdateElement,
  onDeleteElement,
  onResizeElement,
  onMoveElement,
  onDeleteRow,
  onAddRow,
  activeOverRowId,
}: {
  section: LayoutSection;
  onUpdateElement: (id: string, el: LayoutElement) => void;
  onDeleteElement: (id: string) => void;
  onResizeElement: (id: string, span: ElementSpan) => void;
  onMoveElement: (id: string, dir: "left" | "right") => void;
  onDeleteRow: (rowId: string) => void;
  onAddRow: () => void;
  activeOverRowId: string | null;
}) {
  const colors = SECTION_COLORS[section.type];

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
            onResizeElement={onResizeElement}
            onMoveElement={onMoveElement}
            onDeleteRow={() => onDeleteRow(row.id)}
            canDelete={section.rows.length > 1}
            activeOverRowId={activeOverRowId}
          />
        ))}

        <div className="flex justify-center pt-1 pb-1">
          <button
            type="button"
            onClick={onAddRow}
            className="flex items-center gap-1 text-[10px] text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          >
            <Plus className="size-3" />
            <span>linha</span>
          </button>
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
    <div className="flex items-center gap-2 rounded-lg border border-primary/50 bg-card px-3 py-2 shadow-lg">
      <GripVertical className="size-3.5 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">{labels[element.type]}</span>
      {element.content && (
        <span className="text-sm truncate max-w-[180px]">{element.content}</span>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Metadata panel                                                    */
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
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="h-7 text-[11px]" />
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
  const [overRowId, setOverRowId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  /* ---- all-elements map ------------------------------------------ */
  const allElements = useMemo(() => {
    const map: Record<string, LayoutElement> = {};
    for (const sec of layout.sections)
      for (const row of sec.rows)
        for (const el of row.elements) map[el.id] = el;
    return map;
  }, [layout]);

  /* ---- resolve zone → row id ------------------------------------- */
  const resolveRowId = useCallback(
    (overId: string): string | null => {
      if (overId.startsWith("zone_")) return overId.slice(5);
      return null;
    },
    []
  );

  /* ---- DnD handlers ---------------------------------------------- */
  const handleDragStart = useCallback((e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  }, []);

  const handleDragOver = useCallback(
    (e: DragOverEvent) => {
      if (!e.over) {
        setOverRowId(null);
        return;
      }
      const rid = resolveRowId(String(e.over.id));
      setOverRowId(rid);
    },
    [resolveRowId]
  );

  const handleDragEnd = useCallback(
    (e: DragEndEvent) => {
      setActiveId(null);
      setOverRowId(null);
      if (!e.over) return;

      const aId = String(e.active.id);
      const oId = String(e.over.id);
      const targetRowId = resolveRowId(oId);
      if (!targetRowId) return;

      if (aId.startsWith("palette-")) {
        const elType = e.active.data.current?.elementType as ElementType;
        const newEl = createElement(elType);
        setLayout((prev) => addElementToRow(prev, targetRowId, newEl));
      } else {
        setLayout((prev) => moveElementToRow(prev, aId, targetRowId));
      }
    },
    [resolveRowId]
  );

  /* ---- layout actions -------------------------------------------- */
  const handleUpdateElement = useCallback((id: string, el: LayoutElement) => {
    setLayout((prev) => updateElement(prev, id, el));
  }, []);

  const handleDeleteElement = useCallback((id: string) => {
    setLayout((prev) => removeElement(prev, id).layout);
  }, []);

  const handleResizeElement = useCallback((id: string, span: ElementSpan) => {
    setLayout((prev) => resizeElement(prev, id, span));
  }, []);

  const handleMoveElement = useCallback((id: string, dir: "left" | "right") => {
    setLayout((prev) => moveElementInRow(prev, id, dir));
  }, []);

  const handleDeleteRow = useCallback((rowId: string) => {
    setLayout((prev) => removeRow(prev, rowId));
  }, []);

  const handleAddRow = useCallback((sectionType: SectionType) => {
    setLayout((prev) => addRow(prev, sectionType));
  }, []);

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

  /* ---- active overlay info --------------------------------------- */
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
          <h1 className="text-base font-medium tracking-tight">PDF Generator</h1>
          <Button onClick={handleExport} size="sm" variant="outline">
            <Download className="size-4 mr-2" />
            Exportar .md
          </Button>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* ---- sidebar ---- */}
          <aside className="w-[190px] shrink-0 border-r bg-background overflow-y-auto p-3 space-y-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Elementos
              </p>
              <div className="space-y-1.5">
                {PALETTE.map(({ type, label, Icon }) => (
                  <PaletteItem key={type} type={type} label={label} Icon={Icon} />
                ))}
              </div>
            </div>

            <MetadataPanel fm={frontMatter} onUpdate={handleUpdateFM} />
          </aside>

          {/* ---- canvas ---- */}
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
                  onResizeElement={handleResizeElement}
                  onMoveElement={handleMoveElement}
                  onDeleteRow={handleDeleteRow}
                  onAddRow={() => handleAddRow(section.type)}
                  activeOverRowId={overRowId}
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
