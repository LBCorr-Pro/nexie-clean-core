// src/modules/tiptap-editor/components/Toolbar.tsx
"use client";

import React from 'react';
import { type Editor } from '@tiptap/react';
import { Toggle } from '@/components/ui/toggle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type EditorOption } from './editor-options';
import { ChainedCommands } from '@tiptap/core';
import { Icon } from '@/components/ui/icon';

const runCommand = (chain: ChainedCommands, command: string, args?: any) => {
  const commandFunc = (chain as any)[command];
  if (commandFunc) {
    return commandFunc(args).run();
  }
};

const canRunCommand = (editor: Editor, command: string, args?: any) => {
    const canFunc = (editor.can() as any)[command];
    if (canFunc) {
        return canFunc(args);
    }
    return false;
};

interface TipTapToolbarProps {
  editor: Editor | null;
  activeOptions: EditorOption[];
  setLink: () => void;
  translations: Record<string, string>; // Recebe um objeto com todas as traduções necessárias
  suffix?: React.ReactNode;
}

export const TipTapToolbar = ({ editor, activeOptions, setLink, translations, suffix }: TipTapToolbarProps) => {
  if (!editor) return null;

  const hasOption = (key: string) => activeOptions.some(opt => opt.key === key);
  const t = (key: string) => translations[key] || key; // Função de tradução local

  const headingOptions = [
    { level: 1, key: 'heading-1', name: t('heading-1'), icon: 'Heading1' },
    { level: 2, key: 'heading-2', name: t('heading-2'), icon: 'Heading2' },
    { level: 3, key: 'heading-3', name: t('heading-3'), icon: 'Heading3' },
  ].filter(h => hasOption(h.key));

  const toolbarItems = [
      { key: 'undo', onClick: () => runCommand(editor.chain().focus(), 'undo'), disabled: !canRunCommand(editor, 'undo'), icon: 'Undo2' },
      { key: 'redo', onClick: () => runCommand(editor.chain().focus(), 'redo'), disabled: !canRunCommand(editor, 'redo'), icon: 'Redo2' },
      { key: 'bold', onClick: () => runCommand(editor.chain().focus(), 'toggleBold'), active: editor.isActive('bold'), icon: 'Bold' },
      { key: 'italic', onClick: () => runCommand(editor.chain().focus(), 'toggleItalic'), active: editor.isActive('italic'), icon: 'Italic' },
      { key: 'strike', onClick: () => runCommand(editor.chain().focus(), 'toggleStrike'), active: editor.isActive('strike'), icon: 'Strikethrough' },
      { key: 'link', onClick: setLink, active: editor.isActive('link'), icon: 'Link' },
      { key: 'bulletList', onClick: () => runCommand(editor.chain().focus(), 'toggleBulletList'), active: editor.isActive('bulletList'), icon: 'List' },
      { key: 'orderedList', onClick: () => runCommand(editor.chain().focus(), 'toggleOrderedList'), active: editor.isActive('orderedList'), icon: 'ListOrdered' },
      { key: 'blockquote', onClick: () => runCommand(editor.chain().focus(), 'toggleBlockquote'), active: editor.isActive('blockquote'), icon: 'Quote' },
      { key: 'codeBlock', onClick: () => runCommand(editor.chain().focus(), 'toggleCodeBlock'), active: editor.isActive('codeBlock'), icon: 'SquareCode' },
      { key: 'horizontalRule', onClick: () => runCommand(editor.chain().focus(), 'setHorizontalRule'), icon: 'Minus' },
  ].filter(item => hasOption(item.key));

  return (
    <div className="toolbar-container flex flex-wrap items-center gap-1 p-2 bg-background border border-border rounded-t-md">
      {headingOptions.length > 0 && (
        <Select 
          value={headingOptions.find(h => editor.isActive('heading', { level: h.level }))?.level.toString() || '0'}
          onValueChange={(value) => {
            const level = parseInt(value, 10) as 1 | 2 | 3;
            if (level > 0) {
              runCommand(editor.chain().focus(), 'toggleHeading', { level });
            } else {
                runCommand(editor.chain().focus(), 'setParagraph');
            }
          }}
        >
          <SelectTrigger className="w-auto h-9 px-2.5">
             <SelectValue placeholder={t('stylePlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0"><div className="flex items-center"><Icon name="Pilcrow" className="mr-2 h-4 w-4"/>{t('normalText')}</div></SelectItem>
            {headingOptions.map(h => (
              <SelectItem key={h.level} value={h.level.toString()}><div className="flex items-center"><Icon name={h.icon as any} className="mr-2 h-4 w-4"/>{h.name}</div></SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      
      <div className="flex flex-wrap items-center gap-1">
        {toolbarItems.map(item => (
            <ToolbarButton key={item.key} onClick={item.onClick} disabled={item.disabled} active={item.active} tooltip={t(item.key)}>
                <Icon name={item.icon as any} />
            </ToolbarButton>
        ))}
      </div>
      
      {suffix && <div className="ml-auto">{suffix}</div>}
    </div>
  );
};

interface ToolbarButtonProps extends React.ComponentProps<typeof Toggle> {
    children: React.ReactNode;
    tooltip: string;
    onClick: () => void;
    active?: boolean;
}

const ToolbarButton = React.forwardRef<HTMLButtonElement, ToolbarButtonProps>(({ children, tooltip, onClick, active, ...props }, ref) => {
  return (
     <Toggle
        ref={ref}
        size="sm"
        pressed={active}
        onPressedChange={onClick}
        aria-label={tooltip}
        title={tooltip}
        {...props}
      >
        {React.Children.map(children, child => 
          React.isValidElement(child) ? React.cloneElement(child as React.ReactElement, { className: 'h-4 w-4' }) : child
        )}
    </Toggle>
  )
});

ToolbarButton.displayName = 'ToolbarButton';
