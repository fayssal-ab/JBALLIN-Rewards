import { getAllMerchItems } from "@/lib/merch";
import { isAdminSession } from "@/lib/admin";
import { MerchAdmin } from "@/components/MerchAdmin";

export const dynamic = "force-dynamic";

export default async function AdminMerchPage() {
  // See the comment in app/admin/tournaments/page.tsx: the layout hiding
  // {children} doesn't stop this segment's fetch from running, so this
  // check has to happen here too, before any query.
  if (!(await isAdminSession())) return null;

  const items = await getAllMerchItems();

  return (
    <div>
      <p className="text-xs tracking-[0.3em] text-white/40 uppercase">
        Support
      </p>
      <h1 className="font-display text-3xl uppercase text-white sm:text-4xl">
        Store
      </h1>
      <MerchAdmin items={items} />
    </div>
  );
}
