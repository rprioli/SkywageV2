'use client';

/**
 * CSV Upload Page for Skywage Salary Calculator
 * Phase 3: Complete upload workflow with progress tracking
 * Following existing dashboard page patterns
 */

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { RosterUpload } from '@/components/salary-calculator/RosterUpload';
import { ProcessingStatus } from '@/components/salary-calculator/ProcessingStatus';
import { UploadResults } from '@/components/salary-calculator/UploadResults';
import { 
  processCSVUpload,
  ProcessingStatus as ProcessingStatusType,
  ProcessingResult 
} from '@/lib/salary-calculator/upload-processor';
import { Position } from '@/types/salary-calculator';

type UploadState = 'upload' | 'processing' | 'results';

export default function UploadPage() {
  const { user } = useAuth();
  
  // State management
  const [uploadState, setUploadState] = useState<UploadState>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatusType | null>(null);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);

  // Get user position
  const userPosition = (user?.user_metadata?.position as Position) || 'CCM';
  const userId = user?.id;

  // Handle file selection and start processing
  const handleFileSelect = async (file: File) => {
    if (!userId) {
      console.error('User not authenticated');
      return;
    }

    setSelectedFile(file);
    setUploadState('processing');

    try {
      const result = await processCSVUpload(
        file,
        userId,
        userPosition,
        (status) => {
          setProcessingStatus(status);
        }
      );

      setProcessingResult(result);
      setUploadState('results');
    } catch (error) {
      console.error('Processing error:', error);
      setProcessingStatus({
        step: 'error',
        progress: 0,
        message: 'Processing failed',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      setUploadState('results');
    }
  };

  // Handle starting over
  const handleStartOver = () => {
    setUploadState('upload');
    setSelectedFile(null);
    setProcessingStatus(null);
    setProcessingResult(null);
  };

  // Handle download report (placeholder)
  const handleDownloadReport = () => {
    // TODO: Implement report download functionality
    console.log('Download report functionality to be implemented');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/salary-calculator">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Calculator
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-primary">
            Upload Roster
          </h1>
          <p className="text-muted-foreground">
            Upload your CSV roster file for automatic salary calculation
          </p>
        </div>
      </div>

      {/* Content based on state */}
      <div className="max-w-4xl">
        {uploadState === 'upload' && (
          <RosterUpload 
            onFileSelect={handleFileSelect}
            disabled={!userId}
          />
        )}

        {uploadState === 'processing' && processingStatus && (
          <ProcessingStatus 
            status={processingStatus}
          />
        )}

        {uploadState === 'results' && processingResult && selectedFile && (
          <UploadResults
            result={processingResult}
            fileName={selectedFile.name}
            onStartOver={handleStartOver}
            onDownloadReport={handleDownloadReport}
          />
        )}
      </div>

      {/* User Info */}
      <div className="max-w-4xl">
        <div className="bg-muted/50 rounded-lg p-4 text-sm">
          <p className="font-medium mb-2">Current Settings:</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-muted-foreground">Position: </span>
              <span className="font-medium">{userPosition}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Airline: </span>
              <span className="font-medium">{user?.user_metadata?.airline || 'Flydubai'}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            To change these settings, visit your <Link href="/profile" className="text-primary hover:underline">Profile page</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
