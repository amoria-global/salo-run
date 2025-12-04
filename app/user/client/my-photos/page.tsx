import { redirect } from 'next/navigation';

export default function Page() {
  // My Photos is a photographer feature - redirect clients to events
  redirect('/user/client/events');
}
