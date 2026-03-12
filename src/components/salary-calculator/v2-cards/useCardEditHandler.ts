/**
 * useCardEditHandler — Shared hook for edit-save logic across v2 card wrappers.
 * Extracts the duplicated handleSaveEdit pattern from old TurnaroundCard/StandardDutyCard.
 */

import { FlightDuty, TimeValue, Position } from '@/types/salary-calculator';
import { updateFlightDuty } from '@/lib/database/flights';
import { recalculateMonthlyTotals } from '@/lib/salary-calculator/recalculation-engine';
import { getPositionRatesForDate } from '@/lib/salary-calculator/calculation-engine';
import { useToast } from '@/hooks/use-toast';

export function useCardEditHandler(
  userId: string | undefined,
  position: Position | undefined,
  onEditComplete?: () => void,
) {
  const { showSuccess, showError } = useToast();

  /** Returns a save handler bound to a specific FlightDuty */
  const createSaveHandler = (flightDuty: FlightDuty) =>
    async (
      flightId: string,
      newReportTime: TimeValue,
      newDebriefTime: TimeValue,
      isCrossDay: boolean,
    ) => {
      if (!userId || !position) {
        showError('User information not available');
        return;
      }

      try {
        let dutyMinutes = newDebriefTime.totalMinutes - newReportTime.totalMinutes;
        if (isCrossDay) dutyMinutes += 24 * 60;
        const dutyHours = dutyMinutes / 60;

        const month = flightDuty.date.getMonth() + 1;
        const year = flightDuty.date.getFullYear();
        const prelimRates = getPositionRatesForDate(position, year, month);

        let flightPay: number;
        if (flightDuty.dutyType === 'sby') {
          flightPay = 0;
        } else if (flightDuty.dutyType === 'asby') {
          flightPay = flightDuty.flightPay; // Fixed 4-hour payment preserved
        } else {
          flightPay = dutyHours * prelimRates.hourlyRate;
        }

        const result = await updateFlightDuty(
          flightId,
          { reportTime: newReportTime, debriefTime: newDebriefTime, dutyHours, flightPay, isCrossDay },
          userId,
          'Manual time edit from dashboard',
        );

        if (result.error) {
          showError(`Failed to update flight: ${result.error}`);
          return;
        }

        await recalculateMonthlyTotals(userId, month, year);
        showSuccess('Flight times updated successfully');
        onEditComplete?.();
      } catch {
        showError('Failed to update flight times');
      }
    };

  return { createSaveHandler };
}
