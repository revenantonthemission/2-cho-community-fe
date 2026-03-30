import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  type ReactNode,
} from 'react';
import { getAccessToken } from '../services/api';
import { WS_URL } from '../constants/endpoints';
import { useAuth } from '../hooks/useAuth';

const RECONNECT_BASE = 1000;
const RECONNECT_MAX = 30000;
const PING_INTERVAL = 30000;

export interface WebSocketContextType {
  isConnected: boolean;
  subscribe: (type: string, callback: (data: unknown) => void) => () => void;
  send: (data: unknown) => void;
}

export const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<Map<string, Set<(data: unknown) => void>>>(new Map());
  const reconnectDelayRef = useRef(RECONNECT_BASE);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const clearTimers = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (pingTimerRef.current) {
      clearInterval(pingTimerRef.current);
      pingTimerRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    clearTimers();
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, [clearTimers]);

  const connect = useCallback(() => {
    const token = getAccessToken();
    if (!token || wsRef.current) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', token }));
      pingTimerRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, PING_INTERVAL);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as { type: string; [key: string]: unknown };
        if (data.type === 'auth_ok') {
          reconnectDelayRef.current = RECONNECT_BASE;
          if (mountedRef.current) setIsConnected(true);
          return;
        }
        if (data.type === 'pong') return;

        const callbacks = listenersRef.current.get(data.type);
        if (callbacks) {
          callbacks.forEach((cb) => cb(data));
        }
      } catch {
        // parse 실패 무시
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
      if (pingTimerRef.current) {
        clearInterval(pingTimerRef.current);
        pingTimerRef.current = null;
      }
      if (mountedRef.current) {
        setIsConnected(false);
        reconnectTimerRef.current = setTimeout(() => {
          reconnectDelayRef.current = Math.min(
            reconnectDelayRef.current * 2,
            RECONNECT_MAX,
          );
          connect();
        }, reconnectDelayRef.current);
      }
    };

    ws.onerror = () => {
      // onclose 이벤트가 자동으로 발생하므로 별도 처리 불필요
    };
  }, [clearTimers]);

  useEffect(() => {
    mountedRef.current = true;
    if (isAuthenticated) {
      connect();
    } else {
      disconnect();
    }
    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [isAuthenticated, connect, disconnect]);

  const subscribe = useCallback(
    (type: string, callback: (data: unknown) => void): (() => void) => {
      if (!listenersRef.current.has(type)) {
        listenersRef.current.set(type, new Set());
      }
      listenersRef.current.get(type)!.add(callback);
      return () => {
        const set = listenersRef.current.get(type);
        if (set) {
          set.delete(callback);
          if (set.size === 0) listenersRef.current.delete(type);
        }
      };
    },
    [],
  );

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const value = useMemo(
    () => ({ isConnected, subscribe, send }),
    [isConnected, subscribe, send],
  );

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}
