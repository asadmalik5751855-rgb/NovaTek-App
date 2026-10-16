import Link from "next/link";
import { PageHeader } from "@/components/ui/primitives";
import { RangeFilter } from "@/components/charts/range-filter";
import { CommandCenter } from "@/components/portals/command-center";
import { CeoPortal, CmoPortal, CooPortal, CtoPortal, SalesDashboard, WorkDashboard } from "@/components/portals/portals";
import { requireUser } from "@/lib/auth/session";
import { canViewLeads } from "@/lib/auth/permissions";
import { resolveRange } from "@/lib/data/analytics";

export const metadata = { title: "Dashboard" };

/**
 * Personalised dashboard: each role sees its own view (CEO business, COO operations, CTO technology,
 * CMO marketing, sales pipeline, everyone else their work). Super admins land on the CEO view.
 */
export default async function DashboardPage({ searchParams }: PageProps<"/app">) {
  const session = await requireUser();
  const r = resolveRange(await searchParams);
  const firstName = (session.profile.full_name || "").split(" ")[0];
  const view = session.can("portal.ceo") ? "ceo" : session.can("portal.coo") ? "coo" : session.can("portal.cmo") ? "cmo"
    : session.can("portal.cto") ? "cto" : session.can(canViewLeads) ? "sales" : "work";
  const subtitle = {
    ceo: "Company overview", coo: "Today’s operations", cmo: "Marketing performance", cto: "Technical delivery",
    sales: session.can("leads.view_all") ? "Your pipeline and the team’s funnel" : "Your pipeline", work: "Your work",
  }[view];
  const otherPortals = (["ceo", "coo", "cto", "cmo"] as const).filter((p) => p !== view && session.can(`portal.${p}`));
  return (
    <>
      <PageHeader
        title={`Welcome${firstName ? `, ${firstName}` : ""}`}
        description={`${subtitle}${session.profile.designation ? ` · ${session.profile.designation}` : ""}`}
        actions={["ceo", "coo", "cmo", "sales"].includes(view) ? <RangeFilter active={r.key} from={r.fromDate} to={r.toDate} /> : undefined}
      />
      <div className="mb-8 space-y-3">
        <CommandCenter session={session} />
        {otherPortals.length > 0 && (
          <p className="text-xs text-text-3">Also available: {otherPortals.map((p, i) => <span key={p}>{i > 0 && " · "}<Link href={`/app/portals/${p}`} className="text-accent hover:underline">{p.toUpperCase()} portal</Link></span>)}</p>
        )}
      </div>
      {view === "ceo" && <CeoPortal r={r} />}
      {view === "coo" && <CooPortal session={session} r={r} />}
      {view === "cmo" && <CmoPortal r={r} />}
      {view === "cto" && <CtoPortal r={r} />}
      {view === "sales" && <SalesDashboard session={session} r={r} />}
      {view === "work" && <WorkDashboard session={session} />}
    </>
  );
}
