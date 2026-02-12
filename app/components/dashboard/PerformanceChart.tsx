"use client";

import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface ChartData {
  day: string;
  value1: number;
  value2: number;
}

interface PerformanceChartProps {
  data: ChartData[];
  height?: number;
  // Comparison mode props
  isComparisonMode?: boolean;
  targetData?: ChartData[];
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data,
  height = 200,
  isComparisonMode = false,
  targetData
}) => {
  const { colors } = useTheme();

  // Include target data in max calculation if in comparison mode
  const allValues = isComparisonMode && targetData
    ? [...data.flatMap(d => [d.value1, d.value2]), ...targetData.flatMap(d => [d.value1, d.value2])]
    : data.flatMap(d => [d.value1, d.value2]);

  const maxValue = Math.max(...allValues);
  const roundedMax = Math.ceil(maxValue / 50) * 50 || 200;
  const scale = height / roundedMax;
  const yAxisLabels = [roundedMax, roundedMax * 0.75, roundedMax * 0.5, roundedMax * 0.25, 0];

  return (
    <div style={{ width: '100%' }}>
      {/* Legend for comparison mode */}
      {isComparisonMode && targetData && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          marginBottom: '1rem',
          paddingBottom: '0.75rem',
          borderBottom: `2px solid ${colors.borderPrimary}`
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1.5rem',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '2px',
                background: 'linear-gradient(180deg, #3B82F6 0%, #93C5FD 100%)'
              }} />
              <span style={{ fontSize: '0.75rem', color: colors.textSecondary }}>Current V1</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '2px',
                background: 'linear-gradient(180deg, #F59E0B 0%, #FDE68A 100%)'
              }} />
              <span style={{ fontSize: '0.75rem', color: colors.textSecondary }}>Current V2</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '2px',
                background: 'linear-gradient(180deg, #F20C8F 0%, #F9A8D4 100%)'
              }} />
              <span style={{ fontSize: '0.75rem', color: colors.textSecondary }}>Target V1</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '2px',
                background: 'linear-gradient(180deg, #10B981 0%, #6EE7B7 100%)'
              }} />
              <span style={{ fontSize: '0.75rem', color: colors.textSecondary }}>Target V2</span>
            </div>
          </div>
        </div>
      )}

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
              color: colors.textTertiary,
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
                borderBottom: `2px solid ${colors.borderPrimary}`,
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
            {data.map((item, index) => {
              const target = isComparisonMode && targetData ? targetData[index] : null;

              return (
                <div key={index} style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <div style={{
                    display: 'flex',
                    gap: isComparisonMode ? '0.125rem' : '0.25rem',
                    alignItems: 'flex-end',
                    height: `${height}px`
                  }}>
                    {/* Current Value 1 */}
                    <div
                      style={{
                        width: isComparisonMode ? '0.75rem' : '1.25rem',
                        borderTopLeftRadius: '0.25rem',
                        borderTopRightRadius: '0.25rem',
                        transition: 'all 0.3s',
                        height: `${item.value1 * scale}px`,
                        background: 'linear-gradient(180deg, #3B82F6 0%, #93C5FD 100%)',
                        boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
                      }}
                      title={`Current V1: ${item.value1}`}
                    />
                    {/* Current Value 2 */}
                    <div
                      style={{
                        width: isComparisonMode ? '0.75rem' : '1.25rem',
                        borderTopLeftRadius: '0.25rem',
                        borderTopRightRadius: '0.25rem',
                        transition: 'all 0.3s',
                        height: `${item.value2 * scale}px`,
                        background: 'linear-gradient(180deg, #F59E0B 0%, #FDE68A 100%)',
                        boxShadow: '0 2px 4px rgba(245, 158, 11, 0.2)'
                      }}
                      title={`Current V2: ${item.value2}`}
                    />
                    {/* Target bars (only in comparison mode) */}
                    {isComparisonMode && target && (
                      <>
                        <div
                          style={{
                            width: '0.75rem',
                            borderTopLeftRadius: '0.25rem',
                            borderTopRightRadius: '0.25rem',
                            transition: 'all 0.3s',
                            height: target.value1 > 0 ? `${target.value1 * scale}px` : '4px',
                            minHeight: '4px',
                            background: 'linear-gradient(180deg, #F20C8F 0%, #F9A8D4 100%)',
                            boxShadow: '0 2px 4px rgba(242, 12, 143, 0.2)',
                            opacity: target.value1 > 0 ? 0.8 : 0.4
                          }}
                          title={`Target V1: ${target.value1}`}
                        />
                        <div
                          style={{
                            width: '0.75rem',
                            borderTopLeftRadius: '0.25rem',
                            borderTopRightRadius: '0.25rem',
                            transition: 'all 0.3s',
                            height: target.value2 > 0 ? `${target.value2 * scale}px` : '4px',
                            minHeight: '4px',
                            background: 'linear-gradient(180deg, #10B981 0%, #6EE7B7 100%)',
                            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
                            opacity: target.value2 > 0 ? 0.8 : 0.4
                          }}
                          title={`Target V2: ${target.value2}`}
                        />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
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
              color: colors.textTertiary,
              fontWeight: '600'
            }}>{item.day}</span>
          ))}
        </div>
      </div>
    </div>
  );
};
