import type { Collection, Document, Filter, Sort, WithId } from "mongodb";

/** One page of results. `page` is 1-based; `pageCount` is at least 1 even when there is nothing. */
export type Page<T> = { items: T[]; page: number; pageCount: number; total: number };

/** Reads `?page=` (or a route segment) into a page number; anything invalid means page 1. */
export function toPageNumber(value: string | string[] | undefined): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

/** Fetches only the requested page from MongoDB (skip/limit), plus the total for the page links. */
export async function paginate<T>(
  col: Collection,
  filter: Filter<Document>,
  sort: Sort,
  page: number,
  perPage: number,
  map: (doc: WithId<Document>) => T
): Promise<Page<T>> {
  const [total, docs] = await Promise.all([
    col.countDocuments(filter),
    col
      .find(filter)
      .sort(sort)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .toArray(),
  ]);
  return { items: docs.map(map), page, pageCount: Math.max(1, Math.ceil(total / perPage)), total };
}
