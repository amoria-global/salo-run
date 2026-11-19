"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useDashboardAuth, dashboardAuthFetch } from '../../providers/AuthProvider';
import { getApiUrl } from '@/lib/api';
import { getMyWallet, type WalletDTO } from '@/lib/walletApi';
import { useHighlightOnMount } from '@/lib/useHighlightOnMount';
import { useAllTransactions, type AllTransactionsController } from '@/app/components/transactions/useAllTransactions';
import { useUiGlass } from '@/app/lib/useUiGlass';
import GlassAllTransactions from '@/app/components/glass/pages/GlassAllTransactions';

function formatTransactionDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  const formatted = date.toLocaleDateString('en-US', options);
  const hours = date.getHours();
  return `${formatted} ${hours >= 12 ? 'PM' : 'AM'}`;
}

function mapTransactionStatus(status: string): string {
  if (!status) return 'Initiated';
  const s = status.toUpperCase();
  if (s === 'COMPLETED' || s === 'SUCCESS') return 'Completed';
  if (s === 'PENDING') return 'Pending';
  if (s === 'IN_PROGRESS' || s === 'PROCESSING') return 'In progress';
  if (s === 'FAILED' || s === 'CANCELLED') return 'Failed';
  return 'Initiated';
}

/** The classic page body (header, filters, list). The dialogs are AllTransactionsModals, shared with the Compact Glass page. */
const AllTransactionsBody = ({ ctl }: { ctl: AllTransactionsController }) => {
  const {
    colors,
    actualTheme,
    formatPrice,
    currency,
    user,
    formatRowAmount,
    transactions,
    setTransactions,
    selectedTransaction,
    setSelectedTransaction,
    showModal,
    setShowModal,
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    totalPages,
    setTotalPages,
    isLoading,
    setIsLoading,
    wallet,
    setWallet,
    highlightId,
    highlightRowRef,
    fetchTransactions,
    getStatusColor,
    handleDownload,
    handleView,
    closeModal,
    filteredTransactions,
  } = ctl;
  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: colors.bgPrimary }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar userRole="photographer" />

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
                color: colors.textPrimary,
                margin: 0
              }}>All Transactions</h1>
              <p style={{
                fontSize: '0.875rem',
                color: colors.textSecondary,
                marginTop: '0.25rem'
              }}>Your complete earnings and payment history</p>
            </div>
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
          </div>

          {/* Filters and Search */}
          <div style={{
            backgroundColor: colors.bgCard,
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
                  color: colors.textSecondary,
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
                    color: colors.textPrimary,
                    backgroundColor: colors.bgCard
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
              <span style={{ fontSize: '0.875rem', color: colors.textSecondary, fontWeight: '500' }}>Status:</span>
              {['All', 'Pending', 'In progress', 'Initiated', 'Completed'].map((status) => (
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
                    backgroundColor: filterStatus === status ? '#083A85' : colors.bgTertiary,
                    color: filterStatus === status ? 'white' : colors.textSecondary
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Transactions Table */}
          <div style={{
            backgroundColor: colors.bgCard,
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
                      color: colors.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Date</th>
                    <th style={{
                      textAlign: 'left',
                      padding: '0.5rem',
                      fontSize: '0.65rem',
                      fontWeight: '600',
                      color: colors.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Transaction ID</th>
                    <th style={{
                      textAlign: 'left',
                      padding: '0.5rem',
                      fontSize: '0.65rem',
                      fontWeight: '600',
                      color: colors.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Method</th>
                    <th style={{
                      textAlign: 'left',
                      padding: '0.5rem',
                      fontSize: '0.65rem',
                      fontWeight: '600',
                      color: colors.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Amount</th>
                    <th style={{
                      textAlign: 'left',
                      padding: '0.5rem',
                      fontSize: '0.65rem',
                      fontWeight: '600',
                      color: colors.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Status</th>
                    <th style={{
                      textAlign: 'left',
                      padding: '0.5rem',
                      fontSize: '0.65rem',
                      fontWeight: '600',
                      color: colors.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Request ID</th>
                    <th style={{
                      textAlign: 'center',
                      padding: '0.5rem',
                      fontSize: '0.65rem',
                      fontWeight: '600',
                      color: colors.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => {
                    const statusStyle = getStatusColor(transaction.status);
                    const isHighlighted = highlightId != null && String(transaction.id) === highlightId;
                    return (
                      <tr
                        key={transaction.id}
                        ref={isHighlighted ? highlightRowRef : null}
                        className={isHighlighted ? 'notif-highlight-pop' : undefined}
                        style={{
                          borderBottom: '1px solid #F3F4F6'
                        }}
                      >
                        <td style={{
                          padding: '0.5rem',
                          fontSize: '0.75rem',
                          color: colors.textPrimary
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
                                {transaction.client.split(' ').map((n: string) => n[0]).join('')}
                              </div>
                              <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: '500', color: colors.textPrimary }}>
                                  {transaction.client}
                                </div>
                                <div style={{ fontSize: '0.65rem', color: colors.textSecondary }}>
                                  {transaction.service}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{
                          padding: '0.5rem',
                          fontSize: '0.75rem',
                          color: colors.textPrimary
                        }}>{transaction.transactionId}</td>
                        <td style={{
                          padding: '0.5rem',
                          fontSize: '0.75rem',
                          color: colors.textPrimary
                        }}>{transaction.method}</td>
                        <td style={{
                          padding: '0.5rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: colors.textPrimary
                        }}>{formatRowAmount(transaction.amount, transaction.currency)}</td>
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
                          color: colors.textPrimary
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
                                color: 'var(--g-error, #DC2626)',
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

            {/* Loading state */}
            {isLoading && (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: colors.textSecondary
              }}>
                <p style={{ fontSize: '1rem', fontWeight: '500' }}>Loading transactions...</p>
              </div>
            )}

            {/* No results message */}
            {!isLoading && filteredTransactions.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: colors.textSecondary
              }}>
                <i className="bi bi-inbox" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}></i>
                <p style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '0.5rem' }}>No transactions found</p>
                <p style={{ fontSize: '0.875rem' }}>Try adjusting your filters or search query</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '1rem',
                borderTop: `1px solid ${colors.borderPrimary}`
              }}>
                <button
                  onClick={() => fetchTransactions(currentPage - 1)}
                  disabled={currentPage === 0}
                  style={{
                    padding: '0.375rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: `1px solid ${colors.borderPrimary}`,
                    backgroundColor: colors.bgCard,
                    color: currentPage === 0 ? colors.textTertiary : colors.textPrimary,
                    cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  Previous
                </button>
                <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>
                  Page {currentPage + 1} of {totalPages}
                </span>
                <button
                  onClick={() => fetchTransactions(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                  style={{
                    padding: '0.375rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: `1px solid ${colors.borderPrimary}`,
                    backgroundColor: colors.bgCard,
                    color: currentPage >= totalPages - 1 ? colors.textTertiary : colors.textPrimary,
                    cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

/** Every dialog of the page, unchanged; rendered by both the classic and the Compact Glass page. */
export const AllTransactionsModals = ({ ctl }: { ctl: AllTransactionsController }) => {
  const {
    colors,
    actualTheme,
    formatPrice,
    currency,
    user,
    formatRowAmount,
    transactions,
    setTransactions,
    selectedTransaction,
    setSelectedTransaction,
    showModal,
    setShowModal,
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    totalPages,
    setTotalPages,
    isLoading,
    setIsLoading,
    wallet,
    setWallet,
    highlightId,
    highlightRowRef,
    fetchTransactions,
    getStatusColor,
    handleDownload,
    handleView,
    closeModal,
    filteredTransactions,
  } = ctl;
  return (
    <>
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
              backgroundColor: colors.bgCard,
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
              borderBottom: `2px solid ${actualTheme === 'dark' ? '#60A5FA' : '#083A85'}`
            }}>
              <h2 style={{
                fontSize: '1.125rem',
                fontWeight: '700',
                color: actualTheme === 'dark' ? '#60A5FA' : '#083A85',
                margin: 0
              }}>Transaction Details</h2>
              <button
                onClick={closeModal}
                style={{
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: `2px solid ${colors.borderPrimary}`,
                  backgroundColor: colors.bgTertiary,
                  color: colors.textPrimary,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
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
                backgroundColor: colors.bgTertiary,
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
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: colors.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedTransaction.client}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: colors.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                backgroundColor: colors.bgCard,
                border: `2px solid ${colors.borderPrimary}`,
                borderRadius: '0.5rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Date</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '500', color: colors.textPrimary }}>
                    {selectedTransaction.date}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Payment Method</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '500', color: colors.textPrimary }}>
                    {selectedTransaction.method}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Transaction ID</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '500', color: colors.textPrimary }}>
                    {selectedTransaction.transactionId}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Request ID</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '500', color: colors.textPrimary }}>
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
                backgroundColor: colors.bgTertiary,
                borderRadius: '0.5rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Status</div>
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
                  <div style={{ fontSize: '0.65rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Amount</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>
                    {formatRowAmount(selectedTransaction.amount, selectedTransaction.currency)}
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
                    backgroundColor: colors.bgCard,
                    border: `2px solid ${colors.borderPrimary}`,
                    borderRadius: '0.5rem',
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    color: colors.textPrimary,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.375rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bgTertiary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bgCard;
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
    </>
  );
};

/** One controller for both views, so the classic page (UI_GLASS=off) and the Compact Glass page behave the same. */
const AllTransactions = () => {
  const ctl = useAllTransactions();
  const glass = useUiGlass();
  if (glass) return <GlassAllTransactions ctl={ctl} modals={<AllTransactionsModals ctl={ctl} />} />;
  return <><AllTransactionsBody ctl={ctl} /><AllTransactionsModals ctl={ctl} /></>;
};

export default AllTransactions;
