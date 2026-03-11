'use client';

/**
 * TurnaroundCardV2 — Glassmorphic turnaround duty card.
 * Supports single and double-sector turnarounds with sector navigation.
 * Expandable to reveal the flights panel.
 */

import { useState } from 'react';
import { CardShell } from './CardShell';
import { PrimaryPanel, PayBadge } from './PrimaryPanel';
import { SectorNav } from './SectorNav';
import { Collapsible } from './Collapsible';
import { FlightsPanel, Tag } from './FlightsPanel';
import { FlightRow } from './FlightRow';

export interface TurnaroundDestination {
  iata: string;
  city: string;
}

export interface TurnaroundSector {
  flightNumber: string;
  route: string;
  times: React.ReactNode;
  blockTime: string;
}

export interface TurnaroundCardV2Props {
  date: string;
  destinations: TurnaroundDestination[];
  pay: string;
  sectors: TurnaroundSector[];
  dutyTime: string;
  blockTime: string;
  isDoubleSector?: boolean;
}

export function TurnaroundCardV2({
  date,
  destinations,
  pay,
  sectors,
  dutyTime,
  blockTime,
  isDoubleSector = false,
}: TurnaroundCardV2Props) {
  const [idx, setIdx] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const dest = destinations[idx];
  const canPrev = idx > 0;
  const canNext = idx < destinations.length - 1;

  return (
    <CardShell>
      <PrimaryPanel
        date={date}
        title={dest.iata}
        subtitle={dest.city}
        payBadge={<PayBadge>{pay}</PayBadge>}
        tags={
          <>
            <Tag>Turnaround</Tag>
            {isDoubleSector && <Tag>Double Sector</Tag>}
          </>
        }
        nav={
          isDoubleSector ? (
            <SectorNav
              canPrev={canPrev}
              canNext={canNext}
              onPrev={() => setIdx(i => i - 1)}
              onNext={() => setIdx(i => i + 1)}
            />
          ) : undefined
        }
        expandable
        expanded={expanded}
        onToggle={() => setExpanded(e => !e)}
      />

      <Collapsible open={expanded}>
        <FlightsPanel
          tags={
            <>
              <Tag>{dutyTime}</Tag>
              <Tag>{blockTime}</Tag>
            </>
          }
        >
          {sectors.map((s, i) => (
            <FlightRow
              key={`${s.flightNumber}-${i}`}
              flightNumber={s.flightNumber}
              route={s.route}
              times={s.times}
              blockTime={s.blockTime}
            />
          ))}
        </FlightsPanel>
      </Collapsible>
    </CardShell>
  );
}
