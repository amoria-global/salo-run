import { redirect } from 'next/navigation';

export default function Page() {
  // Transactions functionality is now part of Payments page
  redirect('/user/client/payments');
}
