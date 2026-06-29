import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { useAuthStore } from '../stores/authStore';

// Background Sync API — not yet in the standard TypeScript DOM lib
interface SyncManager {
  register(tag: string): Promise<void>;
}
declare global {
  interface ServiceWorkerRegistration {
    readonly sync: SyncManager;
  }
}

interface PendingReport {
  id?: number;
  payload: {
    latitude: number;
    longitude: number;
    waste_type: string;
    description: string;
  };
  blob_image: Blob | null;
  created_at: string;
  retry_count: number;
  last_error: string;
}

interface PendingRecycling {
  id?: number;
  payload: Record<string, unknown>;
  created_at: string;
  retry_count: number;
  last_error: string;
}

interface OfflineDB extends DBSchema {
  pending_reports: {
    key: number;
    value: PendingReport;
  };
  pending_recycling: {
    key: number;
    value: PendingRecycling;
  };
}

let _db: IDBPDatabase<OfflineDB> | null = null;

async function getDB(): Promise<IDBPDatabase<OfflineDB>> {
  if (!_db) {
    _db = await openDB<OfflineDB>('ptrack-offline', 1, {
      upgrade(database) {
        database.createObjectStore('pending_reports', { keyPath: 'id', autoIncrement: true });
        database.createObjectStore('pending_recycling', { keyPath: 'id', autoIncrement: true });
      },
    });
  }
  return _db;
}

export async function enqueueReport(
  payload: PendingReport['payload'],
  imageBlob: Blob | null
): Promise<void> {
  const db = await getDB();
  await db.add('pending_reports', {
    payload,
    blob_image: imageBlob,
    created_at: new Date().toISOString(),
    retry_count: 0,
    last_error: '',
  });
  // Register background sync — guard with a timeout so an updating SW
  // doesn't hang navigator.serviceWorker.ready when offline.
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const timeout = new Promise<null>((res) => setTimeout(() => res(null), 2000));
      const reg = await Promise.race([navigator.serviceWorker.ready, timeout]);
      if (reg) await (reg as ServiceWorkerRegistration).sync.register('sync-reports');
    } catch {
      // Background sync unavailable — the queue is still saved; flushQueue() picks it up on reconnect
    }
  }
}

export async function enqueueRecycling(payload: Record<string, unknown>): Promise<void> {
  const db = await getDB();
  await db.add('pending_recycling', {
    payload,
    created_at: new Date().toISOString(),
    retry_count: 0,
    last_error: '',
  });
}

const MAX_RETRIES = 5;
const BASE_API = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL as string}/api/v1`
  : '/api/v1';

// Prevents concurrent flushes from double-submitting the same queued item.
let _flushing = false;

export async function flushQueue(): Promise<void> {
  if (_flushing) return;
  _flushing = true;
  try {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    const db = await getDB();

    // ── Flush pending reports ───────────────────────────────────────────────
    const reports = await db.getAll('pending_reports');
    for (const report of reports) {
      if (report.retry_count >= MAX_RETRIES || report.id == null) continue;
      try {
        const formData = new FormData();
        formData.append('latitude', String(report.payload.latitude));
        formData.append('longitude', String(report.payload.longitude));
        formData.append('waste_type', report.payload.waste_type);
        formData.append('description', report.payload.description);
        if (report.blob_image) {
          formData.append('image', report.blob_image, 'photo.webp');
        }
        const response = await fetch(`${BASE_API}/reports/`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (response.ok) {
          await db.delete('pending_reports', report.id);
        } else {
          await db.put('pending_reports', {
            ...report,
            retry_count: report.retry_count + 1,
            last_error: `HTTP ${response.status}`,
          });
        }
      } catch (err) {
        await db.put('pending_reports', {
          ...report,
          retry_count: report.retry_count + 1,
          last_error: err instanceof Error ? err.message : 'Network error',
        });
      }
    }

    // ── Flush pending recycling ─────────────────────────────────────────────
    const recycling = await db.getAll('pending_recycling');
    for (const activity of recycling) {
      if (activity.retry_count >= MAX_RETRIES || activity.id == null) continue;
      try {
        const response = await fetch(`${BASE_API}/recycling/`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(activity.payload),
        });
        if (response.ok) {
          await db.delete('pending_recycling', activity.id);
        } else {
          await db.put('pending_recycling', {
            ...activity,
            retry_count: activity.retry_count + 1,
            last_error: `HTTP ${response.status}`,
          });
        }
      } catch (err) {
        await db.put('pending_recycling', {
          ...activity,
          retry_count: activity.retry_count + 1,
          last_error: err instanceof Error ? err.message : 'Network error',
        });
      }
    }
  } finally {
    _flushing = false;
    // Tell BottomNav (and any other listener) to re-read the queue count.
    window.dispatchEvent(new CustomEvent('queue-flushed'));
  }
}

export async function getQueueStats(): Promise<{ reports: number; recycling: number }> {
  const db = await getDB();
  const [reports, recycling] = await Promise.all([
    db.count('pending_reports'),
    db.count('pending_recycling'),
  ]);
  return { reports, recycling };
}
