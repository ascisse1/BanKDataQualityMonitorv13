import { useState, useEffect, useCallback, useRef } from 'react';

export interface SyncBatchEvent {
  type: 'BATCH';
  table: string;
  offset: number;
  batchSize: number;
  totalCount: number;
  upserted: number;
  anomalies: number;
  batchDurationMs: number;
  progress: number;
}

export interface SyncTableCompleteEvent {
  type: 'TABLE_COMPLETE';
  table: string;
  upserted: number;
  anomalies: number;
  errors: number;
  durationMs: number;
  cdc: boolean;
}

export interface SyncCompleteEvent {
  type: 'SYNC_COMPLETE';
  tablesProcessed: number;
  durationMs: number;
}

export type SyncEvent = SyncBatchEvent | SyncTableCompleteEvent | SyncCompleteEvent;

export interface SyncProgress {
  connected: boolean;
  running: boolean;
  currentTable: string | null;
  progress: number;
  events: SyncEvent[];
  tables: Record<string, SyncTableCompleteEvent>;
  lastBatch: SyncBatchEvent | null;
  lastComplete: SyncCompleteEvent | null;
}

export function useSyncProgress() {
  const [state, setState] = useState<SyncProgress>({
    connected: false,
    running: false,
    currentTable: null,
    progress: 0,
    events: [],
    tables: {},
    lastBatch: null,
    lastComplete: null,
  });

  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) return;

    const es = new EventSource('/api/sync/progress');
    eventSourceRef.current = es;

    es.onopen = () => {
      setState(prev => ({ ...prev, connected: true }));
    };

    es.onmessage = (e) => {
      const event: SyncEvent = JSON.parse(e.data);

      setState(prev => {
        const newState = { ...prev, events: [...prev.events.slice(-100), event] };

        switch (event.type) {
          case 'BATCH':
            return {
              ...newState,
              running: true,
              currentTable: event.table,
              progress: event.progress,
              lastBatch: event,
            };
          case 'TABLE_COMPLETE':
            return {
              ...newState,
              tables: { ...prev.tables, [event.table]: event },
            };
          case 'SYNC_COMPLETE':
            return {
              ...newState,
              running: false,
              currentTable: null,
              progress: 100,
              lastComplete: event,
            };
          default:
            return newState;
        }
      });
    };

    es.onerror = () => {
      setState(prev => ({ ...prev, connected: false }));
      es.close();
      eventSourceRef.current = null;
      // Reconnect after 3s
      setTimeout(connect, 3000);
    };
  }, []);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setState(prev => ({ ...prev, connected: false }));
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      connected: state.connected,
      running: false,
      currentTable: null,
      progress: 0,
      events: [],
      tables: {},
      lastBatch: null,
      lastComplete: null,
    });
  }, [state.connected]);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return { ...state, connect, disconnect, reset };
}
