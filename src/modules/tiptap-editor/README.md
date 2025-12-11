# Module: TipTap Editor (ID: tiptap-editor)

## Description

This module provides a rich text editor based on the popular TipTap library. It allows for advanced text formatting, creation of lists, insertion of links, and more.

## Purpose

The primary purpose is to offer a robust and extensible What-You-See-Is-What-You-Get (WYSIWYG) editor that can be used throughout the application for any long-form text content. This module is designated as a rich text editor, making it selectable as the default editor in the system settings.

## Firestore Structure

See `firestore-structure.json` in this directory for a detailed definition of the Firestore collections and fields related to this module.

## Main Component

- **Configuration Page:** `src/app/[locale]/(app)/modules/tiptap-editor/page.tsx` - This page will allow administrators to configure the editor's toolbar, such as enabling/disabling buttons (bold, italic, etc.) and reordering them.
