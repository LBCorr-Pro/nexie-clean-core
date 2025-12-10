// src/modules/lexical-editor/components/LexicalEditor.tsx
"use client";

import React, { useMemo } from 'react';
import { LexicalComposer, InitialConfigType } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import ToolbarPlugin from './ToolbarPlugin';
import type { EditorOption } from './editor-options';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import type { EditorState } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $generateNodesFromDOM, $generateHtmlFromNodes } from '@lexical/html';
import { $getRoot, $getSelection } from 'lexical';
import { useTranslations } from 'next-intl';

const theme = { /* Custom theme config can go here */ };
function onError(error: Error) { console.error(error); }

const initialNodes = [ HeadingNode, ListNode, ListItemNode, QuoteNode, CodeNode, CodeHighlightNode, TableNode, TableCellNode, TableRowNode, AutoLinkNode, LinkNode ];

interface LexicalEditorProps {
    content: string;
    onChange: (content: string) => void;
    activeOptions: EditorOption[];
    placeholderText?: string;
    editable?: boolean;
}

function isLexicalJSON(str: string): boolean {
    if (typeof str !== 'string' || !str.trim().startsWith('{')) {
        return false;
    }
    try {
        const json = JSON.parse(str);
        return json.root && json.root.children;
    } catch (e) {
        return false;
    }
}

const HtmlInitializerPlugin = ({ initialHtml }: { initialHtml: string }) => {
    const [editor] = useLexicalComposerContext();
    
    React.useEffect(() => {
        if (initialHtml && !isLexicalJSON(initialHtml)) {
            editor.update(() => {
                const parser = new DOMParser();
                const dom = parser.parseFromString(initialHtml, 'text/html');
                const root = $getRoot();
                root.clear();
                
                const nodes = $generateNodesFromDOM(editor, dom);
                const selection = $getRoot().select();
                if(selection) selection.insertNodes(nodes);
            });
        }
    }, [editor, initialHtml]);

    return null;
};

const LexicalEditor: React.FC<LexicalEditorProps> = ({ content, onChange, activeOptions, placeholderText, editable = true }) => {
    const t = useTranslations('lexical');
    const editorKey = useMemo(() => content, [content]);

    const initialEditorState = useMemo(() => {
        if (!content || content.trim() === '') {
            return null;
        }
        if (isLexicalJSON(content)) {
            return content;
        }
        return null;
    }, [content]);

    const initialConfig: InitialConfigType = {
        namespace: 'LexicalEditorComponent',
        theme,
        onError,
        nodes: initialNodes,
        editorState: initialEditorState,
        editable,
    };
    
    const handleOnChange = (editorState: EditorState, editor: any) => {
        editorState.read(() => {
            const htmlString = $generateHtmlFromNodes(editor, null);
            onChange(htmlString);
        });
    };

    return (
        <LexicalComposer initialConfig={initialConfig} key={editorKey}>
            <div className="border rounded-md min-h-[300px] flex flex-col">
                {editable && <ToolbarPlugin activeOptions={activeOptions} t={t} />}
                <div className="p-4 flex-grow relative bg-background rounded-b-md">
                    <RichTextPlugin
                        contentEditable={<ContentEditable className="outline-none h-full min-h-[200px] resize-none" />}
                        placeholder={<div className="absolute top-4 left-4 text-muted-foreground pointer-events-none">{placeholderText || t('placeholder')}</div>}
                        ErrorBoundary={LexicalErrorBoundary}
                    />
                    <OnChangePlugin onChange={handleOnChange} />
                    <HistoryPlugin />
                    <ListPlugin />
                    <LinkPlugin />
                    {!initialEditorState && content && <HtmlInitializerPlugin initialHtml={content} />}
                </div>
            </div>
        </LexicalComposer>
    );
};

export default LexicalEditor;
