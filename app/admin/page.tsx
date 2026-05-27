import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminPage from '../../components/admin-page';
import { ensureAdminUsersTable, getAdminSessionFromCookieStore } from '@/lib/admin-auth';

export default async function Admin() {
  await ensureAdminUsersTable();
  const cookieStore = await cookies();
  const session = getAdminSessionFromCookieStore(cookieStore);
  if (!session) {
    redirect('/admin/login');
  }

  return <AdminPage initialAdmin={session} />;
}
