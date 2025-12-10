// src/modules/lexical-editor/components/editor-options.ts

export interface EditorOption {
    key: string;
    icon?: string;
    active: boolean;
    label?: string; // Kept for simplicity in preset management, but UI should use translation.
}

export const defaultLexicalOptions: EditorOption[] = [
    { key: 'undo', icon: 'Undo2', active: true },
    { key: 'redo', icon: 'Redo2', active: true },
    { key: 'separator_0', icon: 'Minus', active: true },
    { key: 'bold', icon: 'Bold', active: true },
    { key: 'italic', icon: 'Italic', active: true },
    { key: 'underline', icon: 'Underline', active: true },
    { key: 'strikethrough', icon: 'Strikethrough', active: true },
    { key: 'code', icon: 'Code', active: true },
    { key: 'separator_1', icon: 'Minus', active: true },
    { key: 'h1', icon: 'Heading1', active: true },
    { key: 'h2', icon: 'Heading2', active: true },
    { key: 'h3', icon: 'Heading3', active: true },
    { key: 'align-left', icon: 'AlignLeft', active: true },
    { key: 'align-center', icon: 'AlignCenter', active: true },
    { key: 'align-right', icon: 'AlignRight', active: true },
    { key: 'align-justify', icon: 'AlignJustify', active: true },
    { key: 'separator_2', icon: 'Minus', active: true },
    { key: 'bulletList', icon: 'List', active: true },
    { key: 'numberList', icon: 'ListOrdered', active: true },
    { key: 'checkList', icon: 'ListChecks', active: true },
    { key: 'separator_3', icon: 'Minus', active: true },
    { key: 'quote', icon: 'Quote', active: true },
    { key: 'codeBlock', icon: 'SquareCode', active: true },
    { key: 'link', icon: 'Link', active: true },
    { key: 'image', icon: 'Image', active: false },
    { key: 'separator_4', icon: 'Minus', active: true },
    { key: 'fontFamily', icon: 'Type', active: true },
    { key: 'fontSize', icon: 'CaseSensitive', active: true },
    { key: 'fontColor', icon: 'Palette', active: true },
    { key: 'fontBgColor', icon: 'Paintbrush', active: true },
];
