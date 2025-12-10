// src/modules/tiptap-editor/components/editor-options.ts

import type { LucideIcon } from 'lucide-react';

// Simplificamos a dependência, removendo a necessidade de importar do lexical
export interface EditorOption {
    key: string;
    icon: string; // Mantemos o nome do ícone como string
    active: boolean;
    label?: string; // O label agora é opcional e será fornecido pelo i18n
}

// Os labels foram removidos. Eles agora são gerenciados pelo `useTranslations` no componente principal.
// O `page.tsx` será responsável por mapear as `defaultTiptapOptions` e adicionar os labels traduzidos.
export const defaultTiptapOptions: Omit<EditorOption, 'label'>[] = [
    { key: 'undo', icon: 'Undo2', active: true },
    { key: 'redo', icon: 'Redo2', active: true },
    { key: 'separator_0', icon: 'Minus', active: true },
    { key: 'bold', icon: 'Bold', active: true },
    { key: 'italic', icon: 'Italic', active: true },
    { key: 'underline', icon: 'Underline', active: true },
    { key: 'strike', icon: 'Strikethrough', active: true },
    { key: 'separator_1', icon: 'Minus', active: true },
    { key: 'heading-1', icon: 'Heading1', active: true },
    { key: 'heading-2', icon: 'Heading2', active: true },
    { key: 'heading-3', icon: 'Heading3', active: true },
    { key: 'separator_2', icon: 'Minus', active: true },
    { key: 'bulletList', icon: 'List', active: true },
    { key: 'orderedList', icon: 'ListOrdered', active: true },
    { key: 'taskList', icon: 'ListChecks', active: true },
    { key: 'separator_3', icon: 'Minus', active: true },
    { key: 'blockquote', icon: 'Quote', active: true },
    { key: 'codeBlock', icon: 'SquareCode', active: true },
    { key: 'horizontalRule', icon: 'Minus', active: true },
    { key: 'link', icon: 'Link', active: true },
    { key: 'image', icon: 'Image', active: true },
    { key: 'highlight', icon: 'Highlighter', active: true },
    { key: 'color', icon: 'Palette', active: true },
    { key: 'align-left', icon: 'AlignLeft', active: true },
    { key: 'align-center', icon: 'AlignCenter', active: true },
    { key: 'align-right', icon: 'AlignRight', active: true },
    { key: 'align-justify', icon: 'AlignJustify', active: true },
];
