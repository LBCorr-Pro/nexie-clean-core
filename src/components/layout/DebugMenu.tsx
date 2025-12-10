// src/components/layout/DebugMenu.tsx -> Now the Log Window
"use client";

import React from 'react';
import { useLog } from '@/contexts/LogContext';
import { Button } from '@/components/ui/button';
import { cn } from "@/lib/utils";
import { ScrollArea } from '../ui/scroll-area';
import { Copy, Trash2, X, Bug, AlertTriangle, Info, MessageSquare, Terminal } from 'lucide-react';
import { useToast } from '@/hooks/nx-use-toast';
import { useDebugMenu } from '@/contexts/DebugMenuContext';

const logTypeStyles = {
  log: 'text-gray-300',
  info: 'text-blue-400',
  warn: 'text-yellow-400',
  error: 'text-red-500',
  debug: 'text-purple-400',
};

const logTypeIcons = {
  log: <MessageSquare className="h-3.5 w-3.5 shrink-0" />,
  info: <Info className="h-3.5 w-3.5 shrink-0" />,
  warn: <AlertTriangle className="h-3.5 w-3.5 shrink-0" />,
  error: <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-500" />,
  debug: <Bug className="h-3.5 w-3.5 shrink-0" />,
};

export const DebugMenu = () => {
  const { isLogVisible, toggleLogVisibility } = useDebugMenu();
  const { logs, clearLogs } = useLog();
  const { toast } = useToast();

  const handleCopyLogs = () => {
    const logText = logs
      .slice()
      .reverse()
      .map(log => `${log.timestamp} [${log.type.toUpperCase()}] ${log.message}`)
      .join('\n');
    navigator.clipboard.writeText(logText);
    toast({ title: "Logs Copiados!" });
  };

  if (process.env.NEXT_PUBLIC_DEV_MODE !== 'true') {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[200] h-[40vh] bg-black/90 text-white backdrop-blur-sm shadow-2xl transition-transform duration-300 ease-in-out",
        "flex flex-col",
        isLogVisible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <header className="flex items-center justify-between p-2 border-b border-gray-700 bg-gray-900/50">
        <h3 className="text-sm font-semibold flex items-center gap-2"><Terminal className="h-4 w-4"/>Console de Logs</h3>
        <div className='flex items-center gap-0.5'>
          <Button variant="ghost" size="sm" onClick={handleCopyLogs} disabled={logs.length === 0}>
            <Copy className="mr-2 h-4 w-4"/> Copiar
          </Button>
          <Button variant="ghost" size="sm" onClick={clearLogs} disabled={logs.length === 0}>
            <Trash2 className="mr-2 h-4 w-4"/> Limpar
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleLogVisibility}>
            <X className="mr-2 h-4 w-4"/> Fechar
          </Button>
        </div>
      </header>
      <ScrollArea className="flex-1 p-2">
        <div className="font-mono text-xs space-y-1">
          {logs.map(log => (
            <div key={log.id} className={cn("flex gap-2 items-start break-words", logTypeStyles[log.type])}>
              <span className="shrink-0 opacity-60">{log.timestamp}</span>
              <span className="shrink-0">{logTypeIcons[log.type]}</span>
              <span className="flex-1 whitespace-pre-wrap">{log.message}</span>
            </div>
          ))}
           {logs.length === 0 && <div className="text-center text-gray-500 py-4">Nenhum log capturado.</div>}
        </div>
      </ScrollArea>
    </div>
  );
};
