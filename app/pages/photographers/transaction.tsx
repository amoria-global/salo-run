"use client";

import React, { useState } from 'react';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';

// Sample transaction data
const transactionsData = [
  {
    id: 1,
    date: 'Jan. 6, 2025 PM',
    transactionId: '4****4492',
    client: 'Kagabo Innocent',
    service: 'Wedding Photography',
    method: 'Mobile Money',
    amount: 430.0,
    status: 'Pending',
    requestId: 'AM26412'
  },
  {
    id: 2,
    date: 'Jan. 6, 2025 AM',
    transactionId: '4****4492',
    client: 'Kagabo Innocent',
    service: 'Mobile Money',
    method: 'Mobile Money',
    amount: 94,
    status: 'In progress',
    requestId: 'AM26412'
  },
  {
    id: 3,
    date: 'Jan. 6, 2025 PM',
    transactionId: '4****4492',
    client: 'Penny Gloria',
    service: 'Photo Consultation',
    method: 'Credit card',
    amount: 110,
    status: 'Initiated',
    requestId: 'AM26412'
  },
  {
    id: 4,
    date: 'Jan. 6, 2025 PM',
    transactionId: '4****4492',
    client: 'Amora Smith',
    service: 'Book Session',
    method: 'Mobile Money',
    amount: 300.0,
    status: 'Initiated',
    requestId: 'AM26412'
  },
  {
    id: 5,
    date: 'Jan. 6, 2025 PM',
    transactionId: '4****4492',
    client: 'Asha Ross',
    service: 'Yes love',
    method: 'Credit card',
    amount: 321.0,
    status: 'Initiated',
    requestId: 'AM26412'
  },
];

