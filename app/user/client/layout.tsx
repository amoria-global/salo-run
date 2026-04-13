import PersistentPaymentBanner from '@/app/components/PersistentPaymentBanner';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <PersistentPaymentBanner />
    </>
  );
}
