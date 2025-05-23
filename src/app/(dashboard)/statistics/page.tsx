'use client';

export default function StatisticsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Statistics</h1>
      
      <p className="text-muted-foreground mb-8">
        View your earnings statistics and flight data analytics.
      </p>
      
      {/* Statistics content will be implemented in future iterations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 border border-border rounded-lg bg-card">
          <h2 className="text-xl font-semibold mb-4">Year-to-Date Earnings</h2>
          <div className="h-64 flex items-center justify-center bg-muted rounded-md">
            <p className="text-muted-foreground">YTD earnings chart will appear here</p>
          </div>
        </div>
        
        <div className="p-6 border border-border rounded-lg bg-card">
          <h2 className="text-xl font-semibold mb-4">Monthly Earnings Trend</h2>
          <div className="h-64 flex items-center justify-center bg-muted rounded-md">
            <p className="text-muted-foreground">Monthly trend chart will appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
}
