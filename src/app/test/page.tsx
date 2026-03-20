'use client';

import { notFound } from 'next/navigation';
import { TurnaroundCardV2 } from '@/components/salary-calculator/v2-cards/TurnaroundCardV2';
import { LayoverCardV2 } from '@/components/salary-calculator/v2-cards/LayoverCardV2';
import { SimpleDutyCardV2 } from '@/components/salary-calculator/v2-cards/SimpleDutyCardV2';
import { CardShell } from '@/components/salary-calculator/v2-cards/CardShell';
import { INNER_PANEL_CLASS } from '@/components/salary-calculator/v2-cards/constants';
import { Clock, Coffee, Banknote, UtensilsCrossed } from 'lucide-react';

function TimeLabel({ children }: { children: string }) {
  return <span className="font-medium tabular-nums text-[#3A3780]/80">{children}</span>;
}


export default function TestCardsPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return (
    <div className="min-h-screen bg-[rgba(76,73,237,0.05)] p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-10">

        {/* ── SECTION: Unified Salary Overview (reference design) ── */}
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Preview</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            Unified Salary Overview
          </h1>
        </div>

        <CardShell>
          <div className={`${INNER_PANEL_CLASS} p-6 md:p-8 lg:p-10`}>
            {/* Top: salary + stats + year selector */}
            <div className="flex flex-col gap-6 border-b border-[#ECE9FA] pb-8 md:flex-row md:items-start md:justify-between">
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A09ABD]">Overview</p>
                  <h2 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-[#332F8A] md:text-5xl">
                    AED 15,015.47
                  </h2>
                </div>
                <p className="text-[15px] text-[#827DA5]">
                  Expected salary for <span className="font-semibold text-[#4C49ED]">Mar, 2026</span>
                </p>

                {/* Inline KPI stats */}
                <div className="grid gap-3 pt-2 md:grid-cols-3 md:gap-0">
                  {[
                    { icon: Clock, label: 'Flight Hours', value: '106' },
                    { icon: Banknote, label: 'Flight Pay', value: 'AED 5,301.68' },
                    { icon: UtensilsCrossed, label: 'Per Diem', value: 'AED 808.79' },
                  ].map((item, index) => (
                    <div key={item.label} className="flex min-w-0 items-center gap-2.5 md:px-3 first:md:pl-0 last:md:pr-0">
                      <span className="flex h-5 w-5 items-center justify-center text-[#706AB5]">
                        <item.icon className="h-4 w-4" strokeWidth={1.8} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A6A1C3]">
                          {item.label}
                        </p>
                        <p className="truncate text-sm font-semibold tracking-[-0.02em] text-[#312D82] md:text-[15px]">
                          {item.value}
                        </p>
                      </div>
                      {index < 2 && (
                        <span className="ml-1 hidden h-6 w-px bg-[#ECE8F8] md:block" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Year selector pill */}
              <div className="flex items-center gap-2.5 self-start rounded-[18px] border border-[#ECE8F8] bg-white/72 px-3.5 py-2.5 shadow-[0_8px_18px_rgba(103,84,214,0.05)]">
                <span className="text-[13px] font-medium text-[#8B86A9]">Year</span>
                <span className="text-[15px] font-semibold text-[#332F8A]">2026</span>
              </div>
            </div>

            {/* Chart area — recessed container */}
            <div className="mt-6">
              <div className="relative rounded-[30px] bg-[#FCFBFF]/50 px-4 pb-4 pt-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.68)] md:px-6 md:pb-6 md:pt-6">
                <div className="grid h-[200px] grid-cols-12 items-end gap-4 md:gap-5">
                  {[
                    { name: 'Jan', value: 72 },
                    { name: 'Feb', value: 84 },
                    { name: 'Mar', value: 95, active: true },
                    { name: 'Apr', value: 0 },
                    { name: 'May', value: 0 },
                    { name: 'Jun', value: 0 },
                    { name: 'Jul', value: 0 },
                    { name: 'Aug', value: 0 },
                    { name: 'Sep', value: 0 },
                    { name: 'Oct', value: 0 },
                    { name: 'Nov', value: 0 },
                    { name: 'Dec', value: 0 },
                  ].map((month) => (
                    <div key={month.name} className="flex h-full flex-col items-center justify-end gap-2">
                      <div className="flex h-full w-full items-end">
                        <div
                          className={`relative w-full rounded-t-[16px] transition-all duration-300 ${
                            month.active
                              ? 'bg-gradient-to-b from-[#716DFF] via-[#5D59F5] to-[#4C49ED] shadow-[0_10px_20px_rgba(76,73,237,0.14)]'
                              : 'bg-[#F3F0FC]'
                          }`}
                          style={{ height: `${Math.max(month.value, 4)}%` }}
                        />
                      </div>
                      <span className={`text-[11px] font-medium ${month.active ? 'text-[#4C49ED]' : 'text-[#8A86A8]'}`}>
                        {month.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardShell>

        {/* ── SECTION: Flight Duty Cards ── */}
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
            Flight Duties
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {/* Turnaround — single sector */}
          <TurnaroundCardV2
            date="15 MAR"
            destinations={[{ iata: 'BOM', city: 'Mumbai, India' }]}
            pay="AED 520.00"
            dutyTime="Duty 8h 30m"
            blockTime="Block 4h 15m"
            sectors={[
              {
                flightNumber: 'FZ 431',
                route: 'DXB — BOM',
                times: <TimeLabel>05:30 · 06:10 — 10:25 · 11:00</TimeLabel>,
                blockTime: '4h 15m',
              },
              {
                flightNumber: 'FZ 432',
                route: 'BOM — DXB',
                times: <TimeLabel>12:00 · 12:30 — 14:20 · 14:50</TimeLabel>,
                blockTime: '3h 50m',
              },
            ]}
          />

          {/* Turnaround — double sector with DHD */}
          <TurnaroundCardV2
            date="16 MAR"
            destinations={[
              { iata: 'CMB', city: 'Colombo, Sri Lanka' },
              { iata: 'DXB', city: 'Dubai, UAE' },
            ]}
            pay="AED 380.00"
            dutyTime="Duty 10h 15m"
            blockTime="Block 5h 40m"
            isDoubleSector
            hasDeadhead
            sectors={[
              {
                flightNumber: 'FZ 557',
                route: 'DXB — CMB',
                times: <TimeLabel>02:30 · 03:00 — 08:30 · 09:00</TimeLabel>,
                blockTime: '5h 30m',
                isDeadhead: true,
              },
              {
                flightNumber: 'FZ 558',
                route: 'CMB — DXB',
                times: <TimeLabel>10:15 · 10:45 — 13:20 · 13:50</TimeLabel>,
                blockTime: '5h 05m',
              },
            ]}
          />

          {/* Layover */}
          <LayoverCardV2
            sectors={[
              {
                iata: 'KTM',
                city: 'Kathmandu, Nepal',
                date: '18 MAR',
                pay: 'AED 445.00',
                dutyTime: 'Duty 7h 20m',
                blockTime: 'Block 4h 50m',
                flights: [
                  {
                    flightNumber: 'FZ 193',
                    route: 'DXB — KTM',
                    times: <TimeLabel>03:00 · 03:30 — 08:50 · 09:20</TimeLabel>,
                    blockTime: '4h 50m',
                  },
                ],
              },
              {
                iata: 'DXB',
                city: 'Dubai, UAE',
                date: '19 MAR',
                pay: 'AED 390.00',
                dutyTime: 'Duty 6h 45m',
                blockTime: 'Block 4h 30m',
                flights: [
                  {
                    flightNumber: 'FZ 194',
                    route: 'KTM — DXB',
                    times: <TimeLabel>10:30 · 11:00 — 14:00 · 14:30</TimeLabel>,
                    blockTime: '4h 30m',
                  },
                ],
              },
            ]}
            restDuration="14h 30m"
            perDiem="AED 127.89"
          />

          {/* Simple — ASBY (paid) */}
          <SimpleDutyCardV2
            date="20 MAR"
            label="ASBY"
            subtitle="Dubai, UAE"
            icon={Clock}
            pay="AED 200.00"
            tags={['Airport Standby', '4h Fixed']}
          />

          {/* Simple — OFF (unpaid) */}
          <SimpleDutyCardV2
            date="21 MAR"
            label="OFF"
            subtitle="Dubai, UAE"
            icon={Coffee}
            tags={['Day Off']}
          />
        </div>
      </div>
    </div>
  );
}
