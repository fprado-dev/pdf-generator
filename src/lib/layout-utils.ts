import type {
  PageLayout,
  LayoutElement,
  ColumnCount,
} from "./layout-types";
import { createRow, createId } from "./layout-types";

/* ================================================================== */
/*  Deep clone                                                        */
/* ================================================================== */

function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/* ================================================================== */
/*  Lookups                                                           */
/* ================================================================== */

export function buildElementToColumn(
  layout: PageLayout
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const row of layout.rows)
    for (const col of row.columns)
      for (const el of col.elements) map[el.id] = col.id;
  return map;
}

export function buildAllElements(
  layout: PageLayout
): Record<string, LayoutElement> {
  const map: Record<string, LayoutElement> = {};
  for (const row of layout.rows)
    for (const col of row.columns)
      for (const el of col.elements) map[el.id] = el;
  return map;
}

export function buildColumnIds(layout: PageLayout): Set<string> {
  const set = new Set<string>();
  for (const row of layout.rows)
    for (const col of row.columns) set.add(col.id);
  return set;
}

/* ================================================================== */
/*  Find helpers                                                      */
/* ================================================================== */

function findColumn(
  layout: PageLayout,
  columnId: string
): { ri: number; ci: number } | null {
  for (let ri = 0; ri < layout.rows.length; ri++) {
    const ci = layout.rows[ri].columns.findIndex((c) => c.id === columnId);
    if (ci >= 0) return { ri, ci };
  }
  return null;
}

function findElement(
  layout: PageLayout,
  elementId: string
): { ri: number; ci: number; ei: number } | null {
  for (let ri = 0; ri < layout.rows.length; ri++)
    for (let ci = 0; ci < layout.rows[ri].columns.length; ci++) {
      const ei = layout.rows[ri].columns[ci].elements.findIndex(
        (e) => e.id === elementId
      );
      if (ei >= 0) return { ri, ci, ei };
    }
  return null;
}

/* ================================================================== */
/*  Mutations                                                         */
/* ================================================================== */

export function addRow(
  layout: PageLayout,
  colCount: ColumnCount = 1
): PageLayout {
  const next = clone(layout);
  next.rows.push(createRow(colCount));
  return next;
}

export function removeRow(layout: PageLayout, rowId: string): PageLayout {
  const next = clone(layout);
  next.rows = next.rows.filter((r) => r.id !== rowId);
  return next;
}

export function setRowColumns(
  layout: PageLayout,
  rowId: string,
  count: ColumnCount
): PageLayout {
  const next = clone(layout);
  const row = next.rows.find((r) => r.id === rowId);
  if (!row) return layout;

  const old = row.columns;
  row.columnCount = count;

  if (count > old.length) {
    while (row.columns.length < count) {
      row.columns.push({ id: createId("col"), weight: 1, elements: [] });
    }
  } else if (count < old.length) {
    const excess = old.splice(count);
    const last = row.columns[count - 1];
    for (const removed of excess) {
      last.elements.push(...removed.elements);
    }
  }

  return next;
}

export function setColumnWeight(
  layout: PageLayout,
  rowId: string,
  colIndex: number,
  newWeight: number
): PageLayout {
  const next = clone(layout);
  const row = next.rows.find((r) => r.id === rowId);
  if (!row || colIndex < 0 || colIndex >= row.columns.length) return layout;
  row.columns[colIndex].weight = Math.max(0.5, Math.min(4, newWeight));
  return next;
}

export function addElementToColumn(
  layout: PageLayout,
  columnId: string,
  element: LayoutElement
): PageLayout {
  const next = clone(layout);
  const loc = findColumn(next, columnId);
  if (!loc) return layout;
  next.rows[loc.ri].columns[loc.ci].elements.push(element);
  return next;
}

export function removeElementById(
  layout: PageLayout,
  elementId: string
): { layout: PageLayout; element: LayoutElement | null } {
  const next = clone(layout);
  const loc = findElement(next, elementId);
  if (!loc) return { layout, element: null };
  const [element] = next.rows[loc.ri].columns[loc.ci].elements.splice(
    loc.ei,
    1
  );
  return { layout: next, element };
}

export function updateElementById(
  layout: PageLayout,
  elementId: string,
  updated: LayoutElement
): PageLayout {
  const next = clone(layout);
  const loc = findElement(next, elementId);
  if (!loc) return layout;
  next.rows[loc.ri].columns[loc.ci].elements[loc.ei] = updated;
  return next;
}

export function reorderInColumn(
  layout: PageLayout,
  columnId: string,
  fromId: string,
  toId: string
): PageLayout {
  const next = clone(layout);
  const loc = findColumn(next, columnId);
  if (!loc) return layout;
  const els = next.rows[loc.ri].columns[loc.ci].elements;
  const fi = els.findIndex((e) => e.id === fromId);
  const ti = els.findIndex((e) => e.id === toId);
  if (fi < 0 || ti < 0) return layout;
  const [el] = els.splice(fi, 1);
  els.splice(ti, 0, el);
  return next;
}

export function moveElementToColumn(
  layout: PageLayout,
  elementId: string,
  targetColumnId: string
): PageLayout {
  const { layout: without, element } = removeElementById(layout, elementId);
  if (!element) return layout;
  return addElementToColumn(without, targetColumnId, element);
}
