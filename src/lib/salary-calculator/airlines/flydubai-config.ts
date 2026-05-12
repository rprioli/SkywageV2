/**
 * Flydubai airline-config assembly.
 *
 * Trimmed to its one remaining job: composing `FLYDUBAI_CONFIG` from the
 * pure constants in `./flydubai-rules` and the `FlydubaiCSVParser` class.
 * All other consumers (`flight-classifier`, `flydubai-parser`,
 * `csv-parser`, `manual-entry-validation`) import the pure pieces from
 * `./flydubai-rules` directly so they no longer pull the parser class
 * into their dependency graph. Mirrors the skywage-mobile Phase 4 Slice 1
 * fix applied to `src/lib/salary-engine/airlines/flydubai-config.ts`.
 */

import { AirlineConfig } from '@/types/airline-config';
import { FLYDUBAI_RATES } from '../calculation-engine';
import { FlydubaiCSVParser } from './flydubai-parser';
import {
  FLYDUBAI_CSV_COLUMNS,
  FLYDUBAI_CSV_VALIDATION,
  FLYDUBAI_FLIGHT_PATTERN,
  FLYDUBAI_SECTOR_PATTERN,
  FLYDUBAI_TIME_FORMATS,
  FLYDUBAI_BUSINESS_RULES,
} from './flydubai-rules';

// Complete Flydubai configuration
export const FLYDUBAI_CONFIG: AirlineConfig = {
  name: 'Flydubai',
  code: 'flydubai',

  salaryRates: FLYDUBAI_RATES,

  csvConfig: {
    columnMapping: FLYDUBAI_CSV_COLUMNS,
    validationRules: FLYDUBAI_CSV_VALIDATION,
    parser: new FlydubaiCSVParser()
  },

  positions: ['CCM', 'SCCM'],

  flightNumberPattern: FLYDUBAI_FLIGHT_PATTERN,
  sectorPattern: FLYDUBAI_SECTOR_PATTERN,
  timeFormats: FLYDUBAI_TIME_FORMATS,
  businessRules: FLYDUBAI_BUSINESS_RULES
};
