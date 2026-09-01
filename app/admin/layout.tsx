import { isAdminSession } from "@/lib/admin";
import { AdminToggle } from "@/components/AdminToggle";
import { AdminSidebar } from "@/components/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAdmin = await isAdminSession();

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-6 py-32 text-center">
        <p className="text-xs tracking-[0.3em] text-white/40 uppercase">
          Admin
        </p>
        <h1 className="font-display mt-2 text-3xl uppercase text-white">
          Admin access required
        </h1>
        <p className="mt-4 text-sm text-white/60">
          Log in to manage the tournament, bonus hunt, and giveaway tools.
        </p>
        <AdminToggle isAdmin={false} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 px-6 py-32 lg:flex-row lg:px-10">
      <AdminSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
