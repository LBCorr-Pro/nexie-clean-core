// src/app/[locale]/(app)/users/components/user-list-table.tsx
"use client";

import React, { useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Pencil, Trash2, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, isValid } from 'date-fns';
import { useTranslations } from "next-intl";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

import { GlobalUser } from '@/types/user-types';

export type SortKey = 'fullName' | 'email' | 'createdAt';
export interface SortConfig {
  key: SortKey;
  direction: 'ascending' | 'descending';
}

interface UserListTableProps {
  users: GlobalUser[];
  isLoading: boolean;
  sortConfig: SortConfig | null;
  handleSort: (key: SortKey) => void;
  onEdit: (user: GlobalUser) => void;
  onDelete: (user: GlobalUser) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function UserListTable({ users, isLoading, sortConfig, handleSort, onEdit, onDelete, canEdit, canDelete }: UserListTableProps) {
  const t = useTranslations('userManagement.table');

  const renderSortArrow = useCallback((key: SortKey) => {
    if (sortConfig?.key !== key) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    return sortConfig.direction === 'ascending' 
      ? <ArrowUpDown className="ml-2 h-4 w-4 text-primary" /> 
      : <ArrowUpDown className="ml-2 h-4 w-4 text-primary scale-y-[-1]" />;
  }, [sortConfig]);

  if (isLoading) {
    return <div className="text-center py-4">{t('loading')}</div>;
  }

  if (users.length === 0) {
    return <p className="text-center text-muted-foreground py-4">{t('noUsersFound')}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('fullName')}>{t('header.name')}{renderSortArrow('fullName')}</Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('email')}>{t('header.email')}{renderSortArrow('email')}</Button>
            </TableHead>
            <TableHead className="hidden md:table-cell">
                 <Button variant="ghost" onClick={() => handleSort('createdAt')}>{t('header.registeredAt')}{renderSortArrow('createdAt')}</Button>
            </TableHead>
            <TableHead>{t('header.status')}</TableHead>
            <TableHead className="text-right">{t('header.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.fullName || 'N/A'}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell className="hidden md:table-cell">
                {user.createdAt && isValid(user.createdAt) ? format(user.createdAt, 'dd/MM/yyyy') : 'N/A'}
              </TableCell>
              <TableCell>
                <Badge variant={user.status === 'active' ? 'success' : 'secondary'}>
                    {user.status === 'active' ? t('active') : t('inactive')}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">{t('actions.openMenu')}</span>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(user)} disabled={!canEdit}>
                      <Pencil className="mr-2 h-4 w-4" />
                      <span>{t('actions.edit')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onDelete(user)} disabled={!canDelete} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>{t('actions.delete')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
UserListTable.displayName = 'UserListTable';
