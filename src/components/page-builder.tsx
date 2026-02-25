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
  PageLayout,
  ColumnCount,
} from "@/lib/layout-types";
import { createElement, createEmptyLayout } from "@/lib/layout-types";
import {
  buildElementToColumn,
  buildAllElements,
  buildColumnIds,
  addRow,
  removeRow,
  setRowColumns,
  addElementToColumn,
  removeElementById,
  updateElementById,
  reorderInColumn,
  moveElementToColumn,
} from "@/lib/layout-utils";
import { cn } from "@/lib/utils";
import {
  Heading1,
  Heading2,
  AlignLeft,
  ImageIcon,
  Minus,
  Table,
  Trash2,
  ImagePlus,
  GripVertical,
  Plus,
  Columns2,
  Columns3,
  Columns4,
  Square,
} from "lucide-react";

const IMG_ACCEPT = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
];

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
/*  Sortable element                                                  */
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
        isDragging && "opacity-30 ring-2 ring-primary/20 z-10"
      )}
    >
      {/* toolbar */}
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

      {/* ---- content by type ---- */}

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
            <div className="rounded overflow-hidden bg-muted/20 border border-border/40">
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
/*  Column drop zone                                                  */
/* ================================================================== */

function ColumnDropZone({
  column,
  onUpdateElement,
  onDeleteElement,
  onAddElement,
  highlighted,
}: {
  column: LayoutColumn;
  onUpdateElement: (id: string, el: LayoutElement) => void;
  onDeleteElement: (id: string) => void;
  onAddElement: (type: ElementType) => void;
  highlighted: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column", columnId: column.id },
  });

  const lit = isOver || highlighted;
  const empty = column.elements.length === 0;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg border-2 border-dashed min-h-[56px] flex flex-col transition-all",
        lit
          ? "border-emerald-400 bg-emerald-100/60"
          : empty
            ? "border-emerald-200/60 bg-emerald-50/40"
            : "border-emerald-100/40 bg-emerald-50/10"
      )}
    >
      <SortableContext
        items={column.elements.map((e) => e.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 p-1.5 space-y-0.5">
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

      {/* click-to-add zone */}
      <div
        className={cn(
          "flex items-center justify-center rounded-md mx-1.5 mb-1.5 transition-all cursor-pointer",
          empty ? "flex-1 min-h-[40px]" : "min-h-[24px]",
          lit
            ? "bg-emerald-200/50"
            : "hover:bg-emerald-100/40"
        )}
        onClick={() => setMenuOpen((v) => !v)}
      >
        {!menuOpen && (
          <span
            className={cn(
              "text-[10px] select-none",
              lit ? "text-emerald-600 font-medium" : "text-emerald-300/80"
            )}
          >
            {lit ? "↓ Soltar aqui" : "+"}
          </span>
        )}
        {menuOpen && (
          <div className="flex flex-wrap items-center justify-center gap-1 py-1">
            {PALETTE.map(({ type, label, Icon }) => (
              <button
                key={type}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddElement(type);
                  setMenuOpen(false);
                }}
                className="flex items-center gap-1 rounded-md border bg-white px-2 py-1 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shadow-sm"
                title={label}
              >
                <Icon className="size-3" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Row with column selector                                          */
/* ================================================================== */

const COL_OPTIONS: { count: ColumnCount; Icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { count: 1, Icon: Square, label: "Full" },
  { count: 2, Icon: Columns2, label: "2 col" },
  { count: 3, Icon: Columns3, label: "3 col" },
  { count: 4, Icon: Columns4, label: "4 col" },
];

function RowComponent({
  row,
  onUpdateElement,
  onDeleteElement,
  onAddElement,
  onDeleteRow,
  onSetColumns,
  overColumnId,
}: {
  row: LayoutRow;
  onUpdateElement: (id: string, el: LayoutElement) => void;
  onDeleteElement: (id: string) => void;
  onAddElement: (columnId: string, type: ElementType) => void;
  onDeleteRow: () => void;
  onSetColumns: (count: ColumnCount) => void;
  overColumnId: string | null;
}) {
  return (
    <div className="group/row relative rounded-xl border border-border/30 bg-white p-2 transition-all hover:border-border/60">
      {/* row toolbar */}
      <div className="flex items-center justify-between mb-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
        <div className="flex items-center gap-0.5 bg-muted/50 rounded-lg px-1 py-0.5">
          {COL_OPTIONS.map(({ count, Icon, label }) => (
            <button
              key={count}
              type="button"
              onClick={() => onSetColumns(count)}
              className={cn(
                "p-1 rounded transition-colors",
                row.columnCount === count
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
              title={label}
            >
              <Icon className="size-3.5" />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onDeleteRow}
          className="p-1 rounded hover:bg-destructive/10 transition-colors"
          title="Remover linha"
        >
          <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
        </button>
      </div>

      {/* columns grid */}
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${row.columnCount}, 1fr)` }}
      >
        {row.columns.map((col) => (
          <ColumnDropZone
            key={col.id}
            column={col}
            onUpdateElement={onUpdateElement}
            onDeleteElement={onDeleteElement}
            onAddElement={(type) => onAddElement(col.id, type)}
            highlighted={overColumnId === col.id}
          />
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Drag overlays                                                     */
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
      <span className="text-xs text-muted-foreground">
        {labels[element.type]}
      </span>
      {element.content && (
        <span className="text-sm truncate">{element.content}</span>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Page Builder                                                      */
/* ================================================================== */

export function PageBuilder() {
  const [layout, setLayout] = useState<PageLayout>(createEmptyLayout());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overColId, setOverColId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } })
  );

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
      if (!e.over) {
        setOverColId(null);
        return;
      }
      setOverColId(resolveColId(String(e.over.id)));
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

      if (aId.startsWith("palette-")) {
        const elType = e.active.data.current?.elementType as ElementType;
        const targetCol = resolveColId(oId);
        if (!targetCol) return;
        setLayout((prev) =>
          addElementToColumn(prev, targetCol, createElement(elType))
        );
        return;
      }

      const srcCol = elToCol[aId];
      const tgtCol = resolveColId(oId);
      if (!srcCol || !tgtCol) return;

      if (srcCol === tgtCol) {
        if (aId !== oId)
          setLayout((prev) => reorderInColumn(prev, srcCol, aId, oId));
      } else {
        setLayout((prev) => moveElementToColumn(prev, aId, tgtCol));
      }
    },
    [resolveColId, elToCol]
  );

  /* ---- actions --------------------------------------------------- */

  const handleAddRow = useCallback(() => {
    setLayout((prev) => addRow(prev));
  }, []);

  const handleDeleteRow = useCallback((rowId: string) => {
    setLayout((prev) => removeRow(prev, rowId));
  }, []);

  const handleSetColumns = useCallback(
    (rowId: string, count: ColumnCount) => {
      setLayout((prev) => setRowColumns(prev, rowId, count));
    },
    []
  );

  const handleUpdateElement = useCallback((id: string, el: LayoutElement) => {
    setLayout((prev) => updateElementById(prev, id, el));
  }, []);

  const handleDeleteElement = useCallback((id: string) => {
    setLayout((prev) => removeElementById(prev, id).layout);
  }, []);

  const handleAddElement = useCallback(
    (columnId: string, type: ElementType) => {
      setLayout((prev) =>
        addElementToColumn(prev, columnId, createElement(type))
      );
    },
    []
  );

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
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* sidebar */}
          <aside className="w-[190px] shrink-0 border-r bg-background overflow-y-auto p-3 space-y-4">
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
          </aside>

          {/* canvas */}
          <main className="flex-1 overflow-y-auto p-6">
            <div
              className="mx-auto bg-white rounded-xl shadow-sm border border-border/40 p-6 space-y-3"
              style={{ width: "210mm", minHeight: "297mm" }}
            >
              {layout.rows.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-muted-foreground/40">
                  <p className="text-sm mb-4">
                    Adicione uma linha para começar
                  </p>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="flex items-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/20 px-6 py-3 text-sm hover:border-primary/40 hover:text-primary transition-colors"
                  >
                    <Plus className="size-4" />
                    Adicionar linha
                  </button>
                </div>
              )}

              {layout.rows.map((row) => (
                <RowComponent
                  key={row.id}
                  row={row}
                  onUpdateElement={handleUpdateElement}
                  onDeleteElement={handleDeleteElement}
                  onAddElement={handleAddElement}
                  onDeleteRow={() => handleDeleteRow(row.id)}
                  onSetColumns={(count) => handleSetColumns(row.id, count)}
                  overColumnId={overColId}
                />
              ))}

              {layout.rows.length > 0 && (
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-muted-foreground/15 py-3 text-[11px] text-muted-foreground/40 hover:border-primary/30 hover:text-primary/60 transition-colors"
                >
                  <Plus className="size-3.5" />
                  Adicionar linha
                </button>
              )}
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
