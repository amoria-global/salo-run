import React from 'react';

interface ChartData {
  day: string;
  value1: number;
  value2: number;
}

interface PerformanceChartProps {
  data: ChartData[];
  height?: number;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data,
  height = 200
}) => {
  const maxValue = Math.max(...data.flatMap(d => [d.value1, d.value2]));
  const roundedMax = Math.ceil(maxValue / 50) * 50;
  const scale = height / roundedMax;
  const yAxisLabels = [roundedMax, roundedMax * 0.75, roundedMax * 0.5, roundedMax * 0.25, 0];

  return (
    <div className="w-full">
      <div className="flex">
        {/* Y-axis labels */}
        <div className="flex flex-col justify-between pr-3 text-right" style={{ height: `${height}px` }}>
          {yAxisLabels.map((label, index) => (
            <span key={index} className="text-xs text-gray-400">{Math.round(label)}</span>
          ))}
        </div>

        {/* Chart area */}
        <div className="flex-1 relative">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {yAxisLabels.map((_, index) => (
              <div key={index} className="border-b border-gray-100 w-full h-0"></div>
            ))}
          </div>

          {/* Bars */}
          <div className="flex justify-between items-end gap-2 relative" style={{ height: `${height}px` }}>
            {data.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="flex gap-1 items-end" style={{ height: `${height}px` }}>
                  <div
                    className="w-4 rounded-t transition-all"
                    style={{
                      height: `${item.value1 * scale}px`,
                      background: 'linear-gradient(180deg, #3B82F6 0%, #93C5FD 100%)'
                    }}
                  />
                  <div
                    className="w-4 rounded-t transition-all"
                    style={{
                      height: `${item.value2 * scale}px`,
                      background: 'linear-gradient(180deg, #F59E0B 0%, #FDE68A 100%)'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex mt-2">
        <div className="w-8"></div>
        <div className="flex-1 flex justify-between">
          {data.map((item, index) => (
            <span key={index} className="flex-1 text-center text-xs text-gray-400 font-medium">{item.day}</span>
          ))}
        </div>
      </div>
    </div>
  );
};
