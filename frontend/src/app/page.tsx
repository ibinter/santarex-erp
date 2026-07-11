import { redirect } from 'next/navigation';

export default function Home() {
  // Server component — redirect to dashboard
  // Auth check is handled by the dashboard layout
  redirect('/dashboard');
}
