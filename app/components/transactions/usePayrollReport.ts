'use client';

// payroll-report.tsx's data load and print handlers, moved verbatim so the classic page and the Compact Glass page
// share one source of truth (no behaviour change).
import { useRef, useState, useEffect } from 'react';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useDashboardAuth, dashboardAuthFetch } from '@/app/providers/AuthProvider';
import { getApiUrl } from '@/lib/api';

export interface PayrollData {
  period: string;
  generatedDate: string;
  initial: number;
  pending: number;
  paid: number;
  total: number;
  transactions: { id: string | number; date: string; description: string; type: string; amount: number; status: string }[];
}

export function usePayrollReport() {
  const { formatPrice } = useCurrency();
  const { user } = useDashboardAuth();
  const reportRef = useRef<HTMLDivElement>(null);

  const [payrollData, setPayrollData] = useState<PayrollData>({
    period: '',
    generatedDate: '',
    initial: 0,
    pending: 0,
    paid: 0,
    total: 0,
    transactions: [],
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const fetchPayroll = async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/payroll-report`);
        if (res.ok) {
          const result = await res.json();
          if (result.action === 1 && result.data) {
            const d = result.data;
            setPayrollData({
              period: d.period || '',
              generatedDate: d.generatedDate || '',
              initial: parseFloat(d.initial) || 0,
              pending: parseFloat(d.pending) || 0,
              paid: parseFloat(d.paid) || 0,
              total: parseFloat(d.total) || 0,
              transactions: (d.transactions || []).map((t: any) => ({
                id: t.id,
                date: t.date || '',
                description: t.description || '',
                type: t.type || 'Service Payment',
                amount: parseFloat(t.amountInUsd ?? t.amount) || 0,
                status: t.status || 'Pending',
              })),
            });
            setLoadError(false);
            return;
          }
        }
        // Non-2xx or action 0: say so rather than print a $0 report.
        setLoadError(true);
      } catch (err) {
        console.error('Failed to fetch payroll report:', err);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPayroll();
  }, [user?.id]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleDownloadPDF = () => {
    handlePrint();
  };

  return { formatPrice, user, reportRef, payrollData, loading, loadError, handlePrint, handleDownloadPDF };
}

export type PayrollReportController = ReturnType<typeof usePayrollReport>;
