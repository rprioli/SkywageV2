'use client';

/**
 * LayoverCardV2 — Glassmorphic layover duty card.
 * Always has sector navigation (outbound + return).
 * Each sector shows its own flights, duty/block time.
 * Expandable to reveal the flights panel.
 */

import { useState } from 'react';
import { CardShell } from './CardShell';
import { PrimaryPanel, PayBadge } from './PrimaryPanel';
import { SectorNav } from './SectorNav';
import { Collapsible } from './Collapsible';
import { FlightsPanel, Tag } from './FlightsPanel';
import { FlightRow } from './FlightRow';

export interface LayoverFlight {
  flightNumber: string;
  route: string;
  times: React.ReactNode;
  blockTime?: string;
}

export interface LayoverSectorData {
  iata: string;
  city: string;
  date: string;
  pay: string;
  flights: LayoverFlight[];
  dutyTime: string;
  blockTime: string;
}

export interface LayoverCardV2Props {
  sectors: LayoverSectorData[];
  restDuration: string;
  perDiem: string;
}

export function LayoverCardV2({
  sectors,
  restDuration,
  perDiem,
}: LayoverCardV2Props) {
  const [idx, setIdx] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const sector = sectors[idx];
  const canPrev = idx > 0;
  const canNext = idx < sectors.length - 1;

  return (
    <CardShell>
      <PrimaryPanel
        date={sector.date}
        title={sector.iata}
        subtitle={sector.city}
        payBadge={<PayBadge>{sector.pay}</PayBadge>}
        tags={
          <>
            <Tag>Layover</Tag>
            <Tag>{restDuration} Rest</Tag>
            <Tag>{perDiem} Per Diem</Tag>
          </>
        }
        nav={
          <SectorNav
            canPrev={canPrev}
            canNext={canNext}
            onPrev={() => setIdx(i => i - 1)}
            onNext={() => setIdx(i => i + 1)}
          />
        }
        expandable
        expanded={expanded}
        onToggle={() => setExpanded(e => !e)}
      />

      <Collapsible open={expanded}>
        <FlightsPanel
          tags={
            <>
              <Tag>{sector.dutyTime}</Tag>
              <Tag>{sector.blockTime}</Tag>
            </>
          }
        >
          {sector.flights.map(f => (
            <FlightRow
              key={f.flightNumber}
              flightNumber={f.flightNumber}
              route={f.route}
              times={f.times}
              blockTime={f.blockTime}
            />
          ))}
        </FlightsPanel>
      </Collapsible>
    </CardShell>
  );
}
