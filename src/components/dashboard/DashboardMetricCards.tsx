import React from "react";
import { Clock, Banknote, UtensilsCrossed, type LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CurrencyFormatter = (amount: number) => string;

export interface DashboardMetricCardsProps {
  dutyHours: number;
  flightPay: number;
  perDiemPay: number;
  isLoading: boolean;
  formatCurrency: CurrencyFormatter;
  formatCurrencyCompact: CurrencyFormatter;
}

interface MetricValueProps {
  compactValue: string;
  fullValue: string;
  compactClassName?: string;
  fullClassName?: string;
}

const MetricValue = ({
  compactValue,
  fullValue,
  compactClassName,
  fullClassName,
}: MetricValueProps) => {
  return (
    <>
      <div
        className={cn(
          "md:hidden text-sm font-bold whitespace-nowrap overflow-hidden text-ellipsis",
          compactClassName
        )}
      >
        {compactValue}
      </div>
      <div
        className={cn(
          "hidden md:block font-bold whitespace-nowrap overflow-hidden text-ellipsis",
          fullClassName
        )}
      >
        {fullValue}
      </div>
    </>
  );
};

interface MetricCardProps {
  icon: LucideIcon;
  iconContainerClassName: string;
  iconClassName: string;
  value: React.ReactNode;
  label: string;
  labelClassName: string;
}

const MetricCard = ({
  icon: Icon,
  iconContainerClassName,
  iconClassName,
  value,
  label,
  labelClassName,
}: MetricCardProps) => {
  return (
    <Card className="bg-white rounded-3xl !border-0 !shadow-none h-full">
      <CardContent className="card-responsive-padding flex h-full items-center">
        <div className="flex flex-col md:flex-row items-center md:items-center gap-2 md:gap-4 w-full min-w-0">
          <div
            className={cn(
              "h-10 w-10 md:h-16 md:w-16 rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0",
              iconContainerClassName
            )}
          >
            <Icon className={cn("h-5 w-5 md:h-8 md:w-8", iconClassName)} aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1 text-center md:text-left overflow-hidden">
            {value}
            <div className={cn("text-[10px] md:text-sm whitespace-nowrap", labelClassName)}>
              {label}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const DashboardMetricCards = ({
  dutyHours,
  flightPay,
  perDiemPay,
  isLoading,
  formatCurrency,
  formatCurrencyCompact,
}: DashboardMetricCardsProps) => {
  const hoursValue = isLoading ? "..." : `${Math.floor(dutyHours).toLocaleString("en-US")}`;

  const flightPayCompact = isLoading ? "..." : `AED ${formatCurrencyCompact(flightPay)}`;
  const flightPayFull = isLoading ? "..." : formatCurrency(flightPay);

  const perDiemCompact = isLoading ? "..." : `AED ${formatCurrencyCompact(perDiemPay)}`;
  const perDiemFull = isLoading ? "..." : formatCurrency(perDiemPay);

  return (
    <div className="h-full">
      <div className="grid grid-cols-3 sm:grid-cols-2 xl:grid-cols-1 gap-2 md:gap-6 xl:grid-rows-3 xl:h-full">
        <MetricCard
          icon={Clock}
          iconContainerClassName="bg-[rgba(76,73,237,0.15)]"
          iconClassName="text-[#4C49ED]"
          value={
            <MetricValue
              compactValue={hoursValue}
              fullValue={hoursValue}
              compactClassName="text-brand-ink"
              fullClassName="text-brand-ink text-responsive-3xl"
            />
          }
          label="Flight Hours"
          labelClassName="text-[#4C49ED]"
        />

        <MetricCard
          icon={Banknote}
          iconContainerClassName="bg-[rgba(109,220,145,0.2)]"
          iconClassName="text-[#6DDC91]"
          value={
            <MetricValue
              compactValue={flightPayCompact}
              fullValue={flightPayFull}
              compactClassName="text-[#059669]"
              fullClassName="text-[#059669] text-responsive-xl"
            />
          }
          label="Flight Pay"
          labelClassName="text-[#10b981]"
        />

        <MetricCard
          icon={UtensilsCrossed}
          iconContainerClassName="bg-[rgba(20,184,166,0.15)]"
          iconClassName="text-[#14b8a6]"
          value={
            <MetricValue
              compactValue={perDiemCompact}
              fullValue={perDiemFull}
              compactClassName="text-[#0f766e]"
              fullClassName="text-[#0f766e] text-responsive-xl"
            />
          }
          label="Per Diem"
          labelClassName="text-[#14b8a6]"
        />
      </div>
    </div>
  );
};

