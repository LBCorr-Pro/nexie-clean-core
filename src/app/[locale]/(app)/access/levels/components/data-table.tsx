"use client";

import React, { useState, useMemo } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
} from '@tanstack/react-table';
import {
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { useTranslations } from 'next-intl';
import { AccessLevelTemplate } from '../types';
import { MoreHorizontal } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { TemplateFormDialog } from './template-form-dialog';
import { DeleteConfirmationDialog } from './delete-confirmation-dialog';
import { deleteTemplate } from '../actions';

interface DataTableProps {
  data: AccessLevelTemplate[];
}

export function DataTable({ data }: DataTableProps) {
  const t = useTranslations('AccessLevels');
  const tActions = useTranslations('Actions');
  const tToast = useTranslations('Toast');
  const queryClient = useQueryClient();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<AccessLevelTemplate | null>(null);

  const handleEdit = (template: AccessLevelTemplate) => {
    setSelectedTemplate(template);
    setIsFormOpen(true);
  };

  const handleDelete = (template: AccessLevelTemplate) => {
    setSelectedTemplate(template);
    setIsDeleteConfirmOpen(true);
  };

  const deleteMutation = useMutation({
    mutationFn: async (templateId: string) => {
        const result = await deleteTemplate(templateId)

        if (result.errors) {
            throw new Error(Object.values(result.errors).flat().join(', '));
        }

        return result.data
    },
    onSuccess: () => {
      toast.success(tToast('deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['access-level-templates'] });
      setIsDeleteConfirmOpen(false);
      setSelectedTemplate(null);
    },
    onError: (error) => {
        toast.error(tToast('error'), {
            description: error.message,
        });
    },
  });

  const columns: ColumnDef<AccessLevelTemplate>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: t('columns.name'),
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
        accessorKey: "description",
        header: t('columns.description'),
        cell: ({ row }) => {
          const description = row.getValue("description") as string;
          return description ? <div>{description}</div> : <div className="italic text-muted-foreground">{t('columns.noDescription')}</div>;
        },
      },
    {
      id: "actions",
      header: () => <div className="text-right">{tActions('title')}</div>,
      cell: ({ row }) => {
        const template = row.original;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEdit(template)}>{tActions('edit')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDelete(template)} className="text-red-500">{tActions('delete')}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], [t, tActions]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
        sorting,
        columnFilters,
    },
  });

  return (
    <div>
        <div className="flex items-center py-4">
            <Input
            placeholder={t('templates.filterPlaceholder')}
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
                table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
            />
            <Button onClick={() => { setSelectedTemplate(null); setIsFormOpen(true); }} className="ml-auto">
                {t('templates.createButton')}
            </Button>
        </div>
        <div className="rounded-md border">
        <Table>
            <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                    {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                        )}
                    </TableHead>
                ))}
                </TableRow>
            ))}
            </TableHeader>
            <TableBody>
            {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                >
                    {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                    ))}
                </TableRow>
                ))
            ) : (
                <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                    {t('templates.noResults')}
                </TableCell>
                </TableRow>
            )}
            </TableBody>
        </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
            <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            >
            Previous
            </Button>
            <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            >
            Next
            </Button>
      </div>

        <TemplateFormDialog
            isOpen={isFormOpen}
            onOpenChange={setIsFormOpen}
            template={selectedTemplate}
            onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['access-level-templates'] });
            }}
        />
        <DeleteConfirmationDialog 
            isOpen={isDeleteConfirmOpen}
            onOpenChange={setIsDeleteConfirmOpen}
            onConfirm={() => selectedTemplate && deleteMutation.mutate(selectedTemplate.id)}
            isPending={deleteMutation.isPending}
        />
    </div>
  );
}
