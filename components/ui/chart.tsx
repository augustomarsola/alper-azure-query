"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "@/lib/utils";

// Chart configuration type
export type ChartConfig = {
  [k: string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
    color?: string;
  };
};

// Chart context
type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >["children"];
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn("flex aspect-video justify-center text-xs", className)}
        {...props}
      >
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = "ChartContainer";

const ChartTooltip = RechartsPrimitive.Tooltip;

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    active?: boolean;
    payload?: Array<{
      dataKey?: string;
      name?: string;
      value?: number;
      payload?: { fill?: string };
      color?: string;
    }>;
    label?: string;
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: "line" | "dot" | "dashed";
    nameKey?: string;
    labelKey?: string;
    formatter?: (value: number | string) => string;
    labelFormatter?: (value: string) => string;
    labelClassName?: string;
    color?: string;
  }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const { config } = useChart();

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null;
      }

      const [item] = payload;
      const key = `${labelKey || item.dataKey || item.name || "value"}`;
      const itemConfig = config[key as keyof typeof config];
      const value =
        !labelKey && typeof label === "string"
          ? itemConfig?.label || label
          : itemConfig?.label || key;

      return (
        <div className={cn("font-medium", labelClassName)}>
          {formatter && typeof value === "string"
            ? (formatter as (value: string) => string)(value)
            : value}
        </div>
      );
    }, [
      label,
      payload,
      hideLabel,
      labelKey,
      config,
      labelClassName,
      formatter,
    ]);

    if (!active || !payload?.length) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-32 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
      >
        {!hideLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload?.map(
            (
              item: {
                dataKey?: string;
                name?: string;
                value?: number;
                payload?: { fill?: string };
                color?: string;
              },
              index: number
            ) => {
              const key = `${nameKey || item.name || item.dataKey || "value"}`;
              const itemConfig = config[key as keyof typeof config];
              const indicatorColor = color || item.payload?.fill || item.color;

              return (
                <div
                  key={`${item.dataKey}-${index}`}
                  className={cn(
                    "flex w-full items-center text-xs",
                    indicator === "dot" && "items-center"
                  )}
                >
                  {!hideIndicator && (
                    <div
                      className={cn(
                        "shrink-0 rounded-xs border-[--color-border] bg-[--color-bg]",
                        indicator === "dot" && "h-2.5 w-2.5 rounded-full",
                        indicator === "line" && "w-1 h-2",
                        indicator === "dashed" &&
                          "w-0 border-[1.5px] border-dashed"
                      )}
                      style={
                        {
                          "--color-bg": indicatorColor,
                          "--color-border": indicatorColor,
                        } as React.CSSProperties
                      }
                    />
                  )}
                  <div
                    className={cn(
                      "flex flex-1 justify-between leading-none",
                      !hideIndicator && "ml-2"
                    )}
                  >
                    <span className="text-muted-foreground">
                      {itemConfig?.label || item.name}
                    </span>
                    <span className="font-mono font-medium tabular-nums text-foreground">
                      {formatter
                        ? (formatter as (value: number) => string)(
                            item.value as number
                          )
                        : item.value}
                    </span>
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>
    );
  }
);
ChartTooltipContent.displayName = "ChartTooltipContent";

export { ChartContainer, ChartTooltip, ChartTooltipContent };
