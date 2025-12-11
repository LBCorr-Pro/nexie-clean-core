# Module: Calc Genius (ID: calc-genius)

## Description

A generic calculation engine module. It allows users to define input fields from various sources (manual, spreadsheets, APIs) and create formulas that consume these fields to produce calculated results.

## Purpose

- **Field Creator:** Register data input fields with configurations like ID, label, origin type, and data type.
- **Formula Builder:** Create formulas using a simple expression language that references the defined fields.
- **Group Manager:** Organize fields and formulas into logical groups.
- **Data Fetcher:** A service to retrieve and normalize data from different origins.
- **Calc Engine:** The core service to execute formulas and return results.

## Firestore Structure

Refer to `firestore-structure.json` in this directory for the expected Firestore collections and document fields related to this module.

## Main Component

The main user interface for this module will be located in `src/modules/calc-genius/page.tsx`.
