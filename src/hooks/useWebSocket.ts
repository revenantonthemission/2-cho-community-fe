import { useContext } from 'react';
import {
  WebSocketContext,
  type WebSocketContextType,
} from '../contexts/WebSocketContext';

export function useWebSocket(): WebSocketContextType {
  const ctx = useContext(WebSocketContext);
  if (!ctx)
    throw new Error('useWebSocket must be used within WebSocketProvider');
  return ctx;
}
