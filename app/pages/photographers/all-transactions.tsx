"use client";

import React, { useState } from 'react';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';

// Extended transaction data
const allTransactionsData = [
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
  {
    id: 6,
    date: 'Jan. 5, 2025 PM',
    transactionId: '4****4493',
    client: 'John Doe',
    service: 'Portrait Session',
    method: 'Credit card',
    amount: 250.0,
    status: 'Pending',
    requestId: 'AM26413'
  },
  {
    id: 7,
    date: 'Jan. 5, 2025 AM',
    transactionId: '4****4494',
    client: 'Sarah Johnson',
    service: 'Event Photography',
    method: 'Mobile Money',
    amount: 520.0,
    status: 'In progress',
    requestId: 'AM26414'
  },
  {
    id: 8,
    date: 'Jan. 4, 2025 PM',
    transactionId: '4****4495',
    client: 'Mike Brown',
    service: 'Family Photo Session',
    method: 'Credit card',
    amount: 180.0,
    status: 'Initiated',
    requestId: 'AM26415'
  },
  {
    id: 9,
    date: 'Jan. 4, 2025 AM',
    transactionId: '4****4496',
    client: 'Emily Davis',
    service: 'Product Photography',
    method: 'Mobile Money',
    amount: 420.0,
    status: 'Pending',
    requestId: 'AM26416'
  },
  {
    id: 10,
    date: 'Jan. 3, 2025 PM',
    transactionId: '4****4497',
    client: 'David Wilson',
    service: 'Corporate Headshots',
    method: 'Credit card',
    amount: 350.0,
    status: 'In progress',
    requestId: 'AM26417'
  },
];

interface AllTransactionsProps {
  userType?: 'photographer' | 'freelancer';
}

const AllTransactions = ({ userType = 'photographer' }: AllTransactionsProps) => {
  const [transactions] = useState(allTransactionsData);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

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

  // Filter transactions based on status and search query
  const filteredTransactions = transactions.filter(transaction => {
    const matchesStatus = filterStatus === 'All' || transaction.status === filterStatus;
    const matchesSearch = transaction.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          transaction.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          transaction.requestId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar userRole={userType} />

        {/* Main Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <div>
              <h1 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#111827',
                margin: 0
              }}>All Transactions</h1>
              <p style={{
                fontSize: '0.875rem',
                color: '#6B7280',
                marginTop: '0.25rem'
              }}>View and manage all your transactions</p>
            </div>
            <button
              onClick={() => window.history.back()}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'white',
                border: '1px solid #D1D5DB',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F9FAFB';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              <i className="bi bi-arrow-left"></i>
              Back
            </button>
          </div>

          {/* Filters and Search */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1rem',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            {/* Search */}
            <div style={{ flex: 1, minWidth: '250px' }}>
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center'
              }}>
                <i className="bi bi-search" style={{
                  position: 'absolute',
                  left: '0.75rem',
                  color: '#6B7280',
                  fontSize: '0.875rem'
                }}></i>
                <input
                  type="text"
                  placeholder="Search by client, service, or request ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem 0.5rem 2.25rem',
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
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(8, 58, 133, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#D1D5DB';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: '#6B7280', fontWeight: '500' }}>Status:</span>
              {['All', 'Pending', 'In progress', 'Initiated'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  style={{
                    padding: '0.375rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: filterStatus === status ? '#083A85' : '#F3F4F6',
                    color: filterStatus === status ? 'white' : '#374151'
                  }}
                  onMouseEnter={(e) => {
                    if (filterStatus !== status) {
                      e.currentTarget.style.backgroundColor = '#E5E7EB';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (filterStatus !== status) {
                      e.currentTarget.style.backgroundColor = '#F3F4F6';
                    }
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Stats Summary */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1rem',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>
                Total Transactions
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                {filteredTransactions.length}
              </div>
            </div>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1rem',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>
                Total Amount
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#083A85' }}>
                ${filteredTransactions.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
              </div>
            </div>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1rem',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>
                Pending
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#92400E' }}>
                {filteredTransactions.filter(t => t.status === 'Pending').length}
              </div>
            </div>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1rem',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>
                In Progress
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1E40AF' }}>
                {filteredTransactions.filter(t => t.status === 'In progress').length}
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            padding: '1rem',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}>
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
                  {filteredTransactions.map((transaction) => {
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

            {/* No results message */}
            {filteredTransactions.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#6B7280'
              }}>
                <i className="bi bi-inbox" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}></i>
                <p style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '0.5rem' }}>No transactions found</p>
                <p style={{ fontSize: '0.875rem' }}>Try adjusting your filters or search query</p>
              </div>
            )}
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
    </div>
  );
};

export default AllTransactions;
