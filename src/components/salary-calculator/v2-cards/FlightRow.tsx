/**
 * FlightRow — Single sector row inside the flights panel.
 * Displays flight number, route, times (with optional report/debrief), and block time.
 */

interface FlightRowProps {
  flightNumber: string;
  route: string;
  times: React.ReactNode;
  blockTime?: string;
}

export function FlightRow({ flightNumber, route, times, blockTime }: FlightRowProps) {
  return (
    <div className="grid grid-cols-[50px_1fr_auto] sm:grid-cols-[50px_72px_1fr_auto] items-baseline gap-x-2 text-[13px]">
      <span className="font-semibold text-[#3A3780]">{flightNumber}</span>
      <span className="hidden sm:inline text-[#3A3780]/55 whitespace-nowrap">{route}</span>
      <span className="text-[#3A3780]/80 font-medium tabular-nums">{times}</span>
      {blockTime && (
        <span className="text-[#3A3780]/60 font-medium tabular-nums whitespace-nowrap">{blockTime}</span>
      )}
    </div>
  );
}
