import { Q } from '@nozbe/watermelondb';
import { database } from '@/db/database';
import { supabase } from '@/lib/supabase';

// Sync configuration
const SYNC_CONFIG = {
  BATCH_SIZE: 100,
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_BASE: 1000, // ms
  SYNC_INTERVAL: 5 * 60 * 1000, // 5 minutes
};

// Operation types for the queue
type SyncOperationType = 'create' | 'update' | 'delete';
type SyncEntityType =
  | 'exercise'
  | 'program'
  | 'workout'
  | 'setLog'
  | 'personalRecord'
  | 'readinessSurvey';

interface SyncOperation {
  id: string;
  entityType: SyncEntityType;
  entityId: string;
  operationType: SyncOperationType;
  data: Record<string, unknown>;
  timestamp: number;
  attempts: number;
  lastError?: string;
}

interface SyncConflict {
  entityType: SyncEntityType;
  entityId: string;
  localData: Record<string, unknown>;
  remoteData: Record<string, unknown>;
  resolvedAt?: number;
}

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

export interface SyncState {
  status: SyncStatus;
  lastSyncAt: number | null;
  pendingOperations: number;
  conflicts: SyncConflict[];
  error: string | null;
}

type SyncStateListener = (state: SyncState) => void;

class CloudSyncService {
  private listeners: Set<SyncStateListener> = new Set();
  private operationQueue: SyncOperation[] = [];
  private conflicts: SyncConflict[] = [];
  private isProcessing = false;
  private status: SyncStatus = 'idle';
  private lastSyncAt: number | null = null;
  private error: string | null = null;
  private networkListener: (() => void) | null = null;

