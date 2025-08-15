"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const BRAND = { primary: "#4C49ED", accent: "#6DDC91", neutral: "#FFFFFF" };

type DutySample = {
  kind: "Layover" | "Turnaround";
  date: string;
  flightNo: string;
  routing: string;
  reporting: string;
  debriefing: string;
  restPeriod?: string;
  totalDuty: string;
  perDiem?: string;
  pay: string;
};

const sample: DutySample = {
  kind: "Layover",
  date: "04 Aug 2025",
  flightNo: "FZ1793",
  routing: "DXB → ZAG",
  reporting: "08:20 04/08",
  debriefing: "16:00 04/08",
  restPeriod: "23h 30m",
  totalDuty: "07:40",
  perDiem: "AED 235.00",
  pay: "AED 383.33",
};

// Sample data for layover segments
const layoverOutbound = {
  kind: "Layover" as const,
  date: "04 Aug 2025",
  flightNo: "FZ1793",
  routing: "DXB → ZAG",
  reporting: "08:20 04/08",
  debriefing: "16:00 04/08",
  restPeriod: "23h 30m",
  totalDuty: "07:40",
  perDiem: "AED 235.00",
  pay: "AED 383.33",
};

const layoverInbound = {
  kind: "Layover" as const,
  date: "05 Aug 2025",
  flightNo: "FZ1794",
  routing: "ZAG → DXB",
  reporting: "15:30 05/08",
  debriefing: "22:45 05/08",
  restPeriod: undefined,
  totalDuty: "07:15",
  perDiem: undefined,
  pay: "AED 362.50",
};

export default function FlightCardDesignTestPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-10" style={{ backgroundColor: `${BRAND.primary}0A` }}>
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Flight Duty Card – Horizontal (Inspired)</h1>
        <p className="text-muted-foreground">Three new horizontally oriented designs inspired by your screenshot.</p>
      </header>

      {/* FLIGHT CARD DESIGNS */}
      <div className="space-y-8">
        <h1 className="text-2xl font-bold text-center mb-8">Flight Card Designs</h1>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Layover</h2>
          <div className="max-w-md">
            <LayoverConnectedCards outbound={layoverOutbound} inbound={layoverInbound} />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Turnaround</h2>
          <div className="max-w-md">
            <CompactWhite3Turnaround duty={{ ...sample, kind: "Turnaround", flightNo: "FZ203 FZ204", routing: "DXB → EBL → DXB", restPeriod: undefined, perDiem: undefined, totalDuty: "08:05", pay: "AED 404.17" }} />
          </div>
        </section>
      </div>

    </div>
  );
}

function formatDateTime(text: string) { return text; }





// DESIGN 3: Purple Accents - With brand color highlights
function CompactWhite3({ duty }: { duty: DutySample }) {
  const [from, to] = duty.routing.split(" → ");
  return (
    <Card className="rounded-2xl border-0 bg-white shadow-none">
      <div className="px-4 py-3">
        {/* Total duty badge */}
        <div className="text-center mb-2">
          <span className="inline-block text-white text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: BRAND.primary }}>
            {duty.totalDuty.replace(':', 'h ')}m Duty
          </span>
        </div>

        {/* Main routing section */}
        <div className="grid grid-cols-3 items-center gap-2 mb-2">
          <div className="text-center">
            <div className="text-lg font-bold tracking-wide text-gray-900">{from}</div>
            <div className="text-xs text-gray-500 mt-0.5">{formatDateTime(duty.reporting)}</div>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 mb-1">
              <div className="h-px w-6" style={{ backgroundColor: BRAND.primary }}></div>
              <div className="text-sm" style={{ color: BRAND.primary }}>✈</div>
              <div className="h-px w-6" style={{ backgroundColor: BRAND.primary }}></div>
            </div>
            <div className="text-xs font-semibold text-white rounded-full px-2 py-0.5" style={{ backgroundColor: BRAND.accent }}>
              {duty.pay}
            </div>
          </div>

          <div className="text-center">
            <div className="text-lg font-bold tracking-wide text-gray-900">{to}</div>
            <div className="text-xs text-gray-500 mt-0.5">{formatDateTime(duty.debriefing)}</div>
          </div>
        </div>

        {/* Layover info */}
        {duty.restPeriod && (
          <div className="text-center text-gray-600 text-xs">
            Layover: {to} {duty.restPeriod}. Per Diem {duty.perDiem}
          </div>
        )}
      </div>
    </Card>
  );
}

