// src/modules/ai-settings/components/MonitoringTab.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, Eye, ArrowUp, ArrowDown, Search } from 'lucide-react';
import { onSnapshot, query, collection, orderBy, limit, doc, Timestamp } from 'firebase/firestore';
import { refs } from '@/lib/firestore-refs';
import { useToast } from '@/hooks/nx-use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { AILog } from '../types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

type SortKey = 'timestamp' | 'assistantName' | 'status';

export function MonitoringTab() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AILog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AILog | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'timestamp', direction: 'desc' });

  useEffect(() => {
    const logsQuery = query(refs.master.aiMonitoringLogs(), orderBy("timestamp", "desc"), limit(50));
    
    const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
      const fetchedLogs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AILog));
      setLogs(fetchedLogs);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching AI logs:", error);
      toast({ title: "Erro ao carregar logs", description: "Verifique se a estrutura do banco de dados está correta.", variant: "destructive" });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const filteredAndSortedLogs = useMemo(() => {
    let sortableItems = [...logs];
    
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      sortableItems = sortableItems.filter(log =>
        log.assistantName?.toLowerCase().includes(lowercasedTerm) ||
        log.status?.toLowerCase().includes(lowercasedTerm) ||
        log.userInput?.toLowerCase().includes(lowercasedTerm)
      );
    }
    
    sortableItems.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;
      
      let comparison = 0;
      if (aVal instanceof Timestamp && bVal instanceof Timestamp) {
        comparison = aVal.toMillis() - bVal.toMillis();
      } else if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      }
      
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    return sortableItems;
  }, [logs, searchTerm, sortConfig]);

  const getStatusVariant = (status?: string) => {
    if (status === 'success') return 'success';
    if (status === 'error') return 'destructive';
    return 'secondary';
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Monitoramento de Interações</CardTitle>
          <CardDescription>
            Visualize o histórico recente de todas as chamadas feitas aos assistentes de IA.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                <div className="relative w-full md:w-1/2 lg:w-1/3">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por assistente, status, prompt..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('timestamp')}>
                      Timestamp
                      {sortConfig.key === 'timestamp' && (sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />)}
                    </Button>
                  </TableHead>
                  <TableHead>
                     <Button variant="ghost" onClick={() => handleSort('assistantName')}>
                      Assistente
                      {sortConfig.key === 'assistantName' && (sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />)}
                    </Button>
                  </TableHead>
                  <TableHead>
                     <Button variant="ghost" onClick={() => handleSort('status')}>
                      Status
                      {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />)}
                    </Button>
                  </TableHead>
                  <TableHead>Custo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></TableCell></TableRow>
                ) : filteredAndSortedLogs.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    {searchTerm ? "Nenhum log corresponde à sua busca." : "Nenhum log de interação encontrado."}
                  </TableCell></TableRow>
                ) : (
                  filteredAndSortedLogs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs">{log.timestamp ? format(log.timestamp.toDate(), 'dd/MM/yy HH:mm:ss', { locale: ptBR }) : 'N/A'}</TableCell>
                      <TableCell className="font-medium text-sm">{log.assistantName || log.assistantId}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(log.status)}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{log.cost ? `R$ ${log.cost.toFixed(6)}` : '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                          <Eye className="h-4 w-4 mr-1"/> Ver Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {selectedLog && (
        <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
            <DialogContent className="sm:max-w-2xl p-0 flex flex-col h-full max-h-[90vh]">
                <DialogHeader className="p-6 pb-4 shrink-0">
                    <DialogTitle>Detalhes do Log</DialogTitle>
                    <DialogDescription>
                        Visualizando interação de <strong>{selectedLog.assistantName || selectedLog.assistantId}</strong> em {selectedLog.timestamp ? format(selectedLog.timestamp.toDate(), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR }) : ''}
                    </DialogDescription>
                </DialogHeader>
                
                <ScrollArea className="flex-grow px-6 min-h-0">
                    <div className="py-4 pr-2 space-y-4">
                        <h4 className="font-semibold">Entrada do Usuário (Prompt)</h4>
                        <pre className="text-xs p-3 bg-muted rounded-md whitespace-pre-wrap font-sans">{selectedLog.userInput || 'N/A'}</pre>
                        
                        <h4 className="font-semibold">Saída da IA</h4>
                        <pre className="text-xs p-3 bg-muted rounded-md whitespace-pre-wrap font-sans">{selectedLog.aiOutput || 'N/A'}</pre>
                        
                        {selectedLog.status === 'error' && (
                            <div>
                                <h4 className="font-semibold text-destructive">Detalhes do Erro</h4>
                                <pre className="text-xs p-3 bg-destructive/10 text-destructive rounded-md whitespace-pre-wrap font-sans">{selectedLog.errorDetails || 'Nenhum detalhe do erro disponível.'}</pre>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter className="p-6 pt-4 border-t shrink-0">
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Fechar</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </>
  );
}
