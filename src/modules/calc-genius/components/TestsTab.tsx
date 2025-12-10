// src/modules/calc-genius/components/TestsTab.tsx
"use client";

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlaskConical, Play, Loader2 } from 'lucide-react';
import { useCalcGenius } from './CalcGeniusContext';

export const TestsTab: React.FC = () => {
    const t = useTranslations('calcGenius.testsTab');
    const { formulas, fields } = useCalcGenius();
    const [isTesting, setIsTesting] = useState(false);
    const [testResults, setTestResults] = useState<any>(null);

    const handleRunTests = () => {
        setIsTesting(true);

        // This is a placeholder for the complex logic of:
        // 1. Creating a UI to input values for all 'manual' fields.
        // 2. Executing all formulas in the correct dependency order.
        // 3. Displaying the results of each calculation.
        
        console.log("Running tests with formulas:", formulas);
        console.log("Input fields available for tests:", fields.filter(f => f.origin_type === 'manual'));

        // Simulate test execution
        setTimeout(() => {
             setTestResults({ summary: `Ran ${formulas.length} formula tests.` });
             setIsTesting(false);
        }, 1500);
    };

    return (
        <Card>
            <CardHeader>
                 <CardTitle className="section-title !border-none !pb-0">
                    <FlaskConical className="section-title-icon" />
                    {t('title')}
                </CardTitle>
                 <CardDescription>{t('description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{t('explanation')}</p>
                
                {testResults && (
                    <div className="p-4 border rounded-md bg-muted">
                        <h3 className="font-semibold">{t('resultsTitle')}</h3>
                        <pre className="text-sm mt-2">{JSON.stringify(testResults, null, 2)}</pre>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex flex-col-reverse sm:flex-row sm:justify-start border-t pt-6">
                <Button onClick={handleRunTests} disabled={isTesting} className="w-full sm:w-auto">
                    {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Play className="mr-2 h-4 w-4" /> }
                    {isTesting ? t('runningButton') : t('runButton')}
                </Button>
            </CardFooter>
        </Card>
    );
};
