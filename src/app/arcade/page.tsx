import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function ArcadeRedirectPage() {
    redirect('/vegas?tab=arcade');
}
