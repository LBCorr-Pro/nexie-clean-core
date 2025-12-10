// src/modules/calc-genius/components/FileAnalyzerTab.tsx
"use client";

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileJson, Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/nx-use-toast';

export const FileAnalyzerTab: React.FC = () => {
    const t = useTranslations('calcGenius.analyzerTab');
    const { toast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const uploadedFile = event.target.files[0];
            if (uploadedFile.type.includes('spreadsheetml') || uploadedFile.name.endsWith('.xlsx') || uploadedFile.name.endsWith('.xls')) {
                setFile(uploadedFile);
            } else {
                toast({
                    title: t('errors.invalidFileTypeTitle'),
                    description: t('errors.invalidFileTypeDescription'),
                    variant: 'destructive'
                });
            }
        }
    };

    const handleAnalyze = async () => {
        if (!file) return;
        setIsAnalyzing(true);
        
        toast({ title: t('analysisStarted'), description: t('analysisDescription') });
        
        // Simulate analysis time
        setTimeout(() => {
             setIsAnalyzing(false);
             toast({ title: t('analysisComplete') });
        }, 2000);
    };

    return (
        <Card>
            <CardHeader>
                 <CardTitle className="section-title !border-none !pb-0">
                    <FileJson className="section-title-icon"/>
                    {t('title')}
                </CardTitle>
                 <CardDescription>{t('description')}</CardDescription>
            </CardHeader>
            <CardContent>
                <div>
                    <label htmlFor="file-upload" className="block text-sm font-medium mb-2">{t('fileUploadLabel')}</label>
                    <Input
                        id="file-upload"
                        type="file"
                        onChange={handleFileChange}
                        accept=".xlsx, .xls, .csv, .json, .xml"
                    />
                    {file && <p className="text-sm text-muted-foreground mt-2">{t('selectedFile')}: {file.name}</p>}
                </div>
            </CardContent>
            <CardFooter className="flex flex-col-reverse sm:flex-row sm:justify-start border-t pt-6">
                 <Button onClick={handleAnalyze} disabled={!file || isAnalyzing} className="w-full sm:w-auto">
                    {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    {isAnalyzing ? t('analyzingButton') : t('analyzeButton')}
                </Button>
            </CardFooter>
        </Card>
    );
};
