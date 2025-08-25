'use client';

/**
 * Audit Trail Display Component for Skywage Salary Calculator
 * Phase 5: Shows change history for flight duties
 * Following existing component patterns in the codebase
 */

import { useState, useEffect } from 'react';
import { AuditTrailEntry } from '@/types/salary-calculator';
import { getFlightAuditTrail, getUserAuditTrail } from '@/lib/database/audit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  History,
  User,
  Calendar,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface AuditTrailDisplayProps {
  flightId?: string;
  userId: string;
  maxEntries?: number;
  showUserActions?: boolean;
}

interface AuditEntryWithDetails extends AuditTrailEntry {
  expanded?: boolean;
}

export function AuditTrailDisplay({
  flightId,
  userId,
  maxEntries = 50,
  showUserActions = false
}: AuditTrailDisplayProps) {
  const [auditEntries, setAuditEntries] = useState<AuditEntryWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load audit trail data
  useEffect(() => {
    loadAuditTrail();
  }, [flightId, userId, maxEntries]);

  const loadAuditTrail = async () => {
    setLoading(true);
    setError(null);

    try {
      let result;
      
      if (flightId) {
        // Get audit trail for specific flight
        result = await getFlightAuditTrail(flightId, userId);
      } else {
        // Get user's recent audit trail
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3); // Last 3 months
        
        result = await getUserAuditTrail(userId, startDate, endDate, maxEntries);
      }

      if (result.error) {
        setError(result.error);
      } else {
        setAuditEntries(result.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit trail');
    } finally {
      setLoading(false);
    }
  };

  // Toggle entry expansion
  const toggleExpanded = (entryId: string) => {
    setAuditEntries(prev => 
      prev.map(entry => 
        entry.id === entryId 
          ? { ...entry, expanded: !entry.expanded }
          : entry
      )
    );
  };

  // Format action badge
  const getActionBadge = (action: string) => {
    const variants = {
      created: 'default',
      deleted: 'destructive'
    } as const;

    const icons = {
      created: Plus,
      deleted: Trash2
    };

    const Icon = icons[action as keyof typeof icons] || Plus;
    const variant = variants[action as keyof typeof variants] || 'default';

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {action.charAt(0).toUpperCase() + action.slice(1)}
      </Badge>
    );
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  // Render data changes
  const renderDataChanges = (entry: AuditTrailEntry) => {
    if (!entry.oldData && !entry.newData) return null;

    const oldData = entry.oldData || {};
    const newData = entry.newData || {};
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

    return (
      <div className="mt-3 space-y-2">
        <h5 className="text-sm font-medium text-muted-foreground">Changes:</h5>
        <div className="space-y-1">
          {Array.from(allKeys).map(key => {
            const oldValue = oldData[key];
            const newValue = newData[key];
            
            // Skip if values are the same
            if (JSON.stringify(oldValue) === JSON.stringify(newValue)) return null;
            
            return (
              <div key={key} className="text-xs bg-muted p-2 rounded">
                <div className="font-medium capitalize">{key.replace(/_/g, ' ')}:</div>
                {oldValue !== undefined && (
                  <div className="text-destructive">
                    - {typeof oldValue === 'object' ? JSON.stringify(oldValue) : String(oldValue)}
                  </div>
                )}
                {newValue !== undefined && (
                  <div className="text-green-600">
                    + {typeof newValue === 'object' ? JSON.stringify(newValue) : String(newValue)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2">Loading audit trail...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <p>Error loading audit trail: {error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadAuditTrail}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (auditEntries.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <History className="h-8 w-8 mx-auto mb-2" />
            <p>No audit trail entries found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          {flightId ? 'Flight Change History' : 'Recent Activity'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {auditEntries.map((entry) => (
            <div key={entry.id} className="border rounded-lg p-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getActionBadge(entry.action)}
                  <div>
                    <div className="text-sm font-medium">
                      {entry.changeReason || `Flight duty ${entry.action}`}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      {formatDate(entry.createdAt!)}
                      {showUserActions && (
                        <>
                          <User className="h-3 w-3" />
                          User ID: {entry.userId.slice(0, 8)}...
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {(entry.oldData || entry.newData) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(entry.id!)}
                    className="h-6 w-6 p-0"
                  >
                    {entry.expanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
              
              {entry.expanded && renderDataChanges(entry)}
            </div>
          ))}
        </div>
        
        {auditEntries.length >= maxEntries && (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Showing {maxEntries} most recent entries
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Modal wrapper for audit trail
export function AuditTrailModal({
  flightId,
  userId,
  trigger
}: {
  flightId?: string;
  userId: string;
  trigger: React.ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Audit Trail</DialogTitle>
          <DialogDescription>
            {flightId 
              ? 'Change history for this flight duty'
              : 'Recent activity for your account'
            }
          </DialogDescription>
        </DialogHeader>
        <AuditTrailDisplay 
          flightId={flightId}
          userId={userId}
          showUserActions={!flightId}
        />
      </DialogContent>
    </Dialog>
  );
}