  // Subscribe to state changes
  subscribe(listener: SyncStateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify all listeners of state changes
  private notifyListeners() {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }

  getState(): SyncState {
    return {
      status: this.status,
      lastSyncAt: this.lastSyncAt,
      pendingOperations: this.operationQueue.length,
      conflicts: this.conflicts,
      error: this.error,
    };
  }

  setStatus(status: SyncStatus) {
    this.status = status;
    this.notifyListeners();
  }

  // Initialize sync service
  async initialize(): Promise<void> {
    // Load pending operations from persistent storage (if implemented)
    // Setup network listener for auto-sync on reconnect
    this.setupNetworkListener();
  }

  // Setup network state listener
  private setupNetworkListener() {
    // In a real app, use NetInfo or similar to detect network changes
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('Network restored - triggering sync');
        this.triggerSync();
      });
      window.addEventListener('offline', () => {
        console.log('Network lost - pausing sync');
        this.setStatus('offline');
      });
    }
  }

  // Add operation to queue
  async queueOperation(
    entityType: SyncEntityType,
    entityId: string,
    operationType: SyncOperationType,
    data: Record<string, unknown>,
  ): Promise<void> {
    const operation: SyncOperation = {
      id: `${entityType}_${entityId}_${Date.now()}`,
      entityType,
      entityId,
      operationType,
      data,
      timestamp: Date.now(),
      attempts: 0,
    };

    this.operationQueue.push(operation);
    this.notifyListeners();

    // Try to process immediately if online
    if (this.status !== 'offline') {
      this.processQueue();
    }
  }

  // Process the operation queue
  async processQueue(): Promise<void> {
    if (this.isProcessing || this.status === 'offline') return;

    this.isProcessing = true;
    this.setStatus('syncing');

    const operations = [...this.operationQueue];

    for (const operation of operations) {
      try {
        await this.processOperation(operation);

        // Remove successful operation from queue
        this.operationQueue = this.operationQueue.filter((op) => op.id !== operation.id);
      } catch (error) {
        operation.attempts++;
        operation.lastError = error instanceof Error ? error.message : 'Unknown error';

        // Mark as failed after max retries
        if (operation.attempts >= SYNC_CONFIG.MAX_RETRY_ATTEMPTS) {
          console.error(
            `Operation ${operation.id} failed after ${operation.attempts} attempts:`,
            operation.lastError,
          );
          this.operationQueue = this.operationQueue.filter((op) => op.id !== operation.id);
          this.error = `Sync failed: ${operation.lastError}`;
        }
      }
    }

    this.lastSyncAt = Date.now();
    this.setStatus(this.error ? 'error' : 'idle');
    this.isProcessing = false;
    this.notifyListeners();
  }

  // Process a single operation
  private async processOperation(operation: SyncOperation): Promise<void> {
    const tableName = this.getSupabaseTableName(operation.entityType);

    switch (operation.operationType) {
      case 'create':
        await this.syncCreate(tableName, operation);
        break;
      case 'update':
        await this.syncUpdate(tableName, operation);
        break;
      case 'delete':
        await this.syncDelete(tableName, operation);
        break;
    }
  }

  // Map entity types to Supabase table names
  private getSupabaseTableName(entityType: SyncEntityType): string {
    const tableMap: Record<SyncEntityType, string> = {
      exercise: 'exercises',
      program: 'programs',
      workout: 'workouts',
      setLog: 'set_logs',
      personalRecord: 'personal_records',
      readinessSurvey: 'readiness_surveys',
    };
    return tableMap[entityType];
  }

  // Sync create operation
  private async syncCreate(tableName: string, operation: SyncOperation): Promise<void> {
    const { error } = await supabase.from(tableName).insert({
      id: operation.entityId,
      ...operation.data,
      synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
  }

  // Sync update operation
  private async syncUpdate(tableName: string, operation: SyncOperation): Promise<void> {
    const { error } = await supabase
      .from(tableName)
      .update({
        ...operation.data,
        synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', operation.entityId);

    if (error) throw error;
  }

  // Sync delete operation
  private async syncDelete(tableName: string, operation: SyncOperation): Promise<void> {
    const { error } = await supabase.from(tableName).delete().eq('id', operation.entityId);

    if (error) throw error;
  }

  // Pull remote changes
  async pullChanges(): Promise<void> {
    if (this.status === 'offline') return;

    try {
      // Get all tables to sync
      const tables: SyncEntityType[] = [
        'exercise',
        'program',
        'workout',
        'setLog',
        'personalRecord',
        'readinessSurvey',
      ];

      for (const entityType of tables) {
        const tableName = this.getSupabaseTableName(entityType);

        // Get last sync time
        const lastSync = this.lastSyncAt || 0;

        // Fetch changes since last sync
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .gte('updated_at', new Date(lastSync).toISOString());

        if (error) throw error;

        if (data && data.length > 0) {
          await this.applyRemoteChanges(entityType, data);
        }
      }

      this.lastSyncAt = Date.now();
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to pull changes:', error);
      this.error = 'Failed to pull changes';
      this.setStatus('error');
    }
  }

  // Apply remote changes to local database
  private async applyRemoteChanges(
    _entityType: SyncEntityType,
    _changes: Record<string, unknown>[],
  ): Promise<void> {
    // Placeholder: In production, this would sync WatermelonDB records
    // Requires actual WatermelonDB model implementations
    console.log('Remote changes would be applied to WatermelonDB');
  }

  // Manual sync trigger
  async triggerSync(): Promise<void> {
    await this.pullChanges();
    await this.processQueue();
  }

  // Resolve conflict
  async resolveConflict(conflictId: number, preferLocal: boolean): Promise<void> {
    const conflict = this.conflicts[conflictId];
    if (!conflict) return;

    if (preferLocal) {
      // Push local data to remote
      await this.queueOperation(
        conflict.entityType,
        conflict.entityId,
        'update',
        conflict.localData as Record<string, unknown>,
      );
    } else {
      // Apply remote data locally
      await this.applyRemoteChanges(conflict.entityType, [conflict.remoteData]);
    }

    conflict.resolvedAt = Date.now();
    this.conflicts = this.conflicts.filter((_, i) => i !== conflictId);
    this.notifyListeners();
  }

  // Get pending operation count
  getPendingCount(): number {
    return this.operationQueue.length;
  }

  // Check if sync is needed
  isSyncNeeded(): boolean {
    return this.operationQueue.length > 0 || this.status === 'error';
  }
}

export const cloudSyncService = new CloudSyncService();
