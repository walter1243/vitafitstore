import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminLoginForm } from '@/components/admin-login-form';
import { ensureAdminUsersTable, getAdminSessionFromCookieStore } from '@/lib/admin-auth';

export default async function AdminLoginPage() {
  await ensureAdminUsersTable();
  const cookieStore = await cookies();
  const session = getAdminSessionFromCookieStore(cookieStore);
  if (session) {
    redirect('/admin');
  }

  return <AdminLoginForm />;
}
