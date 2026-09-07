const fs = require("fs");
let content = fs.readFileSync("src/components/Sidebar.tsx", "utf8");

// 1. Add missing lucide imports
const lucideMatch = content.match(/import\s+{([^}]+)}\s+from\s+["']lucide-react["'];/);
if (lucideMatch) {
  let imports = lucideMatch[1].split(",").map(s => s.trim()).filter(Boolean);
  const newImports = ["CalendarDays", "CheckCircle2", "ChevronRight", "CreditCard"];
  newImports.forEach(imp => {
    if (!imports.includes(imp)) imports.push(imp);
  });
  content = content.replace(lucideMatch[0], `import {\n  ${imports.join(",\n  ")}\n} from "lucide-react";`);
}

// 2. Inject SubscriptionCard in the Sidebar
// Let's find the start of the scrollable container.
//       {/* Main Navigation (Scrollable) */}
//       <div style={{
//         flex: 1, overflowY: "auto", overflowX: "hidden", padding: "16px 12px",
//       }} className="hide-scrollbar">

const injectTarget = `      {/* Main Navigation (Scrollable) */}
      <div style={{
        flex: 1, overflowY: "auto", overflowX: "hidden", padding: "16px 12px",
      }} className="hide-scrollbar">`;
      
const injectContent = `      {/* Main Navigation (Scrollable) */}
      <div style={{
        flex: 1, overflowY: "auto", overflowX: "hidden", padding: "16px 12px",
      }} className="hide-scrollbar">
        {!collapsed && profile?.isPremium && profile?.premiumEndDate && (
          <div style={{ marginBottom: "16px" }}>
            <SubscriptionCard profile={profile} />
          </div>
        )}`;

content = content.replace(injectTarget, injectContent);

// 3. Append the components
const components = `

/* =========================================
   SUBSCRIPTION UI COMPONENTS
========================================= */

export function SubscriptionCard({ profile }: { profile: any }) {
  const [showDetails, setShowDetails] = useState(false);

  // Parse dates
  const start = profile.trialStartedAt ? new Date(profile.trialStartedAt) : new Date();
  const end = new Date(profile.premiumEndDate);
  const today = new Date();

  // Calculate days
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
  const remainingDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 3600 * 24));
  const daysLeft = Math.max(0, remainingDays);
  const daysUsed = Math.max(0, totalDays - daysLeft);

  const remainingPercent = totalDays > 0 ? Math.max(0, Math.min(100, Math.round((daysLeft / totalDays) * 100))) : 0;
  const usedPercent = 100 - remainingPercent;

  // Formatting dates
  const formatDate = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const startDate = formatDate(start);
  const expiryDate = formatDate(end);

  // Determine plan name based on total days (roughly)
  let planName = "PREMIUM PLAN";
  if (totalDays >= 1050) planName = "3 YEAR PLAN";
  else if (totalDays >= 690) planName = "2 YEAR PLAN";
  else if (totalDays >= 330) planName = "1 YEAR PLAN";
  else if (totalDays >= 170) planName = "6 MONTH PLAN";
  else if (totalDays >= 80) planName = "3 MONTH PLAN";
  else if (totalDays >= 25) planName = "1 MONTH PLAN";

  return (
    <>
      {/* COMPACT SIDEBAR CARD */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white/80 p-3 shadow-sm backdrop-blur-xl">
        
        {/* Subtle Glow */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-400/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-20 w-20 rounded-full bg-violet-400/10 blur-2xl" />

        {/* Header */}
        <div className="relative mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-sm">
              <Sparkles size={13} />
            </div>

            <span className="text-[11px] font-bold tracking-wide text-slate-600">
              SUBSCRIPTION
            </span>
          </div>

          <button
            onClick={() => setShowDetails(true)}
            className="group flex items-center gap-0.5 text-[11px] font-bold text-blue-600 transition hover:text-blue-800"
          >
            View
            <ChevronRight
              size={13}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </button>
        </div>

        {/* Plan + Status */}
        <div className="relative flex items-center justify-between">
          <div>
            <div className="text-sm font-extrabold text-slate-800">
              {planName}
            </div>

            <div className="mt-0.5 flex items-center gap-1.5">
              {daysLeft > 0 ? (
                <>
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-semibold text-emerald-600">
                    ACTIVE
                  </span>
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  <span className="text-[10px] font-semibold text-red-600">
                    EXPIRED
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="text-right">
            <div className="text-lg font-black leading-none text-slate-800">
              {daysLeft}
            </div>
            <div className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Days Left
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="relative mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-700"
              style={{ width: \`\${remainingPercent}%\` }}
            />
          </div>

          <div className="mt-1 flex justify-between text-[9px] font-medium text-slate-400">
            <span>{daysUsed} days used</span>
            <span>{remainingPercent}% remaining</span>
          </div>
        </div>

        {/* Expiry */}
        <div className="relative mt-2 flex items-center gap-1.5 text-[10px] text-slate-500">
          <CalendarDays size={12} />
          <span>
            Expires <strong className="text-slate-700">{expiryDate}</strong>
          </span>
        </div>
      </div>

      {/* DETAILS MODAL */}
      {showDetails && (
        <SubscriptionDetails
          planName={planName}
          planDays={totalDays}
          daysUsed={daysUsed}
          daysLeft={daysLeft}
          remainingPercent={remainingPercent}
          usedPercent={usedPercent}
          price={totalDays > 300 ? 4000 : (totalDays > 150 ? 2500 : 1000)} // Mock pricing
          startDate={startDate}
          expiryDate={expiryDate}
          onClose={() => setShowDetails(false)}
        />
      )}
    </>
  );
}

function SubscriptionDetails({
  planName,
  planDays,
  daysUsed,
  daysLeft,
  remainingPercent,
  usedPercent,
  price,
  startDate,
  expiryDate,
  onClose,
}: {
  planName: string;
  planDays: number;
  daysUsed: number;
  daysLeft: number;
  remainingPercent: number;
  usedPercent: number;
  price: number;
  startDate: string;
  expiryDate: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/50 bg-white shadow-2xl">
        
        {/* TOP GRADIENT */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-violet-600 px-6 py-7 text-white">
          
          <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute right-5 top-5 rounded-full bg-white/15 p-2 transition hover:bg-white/25"
          >
            <X size={18} />
          </button>

          <div className="relative">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                <Sparkles size={18} />
              </div>

              <span className="text-xs font-bold tracking-[0.18em] text-white/80">
                KRAVY SUBSCRIPTION
              </span>
            </div>

            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">
                  {planName}
                </h2>

                <div className="mt-2 flex items-center gap-2">
                  {daysLeft > 0 ? (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-400/20 px-2.5 py-1 text-xs font-bold text-white">
                      <CheckCircle2 size={13} />
                      ACTIVE
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-red-400/20 px-2.5 py-1 text-xs font-bold text-white">
                      EXPIRED
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <div className="text-3xl font-black">
                  {daysLeft}
                </div>
                <div className="text-xs font-medium text-white/70">
                  DAYS LEFT
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="space-y-5 p-6">

          {/* Usage Card */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
            
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800">
                  Plan Usage
                </h3>

                <p className="text-xs text-slate-400">
                  Your subscription journey
                </p>
              </div>

              <span className="text-sm font-black text-blue-600">
                {remainingPercent}% Remaining
              </span>
            </div>

            {/* Progress */}
            <div className="h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                style={{ width: \`\${remainingPercent}%\` }}
              />
            </div>

            <div className="mt-3 flex justify-between">
              <div>
                <p className="text-xs text-slate-400">
                  Used
                </p>
                <p className="font-bold text-slate-700">
                  {daysUsed} Days
                </p>
              </div>

              <div className="text-center">
                <p className="text-xs text-slate-400">
                  Total Plan
                </p>
                <p className="font-bold text-slate-700">
                  {planDays} Days
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs text-slate-400">
                  Remaining
                </p>
                <p className="font-bold text-blue-600">
                  {daysLeft} Days
                </p>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div>
            <h3 className="mb-3 font-bold text-slate-800">
              Subscription Period
            </h3>

            <div className="grid grid-cols-2 gap-3">
              
              <div className="rounded-2xl border border-slate-100 p-4">
                <div className="mb-2 flex items-center gap-2 text-slate-400">
                  <CalendarDays size={15} />
                  <span className="text-xs font-medium">
                    Started
                  </span>
                </div>

                <p className="font-bold text-slate-800">
                  {startDate}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 p-4">
                <div className="mb-2 flex items-center gap-2 text-slate-400">
                  <CalendarDays size={15} />
                  <span className="text-xs font-medium">
                    Expires
                  </span>
                </div>

                <p className="font-bold text-slate-800">
                  {expiryDate}
                </p>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div>
            <h3 className="mb-3 font-bold text-slate-800">
              Plan & Payment
            </h3>

            <div className="rounded-2xl border border-slate-100">
              
              <div className="flex items-center justify-between border-b border-slate-100 p-4">
                <span className="text-sm text-slate-500">
                  Plan
                </span>
                <span className="font-bold text-slate-800">
                  {planName}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 p-4">
                <span className="text-sm text-slate-500">
                  Estimated Pricing
                </span>
                <span className="font-bold text-slate-800">
                  ₹{price.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex items-center justify-between p-4">
                <span className="flex items-center gap-2 text-sm text-slate-500">
                  <CreditCard size={15} />
                  Payment Status
                </span>

                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">
                  ✓ PAID
                </span>
              </div>
            </div>
          </div>

          {/* Renewal */}
          <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-blue-50 to-violet-50 p-4 mt-5">
            <div>
              <p className="font-bold text-slate-800">
                Want to continue with Kravy?
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Renew your subscription before it expires.
              </p>
            </div>

            <button className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800">
              Renew Plan
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync("src/components/Sidebar.tsx", content + components);
console.log("Done");
