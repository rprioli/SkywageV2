/**
 * Core calculation engine for Skywage Salary Calculator
 * Implements Flydubai salary calculation rules with precision
 * Following existing utility patterns in the codebase
 */

import { 
  FlightDuty, 
  LayoverRestPeriod, 
  MonthlyCalculation, 
  SalaryRates, 
  Position,
  FlightCalculationResult,
  MonthlyCalculationResult
} from '@/types/salary-calculator';
import { calculateDuration, calculateRestPeriod } from './time-calculator';

// Flydubai salary rates as per specification
export const FLYDUBAI_RATES: { [K in Position]: SalaryRates } = {
  CCM: {
    position: 'CCM',
    basicSalary: 3275,
    housingAllowance: 4000,
    transportAllowance: 1000,
    hourlyRate: 50,
    perDiemRate: 8.82,
    asbyHours: 4
  },
  SCCM: {
    position: 'SCCM',
    basicSalary: 4275,
    housingAllowance: 5000,
    transportAllowance: 1000,
    hourlyRate: 62,
    perDiemRate: 8.82,
    asbyHours: 4
  }
};

/**
 * Calculates flight pay for a single duty
 */
export function calculateFlightPay(
  dutyHours: number,
  position: Position
): number {
  const rates = FLYDUBAI_RATES[position];
  return dutyHours * rates.hourlyRate;
}

/**
 * Calculates per diem pay for rest period
 */
export function calculatePerDiemPay(
  restHours: number,
  position: Position
): number {
  const rates = FLYDUBAI_RATES[position];
  return restHours * rates.perDiemRate;
}

/**
 * Calculates ASBY (Airport Standby) pay
 */
export function calculateAsbyPay(position: Position): number {
  const rates = FLYDUBAI_RATES[position];
  return rates.asbyHours * rates.hourlyRate;
}

/**
 * Calculates Recurrent pay (4 hours at flight rate)
 */
export function calculateRecurrentPay(position: Position): number {
  const rates = FLYDUBAI_RATES[position];
  return 4 * rates.hourlyRate; // 4 hours at hourly rate
}

/**
 * Calculates duty hours for a flight
 */
export function calculateDutyHours(flightDuty: FlightDuty): number {
  return calculateDuration(
    flightDuty.reportTime,
    flightDuty.debriefTime,
    flightDuty.isCrossDay
  );
}

/**
 * Processes a single flight duty and calculates payment
 */
export function calculateFlightDuty(
  flightDuty: FlightDuty,
  position: Position
): FlightCalculationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Calculate duty hours
    const dutyHours = calculateDutyHours(flightDuty);
    
    // Validate duty hours
    if (dutyHours <= 0) {
      errors.push('Duty hours must be greater than 0');
    }
    
    if (dutyHours > 24) {
      warnings.push(`Duty hours (${dutyHours.toFixed(2)}) exceed 24 hours - please verify`);
    }

    let flightPay = 0;
    let asbyPay = 0;

    // Calculate payment based on duty type
    switch (flightDuty.dutyType) {
      case 'turnaround':
      case 'layover':
        flightPay = calculateFlightPay(dutyHours, position);
        break;

      case 'asby':
        asbyPay = calculateAsbyPay(position);
        flightPay = asbyPay; // ASBY is paid at flight rate for fixed hours
        break;

      case 'recurrent':
        flightPay = calculateRecurrentPay(position); // Recurrent is paid at 4 hours at flight rate
        break;

      case 'sby':
      case 'off':
        // No payment for standby or off days
        break;

      default:
        errors.push(`Unknown duty type: ${flightDuty.dutyType}`);
    }

    // Update flight duty with calculated values
    const updatedFlightDuty: FlightDuty = {
      ...flightDuty,
      dutyHours,
      flightPay
    };

    return {
      flightDuty: updatedFlightDuty,
      calculationDetails: {
        dutyHours,
        flightPay,
        asbyPay: flightDuty.dutyType === 'asby' ? asbyPay : undefined
      },
      errors,
      warnings
    };

  } catch (error) {
    errors.push(`Calculation error: ${(error as Error).message}`);
    
    return {
      flightDuty,
      calculationDetails: {
        dutyHours: 0,
        flightPay: 0
      },
      errors,
      warnings
    };
  }
}

