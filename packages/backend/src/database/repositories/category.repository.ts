import { getDb } from '../connection';
import type { CategoryResponse, CreateCategoryRequest, UpdateCategoryRequest } from '@mail-to-notion/shared';

interface CategoryRow {
  id: number;
  name: string;
  description: string;
  color: string;
  sort_order: number;
  is_default: number;
  created_at: string;
  updated_at: string;
}

function toResponse(row: CategoryRow): CategoryResponse {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    color: row.color,
    sortOrder: row.sort_order,
    isDefault: row.is_default === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const categoryRepository = {
  findAll(): CategoryResponse[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all() as CategoryRow[];
    return rows.map(toResponse);
  },

  findById(id: number): CategoryResponse | undefined {
    const db = getDb();
    const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as CategoryRow | undefined;
    return row ? toResponse(row) : undefined;
  },

  findByName(name: string): CategoryResponse | undefined {
    const db = getDb();
    const row = db.prepare('SELECT * FROM categories WHERE name = ?').get(name) as CategoryRow | undefined;
    return row ? toResponse(row) : undefined;
  },

  create(data: CreateCategoryRequest): CategoryResponse {
    const db = getDb();
    const sortOrder = data.sortOrder ?? this._nextSortOrder();
    const result = db.prepare(
      'INSERT INTO categories (name, description, color, sort_order) VALUES (?, ?, ?, ?)'
    ).run(data.name, data.description ?? '', data.color ?? '#6B7280', sortOrder);

    return this.findById(result.lastInsertRowid as number)!;
  },

  update(id: number, data: UpdateCategoryRequest): CategoryResponse | undefined {
    const db = getDb();
    const existing = this.findById(id);
    if (!existing) return undefined;

    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.color !== undefined) { fields.push('color = ?'); values.push(data.color); }
    if (data.sortOrder !== undefined) { fields.push('sort_order = ?'); values.push(data.sortOrder); }

    if (fields.length === 0) return existing;

    fields.push("updated_at = datetime('now')");
    values.push(id);

    db.prepare(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id);
  },

  delete(id: number): { success: boolean; message: string } {
    const db = getDb();
    const existing = this.findById(id);
    if (!existing) {
      return { success: false, message: 'Category not found' };
    }
    if (existing.isDefault) {
      return { success: false, message: 'Cannot delete default category' };
    }
    db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    return { success: true, message: 'Category deleted' };
  },

  _nextSortOrder(): number {
    const db = getDb();
    const row = db.prepare('SELECT MAX(sort_order) as max_order FROM categories').get() as { max_order: number | null };
    return (row.max_order ?? 0) + 1;
  },
};
