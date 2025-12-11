# Module: Lexical Editor (ID: lexical-editor)

## Description

This module provides a rich text editor based on the Lexical framework by Meta. It is designed for high performance and extensibility, offering a powerful foundation for complex text editing features.

## Purpose

The primary purpose is to offer an alternative, high-performance WYSIWYG editor. This module is designated as a rich text editor, making it selectable as the default editor in the system settings, alongside other editors like TipTap.

## Firestore Structure

See `firestore-structure.json` in this directory for a detailed definition of the Firestore collections and fields related to this module.

## Main Component

- **Configuration Page:** `src/app/[locale]/(app)/modules/lexical-editor/page.tsx` - This page will allow administrators to configure the editor's toolbar, such as enabling/disabling buttons and reordering them, similar to the TipTap configuration.