/**
 * Identifies layover pairs and calculates rest periods
 */
export function calculateLayoverRestPeriods(
  flightDuties: FlightDuty[],
  userId: string,
  position: Position
): LayoverRestPeriod[] {
  const layoverFlights = flightDuties
    .filter(flight => flight.dutyType === 'layover')
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const restPeriods: LayoverRestPeriod[] = [];

  for (let i = 0; i < layoverFlights.length - 1; i++) {
    const outboundFlight = layoverFlights[i];
    const inboundFlight = layoverFlights[i + 1];

    // Check if flights are consecutive (within 3 days)
    const daysDiff = Math.abs(
      (inboundFlight.date.getTime() - outboundFlight.date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff <= 3) {
      try {
        const restHours = calculateRestPeriod(
          outboundFlight.debriefTime,
          outboundFlight.isCrossDay,
          inboundFlight.reportTime,
          false, // Assuming inbound report time is not cross-day
          Math.floor(daysDiff)
        );

        if (restHours > 0) {
          const perDiemPay = calculatePerDiemPay(restHours, position);

          restPeriods.push({
            userId,
            outboundFlightId: outboundFlight.id || '',
            inboundFlightId: inboundFlight.id || '',
            restStartTime: new Date(outboundFlight.date), // Simplified - should use actual debrief timestamp
            restEndTime: new Date(inboundFlight.date), // Simplified - should use actual report timestamp
            restHours,
            perDiemPay,
            month: outboundFlight.month,
            year: outboundFlight.year
          });
        }
      } catch (error) {
        console.warn(`Error calculating rest period between flights: ${error}`);
      }
    }
  }

  return restPeriods;
}

/**
 * Calculates monthly salary totals
 */
export function calculateMonthlySalary(
  flightDuties: FlightDuty[],
  layoverRestPeriods: LayoverRestPeriod[],
  position: Position,
  month: number,
  year: number,
  userId: string
): MonthlyCalculationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const rates = FLYDUBAI_RATES[position];

  // Fixed components
  const basicSalary = rates.basicSalary;
  const housingAllowance = rates.housingAllowance;
  const transportAllowance = rates.transportAllowance;
  const totalFixed = basicSalary + housingAllowance + transportAllowance;

  // Variable components
  const totalDutyHours = flightDuties.reduce((sum, flight) => sum + flight.dutyHours, 0);
  const flightPay = flightDuties.reduce((sum, flight) => sum + flight.flightPay, 0);
  const totalRestHours = layoverRestPeriods.reduce((sum, rest) => sum + rest.restHours, 0);
  const perDiemPay = layoverRestPeriods.reduce((sum, rest) => sum + rest.perDiemPay, 0);
  
  const asbyCount = flightDuties.filter(flight => flight.dutyType === 'asby').length;
  const asbyPay = asbyCount * calculateAsbyPay(position);

  const totalVariable = flightPay + perDiemPay;
  const totalSalary = totalFixed + totalVariable;

  // Calculate summary statistics
  const totalFlights = flightDuties.filter(flight =>
    ['turnaround', 'layover', 'asby', 'recurrent'].includes(flight.dutyType)
  ).length;
  
  const totalTurnarounds = flightDuties.filter(flight => flight.dutyType === 'turnaround').length;
  const totalLayovers = flightDuties.filter(flight => flight.dutyType === 'layover').length;
  const totalAsbyDuties = asbyCount;
  
  const averageDutyHours = totalFlights > 0 ? totalDutyHours / totalFlights : 0;
  const averageRestHours = layoverRestPeriods.length > 0 ? totalRestHours / layoverRestPeriods.length : 0;

  const monthlyCalculation: MonthlyCalculation = {
    userId,
    month,
    year,
    basicSalary,
    housingAllowance,
    transportAllowance,
    totalDutyHours,
    flightPay,
    totalRestHours,
    perDiemPay,
    asbyCount,
    asbyPay,
    totalFixed,
    totalVariable,
    totalSalary
  };

  return {
    monthlyCalculation,
    flightDuties,
    layoverRestPeriods,
    calculationSummary: {
      totalFlights,
      totalTurnarounds,
      totalLayovers,
      totalAsbyDuties,
      averageDutyHours,
      averageRestHours
    },
    errors,
    warnings
  };
}
