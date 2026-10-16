import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function GameRedirectPage() {
  redirect('/academy?tab=arena');
}
