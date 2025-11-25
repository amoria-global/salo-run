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
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex' }}>
        {/* Y-axis labels */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          paddingRight: '0.75rem',
          textAlign: 'right',
          height: `${height}px`
        }}>
          {yAxisLabels.map((label, index) => (
            <span key={index} style={{
              fontSize: '0.85rem',
              lineHeight: '1rem',
              color: '#9CA3AF',
              fontWeight: '500'
            }}>{Math.round(label)}</span>
          ))}
        </div>

        {/* Chart area */}
        <div style={{ flex: 1, position: 'relative' }}>
          {/* Grid lines */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            pointerEvents: 'none'
          }}>
            {yAxisLabels.map((_, index) => (
              <div key={index} style={{
                borderBottom: '1px solid #F3F4F6',
                width: '100%',
                height: 0
              }}></div>
            ))}
          </div>

          {/* Bars */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: '0.5rem',
            position: 'relative',
            height: `${height}px`
          }}>
            {data.map((item, index) => (
              <div key={index} style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <div style={{
                  display: 'flex',
                  gap: '0.25rem',
                  alignItems: 'flex-end',
                  height: `${height}px`
                }}>
                  <div
                    style={{
                      width: '1.25rem',
                      borderTopLeftRadius: '0.25rem',
                      borderTopRightRadius: '0.25rem',
                      transition: 'all 0.3s',
                      height: `${item.value1 * scale}px`,
                      background: 'linear-gradient(180deg, #3B82F6 0%, #93C5FD 100%)',
                      boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
                    }}
                  />
                  <div
                    style={{
                      width: '1.25rem',
                      borderTopLeftRadius: '0.25rem',
                      borderTopRightRadius: '0.25rem',
                      transition: 'all 0.3s',
                      height: `${item.value2 * scale}px`,
                      background: 'linear-gradient(180deg, #F59E0B 0%, #FDE68A 100%)',
                      boxShadow: '0 2px 4px rgba(245, 158, 11, 0.2)'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* X-axis labels */}
      <div style={{ display: 'flex', marginTop: '0.5rem' }}>
        <div style={{ width: '2rem' }}></div>
        <div style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          {data.map((item, index) => (
            <span key={index} style={{
              flex: 1,
              textAlign: 'center',
              fontSize: '0.85rem',
              lineHeight: '1rem',
              color: '#9CA3AF',
              fontWeight: '600'
            }}>{item.day}</span>
          ))}
        </div>
      </div>
    </div>
  );
};
