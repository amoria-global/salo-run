"use client";

import React, { useRef } from 'react';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '@/app/context/CurrencyContext';

const PayrollReport = () => {
  const { colors, actualTheme } = useTheme();
  const { formatPrice } = useCurrency();
  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleDownloadPDF = () => {
    handlePrint();
  };

  // Sample payroll data
  const payrollData = {
    period: 'From 13 - 18 July 2025',
    generatedDate: 'July 19, 2025',
    initial: 1200.13,
    pending: 350.13,
    paid: 949.87,
    total: 2500.13,
    transactions: [
      {
        id: 1,
        date: 'July 13, 2025',
        description: 'Wedding Photography - Kagabo Innocent',
        type: 'Service Payment',
        amount: 430.00,
        status: 'Paid'
      },
      {
        id: 2,
        date: 'July 14, 2025',
        description: 'Portrait Session - Amora Smith',
        type: 'Service Payment',
        amount: 300.00,
        status: 'Paid'
      },
      {
        id: 3,
        date: 'July 15, 2025',
        description: 'Photo Consultation - Penny Gloria',
        type: 'Service Payment',
        amount: 110.00,
        status: 'Pending'
      },
      {
        id: 4,
        date: 'July 16, 2025',
        description: 'Event Photography - Sarah Johnson',
        type: 'Service Payment',
        amount: 520.00,
        status: 'Initial'
      },
      {
        id: 5,
        date: 'July 17, 2025',
        description: 'Corporate Headshots - Tech Corp',
        type: 'Service Payment',
        amount: 680.13,
        status: 'Initial'
      },
      {
        id: 6,
        date: 'July 18, 2025',
        description: 'Product Photography - Asha Ross',
        type: 'Service Payment',
        amount: 240.13,
        status: 'Pending'
      },
      {
        id: 7,
        date: 'July 18, 2025',
        description: 'Family Photo Session - Mike Brown',
        type: 'Service Payment',
        amount: 219.87,
        status: 'Paid'
      }
    ]
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return { bg: '#D1FAE5', text: '#065F46' };
      case 'pending':
        return { bg: '#FEF3C7', text: '#92400E' };
      case 'initial':
        return { bg: '#DBEAFE', text: '#1E40AF' };
      default:
        return { bg: '#F3F4F6', text: '#374151' };
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          .print-show {
            display: block !important;
          }
          #printable-report {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          @page {
            margin: 1cm;
          }
        }
        .print-show {
          display: none;
        }
      `}} />

      <div style={{ display: 'flex', height: '100vh', backgroundColor: colors.bgPrimary }}>
        <div className="no-print">
          <Sidebar />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="no-print">
            <Topbar userRole="photographer" />
          </div>

          {/* Main Content */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem'
          }}>
            {/* Header with Actions */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }} className="no-print">
              <div>
                <h1 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: colors.textPrimary,
                  margin: 0
                }}>Payroll Report</h1>
                <p style={{
                  fontSize: '0.875rem',
                  color: colors.textSecondary,
                  marginTop: '0.25rem'
                }}>{payrollData.period}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => window.history.back()}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: colors.bgCard,
                    border: `2px solid ${colors.borderPrimary}`,
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: colors.textPrimary,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bgTertiary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bgCard;
                  }}
                >
                  <i className="bi bi-arrow-left"></i>
                  Back
                </button>
                <button
                  onClick={handleDownloadPDF}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#083A85',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#062D6B';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#083A85';
                  }}
                >
                  <i className="bi bi-printer"></i>
                  Print Report
                </button>
              </div>
            </div>

            {/* Printable Report */}
            <div id="printable-report" ref={reportRef}>
              {/* Print Header (only visible when printing) */}
              <div className="print-show" style={{
                marginBottom: '2rem',
                borderBottom: '2px solid #083A85',
                paddingBottom: '1rem'
              }}>
                <h1 style={{
                  fontSize: '1.875rem',
                  fontWeight: '700',
                  color: '#083A85',
                  margin: 0
                }}>Payroll Report</h1>
                <p style={{
                  fontSize: '0.875rem',
                  color: colors.textSecondary,
                  marginTop: '0.5rem'
                }}>
                  {payrollData.period} • Generated on {payrollData.generatedDate}
                </p>
              </div>

              {/* Summary Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  backgroundColor: colors.bgCard,
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  border: `2px solid ${colors.borderPrimary}`
                }}>
                  <div style={{
                    fontSize: '0.75rem',
                    color: colors.textSecondary,
                    marginBottom: '0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: '600'
                  }}>Total Amount</div>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: colors.textPrimary
                  }}>{formatPrice(payrollData.total)}</div>
                </div>

                <div style={{
                  backgroundColor: colors.bgCard,
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  border: `2px solid ${colors.borderPrimary}`
                }}>
                  <div style={{
                    fontSize: '0.75rem',
                    color: colors.textSecondary,
                    marginBottom: '0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: '600'
                  }}>Paid</div>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#065F46'
                  }}>{formatPrice(payrollData.paid)}</div>
                  <div style={{
                    marginTop: '0.5rem',
                    height: '4px',
                    backgroundColor: '#111827',
                    borderRadius: '2px'
                  }}></div>
                </div>

                <div style={{
                  backgroundColor: colors.bgCard,
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  border: `2px solid ${colors.borderPrimary}`
                }}>
                  <div style={{
                    fontSize: '0.75rem',
                    color: colors.textSecondary,
                    marginBottom: '0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: '600'
                  }}>Pending</div>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#92400E'
                  }}>{formatPrice(payrollData.pending)}</div>
                  <div style={{
                    marginTop: '0.5rem',
                    height: '4px',
                    backgroundColor: '#FCD34D',
                    borderRadius: '2px'
                  }}></div>
                </div>

                <div style={{
                  backgroundColor: colors.bgCard,
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  border: `2px solid ${colors.borderPrimary}`
                }}>
                  <div style={{
                    fontSize: '0.75rem',
                    color: colors.textSecondary,
                    marginBottom: '0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: '600'
                  }}>Initial</div>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#1E40AF'
                  }}>{formatPrice(payrollData.initial)}</div>
                  <div style={{
                    marginTop: '0.5rem',
                    height: '4px',
                    backgroundColor: '#3B82F6',
                    borderRadius: '2px'
                  }}></div>
                </div>
              </div>

              {/* Detailed Transactions */}
              <div style={{
                backgroundColor: colors.bgCard,
                borderRadius: '0.75rem',
                padding: '1.5rem',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                border: `2px solid ${colors.borderPrimary}`
              }}>
                <h2 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: colors.textPrimary,
                  marginBottom: '1.5rem',
                  marginTop: 0
                }}>Transaction Details</h2>

                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse'
                }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                      <th style={{
                        textAlign: 'left',
                        padding: '0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: colors.textSecondary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Date</th>
                      <th style={{
                        textAlign: 'left',
                        padding: '0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: colors.textSecondary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Description</th>
                      <th style={{
                        textAlign: 'left',
                        padding: '0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: colors.textSecondary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Type</th>
                      <th style={{
                        textAlign: 'right',
                        padding: '0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: colors.textSecondary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Amount</th>
                      <th style={{
                        textAlign: 'center',
                        padding: '0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: colors.textSecondary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrollData.transactions.map((transaction) => {
                      const statusStyle = getStatusColor(transaction.status);
                      return (
                        <tr
                          key={transaction.id}
                          style={{
                            borderBottom: '1px solid #F3F4F6'
                          }}
                        >
                          <td style={{
                            padding: '1rem 0.75rem',
                            fontSize: '0.875rem',
                            color: colors.textPrimary
                          }}>{transaction.date}</td>
                          <td style={{
                            padding: '1rem 0.75rem',
                            fontSize: '0.875rem',
                            color: colors.textPrimary,
                            fontWeight: '500'
                          }}>{transaction.description}</td>
                          <td style={{
                            padding: '1rem 0.75rem',
                            fontSize: '0.875rem',
                            color: colors.textSecondary
                          }}>{transaction.type}</td>
                          <td style={{
                            padding: '1rem 0.75rem',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: colors.textPrimary,
                            textAlign: 'right'
                          }}>{formatPrice(transaction.amount)}</td>
                          <td style={{
                            padding: '1rem 0.75rem',
                            textAlign: 'center'
                          }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              backgroundColor: statusStyle.bg,
                              color: statusStyle.text
                            }}>
                              {transaction.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid #E5E7EB' }}>
                      <td colSpan={3} style={{
                        padding: '1rem 0.75rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: colors.textPrimary,
                        textAlign: 'right'
                      }}>Total:</td>
                      <td style={{
                        padding: '1rem 0.75rem',
                        fontSize: '1.125rem',
                        fontWeight: '700',
                        color: colors.textPrimary,
                        textAlign: 'right'
                      }}>{formatPrice(payrollData.total)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Print Footer */}
              <div className="print-show" style={{
                marginTop: '3rem',
                paddingTop: '1rem',
                borderTop: '1px solid #E5E7EB',
                fontSize: '0.75rem',
                color: colors.textSecondary,
                textAlign: 'center'
              }}>
                <p style={{ margin: 0 }}>
                  This report was generated on {payrollData.generatedDate} | Amoria connekt
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PayrollReport;
