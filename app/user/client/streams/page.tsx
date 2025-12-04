import { redirect } from 'next/navigation';

export default function Page() {
  // Streams functionality is now part of My Events page
  redirect('/user/client/events');
}
