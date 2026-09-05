/**
 * High-Capacity, Fault-Tolerant Storage Manager
 * Uses IndexedDB as Primary High-Capacity Storage (avoids 5MB LocalStorage quota crash with Base64 images)
 * with LocalStorage as Synchronous Multi-Layer Mirror and Timestamp Tracking.
 */

const DB_NAME = 'MI_KARTU_PELAJAR_STORAGE_V2';
const STORE_NAME = 'app_data';

export const isMockStudent = (s: any): boolean => {
  if (!s || typeof s !== 'object' || !s.id || !s.nama) return true;
  return false;
};

export const purgeMockStudents = (list: any): any[] => {
  if (!Array.isArray(list)) return [];
  // Retain all valid student objects safely without destructive name/id/nisn filters
  return list.filter((item) => item && typeof item === 'object' && item.id && item.nama);
};

function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }

    try {
      const request = window.indexedDB.open(DB_NAME, 2);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };

      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };

      request.onblocked = () => {
        console.warn('IndexedDB open blocked by another tab');
      };
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Save data reliably to IndexedDB and safely mirror to LocalStorage with timestamp
 */
export async function setPersistentItem(key: string, value: any): Promise<void> {
  const timestamp = Date.now();

  // 1. Mirror to LocalStorage immediately (synchronous, instant)
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      localStorage.setItem(`${key}_updated_at`, timestamp.toString());
      localStorage.setItem('mi_data_has_user_edits', 'true');
    } catch (e) {
      // If quota exceeded in localStorage (e.g. huge base64 images), try saving stripped/compressed or cleanup
      try {
        localStorage.removeItem('mi_students_backup_vault');
        localStorage.removeItem('mi_madrasah_backup_vault');
        localStorage.setItem(key, JSON.stringify(value));
        localStorage.setItem(`${key}_updated_at`, timestamp.toString());
      } catch (err2) {
        // Safe fail since IndexedDB will hold the full uncompressed data
        try {
          localStorage.setItem(`${key}_updated_at`, timestamp.toString());
        } catch (err3) {}
      }
    }
  }

  // 2. Write to IndexedDB (Unlimited capacity, handles huge Base64 logos, stamps, student photos)
  try {
    const db = await openIndexedDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(value, key);
      store.put(timestamp, `${key}_updated_at`);
      store.put(true, `${key}_is_user_edited`);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB write warning:', err);
  }
}

/**
 * Retrieve data reliably from IndexedDB, falling back to LocalStorage
 */
export async function getPersistentItem<T>(key: string, defaultValue?: T): Promise<T | null> {
  // 1. Try reading from IndexedDB first (most complete, uncompressed data)
  try {
    const db = await openIndexedDB();
    const result = await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result !== undefined ? req.result : null);
      req.onerror = () => reject(req.error);
    });

    if (result !== null && result !== undefined) {
      return result;
    }
  } catch (err) {
    // console.warn('IndexedDB read warning:', err);
  }

  // 2. Fallback to LocalStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        return JSON.parse(raw) as T;
      }
    } catch (e) {
      // console.error(e);
    }
  }

  return defaultValue !== undefined ? defaultValue : null;
}

/**
 * Get timestamp when key was last saved locally
 */
export async function getPersistentTimestamp(key: string): Promise<number> {
  // 1. Check LocalStorage first (synchronous & fastest)
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const val = localStorage.getItem(`${key}_updated_at`);
      if (val) {
        const num = Number(val);
        if (!isNaN(num) && num > 0) return num;
      }
    } catch (e) {}
  }

  // 2. Check IndexedDB
  try {
    const db = await openIndexedDB();
    const time = await new Promise<number | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(`${key}_updated_at`);
      req.onsuccess = () => resolve(typeof req.result === 'number' ? req.result : null);
      req.onerror = () => resolve(null);
    });
    if (time !== null && time > 0) return time;
  } catch (e) {}

  return 0;
}

/**
 * Check if the user has ever saved custom edits locally
 */
