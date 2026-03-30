import { useContext } from 'react';
import { DMContext, type DMContextType } from '../contexts/DMContext';

export function useDM(): DMContextType {
  const ctx = useContext(DMContext);
  if (!ctx) throw new Error('useDM must be used within DMProvider');
  return ctx;
}