const Transaction = () => {
  const [transactions] = useState(transactionsData);
  const [selectedPeriod, setSelectedPeriod] = useState('1Y');
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return { bg: '#FEF3C7', text: '#92400E' };
      case 'in progress':
        return { bg: '#DBEAFE', text: '#1E40AF' };
      case 'initiated':
        return { bg: '#E0E7FF', text: '#3730A3' };
      default:
        return { bg: '#F3F4F6', text: '#374151' };
    }
  };

  const handleDownload = (transaction: any) => {
    // Create HTML content for PDF
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Transaction Receipt</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      color: #111827;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #083A85;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #083A85;
      margin: 0;
      font-size: 28px;
    }
    .header p {
      color: #6B7280;
      margin: 5px 0 0 0;
    }
    .content {
      max-width: 600px;
      margin: 0 auto;
    }
    .row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #E5E7EB;
    }
    .label {
      color: #6B7280;
      font-size: 14px;
    }
    .value {
      color: #111827;
      font-weight: 600;
      font-size: 14px;
    }
    .total-row {
      background-color: #F9FAFB;
      padding: 20px;
      margin-top: 20px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .total-label {
      font-size: 18px;
      font-weight: 600;
    }
    .total-amount {
      font-size: 24px;
      font-weight: 700;
      color: #083A85;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
      color: #6B7280;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>TRANSACTION RECEIPT</h1>
    <p>Amoria connekt</p>
  </div>
  <div class="content">
    <div class="row">
      <span class="label">Date</span>
      <span class="value">${transaction.date}</span>
    </div>
    <div class="row">
      <span class="label">Transaction ID</span>
      <span class="value">${transaction.transactionId}</span>
    </div>
    <div class="row">
      <span class="label">Request ID</span>
      <span class="value">${transaction.requestId}</span>
    </div>
    <div class="row">
      <span class="label">Client</span>
      <span class="value">${transaction.client}</span>
    </div>
    <div class="row">
      <span class="label">Service</span>
      <span class="value">${transaction.service}</span>
    </div>
    <div class="row">
      <span class="label">Payment Method</span>
      <span class="value">${transaction.method}</span>
    </div>
    <div class="row">
      <span class="label">Status</span>
      <span class="value">${transaction.status}</span>
    </div>
    <div class="total-row">
      <span class="total-label">Total Amount</span>
      <span class="total-amount">$${transaction.amount}</span>
    </div>
  </div>
  <div class="footer">
    <p>Thank you for your business!</p>
    <p>This receipt was generated on ${new Date().toLocaleDateString()}</p>
  </div>
</body>
</html>
    `;

    // Create a blob and trigger print (which can save as PDF)
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');

    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
        setTimeout(() => {
          printWindow.close();
          window.URL.revokeObjectURL(url);
        }, 100);
      };
    }
  };

  const handleView = (transaction: any) => {
    setSelectedTransaction(transaction);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTransaction(null);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />

        {/* Main Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem'
        }}>
          {/* Financial Summary Card */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1rem',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  backgroundColor: '#F3F4F6',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="bi bi-bank2" style={{ fontSize: '1.25rem', color: '#374151' }}></i>
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    $2,848.80
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                    Available to withdraw
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  style={{
                    padding: '0.625rem 1.5rem',
                    backgroundColor: '#083A85',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#062D6B';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#083A85';
                  }}
                >
                  Withdraw
                </button>
                <button
                  style={{
                    width: '36px',
                    height: '36px',
                    backgroundColor: 'transparent',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <i className="bi bi-three-dots" style={{ fontSize: '1rem', color: '#374151' }}></i>
                </button>
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '2rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid #E5E7EB'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>
                  Previous Deposit:
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>
                  $450.00
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>
                  Last Withdraw:
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>
                  $1,345.00
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>
                  Active Account:
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem'
                }}>
                  <i className="bi bi-credit-card" style={{ fontSize: '0.875rem', color: '#374151' }}></i>
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>
                    *****980
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Earnings Chart and Payroll Summary */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            {/* Total Earnings Chart */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1rem',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '0.75rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.125rem' }}>
                    Total Earnings
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827' }}>
                    $18,500.04
                  </div>
                  <div style={{
                    display: 'inline-block',
                    fontSize: '0.65rem',
                    fontWeight: '600',
                    color: '#10B981',
                    backgroundColor: '#D1FAE5',
                    padding: '0.125rem 0.375rem',
                    borderRadius: '0.25rem',
                    marginTop: '0.25rem'
                  }}>
                    +23% vs last week
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  gap: '0.25rem',
                  fontSize: '0.65rem',
                  fontWeight: '500',
                  color: '#6B7280'
                }}>
                  {['1W', '1M', '3M', '6M', '1Y'].map((period) => (
                    <button
                      key={period}
                      onClick={() => setSelectedPeriod(period)}
                      style={{
                        padding: '0.125rem 0.375rem',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        color: selectedPeriod === period ? '#111827' : '#6B7280',
                        fontWeight: selectedPeriod === period ? '600' : '500',
                        fontSize: '0.65rem',
                        transition: 'all 0.2s'
                      }}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart Area */}
              <div style={{
                position: 'relative',
                height: '160px',
                marginTop: '0.5rem'
              }}>
                <svg width="100%" height="160" viewBox="0 0 600 160" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#083A85" />
                      <stop offset="100%" stopColor="#E9E9E9" />
                    </linearGradient>
                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgba(8, 58, 133, 0.2)" />
                      <stop offset="100%" stopColor="rgba(233, 233, 233, 0.2)" />
                    </linearGradient>
                  </defs>

                  {/* Area under the line */}
                  <path
                    d="M 0,80 L 100,75 L 200,85 L 300,60 L 400,70 L 500,65 L 600,55 L 600,160 L 0,160 Z"
                    fill="url(#areaGradient)"
                  />

                  {/* Line chart */}
                  <path
                    d="M 0,80 L 100,75 L 200,85 L 300,60 L 400,70 L 500,65 L 600,55"
                    fill="none"
                    stroke="url(#chartGradient)"
                    strokeWidth="2.5"
                  />
                </svg>

                {/* Earnings Tooltip */}
                <div style={{
                  position: 'absolute',
                  top: '15%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  textAlign: 'center',
                  zIndex: 10
                }}>
                  <div style={{ fontSize: '0.65rem', color: '#6B7280', marginBottom: '0.25rem' }}>
                    Wednesday, 16 July 2025
                  </div>
                  <div style={{
                    backgroundColor: '#1E3A8A',
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    boxShadow: '0 2px 8px rgba(30, 58, 138, 0.3)'
                  }}>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span style={{ fontSize: '0.7rem', color: '#1E3A8A', fontWeight: '700' }}>$</span>
                    </div>
                    <span>Earnings</span>
                    <span style={{ fontWeight: '700', marginLeft: '0.25rem' }}>$5.6k</span>
                  </div>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#EC4899',
                    borderRadius: '50%',
                    margin: '0.5rem auto 0',
                    boxShadow: '0 0 0 3px rgba(236, 72, 153, 0.3)'
                  }}></div>
                </div>

                {/* Date Labels */}
                <div style={{
                  position: 'absolute',
                  bottom: '0',
                  left: 0,
                  right: 0,
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0 0.5rem',
                  fontSize: '0.6rem',
                  color: '#9CA3AF'
                }}>
                  <span>July 13</span>
                  <span>July 14</span>
                  <span>July 15</span>
                  <span>July 16</span>
                  <span>July 17</span>
                  <span>July 18</span>
                  <span>July 19</span>
                </div>
              </div>
            </div>

            {/* Payroll Summary */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1rem',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#111827', marginBottom: '0.125rem' }}>
                    Payroll summary
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#9CA3AF' }}>
                    From 13 - 18 July 2025
                  </div>
                </div>
                <a
                  href="/user/photographers/payroll-report"
                  style={{
                    color: '#2563EB',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    textDecoration: 'none'
                  }}
                >
                  View report
                </a>
              </div>

              {/* Stats with colored bars */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    height: '3px',
                    backgroundColor: '#3B82F6',
                    marginBottom: '0.5rem',
                    borderRadius: '2px'
                  }}></div>
                  <div style={{
                    fontSize: '0.65rem',
                    color: '#6B7280',
                    marginBottom: '0.25rem'
                  }}>Initial</div>
                  <div style={{
                    fontSize: '1rem',
                    fontWeight: '700',
                    color: '#111827'
                  }}>$1,200.13</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    height: '3px',
                    backgroundColor: '#FCD34D',
                    marginBottom: '0.5rem',
                    borderRadius: '2px'
                  }}></div>
                  <div style={{
                    fontSize: '0.65rem',
                    color: '#6B7280',
                    marginBottom: '0.25rem'
                  }}>Pending</div>
                  <div style={{
                    fontSize: '1rem',
                    fontWeight: '700',
                    color: '#111827'
                  }}>$350.13</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    height: '3px',
                    backgroundColor: '#111827',
                    marginBottom: '0.5rem',
                    borderRadius: '2px'
                  }}></div>
                  <div style={{
                    fontSize: '0.65rem',
                    color: '#6B7280',
                    marginBottom: '0.25rem'
                  }}>Paid</div>
                  <div style={{
                    fontSize: '1rem',
                    fontWeight: '700',
                    color: '#111827'
                  }}>$949.87</div>
                </div>
              </div>

              {/* Donut Chart */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: '0.5rem'
              }}>
                <svg width="240" height="140" viewBox="0 0 240 140">
                  {/* Donut segments */}
                  <g transform="translate(120, 120)">
                    {/* Initial - Blue (left side) */}
                    <path
                      d="M -60,0 A 60,60 0 0,1 -30,-51.96 L -18,-31.18 A 36,36 0 0,0 -36,0 Z"
                      fill="#3B82F6"
                    />
                    {/* Pending - Yellow (top) */}
                    <path
                      d="M -30,-51.96 A 60,60 0 0,1 30,-51.96 L 18,-31.18 A 36,36 0 0,0 -18,-31.18 Z"
                      fill="#FCD34D"
                    />
                    {/* Paid - Black (right side) */}
                    <path
                      d="M 30,-51.96 A 60,60 0 0,1 60,0 L 36,0 A 36,36 0 0,0 18,-31.18 Z"
                      fill="#111827"
                    />
                  </g>
                </svg>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            padding: '1rem',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h2 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>Recent Transactions</h2>
              <a
                href="/user/photographers/all-transactions"
                style={{
                  color: '#2563EB',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  textDecoration: 'none'
                }}
              >
                See all
              </a>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <th style={{
                      textAlign: 'left',
                      padding: '0.5rem',
                      fontSize: '0.65rem',
                      fontWeight: '600',
                      color: '#6B7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Date</th>
                    <th style={{
                      textAlign: 'left',
                      padding: '0.5rem',
                      fontSize: '0.65rem',
                      fontWeight: '600',
                      color: '#6B7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Transaction ID</th>
                    <th style={{
                      textAlign: 'left',
                      padding: '0.5rem',
                      fontSize: '0.65rem',
                      fontWeight: '600',
                      color: '#6B7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Method</th>
                    <th style={{
                      textAlign: 'left',
                      padding: '0.5rem',
                      fontSize: '0.65rem',
                      fontWeight: '600',
                      color: '#6B7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Amount</th>
                    <th style={{
                      textAlign: 'left',
                      padding: '0.5rem',
                      fontSize: '0.65rem',
                      fontWeight: '600',
                      color: '#6B7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Status</th>
                    <th style={{
                      textAlign: 'left',
                      padding: '0.5rem',
                      fontSize: '0.65rem',
                      fontWeight: '600',
                      color: '#6B7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Request ID</th>
                    <th style={{
                      textAlign: 'center',
                      padding: '0.5rem',
                      fontSize: '0.65rem',
                      fontWeight: '600',
                      color: '#6B7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => {
                    const statusStyle = getStatusColor(transaction.status);
                    return (
                      <tr
                        key={transaction.id}
                        style={{
                          borderBottom: '1px solid #F3F4F6'
                        }}
                      >
                        <td style={{
                          padding: '0.5rem',
                          fontSize: '0.75rem',
                          color: '#111827'
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span style={{ fontWeight: '500', fontSize: '0.7rem' }}>{transaction.date}</span>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.375rem'
                            }}>
                              <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                backgroundColor: transaction.id % 2 === 0 ? '#FEF3C7' : '#DBEAFE',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.65rem',
                                fontWeight: '600',
                                color: transaction.id % 2 === 0 ? '#92400E' : '#1E40AF'
                              }}>
                                {transaction.client.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: '500', color: '#111827' }}>
                                  {transaction.client}
                                </div>
                                <div style={{ fontSize: '0.65rem', color: '#6B7280' }}>
                                  {transaction.service}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{
                          padding: '0.5rem',
                          fontSize: '0.75rem',
                          color: '#374151'
                        }}>{transaction.transactionId}</td>
                        <td style={{
                          padding: '0.5rem',
                          fontSize: '0.75rem',
                          color: '#374151'
                        }}>{transaction.method}</td>
                        <td style={{
                          padding: '0.5rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: '#111827'
                        }}>${transaction.amount}</td>
                        <td style={{ padding: '0.5rem' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.125rem 0.5rem',
                            borderRadius: '9999px',
                            fontSize: '0.65rem',
                            fontWeight: '500',
                            backgroundColor: statusStyle.bg,
                            color: statusStyle.text
                          }}>
                            {transaction.status}
                          </span>
                        </td>
                        <td style={{
                          padding: '0.5rem',
                          fontSize: '0.75rem',
                          color: '#374151'
                        }}>
                          <i className="bi bi-link-45deg" style={{ marginRight: '0.125rem', fontSize: '0.75rem' }}></i>
                          {transaction.requestId}
                        </td>
                        <td style={{
                          padding: '0.5rem',
                          textAlign: 'center'
                        }}>
                          <div style={{
                            display: 'flex',
                            gap: '0.375rem',
                            justifyContent: 'center'
                          }}>
                            <button
                              onClick={() => handleDownload(transaction)}
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '50%',
                                border: 'none',
                                backgroundColor: '#FEE2E2',
                                color: '#DC2626',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#FEE2E2';
                                e.currentTarget.style.transform = 'scale(1.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#FEE2E2';
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                              title="Download"
                            >
                              <i className="bi bi-download" style={{ fontSize: '0.7rem' }}></i>
                            </button>
                            <button
                              onClick={() => handleView(transaction)}
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '50%',
                                border: 'none',
                                backgroundColor: '#DBEAFE',
                                color: '#2563EB',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#DBEAFE';
                                e.currentTarget.style.transform = 'scale(1.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#DBEAFE';
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                              title="View"
                            >
                              <i className="bi bi-eye" style={{ fontSize: '0.7rem' }}></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {showModal && selectedTransaction && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={closeModal}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              width: '420px',
              maxHeight: '85vh',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              paddingBottom: '0.75rem',
              borderBottom: '2px solid #083A85'
            }}>
              <h2 style={{
                fontSize: '1.125rem',
                fontWeight: '700',
                color: '#083A85',
                margin: 0
              }}>Transaction Details</h2>
              <button
                onClick={closeModal}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#F3F4F6',
                  color: '#374151',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#E5E7EB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F3F4F6';
                }}
              >
                <i className="bi bi-x-lg" style={{ fontSize: '0.875rem' }}></i>
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Client Info */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                backgroundColor: '#F9FAFB',
                borderRadius: '0.5rem'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: selectedTransaction.id % 2 === 0 ? '#FEF3C7' : '#DBEAFE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: selectedTransaction.id % 2 === 0 ? '#92400E' : '#1E40AF',
                  flexShrink: 0
                }}>
                  {selectedTransaction.client.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedTransaction.client}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedTransaction.service}
                  </div>
                </div>
              </div>

              {/* Transaction Details Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.5rem',
                padding: '0.75rem',
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '0.5rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#6B7280', marginBottom: '0.25rem' }}>Date</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '500', color: '#111827' }}>
                    {selectedTransaction.date}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#6B7280', marginBottom: '0.25rem' }}>Payment Method</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '500', color: '#111827' }}>
                    {selectedTransaction.method}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#6B7280', marginBottom: '0.25rem' }}>Transaction ID</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '500', color: '#111827' }}>
                    {selectedTransaction.transactionId}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#6B7280', marginBottom: '0.25rem' }}>Request ID</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '500', color: '#111827' }}>
                    {selectedTransaction.requestId}
                  </div>
                </div>
              </div>

              {/* Status and Amount */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                backgroundColor: '#F9FAFB',
                borderRadius: '0.5rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#6B7280', marginBottom: '0.25rem' }}>Status</div>
                  <span style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.625rem',
                    borderRadius: '9999px',
                    fontSize: '0.7rem',
                    fontWeight: '500',
                    backgroundColor: getStatusColor(selectedTransaction.status).bg,
                    color: getStatusColor(selectedTransaction.status).text
                  }}>
                    {selectedTransaction.status}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.65rem', color: '#6B7280', marginBottom: '0.25rem' }}>Amount</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#083A85' }}>
                    ${selectedTransaction.amount}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginTop: '0.5rem'
              }}>
                <button
                  onClick={() => handleDownload(selectedTransaction)}
                  style={{
                    flex: 1,
                    padding: '0.625rem 1rem',
                    backgroundColor: 'white',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    color: '#374151',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.375rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F9FAFB';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  <i className="bi bi-download" style={{ fontSize: '0.875rem' }}></i>
                  Download PDF
                </button>
                <button
                  onClick={closeModal}
                  style={{
                    flex: 1,
                    padding: '0.625rem 1rem',
                    backgroundColor: '#083A85',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#062D6B';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#083A85';
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Money Modal */}
      {showWithdrawModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={() => setShowWithdrawModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              width: '420px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                fontSize: '1.125rem',
                fontWeight: '700',
                color: '#111827',
                margin: 0
              }}>Withdraw Money</h2>
              <button
                onClick={() => setShowWithdrawModal(false)}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#F3F4F6',
                  color: '#374151',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#E5E7EB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F3F4F6';
                }}
              >
                <i className="bi bi-x-lg" style={{ fontSize: '0.875rem' }}></i>
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Amount Input */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Amount (USD)
                </label>
                <input
                  type="text"
                  placeholder="$5000"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'all 0.2s',
                    color: '#111827',
                    backgroundColor: 'white'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#083A85';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#D1D5DB';
                  }}
                />
              </div>

              {/* Receiver Account Dropdown */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Receiver Account
                </label>
                <select
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'all 0.2s',
                    color: '#6B7280',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#083A85';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#D1D5DB';
                  }}
                >
                  <option value="">Select your saved account</option>
                  <option value="account1">Account ending in *****980</option>
                  <option value="account2">Account ending in *****432</option>
                  <option value="account3">Account ending in *****187</option>
                </select>
              </div>

              {/* Withdraw Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  style={{
                    padding: '0.625rem 2rem',
                    backgroundColor: '#083A85',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#062D6B';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#083A85';
                  }}
                  onClick={() => {
                    // Handle withdrawal logic here
                    console.log('Withdrawing:', withdrawAmount);
                    setShowWithdrawModal(false);
                    setWithdrawAmount('');
                  }}
                >
                  Withdraw
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transaction;