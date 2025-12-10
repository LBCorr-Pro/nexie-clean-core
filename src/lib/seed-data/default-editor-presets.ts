// src/lib/seed-data/default-editor-presets.ts
import type { EditorOption } from '@/modules/lexical-editor/components/editor-options';
import { defaultLexicalOptions } from '@/modules/lexical-editor/components/editor-options';
import { defaultTiptapOptions } from '@/modules/tiptap-editor/components/editor-options';

export const defaultLexicalPresets = [
    {
        name: "Editor Completo (Lexical)",
        settings: {
            toolbar: defaultLexicalOptions.map(opt => ({...opt, id: opt.key, active: true }))
        }
    },
    {
        name: "Editor Básico (Lexical)",
        settings: {
            toolbar: defaultLexicalOptions.map(opt => ({
                ...opt,
                id: opt.key,
                active: ['bold', 'italic', 'underline', 'bulletList', 'numberList', 'link'].includes(opt.key)
            }))
        }
    }
];

export const defaultTiptapPresets = [
    {
        name: "Editor Completo (TipTap)",
        settings: {
            toolbar: defaultTiptapOptions.map(opt => ({ ...opt, id: opt.key, active: true }))
        }
    },
    {
        name: "Editor Simples (TipTap)",
        settings: {
            toolbar: defaultTiptapOptions.map(opt => ({
                ...opt,
                id: opt.key,
                active: ['bold', 'italic', 'underline', 'bulletList', 'orderedList', 'link', 'color'].includes(opt.key)
            }))
        }
    }
];
