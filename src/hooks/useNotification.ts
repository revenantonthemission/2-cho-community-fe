import { useContext } from 'react';
import {
  NotificationContext,
  type NotificationContextType,
} from '../contexts/NotificationContext';

export function useNotification(): NotificationContextType {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
}