// DESIGN 3 TURNAROUND: Purple Accents - Exactly like layover but shows "Turnaround"
function CompactWhite3Turnaround({ duty }: { duty: DutySample }) {
  const [from, to] = duty.routing.split(" → ");
  return (
    <Card className="rounded-2xl border-0 bg-white shadow-none" style={{ minHeight: '120px', maxHeight: '120px' }}>
      <div className="px-4 py-3">
        {/* Flight number, Payment badge, and Total duty badge - same line */}
        <div className="relative flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500 font-bold">FZ203 FZ204</span>
          <div className="absolute left-1/2 transform -translate-x-1/2 text-xs font-semibold text-white rounded-full px-2 py-0.5" style={{ backgroundColor: BRAND.accent }}>
            {duty.pay}
          </div>
          <span className="inline-block text-white text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: BRAND.primary }}>
            {duty.totalDuty.replace(':', 'h ')}m Duty
          </span>
        </div>

        {/* Main routing section */}
        <div className="grid grid-cols-3 items-center gap-2 mb-2">
          <div className="text-center">
            <div className="text-lg font-bold tracking-wide text-gray-900">{from}</div>
            <div className="text-xs text-gray-500 mt-0.5">{formatDateTime(duty.reporting)}</div>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 mb-1">
              <div className="h-px w-6" style={{ backgroundColor: BRAND.primary }}></div>
              <div className="text-sm" style={{ color: BRAND.primary }}>✈</div>
              <div className="h-px w-6" style={{ backgroundColor: BRAND.primary }}></div>
            </div>
            <div className="text-xs font-semibold text-gray-700">
              Turnaround
            </div>
          </div>

          <div className="text-center">
            <div className="text-lg font-bold tracking-wide text-gray-900">{to}</div>
            <div className="text-xs text-gray-500 mt-0.5">{formatDateTime(duty.debriefing)}</div>
          </div>
        </div>



      </div>
    </Card>
  );
}

// LAYOVER CONNECTED CARDS: Two-segment layover interface with navigation
function LayoverConnectedCards({ outbound, inbound }: { outbound: DutySample, inbound: DutySample }) {
  const [currentSegment, setCurrentSegment] = React.useState<'outbound' | 'inbound'>('outbound');
  const currentDuty = currentSegment === 'outbound' ? outbound : inbound;
  const [from, to] = currentDuty.routing.split(" → ");

  return (
    <div className="relative">
      {/* Navigation indicators */}
      <div className="flex items-center justify-center mb-2 gap-2">
        <button
          onClick={() => setCurrentSegment('outbound')}
          className="w-2 h-2 rounded-full transition-colors"
          style={{ backgroundColor: currentSegment === 'outbound' ? BRAND.primary : '#d1d5db' }}
        />
        <button
          onClick={() => setCurrentSegment('inbound')}
          className="w-2 h-2 rounded-full transition-colors"
          style={{ backgroundColor: currentSegment === 'inbound' ? BRAND.primary : '#d1d5db' }}
        />
      </div>

      {/* Card container */}
      <div className="relative">
        {/* Main card */}
        <Card className="rounded-2xl border-0 bg-white shadow-none" style={{ minHeight: '120px', maxHeight: '120px' }}>
          <div className="px-4 py-3">
            {/* Flight number, Payment badge, and Total duty badge - same line */}
            <div className="relative flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-bold">{currentDuty.flightNo}</span>
              <div className="absolute left-1/2 transform -translate-x-1/2 text-xs font-semibold text-white rounded-full px-2 py-0.5" style={{ backgroundColor: BRAND.accent }}>
                {currentDuty.pay}
              </div>
              <span className="inline-block text-white text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: BRAND.primary }}>
                {currentDuty.totalDuty.replace(':', 'h ')}m Duty
              </span>
            </div>

            {/* Main routing section */}
            <div className="grid grid-cols-3 items-center gap-2 mb-1">
              <div className="text-center">
                <div className="text-lg font-bold tracking-wide text-gray-900">{from}</div>
                <div className="text-xs text-gray-500 mt-0.5">{formatDateTime(currentDuty.reporting)}</div>
              </div>

              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 mb-0.5">
                  <div className="h-px w-6" style={{ backgroundColor: BRAND.primary }}></div>
                  <div className="text-sm" style={{ color: BRAND.primary }}>✈</div>
                  <div className="h-px w-6" style={{ backgroundColor: BRAND.primary }}></div>
                </div>
                <div className="text-xs text-gray-700 font-semibold">
                  Layover
                </div>
              </div>

              <div className="text-center">
                <div className="text-lg font-bold tracking-wide text-gray-900">{to}</div>
                <div className="text-xs text-gray-500 mt-0.5">{formatDateTime(currentDuty.debriefing)}</div>
              </div>
            </div>

            {/* Layover details - only show on outbound */}
            {currentSegment === 'outbound' && currentDuty.restPeriod && (
              <div className="text-xs text-gray-600 text-center mt-0.5">
                {currentDuty.routing.split(" → ")[1]} {currentDuty.restPeriod} - {currentDuty.perDiem}
              </div>
            )}

          </div>
        </Card>
      </div>
    </div>
  );
}







