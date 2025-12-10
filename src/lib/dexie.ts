// src/lib/dexie.ts
import Dexie, { type Table } from 'dexie';
import type { MenuGroupFromFirestore, UserMenuItemConfig } from '@/hooks/use-menu-data'; // Atualizado
import type { AppearanceSettings } from '@/hooks/use-nx-appearance';
import type { GeneralSettings } from '@/hooks/use-nx-general-settings'; // Atualizado

export interface CachedData<T> {
  contextKey: string; // "master", "instance_{id}", "sub_{parentId}_{subId}"
  data: T;
  timestamp: number;
}

export class NexieDexie extends Dexie {
  cachedMenuGroups!: Table<CachedData<Omit<MenuGroupFromFirestore, 'items' | 'finalDisplayGroupIconColor' | 'finalDisplayGroupTextColor'>[]>>;
  cachedMenuItemConfigs!: Table<CachedData<UserMenuItemConfig[]>>;
  cachedAppearanceSettings!: Table<CachedData<AppearanceSettings | null>>;
  cachedGeneralSettings!: Table<CachedData<GeneralSettings | null>>;

  constructor() {
    super('NexieDB');
    this.version(1).stores({
      cachedMenuGroups: 'contextKey, timestamp',
      cachedMenuItemConfigs: 'contextKey, timestamp',
      cachedAppearanceSettings: 'contextKey, timestamp',
      cachedGeneralSettings: 'contextKey, timestamp',
    });
  }
}

const isBrowser = typeof window !== 'undefined';

// Mock implementation for server-side rendering
const mockDexieTable = {
  get: () => Promise.resolve(undefined),
  put: () => Promise.resolve(''),
  clear: () => Promise.resolve(),
};

const mockDexieDb = {
  ...({
    cachedMenuGroups: mockDexieTable,
    cachedMenuItemConfigs: mockDexieTable,
    cachedAppearanceSettings: mockDexieTable,
    cachedGeneralSettings: mockDexieTable,
  } as unknown as NexieDexie),
  delete: () => Promise.resolve(),
  isOpen: () => false,
  close: () => {},
};

export const localDb = isBrowser 
  ? new NexieDexie() 
  : mockDexieDb;

/**
 * Deletes the entire Dexie database from the browser.
 * This is a hard reset for all cached settings.
 */
export async function clearAllCachedSettings() {
  if (!isBrowser) return;

  try {
    const db = new NexieDexie();
    if (db.isOpen()) {
      db.close();
    }
    await db.delete();
    console.log("NexieDB database successfully deleted.");
  } catch (error) {
    console.error("Error deleting NexieDB database:", error);
    throw error;
  }
}