'use client';

/**
 * Test page — Living preview of all v2 duty card designs.
 * Imports from the refactored v2-cards components with mock data.
 */

import {
  Timer, Clock, BookOpen, Home, Moon, Palmtree, ThermometerSun,
} from 'lucide-react';
import {
  TurnaroundCardV2,
  LayoverCardV2,
  SimpleDutyCardV2,
} from '@/components/salary-calculator/v2-cards';

/* ─── Mock data ───────────────────────────────────────────────────────── */

const SINGLE_DESTINATIONS = [{ iata: 'IKA', city: 'Tehran, Iran' }];
const DOUBLE_DESTINATIONS = [
  { iata: 'IKA', city: 'Tehran, Iran' },
  { iata: 'KHI', city: 'Karachi, Pakistan' },
];

const SINGLE_SECTORS = [
  {
    flightNumber: 'FZ1931', route: 'DXB → IKA',
    times: <><span className="text-[#3A3780]/38 font-normal">15:40 · </span>16:40–18:55</>,
    blockTime: '2h 15m',
  },
  {
    flightNumber: 'FZ1932', route: 'IKA → DXB',
    times: <>19:55–22:10<span className="text-[#3A3780]/38 font-normal"> · 22:40</span></>,
    blockTime: '2h 15m',
  },
];

const DOUBLE_SECTORS = [
  {
    flightNumber: 'FZ1931', route: 'DXB → IKA',
    times: <><span className="text-[#3A3780]/38 font-normal">15:40 · </span>16:40–18:55</>,
    blockTime: '2h 15m',
  },
  {
    flightNumber: 'FZ1932', route: 'IKA → DXB',
    times: <>19:55–22:10</>,
    blockTime: '2h 15m',
  },
  {
    flightNumber: 'FZ1401', route: 'DXB → KHI',
    times: <>23:00–01:15</>,
    blockTime: '2h 15m',
  },
  {
    flightNumber: 'FZ1402', route: 'KHI → DXB',
    times: <>02:00–04:15<span className="text-[#3A3780]/38 font-normal"> · 04:45</span></>,
    blockTime: '2h 15m',
  },
];

const LAYOVER_SECTORS = [
  {
    iata: 'IKA', city: 'Tehran, Iran', date: '27 Mar', pay: 'AED 112.50',
    flights: [
      {
        flightNumber: 'FZ1931', route: 'DXB → IKA',
        times: <><span className="text-[#3A3780]/38 font-normal">15:40 · </span>16:40–18:55<span className="text-[#3A3780]/38 font-normal"> · 19:25</span></>,
      },
    ],
    dutyTime: '03h 45m Duty', blockTime: '02h 15m Block',
  },
  {
    iata: 'DXB', city: 'Dubai, UAE', date: '28 Mar', pay: 'AED 112.50',
    flights: [
      {
        flightNumber: 'FZ1932', route: 'IKA → DXB',
        times: <><span className="text-[#3A3780]/38 font-normal">18:55 · </span>19:55–22:10<span className="text-[#3A3780]/38 font-normal"> · 22:40</span></>,
      },
    ],
    dutyTime: '03h 45m Duty', blockTime: '02h 15m Block',
  },
];

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function TestPage() {
  return (
    <div className="min-h-screen bg-[rgba(76,73,237,0.05)] flex items-center justify-center p-8">
      <style>{`
        @keyframes cardEntrance {
          from { opacity: 0; transform: translateY(18px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        .card-entrance { animation: cardEntrance 0.45s ease-out both; }
      `}</style>

      <div className="flex flex-col gap-8">
        {/* Flight duty cards — expandable */}
        <div className="flex items-start gap-6">
          <div className="w-[420px]">
            <TurnaroundCardV2
              date="27 Mar"
              destinations={SINGLE_DESTINATIONS}
              pay="AED 350"
              sectors={SINGLE_SECTORS}
              dutyTime="07h 00m Duty"
              blockTime="04h 30m Block"
            />
          </div>
          <div className="w-[420px]">
            <TurnaroundCardV2
              date="27 Mar"
              destinations={DOUBLE_DESTINATIONS}
              pay="AED 520"
              sectors={DOUBLE_SECTORS}
              dutyTime="11h 00m Duty"
              blockTime="09h 00m Block"
              isDoubleSector
            />
          </div>
          <div className="w-[420px]">
            <LayoverCardV2
              sectors={LAYOVER_SECTORS}
              restDuration="24h 00m"
              perDiem="AED 211.68"
            />
          </div>
        </div>

        {/* Simple duty cards — paid */}
        <div className="flex items-start gap-6">
          <div className="w-[420px]">
            <SimpleDutyCardV2 date="27 Mar" label="ASBY" icon={Timer} pay="AED 200" tags={['Airport Standby', '04h 00m Fixed']} />
          </div>
          <div className="w-[420px]">
            <SimpleDutyCardV2 date="27 Mar" label="REC" icon={BookOpen} pay="AED 200" tags={['Recurrent Training', '04h 00m Fixed']} />
          </div>
          <div className="w-[420px]">
            <SimpleDutyCardV2 date="27 Mar" label="BP" icon={BookOpen} pay="AED 250" tags={['Business Promotion', '05h 00m Fixed']} />
          </div>
        </div>

        {/* Simple duty cards — no pay */}
        <div className="flex items-start gap-6">
          <div className="w-[420px]">
            <SimpleDutyCardV2 date="27 Mar" label="SBY" icon={Clock} tags={['Home Standby']} />
          </div>
          <div className="w-[420px]">
            <SimpleDutyCardV2 date="27 Mar" label="OFF" icon={Home} tags={['Day Off']} />
          </div>
          <div className="w-[420px]">
            <SimpleDutyCardV2 date="27 Mar" label="REST" icon={Moon} tags={['Rest Day']} />
          </div>
          <div className="w-[420px]">
            <SimpleDutyCardV2 date="27 Mar" label="AL" icon={Palmtree} tags={['Annual Leave']} />
          </div>
          <div className="w-[420px]">
            <SimpleDutyCardV2 date="27 Mar" label="SICK" icon={ThermometerSun} tags={['Sick Leave']} />
          </div>
        </div>
      </div>
    </div>
  );
}
