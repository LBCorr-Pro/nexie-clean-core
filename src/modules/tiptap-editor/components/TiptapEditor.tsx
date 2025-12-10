// src/modules/tiptap-editor/components/TiptapEditor.tsx
"use client";

import React, { useCallback, useEffect, useState, forwardRef, useImperativeHandle, useRef, useMemo } from 'react';
import { useEditor, EditorContent, Editor, BubbleMenu, ChainedCommands } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import { Color } from '@tiptap/extension-color';
import Typography from '@tiptap/extension-typography';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { TipTapToolbar } from './Toolbar';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { type EditorOption } from '../components/editor-options';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import { FontSize } from '../lib/FontSize';
import { useTranslations } from 'next-intl';

const runCommand = (chain: ChainedCommands, command: string) => {
    return (chain as any)[command]().run();
};

interface TiptapEditorProps {
  content: string;
  onChange: (newContent: string) => void;
  activeOptions?: EditorOption[];
  editable?: boolean;
  className?: string;
  placeholder?: string;
  toolbarSuffix?: React.ReactNode;
}

export interface TiptapEditorRef {
  clear: () => void;
  insertText: (text: string) => void;
  getHTML: () => string;
  getTextContent: () => string;
}

function isJSON(str: string): boolean {
  if (typeof str !== 'string' || str.trim() === '' || !str.trim().startsWith('{')) {
    return false;
  }
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

const TiptapEditor = forwardRef<TiptapEditorRef, TiptapEditorProps>(({ content, onChange, activeOptions = [], editable = true, className, placeholder, toolbarSuffix }, ref) => {
  const [isClient, setIsClient] = useState(typeof window !== 'undefined');
  const lastHtmlRef = useRef<string>(content);
  const t = useTranslations('tiptapEditor.toolbar');

  const translations = useMemo(() => ({
      'undo': t('undo'),
      'redo': t('redo'),
      'bold': t('bold'),
      'italic': t('italic'),
      'strike': t('strike'),
      'link': t('link'),
      'bulletList': t('bulletList'),
      'orderedList': t('orderedList'),
      'blockquote': t('blockquote'),
      'codeBlock': t('codeBlock'),
      'horizontalRule': t('horizontalRule'),
      'heading-1': t('heading-1'),
      'heading-2': t('heading-2'),
      'heading-3': t('heading-3'),
      'normalText': t('normalText'),
      'stylePlaceholder': t('stylePlaceholder'),
  }), [t]);

  const extensions = React.useMemo(() => {
    const activeKeys = new Set(activeOptions.map(opt => opt.key));
    const check = (key: string) => activeKeys.has(key);

    const starterKitOptions = {
        history: check('undo') || check('redo') ? {} : false,
        bold: check('bold') ? {} : false,
        italic: check('italic') ? {} : false,
        strike: check('strike') ? {} : false,
        heading: {
            levels: [1, 2, 3].filter(level => check(`heading-${level}`)) as (1 | 2 | 3)[]
        },
        bulletList: check('bulletList') ? {} : false,
        orderedList: check('orderedList') ? {} : false,
        blockquote: check('blockquote') ? {} : false,
        codeBlock: check('codeBlock') ? {} : false,
        horizontalRule: check('horizontalRule') ? {} : false,
    };

    const activeExtensions: any[] = [StarterKit.configure(starterKitOptions)];

    if (check('underline')) activeExtensions.push(Underline);
    if (check('link')) activeExtensions.push(Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }));
    if (check('image')) activeExtensions.push(Image.configure({ inline: true, allowBase64: true }));
    if (placeholder) activeExtensions.push(Placeholder.configure({ placeholder }));
    if (check('highlight')) activeExtensions.push(Highlight.configure({ multicolor: true }));

    activeExtensions.push(TextStyle);
    if (check('fontFamily')) activeExtensions.push(FontFamily.configure({ types: ['textStyle'] }));
    if (check('fontSize')) activeExtensions.push(FontSize.configure({ types: ['textStyle'] }));
    if (check('color')) activeExtensions.push(Color.configure({ types: ['textStyle', 'link'] }));

    if (check('align-left') || check('align-center') || check('align-right') || check('align-justify')) {
        const alignments = ['left', 'center', 'right', 'justify'].filter(align => check(`align-${align}`));
        activeExtensions.push(TextAlign.configure({ types: ['heading', 'paragraph'], alignments: alignments.length > 0 ? alignments : undefined }));
    }

    if (check('typography')) activeExtensions.push(Typography);
    if (check('taskList')) {
        activeExtensions.push(TaskList);
        activeExtensions.push(TaskItem.configure({ nested: true }));
    }

    return activeExtensions;
}, [placeholder, activeOptions]);

  const processedContent = useMemo(() => {
    if (!content) return '';
    return isJSON(content) ? JSON.parse(content) : content;
  }, [content]);

  const editor = useEditor({
    extensions,
    content: processedContent,
    editable: editable,
    onUpdate: ({ editor }) => {
      const newHtml = editor.getHTML();
      if (newHtml !== lastHtmlRef.current) {
        lastHtmlRef.current = newHtml;
        onChange(newHtml);
      }
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl',
          'min-h-[200px] w-full rounded-b-md border-0 bg-background px-3 py-2 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        ),
      },
    },
    immediatelyRender: false,
  });
  
  useImperativeHandle(ref, () => ({
    clear: () => editor?.chain().focus().clearContent().run(),
    insertText: (text) => editor?.chain().focus().insertContent(text).run(),
    getHTML: () => editor?.getHTML() || "",
    getTextContent: () => editor?.getText() || "",
  }));

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  useEffect(() => {
    if (editor && editor.isEditable !== editable) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);
  
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      const currentHtml = editor.getHTML();
      if (content !== currentHtml) {
        const newContentToSet = isJSON(content) ? JSON.parse(content) : content;
        editor.commands.setContent(newContentToSet, false); 
        lastHtmlRef.current = editor.getHTML();
      }
    }
  }, [content, editor]);

  if (!isClient) {
    return (
      <div className={cn("tiptap-container flex flex-col h-full rounded-md border border-input", className)}>
        <Skeleton className="h-10 w-full rounded-t-md rounded-b-none" />
        <Skeleton className="min-h-[200px] w-full rounded-b-md rounded-t-none p-3" />
      </div>
    );
  }

  return (
    <div className={cn("rounded-md border-0", className)}>
      {editable && <TipTapToolbar editor={editor} activeOptions={activeOptions} setLink={setLink} translations={translations} suffix={toolbarSuffix} />}
      <EditorContent editor={editor} />
       {editor && editable && activeOptions.some(opt => opt.key === 'link') && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 100 }}
          className="flex items-center gap-1 p-1 bg-background border border-border rounded-md shadow-xl"
        >
          {activeOptions.some(opt => opt.key === 'bold') && <Toggle size="sm" pressed={editor.isActive("bold")} onPressedChange={() => runCommand(editor.chain().focus(), 'toggleBold')}>{t('bold')}</Toggle>}
          {activeOptions.some(opt => opt.key === 'italic') && <Toggle size="sm" pressed={editor.isActive("italic")} onPressedChange={() => runCommand(editor.chain().focus(), 'toggleItalic')}>{t('italic')}</Toggle>}
          <Button type="button" size="sm" variant="ghost" onClick={setLink}>{t('link')}</Button>
        </BubbleMenu>
      )}
    </div>
  );
});
TiptapEditor.displayName = "TiptapEditor";

export default TiptapEditor;
