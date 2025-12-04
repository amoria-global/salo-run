import { redirect } from 'next/navigation';

export default function Page() {
  // Bookings have been merged into the Photographers page
  redirect('/user/client/photographers');
}
