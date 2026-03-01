import { Q } from '@nozbe/watermelondb';
import { database } from '../database';
import type { Model } from '@nozbe/watermelondb';

/**
 * Base service class for common CRUD operations
 */
export abstract class BaseService<T extends Model> {
  protected collection;

  constructor(tableName: string) {
    this.collection = database.get<T>(tableName);
  }

  async findById(id: string): Promise<T | null> {
    try {
      return await this.collection.find(id);
    } catch {
      return null;
    }
  }

  async findAll(): Promise<T[]> {
    return this.collection.query().fetch();
  }

  async findWhere(condition: Q.Clause[]): Promise<T[]> {
    return this.collection.query(...condition).fetch();
  }

  async create(data: Partial<Record<keyof T, any>>): Promise<T> {
    return database.write(async () => {
      return this.collection.create((record: any) => {
        Object.entries(data).forEach(([key, value]) => {
          record[key] = value;
        });
      });
    });
  }

  async update(id: string, data: Partial<Record<keyof T, any>>): Promise<T | null> {
    const record = await this.findById(id);
    if (!record) return null;

    return database.write(async () => {
      await record.update((r: any) => {
        Object.entries(data).forEach(([key, value]) => {
          r[key] = value;
        });
      });
      return record;
    });
  }

  async delete(id: string): Promise<boolean> {
    const record = await this.findById(id);
    if (!record) return false;

    return database.write(async () => {
      await record.markAsDeleted();
      return true;
    });
  }

  async deleteAll(ids: string[]): Promise<void> {
    return database.write(async () => {
      const records = await this.collection.query(Q.where('id', Q.oneOf(ids))).fetch();
      await database.batch(...records.map((r) => r.prepareMarkAsDeleted()));
    });
  }

  observe() {
    return this.collection.query().observe();
  }

  observeById(id: string) {
    return this.collection.findAndObserve(id);
  }
}

/**
 * Helper to get a collection by name
 */
export function getCollection<T extends Model>(tableName: string) {
  return database.get<T>(tableName);
}

/**
 * Perform a database write operation
 */
export async function dbWrite<T>(operation: () => Promise<T>): Promise<T> {
  return database.write(operation);
}
