// src/modules/calc-genius/services/engine.ts
'use server';

import type { Field, Formula } from '../types';

type ReportRow = Record<string, any>;

/**
 * Executes a formula against a dataset.
 * This is the central engine for all calculations.
 *
 * @param formula - The full formula object from Firestore.
 * @param dataset - An array of data objects (rows from the spreadsheet).
 * @param fieldsMap - A Map where keys are field slugs and values are the full field definitions.
 * @returns The result of the calculation. For row-level formulas, this will be an array of results.
 * @throws An error if the formula execution fails.
 */
export async function executeFormula(
  formula: Formula,
  dataset: ReportRow[],
  fieldsMap: Map<string, Field>
): Promise<any> {
  const { expression, formula_type } = formula;

  // Create a reverse map from Column Label to Field Slug (ID)
  const labelToIdMap = new Map<string, string>();
  for (const [id, fieldDef] of fieldsMap.entries()) {
    // The key for lookup will be the 'column_name' if it exists, otherwise the 'label'.
    const lookupKey = fieldDef.origin_config?.column_name || fieldDef.label;
    if(lookupKey) {
        labelToIdMap.set(lookupKey.toLowerCase().trim(), id);
    }
  }

  // Map the original dataset to a dataset where keys are the field slugs.
  const mappedDataset = dataset.map(originalRow => {
    const newRowWithSlugs: ReportRow = {};
    for (const originalHeader in originalRow) {
      const id = labelToIdMap.get(originalHeader.toLowerCase().trim());
      if (id) {
        const fieldDef = fieldsMap.get(id);
        // Parse the value according to the field's data type
        newRowWithSlugs[id] = fieldDef ? parseFieldValue(originalRow[originalHeader], fieldDef.data_type) : originalRow[originalHeader];
      }
    }
    return newRowWithSlugs;
  });

  try {
    if (formula_type === 'aggregation') {
      // The expression (e.g., dataset.reduce(...)) will operate on the mappedDataset
      const formulaFunction = new Function('dataset', 'fieldsMap', `return ${expression}`);
      return formulaFunction(mappedDataset, fieldsMap);

    } else if (formula_type === 'row_level') {
      // For each row, execute the expression.
      return mappedDataset.map(row => {
        // Create a scope for this row where keys are field slugs
        const scope = { ...row };
        const formulaFunction = new Function(...Object.keys(scope), `return ${expression}`);
        return formulaFunction(...Object.values(scope));
      });

    } else if (formula_type === 'fixed_value') {
      // Simply evaluate the expression, no dataset needed.
      const formulaFunction = new Function(`return ${expression}`);
      return formulaFunction();
    }
    
    throw new Error(`Unknown formula type: ${formula_type}`);

  } catch (error) {
    console.error(`Error executing formula: "${expression}"`, error);
    throw new Error(`Execution failed for formula: "${expression}". Error: ${(error as Error).message}`);
  }
}

// Helper to parse values based on field definition
const parseFieldValue = (value: any, dataType: Field['data_type']): any => {
    if (value === undefined || value === null || String(value).trim() === '') {
        return dataType === 'number' ? 0 : dataType === 'boolean' ? false : null;
    }
    
    switch(dataType) {
        case 'number':
            const strValue = String(value).replace(/R\$\s?/, '').replace(/\./g, '').replace(',', '.');
            const num = parseFloat(strValue);
            return isNaN(num) ? 0 : num;
        case 'boolean':
             const lowerValue = String(value).toLowerCase().trim();
             return ['true', '1', 'sim', 's', 'verdadeiro', 'yes', 'y'].includes(lowerValue);
        case 'date':
        case 'datetime':
            // Basic date parsing, can be enhanced
            const parsedDate = new Date(value);
            return isNaN(parsedDate.getTime()) ? null : parsedDate;
        default:
            return String(value);
    }
};
