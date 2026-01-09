"use client";

import { useRef, useState } from "react";
import type { ReactElement } from "react";
import { processActivities, getActivityColor } from "@/lib/activity-processor";
import type { StravaActivity } from "@/lib/strava";

type ActivityGridProps = {
  activities: StravaActivity[];
};

export const ActivityGrid = ({ activities }: ActivityGridProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const gridSvgRef = useRef<SVGSVGElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [viewMode, setViewMode] = useState<"heatmap" | "grid">("heatmap");
  const dayActivities = processActivities(activities);

  const DOT_SIZE = 16;
  const DOT_GAP = 4;
  const WEEKS_PER_ROW = 53;
  const DAYS_PER_WEEK = 7;
  const SVG_PADDING = 20;
  const FOOTER_HEIGHT = 30;
  const MONTH_LABEL_HEIGHT = 20;
  const DAY_LABEL_WIDTH = 30;

  const getDayOfWeek = (date: Date): number => date.getDay();
  const getWeekNumber = (date: Date): number => {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    return Math.floor(days / 7);
  };

  const renderDot = (day: typeof dayActivities[0], x: number, y: number) => {
    const { activities: dayActs } = day;
    const centerX = x + DOT_SIZE / 2;
    const centerY = y + DOT_SIZE / 2;
    const radius = DOT_SIZE / 2;
    
    if (dayActs.length === 0) {
      return <circle key={`${day.date.toISOString()}-dot`} cx={centerX} cy={centerY} r={radius} fill="#2d2d2d" />;
    }
    if (dayActs.length === 1) {
      return <circle key={`${day.date.toISOString()}-dot`} cx={centerX} cy={centerY} r={radius} fill={getActivityColor(dayActs[0])} />;
    }
    const maxSlices = 4;
    const activitiesToShow = dayActs.slice(0, maxSlices);
    const hasMore = dayActs.length > maxSlices;
    const sliceCount = hasMore ? activitiesToShow.length + 1 : activitiesToShow.length;
    const sliceAngle = (2 * Math.PI) / sliceCount;
    const slices: ReactElement[] = [];
    let currentAngle = -Math.PI / 2;
    activitiesToShow.forEach((activityType, idx) => {
      const nextAngle = currentAngle + sliceAngle;
      const x1 = centerX + radius * Math.cos(currentAngle);
      const y1 = centerY + radius * Math.sin(currentAngle);
      const x2 = centerX + radius * Math.cos(nextAngle);
      const y2 = centerY + radius * Math.sin(nextAngle);
      const largeArc = sliceAngle > Math.PI ? 1 : 0;
      slices.push(<path key={`${day.date.toISOString()}-slice-${idx}`} d={`M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`} fill={getActivityColor(activityType)} />);
      currentAngle = nextAngle;
    });
    if (hasMore) {
      const x1 = centerX + radius * Math.cos(currentAngle);
      const y1 = centerY + radius * Math.sin(currentAngle);
      const x2 = centerX + radius * Math.cos(-Math.PI / 2);
      const y2 = centerY + radius * Math.sin(-Math.PI / 2);
      const largeArc = sliceAngle > Math.PI ? 1 : 0;
      slices.push(<path key={`${day.date.toISOString()}-slice-other`} d={`M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`} fill={getActivityColor("Other")} />);
    }
    return (
      <g key={`${day.date.toISOString()}-group`}>
        <circle cx={centerX} cy={centerY} r={radius} fill="#2d2d2d" />
        {slices}
      </g>
    );
  };

  const exportToPNG = async () => {
    if (!svgRef.current) return;
    setIsExporting(true);
    try {
      const svgWidth = svgRef.current.viewBox.baseVal.width;
      const svgHeight = svgRef.current.viewBox.baseVal.height;
      
      // Calculate attribution Y position (same calculation as below)
      const gridHeight = DAYS_PER_WEEK * (DOT_SIZE + DOT_GAP) - DOT_GAP;
      const legendY = gridHeight + SVG_PADDING + MONTH_LABEL_HEIGHT + 20;
      const statsY = legendY + 30;
      const STATS_HEIGHT = 60;
      const attributionYPos = statsY + STATS_HEIGHT + 10; // statsY + STATS_HEIGHT + some padding
      
      // Calculate the area to export: from month labels to attribution
      const startY = 0; // Start from top (month labels)
      const endY = attributionYPos + 15; // End at attribution text
      const contentHeight = endY - startY;
      const margin = 40; // Top and bottom margin
      const exportHeight = contentHeight + margin * 2;
      
      // Calculate scale to fit width in 1080px
      const targetWidth = 1080;
      const scale = targetWidth / svgWidth;
      const scaledHeight = exportHeight * scale;
      
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = scaledHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      
      // Fill background
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, targetWidth, scaledHeight);
      
      // Create a temporary SVG with the cropped viewBox
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });
      
      // Draw the cropped portion with margins
      const sourceY = startY;
      const sourceHeight = contentHeight;
      ctx.drawImage(
        img,
        0, sourceY, svgWidth, sourceHeight, // Source rectangle
        margin, margin, targetWidth - margin * 2, scaledHeight - margin * 2 // Destination rectangle
      );
      
      canvas.toBlob((blob) => {
        if (!blob) return;
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = "founderpace-2025.png";
        link.click();
        URL.revokeObjectURL(downloadUrl);
        URL.revokeObjectURL(url);
      }, "image/png");
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  // Calculate stats
  const totalActivities = activities.length;
  const daysWithActivities = dayActivities.filter((day) => day.activities.length > 0).length;
  const activityCounts = new Map<string, number>();
  dayActivities.forEach((day) => {
    day.activities.forEach((activityType) => {
      activityCounts.set(activityType, (activityCounts.get(activityType) || 0) + 1);
    });
  });
  const mostCommonActivity = Array.from(activityCounts.entries()).sort((a, b) => b[1] - a[1])[0];
  
  // Calculate longest streak
  let longestStreak = 0;
  let currentStreak = 0;
  dayActivities.forEach((day) => {
    if (day.activities.length > 0) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });

  const gridWidth = WEEKS_PER_ROW * (DOT_SIZE + DOT_GAP) - DOT_GAP;
  const gridHeight = DAYS_PER_WEEK * (DOT_SIZE + DOT_GAP) - DOT_GAP;
  const LEGEND_HEIGHT = 40;
  const STATS_HEIGHT = 60;
  const ATTRIBUTION_HEIGHT = 20;
  const svgWidth = gridWidth + SVG_PADDING * 2 + DAY_LABEL_WIDTH;
  const svgHeight = gridHeight + SVG_PADDING * 2 + FOOTER_HEIGHT + LEGEND_HEIGHT + MONTH_LABEL_HEIGHT + STATS_HEIGHT + ATTRIBUTION_HEIGHT;
  const dots: { day: typeof dayActivities[0]; x: number; y: number }[] = [];
  dayActivities.forEach((day) => {
    const weekNum = getWeekNumber(day.date);
    const dayOfWeek = getDayOfWeek(day.date);
    const x = SVG_PADDING + DAY_LABEL_WIDTH + weekNum * (DOT_SIZE + DOT_GAP);
    const y = SVG_PADDING + MONTH_LABEL_HEIGHT + dayOfWeek * (DOT_SIZE + DOT_GAP);
    dots.push({ day, x, y });
  });

  // Get month labels - show first week of each month
  const monthLabels: Array<{ month: string; weekNum: number }> = [];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const seenMonths = new Set<number>();
  dayActivities.forEach((day) => {
    const month = day.date.getMonth();
    if (!seenMonths.has(month)) {
      const weekNum = getWeekNumber(day.date);
      // Only add if this is the first week of the month (or close to it)
      const firstDayOfMonth = new Date(day.date.getFullYear(), month, 1);
      const firstWeekNum = getWeekNumber(firstDayOfMonth);
      if (weekNum === firstWeekNum || weekNum === firstWeekNum + 1) {
        monthLabels.push({ month: monthNames[month], weekNum });
        seenMonths.add(month);
      }
    }
  });

  // Day of week labels
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const activityTypes: Array<{ type: string; color: string }> = [
    { type: "Run", color: getActivityColor("Run") },
    { type: "Walk", color: getActivityColor("Walk") },
    { type: "Ride", color: getActivityColor("Ride") },
    { type: "Swim", color: getActivityColor("Swim") },
    { type: "Hike", color: getActivityColor("Hike") },
    { type: "Workout", color: getActivityColor("Workout") },
    { type: "Other", color: getActivityColor("Other") },
  ];

  const legendY = gridHeight + SVG_PADDING + MONTH_LABEL_HEIGHT + 20;
  const legendItemSpacing = 80;
  // Calculate total legend width: (number of items - 1) * spacing + width of last item
  // Each item is approximately: DOT_SIZE/2 + 8 (gap) + text width (~50px) + spacing
  const totalLegendWidth = (activityTypes.length - 1) * legendItemSpacing + DOT_SIZE + 60;
  const legendStartX = (svgWidth - totalLegendWidth) / 2; // Center the legend
  
  const statsY = legendY + 50;
  // Calculate stats width: 4 items with spacing
  const statsTextWidth = 4 * 180; // Each stat is approximately 180px wide
  const statsStartX = (svgWidth - statsTextWidth) / 2; // Center the stats
  const attributionY = svgHeight - FOOTER_HEIGHT - 5;

  // Grid view: 15 dots per row, left to right, top to bottom
  const GRID_DOTS_PER_ROW = 15;
  const GRID_DOT_SIZE = 16; // Doubled from 8
  const GRID_DOT_GAP = 4; // Doubled from 2
  const GRID_ROWS = Math.ceil(dayActivities.length / GRID_DOTS_PER_ROW);
  const gridViewWidth = GRID_DOTS_PER_ROW * (GRID_DOT_SIZE + GRID_DOT_GAP) - GRID_DOT_GAP;
  const gridViewHeight = GRID_ROWS * (GRID_DOT_SIZE + GRID_DOT_GAP) - GRID_DOT_GAP;
  // Calculate max width needed for stats (last stat at x=40+450+text width ~100 = 590)
  const maxStatsWidth = 40 + 450 + 120; // Last stat position + text width
  const gridSvgWidth = Math.max(gridViewWidth + 80, maxStatsWidth); // Ensure enough width for stats
  const gridSvgHeight = gridViewHeight + 120; // Extra space for legend/stats and instructions

  const renderGridDot = (day: typeof dayActivities[0], index: number) => {
    const row = Math.floor(index / GRID_DOTS_PER_ROW);
    const col = index % GRID_DOTS_PER_ROW;
    // Center the grid horizontally within the SVG
    const gridStartX = (gridSvgWidth - gridViewWidth) / 2;
    const x = gridStartX + col * (GRID_DOT_SIZE + GRID_DOT_GAP);
    const y = 20 + row * (GRID_DOT_SIZE + GRID_DOT_GAP);
    const centerX = x + GRID_DOT_SIZE / 2;
    const centerY = y + GRID_DOT_SIZE / 2;
    const radius = GRID_DOT_SIZE / 2;
    const { activities: dayActs } = day;

    if (dayActs.length === 0) {
      return <circle key={`grid-${day.date.toISOString()}`} cx={centerX} cy={centerY} r={radius} fill="#2d2d2d" />;
    }
    if (dayActs.length === 1) {
      return <circle key={`grid-${day.date.toISOString()}`} cx={centerX} cy={centerY} r={radius} fill={getActivityColor(dayActs[0])} />;
    }

    // Multiple activities - pie chart
    const maxSlices = 4;
    const activitiesToShow = dayActs.slice(0, maxSlices);
    const hasMore = dayActs.length > maxSlices;
    const sliceCount = hasMore ? activitiesToShow.length + 1 : activitiesToShow.length;
    const sliceAngle = (2 * Math.PI) / sliceCount;
    const slices: ReactElement[] = [];
    let currentAngle = -Math.PI / 2;

    activitiesToShow.forEach((activityType, idx) => {
      const nextAngle = currentAngle + sliceAngle;
      const x1 = centerX + radius * Math.cos(currentAngle);
      const y1 = centerY + radius * Math.sin(currentAngle);
      const x2 = centerX + radius * Math.cos(nextAngle);
      const y2 = centerY + radius * Math.sin(nextAngle);
      const largeArc = sliceAngle > Math.PI ? 1 : 0;
      slices.push(
        <path
          key={`grid-${day.date.toISOString()}-slice-${idx}`}
          d={`M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
          fill={getActivityColor(activityType)}
        />
      );
      currentAngle = nextAngle;
    });

    if (hasMore) {
      const x1 = centerX + radius * Math.cos(currentAngle);
      const y1 = centerY + radius * Math.sin(currentAngle);
      const x2 = centerX + radius * Math.cos(-Math.PI / 2);
      const y2 = centerY + radius * Math.sin(-Math.PI / 2);
      const largeArc = sliceAngle > Math.PI ? 1 : 0;
      slices.push(
        <path
          key={`grid-${day.date.toISOString()}-slice-other`}
          d={`M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
          fill={getActivityColor("Other")}
        />
      );
    }

    return (
      <g key={`grid-${day.date.toISOString()}-group`}>
        <circle cx={centerX} cy={centerY} r={radius} fill="#2d2d2d" />
        {slices}
      </g>
    );
  };

  const exportGridToPNG = async () => {
    if (!gridSvgRef.current) return;
    setIsExporting(true);
    try {
      const svgWidth = gridSvgRef.current.viewBox.baseVal.width;
      const svgHeight = gridSvgRef.current.viewBox.baseVal.height;
      const targetWidth = 1080;
      const scale = targetWidth / svgWidth;
      const scaledHeight = svgHeight * scale;

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = scaledHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, targetWidth, scaledHeight);

      const svgData = new XMLSerializer().serializeToString(gridSvgRef.current);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });

      ctx.drawImage(img, 0, 0, targetWidth, scaledHeight);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = "founderpace-2025.png";
        link.click();
        URL.revokeObjectURL(downloadUrl);
        URL.revokeObjectURL(url);
      }, "image/png");
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex justify-center gap-4 items-center">
        <button
          onClick={() => setViewMode("heatmap")}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            viewMode === "heatmap"
              ? "bg-white text-black"
              : "bg-neutral-800 text-neutral-400 hover:text-white"
          }`}
        >
          Heatmap
        </button>
        <button
          onClick={() => setViewMode("grid")}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            viewMode === "grid"
              ? "bg-white text-black"
              : "bg-neutral-800 text-neutral-400 hover:text-white"
          }`}
        >
          Grid
        </button>
      </div>

      {viewMode === "heatmap" ? (
        <>
          <div className="flex justify-center">
            <svg ref={svgRef} width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="bg-[#0a0a0a]">
              {/* Month labels */}
              {monthLabels.map(({ month, weekNum }) => {
            const monthX = SVG_PADDING + DAY_LABEL_WIDTH + weekNum * (DOT_SIZE + DOT_GAP);
            return (
              <text
                key={month}
                x={monthX}
                y={MONTH_LABEL_HEIGHT - 2}
                fill="#ffffff"
                fontSize="14"
                fontFamily="system-ui, sans-serif"
              >
                {month}
              </text>
            );
          })}
          
          {/* Day of week labels */}
          {dayLabels.map((day, idx) => {
            const dayY = SVG_PADDING + MONTH_LABEL_HEIGHT + idx * (DOT_SIZE + DOT_GAP) + DOT_SIZE / 2;
            return (
              <text
                key={day}
                x={DAY_LABEL_WIDTH - 8}
                y={dayY + 4}
                fill="#ffffff"
                fontSize="14"
                fontFamily="system-ui, sans-serif"
                textAnchor="end"
              >
                {day}
              </text>
            );
          })}
          
          {/* Activity dots */}
          {dots.map(({ day, x, y }) => renderDot(day, x, y))}
          
          {/* Legend */}
          {activityTypes.map((item, idx) => {
            const legendX = legendStartX + idx * legendItemSpacing;
            return (
              <g key={item.type}>
                <circle cx={legendX} cy={legendY} r={DOT_SIZE / 2} fill={item.color} />
                <text x={legendX + DOT_SIZE / 2 + 8} y={legendY + 5} fill="#ffffff" fontSize="14" fontFamily="system-ui, sans-serif">
                  {item.type}
                </text>
              </g>
            );
          })}
          
          {/* Stats */}
          <text x={statsStartX} y={statsY} fill="#ffffff" fontSize="16" fontFamily="system-ui, sans-serif" fontWeight="700">
            {totalActivities} activities
          </text>
          <text x={statsStartX + 180} y={statsY} fill="#ffffff" fontSize="16" fontFamily="system-ui, sans-serif" fontWeight="700">
            {daysWithActivities} active days
          </text>
          {mostCommonActivity && (
            <text x={statsStartX + 360} y={statsY} fill="#ffffff" fontSize="16" fontFamily="system-ui, sans-serif" fontWeight="700">
              {mostCommonActivity[1]} {mostCommonActivity[0]}s
            </text>
          )}
          {longestStreak > 0 && (
            <text x={statsStartX + 540} y={statsY} fill="#ffffff" fontSize="16" fontFamily="system-ui, sans-serif" fontWeight="700">
              {longestStreak} day streak
            </text>
          )}
          
              {/* Attribution */}
              <text x={svgWidth - SVG_PADDING} y={attributionY} fill="#666666" fontSize="12" fontFamily="system-ui, sans-serif" textAnchor="end">
                Created with FounderPace.com
              </text>
            </svg>
          </div>
          <div className="flex flex-col items-center gap-3">
            <p className="text-neutral-400 text-sm">
              Share your 2025 running year!
            </p>
            <button onClick={exportToPNG} disabled={isExporting} className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50">
              {isExporting ? "Exporting..." : "Save Image"}
            </button>
            <a
              href="https://buy.stripe.com/fZu14m1UQ2mgcuwgQTbbG0A"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-500 text-lg hover:text-neutral-300 underline mt-2"
            >
              Your brand here
            </a>
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-center w-full">
            <div className="flex justify-center">
              <svg ref={gridSvgRef} width={gridSvgWidth} height={gridSvgHeight} viewBox={`0 0 ${gridSvgWidth} ${gridSvgHeight}`} className="bg-[#0a0a0a]">
              {dayActivities.map((day, index) => renderGridDot(day, index))}
              
              {/* How to read text */}
              <text x={gridSvgWidth / 2} y={gridViewHeight + 30} fill="#ffffff" fontSize="11" fontFamily="system-ui, sans-serif" textAnchor="middle" fillOpacity={0.6}>
                Each dot = one day in 2025. Read left to right, top to bottom.
              </text>
              
              {/* Legend - centered */}
              {(() => {
                const totalLegendWidth = (activityTypes.length - 1) * 80 + GRID_DOT_SIZE + 60;
                const legendStartX = (gridSvgWidth - totalLegendWidth) / 2;
                return activityTypes.map((item, idx) => {
                  const legendX = legendStartX + idx * 80;
                  const legendY = gridViewHeight + 55;
                  return (
                    <g key={item.type}>
                      <circle cx={legendX} cy={legendY} r={GRID_DOT_SIZE / 2} fill={item.color} />
                      <text x={legendX + GRID_DOT_SIZE / 2 + 8} y={legendY + 5} fill="#ffffff" fontSize="12" fontFamily="system-ui, sans-serif">
                        {item.type}
                      </text>
                    </g>
                  );
                });
              })()}
              
              {/* Stats - centered */}
              {(() => {
                const statsTextWidth = 4 * 150;
                const statsStartX = (gridSvgWidth - statsTextWidth) / 2;
                return (
                  <>
                    <text x={statsStartX} y={gridViewHeight + 85} fill="#ffffff" fontSize="14" fontFamily="system-ui, sans-serif" fontWeight="700">
                      {totalActivities} activities
                    </text>
                    <text x={statsStartX + 150} y={gridViewHeight + 85} fill="#ffffff" fontSize="14" fontFamily="system-ui, sans-serif" fontWeight="700">
                      {daysWithActivities} active days
                    </text>
                    {mostCommonActivity && (
                      <text x={statsStartX + 300} y={gridViewHeight + 85} fill="#ffffff" fontSize="14" fontFamily="system-ui, sans-serif" fontWeight="700">
                        {mostCommonActivity[1]} {mostCommonActivity[0]}s
                      </text>
                    )}
                    {longestStreak > 0 && (
                      <text x={statsStartX + 450} y={gridViewHeight + 85} fill="#ffffff" fontSize="14" fontFamily="system-ui, sans-serif" fontWeight="700">
                        {longestStreak} day streak
                      </text>
                    )}
                  </>
                );
              })()}
              
              {/* Attribution */}
              <text x={gridSvgWidth - 20} y={gridSvgHeight - 10} fill="#666666" fontSize="12" fontFamily="system-ui, sans-serif" textAnchor="end">
                Created with FounderPace.com
              </text>
              </svg>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <p className="text-neutral-400 text-sm">
              Share your 2025 running year!
            </p>
            <button onClick={exportGridToPNG} disabled={isExporting} className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50">
              {isExporting ? "Exporting..." : "Save Image"}
            </button>
            <a
              href="https://buy.stripe.com/fZu14m1UQ2mgcuwgQTbbG0A"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-500 text-lg hover:text-neutral-300 underline mt-2"
            >
              Your brand here
            </a>
          </div>
        </>
      )}
    </div>
  );
};
