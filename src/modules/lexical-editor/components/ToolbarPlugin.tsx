// src/modules/lexical-editor/components/ToolbarPlugin.tsx
"use client";

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  SELECTION_CHANGE_COMMAND,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  ElementFormatType,
  $createParagraphNode,
  $isElementNode,
  UNDO_COMMAND,
  REDO_COMMAND,
  CAN_UNDO_COMMAND,
  CAN_REDO_COMMAND,
} from 'lexical';
import { $patchStyleText, $getSelectionStyleValueForProperty } from '@lexical/selection';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { $isListNode, ListNode, INSERT_UNORDERED_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND, INSERT_CHECK_LIST_COMMAND, REMOVE_LIST_COMMAND } from "@lexical/list";
import { $createHeadingNode, $isHeadingNode, $isQuoteNode, $createQuoteNode } from "@lexical/rich-text";
import { $findMatchingParent, $getNearestNodeOfType } from "@lexical/utils";
import { $createCodeNode, $isCodeNode } from '@lexical/code';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { HexColorPicker } from 'react-colorful';
import { googleFonts } from '@/lib/data/google-fonts';
import { getSelectedNode } from './utils';
import type { EditorOption } from './editor-options';

const fontSizes = ["10px", "12px", "14px", "16px", "18px", "20px", "24px", "30px", "36px"];

const ToolbarButton = ({ command, isActive, icon, label, disabled = false }: { command: () => void, isActive?: boolean, icon: string, label: string, disabled?: boolean }) => (
    <Button
        type="button"
        variant={isActive ? 'secondary' : 'ghost'}
        size="icon"
        className="h-8 w-8"
        aria-label={label}
        onClick={command}
        onMouseDown={(e) => e.preventDefault()}
        disabled={disabled}
    >
        <Icon name={icon} className="h-4 w-4" />
    </Button>
);

const ColorPicker = ({ onChange, color }: { onChange: (color: string) => void; color: string; }) => (
  <HexColorPicker color={color} onChange={onChange} />
);

interface ToolbarPluginProps {
    activeOptions: EditorOption[];
    t: (key: string) => string;
}

// Helper to convert kebab-case to camelCase
const kebabToCamelCase = (str: string) => {
    return str.replace(/-./g, x => x[1].toUpperCase());
};