export function hasUserCustomData(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    return (
      localStorage.getItem('mi_data_has_user_edits') === 'true' ||
      Number(localStorage.getItem('mi_madrasah_info_updated_at') || '0') > 0 ||
      Number(localStorage.getItem('mi_students_data_updated_at') || '0') > 0 ||
      !!localStorage.getItem('mi_permanent_vault_madrasah')
    );
  } catch (e) {
    return false;
  }
}

/**
 * Save complete application snapshot to Permanent Anti-Overwrite Vault
 */
export async function saveToPermanentVault(
  madrasah?: any,
  students?: any[],
  cardConfig?: any,
  loaderConfig?: any
): Promise<void> {
  const timestamp = Date.now();
  try {
    if (madrasah && madrasah.namaMadrasah) {
      await setPersistentItem('mi_permanent_vault_madrasah', {
        data: madrasah,
        savedAt: timestamp,
      });
    }
    if (Array.isArray(students) && students.length > 0) {
      await setPersistentItem('mi_permanent_vault_students', {
        data: students,
        savedAt: timestamp,
        count: students.length,
      });
    }
    if (cardConfig) {
      await setPersistentItem('mi_permanent_vault_card_config', {
        data: cardConfig,
        savedAt: timestamp,
      });
    }
    if (loaderConfig) {
      await setPersistentItem('mi_permanent_vault_loader_config', {
        data: loaderConfig,
        savedAt: timestamp,
      });
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('mi_permanent_vault_last_backup', timestamp.toString());
    }
  } catch (e) {
    console.warn('Permanent Vault backup warning:', e);
  }
}

/**
 * Restore complete application snapshot from Permanent Anti-Overwrite Vault
 */
export async function restoreFromPermanentVault(): Promise<{
  madrasah: any | null;
  students: any[] | null;
  cardConfig: any | null;
  loaderConfig: any | null;
  restoredAt: number;
} | null> {
  try {
    const [vMadrasah, vStudents, vConfig, vLoader] = await Promise.all([
      getPersistentItem<{ data: any; savedAt: number }>('mi_permanent_vault_madrasah'),
      getPersistentItem<{ data: any[]; savedAt: number }>('mi_permanent_vault_students'),
      getPersistentItem<{ data: any; savedAt: number }>('mi_permanent_vault_card_config'),
      getPersistentItem<{ data: any; savedAt: number }>('mi_permanent_vault_loader_config'),
    ]);

    if (!vMadrasah && !vStudents && !vConfig && !vLoader) {
      return null;
    }

    const cleanStudents = purgeMockStudents(vStudents?.data);

    return {
      madrasah: vMadrasah?.data || null,
      students: cleanStudents.length > 0 ? cleanStudents : null,
      cardConfig: vConfig?.data || null,
      loaderConfig: vLoader?.data || null,
      restoredAt: Date.now(),
    };
  } catch (e) {
    console.error('Failed to restore from Permanent Vault:', e);
    return null;
  }
}

/**
 * Completely purge all local browser caches to force a fresh 1:1 resynchronization with MySQL
 */
export async function clearAllLocalCaches(): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      const keysToPurge = [
        'mi_students_data',
        'mi_students_list',
        'mi_students_updated_at',
        'mi_students_backup_vault',
        'mi_madrasah_info',
        'mi_madrasah_updated_at',
        'mi_madrasah_backup_vault',
        'mi_card_config',
        'mi_card_config_updated_at',
        'mi_loader_config',
        'mi_activity_logs',
        'mi_permanent_vault_madrasah',
        'mi_permanent_vault_students',
        'mi_permanent_vault_card_config',
        'mi_permanent_vault_loader_config',
        'mi_data_has_user_edits',
      ];
      for (const k of keysToPurge) {
        localStorage.removeItem(k);
      }
    } catch (e) {}

    try {
      if (window.indexedDB) {
        window.indexedDB.deleteDatabase(DB_NAME);
      }
    } catch (e) {}
  }
}

