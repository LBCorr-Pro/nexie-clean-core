// src/contexts/LogContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';

export interface LogMessage {
  id: number;
  type: 'log' | 'warn' | 'error' | 'info' | 'debug';
  timestamp: string;
  message: string;
}

interface LogContextType {
  logs: LogMessage[];
  clearLogs: () => void;
  logEvent: (type: LogMessage['type'], ...args: any[]) => void;
}

const LogContext = createContext<LogContextType | undefined>(undefined);

export const useLog = () => {
  const context = useContext(LogContext);
  if (!context) {
    throw new Error('useLog must be used within a LogProvider');
  }
  return context;
};

let logIdCounter = 0;

export const LogProvider = ({ children }: { children: ReactNode }) => {
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const originalConsoleRef = React.useRef<typeof window.console | null>(null);

  const logEvent = useCallback((type: LogMessage['type'], ...args: any[]) => {
    // Defer state update to avoid calling it during an existing render cycle
    setTimeout(() => {
      try {
          const formattedMessage = args.map(arg => {
              if (typeof arg === 'object' && arg !== null) {
                  try {
                      if (arg instanceof Promise) return '[Promise Object]';
                      if (arg instanceof Error) {
                        return `{ message: "${arg.message}", name: "${arg.name}", stack: "${arg.stack?.substring(0, 150)}..." }`;
                      }
                      return JSON.stringify(arg, (key, value) => 
                        typeof value === 'bigint' ? value.toString() : value, 2);
                  } catch {
                      return '[Unserializable Object]';
                  }
              }
              return String(arg);
          }).join(' ');

          const newLog: LogMessage = {
              id: logIdCounter++,
              type,
              timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
              message: formattedMessage,
          };
          
          setLogs(prevLogs => [newLog, ...prevLogs].slice(0, 200));
      } catch (e) {
          if(originalConsoleRef.current) {
              originalConsoleRef.current.error("Error in custom logEvent function:", e);
          } else {
              console.error("Error in custom logEvent function:", e);
          }
      }
    }, 0);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    logEvent('info', 'Logs cleared.');
  }, [logEvent]);

  const value = useMemo(() => ({
    logs,
    clearLogs,
    logEvent,
  }), [logs, clearLogs, logEvent]);

  return (
    <LogContext.Provider value={value}>
      {children}
    </LogContext.Provider>
  );
};