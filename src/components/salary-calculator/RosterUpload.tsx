'use client';

/**
 * Roster Upload Component for Skywage Salary Calculator
 * Phase 3: CSV file upload with drag & drop and validation
 * Following existing file upload patterns from AvatarUpload.tsx
 */

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateCSVFileQuick } from '@/lib/salary-calculator/upload-processor';
import { ValidationResult } from '@/types/salary-calculator';

interface RosterUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  className?: string;
}

export function RosterUpload({ onFileSelect, disabled = false, className }: RosterUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);

    // Quick validation
    const validationResult = validateCSVFileQuick(file);
    setValidation(validationResult);

    // If valid, automatically start processing (no extra button needed)
    if (validationResult.valid) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  // Handle file input change
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect, disabled]);

  // Clear selection
  const clearSelection = () => {
    setSelectedFile(null);
    setValidation(null);
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Upload Roster File
        </CardTitle>
        <CardDescription>
          Upload your Flydubai CSV roster file for automatic salary calculation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Upload Area */}
          <div
            className={cn(
              'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors',
              dragActive && !disabled
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50',
              disabled && 'opacity-50 cursor-not-allowed',
              selectedFile && validation?.valid && 'border-accent bg-accent/5'
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={disabled}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            
            <div className="space-y-4">
              {selectedFile ? (
                <div className="space-y-2">
                  <FileText className="h-12 w-12 mx-auto text-primary" />
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="font-medium">Drop your CSV file here</p>
                    <p className="text-sm text-muted-foreground">
                      or click to browse files
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* File Requirements */}
          <div className="text-sm text-muted-foreground space-y-1">
            <p className="font-medium">File Requirements:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>CSV format (.csv extension)</li>
              <li>Flydubai roster format</li>
              <li>Maximum file size: 10MB</li>
              <li>Must contain flight duties data</li>
            </ul>
          </div>

          {/* Validation Results */}
          {validation && (
            <div className="space-y-2">
              {validation.valid ? (
                <div className="flex items-center gap-2 text-accent">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">File validation passed</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Validation errors</span>
                  </div>
                  <ul className="text-sm text-destructive space-y-1 ml-6">
                    {validation.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {validation.warnings && validation.warnings.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-orange-600">Warnings:</p>
                  <ul className="text-sm text-orange-600 space-y-1 ml-6">
                    {validation.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {selectedFile && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={clearSelection}
                disabled={disabled}
                size="sm"
              >
                Clear Selection
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