export default function ToolbarPlugin({ activeOptions, t }: ToolbarPluginProps) {
  const [editor] = useLexicalComposerContext();
  
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isLink, setIsLink] = useState(false);
  
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  
  const [blockType, setBlockType] = useState<string>("paragraph");
  const [elementFormat, setElementFormat] = useState<ElementFormatType>("left");
  
  const [fontFamily, setFontFamily] = useState<string>('Inter');
  const [fontSize, setFontSize] = useState<string>('14px');
  const [fontColor, setFontColor] = useState<string>("#000");
  const [bgColor, setBgColor] = useState<string>("#fff");

  const isStyleChangeByUser = useRef(false);

  const applyStyleText = useCallback((styles: Record<string, string>) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $patchStyleText(selection, styles);
      }
    });
  }, [editor]);

  const onFontFamilySelect = useCallback((value: string) => {
    isStyleChangeByUser.current = true;
    setFontFamily(value);
    applyStyleText({ 'font-family': value });
  }, [applyStyleText]);

  const onFontSizeSelect = useCallback((value: string) => {
    isStyleChangeByUser.current = true;
    setFontSize(value);
    applyStyleText({ 'font-size': value });
  }, [applyStyleText]);
  
  const onFontColorSelect = useCallback((value: string) => { setFontColor(value); applyStyleText({ color: value }); }, [applyStyleText]);
  const onBgColorSelect = useCallback((value: string) => { setBgColor(value); applyStyleText({ 'background-color': value }); }, [applyStyleText]);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
      setIsCode(selection.hasFormat('code'));

      const node = getSelectedNode(selection);
      const parent = node.getParent();
      setIsLink($isLinkNode(parent) || $isLinkNode(node));

      const anchorNode = selection.anchor.getNode();
      const element = anchorNode.getKey() === 'root' ? anchorNode : $findMatchingParent(anchorNode, (e) => { const parent = e.getParent(); return parent !== null && parent.getKey() === 'root'; });
      if (element) {
          if ($isListNode(element)) {
            const parentList = $getNearestNodeOfType<ListNode>(anchorNode, ListNode);
            const type = parentList ? parentList.getListType() : element.getListType();
            setBlockType(type);
          } else {
            const type = $isHeadingNode(element) ? element.getTag() : ($isQuoteNode(element) ? 'quote' : ($isCodeNode(element) ? 'code' : element.getType()));
            setBlockType(type);
          }
          if ($isElementNode(element)) {
             setElementFormat(element.getFormatType());
          }
      }
      
      if (isStyleChangeByUser.current) {
        isStyleChangeByUser.current = false;
        return;
      }
      setFontFamily($getSelectionStyleValueForProperty(selection, "font-family", "Inter"));
      setFontSize($getSelectionStyleValueForProperty(selection, "font-size", "14px"));
      setFontColor($getSelectionStyleValueForProperty(selection, "color", "#000"));
      setBgColor($getSelectionStyleValueForProperty(selection, "background-color", "#fff"));
    }
  }, []);

  useEffect(() => {
    const unregisterListener = editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      });

    const unregisterCanUndo = editor.registerCommand(CAN_UNDO_COMMAND, (payload) => { setCanUndo(payload); return false; }, COMMAND_PRIORITY_CRITICAL);
    const unregisterCanRedo = editor.registerCommand(CAN_REDO_COMMAND, (payload) => { setCanRedo(payload); return false; }, COMMAND_PRIORITY_CRITICAL);

    return () => {
        unregisterListener();
        unregisterCanUndo();
        unregisterCanRedo();
    };
  }, [editor, updateToolbar]);

  const insertLink = useCallback(() => {
    if (!isLink) {
      const url = prompt(t('toolbar.prompts.enterUrl'));
      if (url) editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  }, [editor, isLink, t]);

  const formatBlock = (type: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      if (type === blockType) {
        if (['bullet', 'number', 'check'].includes(type)) {
          editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
        } else {
          $createParagraphNode().select();
        }
        return;
      }
  
      switch(type) {
        case 'h1':
        case 'h2':
        case 'h3':
          $createHeadingNode(type).select();
          break;
        case 'quote':
          $createQuoteNode().select();
          break;
        case 'code':
          $createCodeNode().select();
          break;
        case 'bullet':
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
          break;
        case 'number':
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
          break;
        case 'check':
          editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
          break;
        default:
          $createParagraphNode().select();
          break;
      }
    });
  };

  const commandMap: Record<string, () => void> = {
    'undo': () => editor.dispatchCommand(UNDO_COMMAND, undefined),
    'redo': () => editor.dispatchCommand(REDO_COMMAND, undefined),
    'bold': () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold'),
    'italic': () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic'),
    'underline': () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline'),
    'strikethrough': () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough'),
    'code': () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code'),
    'h1': () => formatBlock('h1'),
    'h2': () => formatBlock('h2'),
    'h3': () => formatBlock('h3'),
    'align-left': () => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left'),
    'align-center': () => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center'),
    'align-right': () => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right'),
    'align-justify': () => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify'),
    'bulletList': () => formatBlock('bullet'),
    'numberList': () => formatBlock('number'),
    'checkList': () => formatBlock('check'),
    'quote': () => formatBlock('quote'),
    'codeBlock': () => formatBlock('code'),
    'link': insertLink,
  };
  
  const getIsActive = (key: string): boolean => {
    switch (key) {
        case 'bold': return isBold;
        case 'italic': return isItalic;
        case 'underline': return isUnderline;
        case 'strikethrough': return isStrikethrough;
        case 'code': return isCode;
        case 'link': return isLink;
        case 'h1': case 'h2': case 'h3': case 'quote': case 'codeBlock':
            return blockType === key;
        case 'bulletList': return blockType === 'bullet';
        case 'numberList': return blockType === 'number';
        case 'checkList': return blockType === 'check';
        case 'align-left': return elementFormat === 'left';
        case 'align-center': return elementFormat === 'center';
        case 'align-right': return elementFormat === 'right';
        case 'align-justify': return elementFormat === 'justify';
        default: return false;
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b mb-2 bg-background rounded-t-md">
      {activeOptions.map((opt) => {
        if (opt.key.startsWith('separator')) {
          return <Separator key={opt.key} orientation="vertical" className="h-6 mx-1" />;
        }
        
        const command = commandMap[opt.key];
        const label = t(`toolbar.${kebabToCamelCase(opt.key)}` as any);

        if (command) {
            if (opt.key === 'undo') {
                return <ToolbarButton key={opt.key} command={command} disabled={!canUndo} icon={opt.icon || 'HelpCircle'} label={label} />;
            }
            if (opt.key === 'redo') {
                return <ToolbarButton key={opt.key} command={command} disabled={!canRedo} icon={opt.icon || 'HelpCircle'} label={label} />;
            }
            return (
                <ToolbarButton
                key={opt.key}
                command={command}
                isActive={getIsActive(opt.key)}
                icon={opt.icon || 'HelpCircle'}
                label={label}
                />
            );
        }
        
        if(opt.key === 'fontFamily') {
          return (
             <Select key={opt.key} onValueChange={onFontFamilySelect} value={fontFamily}>
              <SelectTrigger onMouseDown={(e) => e.preventDefault()} className="h-8 w-32 text-xs px-2">
                <SelectValue placeholder={t('toolbar.placeholders.fontFamily')} />
              </SelectTrigger>
              <SelectContent>
                {googleFonts.map(font => (
                    <SelectItem key={font.family} value={font.family}>
                        <span style={{ fontFamily: font.family }}>{font.family}</span>
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        }
        
        if (opt.key === 'fontSize') {
            return (
              <Select key={opt.key} onValueChange={onFontSizeSelect} value={fontSize}>
                <SelectTrigger onMouseDown={(e) => e.preventDefault()} className="h-8 w-20 text-xs px-2">
                  <SelectValue placeholder={t('toolbar.placeholders.fontSize')} />
                </SelectTrigger>
                <SelectContent>
                  {fontSizes.map(size => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
        }

        if (opt.key === 'fontColor') {
          return (
            <Popover key={opt.key}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={t('toolbar.ariaLabels.fontColor')}>
                    <Icon name="Palette" className="h-4 w-4" style={{ color: fontColor }}/>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <ColorPicker color={fontColor} onChange={onFontColorSelect} />
              </PopoverContent>
            </Popover>
          );
        }

        if (opt.key === 'fontBgColor') {
          return (
            <Popover key={opt.key}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={t('toolbar.ariaLabels.fontBgColor')}>
                    <Icon name="Paintbrush" className="h-4 w-4" style={{ color: bgColor }}/>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <ColorPicker color={bgColor} onChange={onBgColorSelect} />
              </PopoverContent>
            </Popover>
          );
        }

        return null;
      })}
    </div>
  );
}
