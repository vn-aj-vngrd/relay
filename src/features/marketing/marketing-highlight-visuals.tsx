type HighlightVisualName = "find" | "plan" | "invite" | "organize" | "play" | "repay" | "sync" | "remember";

const avatarColors = ["bg-[#635bde]", "bg-[#1f7898]", "bg-[#b14a42]", "bg-[#39764e]"];

function MiniAvatar({ name, index = 0 }: { name: string; index?: number }) {
  return (
    <span
      aria-hidden
      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[9px] font-bold text-white ${avatarColors[index % avatarColors.length]}`}
    >
      {name.slice(0, 1)}
    </span>
  );
}

function MiniField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[8px] font-semibold text-[#6b6b70]">{label}</p>
      <div className="mt-1 flex h-8 items-center rounded-md border border-[#deded9] bg-white px-2.5 text-[10px] font-medium">
        {value}
      </div>
    </div>
  );
}

function FindVisual() {
  const courts = [
    ["All Day Dink", "Consolacion"],
    ["Court District Cebu", "Mandaue"],
    ["Pickle at The Kiln", "Banilad"],
  ] as const;

  return (
    <div className="grid h-full grid-cols-[1.35fr_.85fr] bg-[#f7f7f5] text-[#171719]">
      <div className="relative overflow-hidden border-r border-[#deded9] bg-[#edf1ec]">
        <svg aria-hidden viewBox="0 0 220 260" className="absolute inset-0 h-full w-full text-[#c9cec8]">
          <path d="M-15 48 C45 28 62 82 122 54 S198 26 238 52" fill="none" stroke="currentColor" strokeWidth="4" />
          <path d="M18 -10 C26 46 78 73 61 128 S74 207 42 278" fill="none" stroke="white" strokeWidth="8" />
          <path d="M18 -10 C26 46 78 73 61 128 S74 207 42 278" fill="none" stroke="#d7d2c8" strokeWidth="2" />
          <path d="M112 -14 C91 58 146 85 122 142 S144 216 116 276" fill="none" stroke="white" strokeWidth="7" />
          <path d="M112 -14 C91 58 146 85 122 142 S144 216 116 276" fill="none" stroke="#d7d2c8" strokeWidth="2" />
          <path d="M-10 188 C48 160 92 198 132 176 S202 151 236 170" fill="none" stroke="white" strokeWidth="8" />
          <path d="M-10 188 C48 160 92 198 132 176 S202 151 236 170" fill="none" stroke="#d7d2c8" strokeWidth="2" />
        </svg>
        {[
          ["22%", "68%"],
          ["38%", "45%"],
          ["55%", "59%"],
          ["67%", "31%"],
          ["78%", "50%"],
        ].map(([left, top], index) => (
          <span
            key={`${left}-${top}`}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-sm ${index === 2 ? "h-4 w-4 bg-[#5962d9]" : "h-2.5 w-2.5 bg-[#30343b]"}`}
            style={{ left, top }}
          />
        ))}
        <div className="absolute inset-x-2.5 bottom-2.5 rounded-lg border border-[#deded9] bg-white p-2.5 shadow-sm">
          <p className="text-[7px] font-semibold text-[#6b6b70]">SELECTED COURT</p>
          <p className="mt-1 text-[10px] font-bold">All Day Dink</p>
          <div className="mt-2 flex gap-1.5 text-[7px] font-semibold">
            <span className="rounded bg-[#5962d9] px-2 py-1 text-white">Create game</span>
            <span className="rounded border border-[#deded9] px-2 py-1">Directions</span>
          </div>
        </div>
      </div>
      <div className="bg-white">
        <div className="border-b border-[#deded9] p-2.5">
          <p className="text-[10px] font-bold">Courts</p>
          <p className="mt-0.5 text-[7px] text-[#6b6b70]">51 places</p>
        </div>
        <ul className="divide-y divide-[#deded9]">
          {courts.map(([name, area], index) => (
            <li key={name} className={`p-2.5 ${index === 0 ? "border-l-2 border-[#5962d9] bg-[#f0efff]" : ""}`}>
              <p className="text-[8px] font-bold leading-tight">{name}</p>
              <p className="mt-1 text-[7px] text-[#6b6b70]">{area}</p>
              <p className="mt-1 text-[7px] font-medium">{index === 1 ? "Indoor · 2 courts" : "Outdoor · 2 courts"}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function PlanVisual() {
  return (
    <div className="h-full bg-[#f7f7f5] p-4 text-[#171719]">
      <h4 className="text-sm font-bold">Create a game</h4>
      <p className="mt-1 text-[9px] text-[#6b6b70]">Set the plan. Share the link.</p>
      <div className="mt-3 space-y-2.5">
        <MiniField label="GAME NAME" value="Saturday Night Pickle" />
        <MiniField label="VENUE" value="All Day Dink · Consolacion" />
        <div className="grid grid-cols-3 gap-2">
          <MiniField label="DATE" value="Aug 22" />
          <MiniField label="START" value="7:00 PM" />
          <MiniField label="END" value="10:00 PM" />
        </div>
      </div>
    </div>
  );
}

function InviteVisual() {
  return (
    <div className="h-full bg-white p-3.5 text-[#171719]">
      <div className="rounded-lg bg-[#1c2944] p-3 text-white">
        <p className="text-[8px] font-semibold text-white/60">SATURDAY, AUGUST 22</p>
        <h4 className="mt-2 text-base font-bold leading-tight">Saturday Night Pickle</h4>
        <p className="mt-1 text-[9px] text-white/65">Central Pickle · 7:00–10:00 PM</p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[9px]">
        <div className="border-r border-[#deded9] pr-2">
          <p className="text-[#6b6b70]">PLAYERS</p>
          <p className="mt-1 font-bold">8 of 10 going</p>
        </div>
        <div>
          <p className="text-[#6b6b70]">ESTIMATED</p>
          <p className="mt-1 font-bold">₱300 / player</p>
        </div>
      </div>
      <div className="mt-3 border-t border-[#deded9] pt-3">
        <p className="text-[10px] font-bold">Join this game</p>
        <div className="mt-2 flex h-8 items-center rounded-md border border-[#deded9] px-2.5 text-[9px] text-[#66666c]">
          Your name
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1.5 text-center text-[9px] font-semibold">
          <span className="rounded-md border border-[#5962d9] bg-[#f0efff] py-1.5 text-[#4e55bd]">Going</span>
          <span className="rounded-md border border-[#deded9] py-1.5">Maybe</span>
          <span className="rounded-md border border-[#deded9] py-1.5">Can’t go</span>
        </div>
      </div>
    </div>
  );
}

function OrganizeVisual() {
  const players = [
    ["Van", "Host", "Going"],
    ["AJ", "Regular", "Going"],
    ["Mika", "Casual", "Going"],
  ] as const;
  return (
    <div className="h-full bg-white p-4 text-[#171719]">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[9px] text-[#6b6b70]">GAME READINESS</p>
          <p className="mt-1 text-sm font-bold">Almost ready</p>
        </div>
        <strong className="font-mono text-xl">75%</strong>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#ececea]">
        <div className="h-full w-3/4 rounded-full bg-[#5962d9]" />
      </div>
      <div className="mt-4 flex items-center justify-between border-y border-[#deded9] py-2.5 text-[9px]">
        <span>Roster · 8 going · 1 waitlisted</span>
        <span className="font-semibold text-[#5962d9]">Add player</span>
      </div>
      <ul className="divide-y divide-[#e5e5e1]">
        {players.map(([name, detail, status], index) => (
          <li key={name} className="flex items-center gap-2 py-2.5">
            <MiniAvatar name={name} index={index} />
            <span className="min-w-0 flex-1">
              <strong className="block text-[10px]">{name}</strong>
              <span className="block text-[8px] text-[#6b6b70]">{detail}</span>
            </span>
            <span className="text-[8px] font-semibold text-[#39764e]">{status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PlayVisual() {
  return (
    <div className="h-full bg-[#121b2e] p-3.5 text-white">
      <div className="flex items-center justify-between border-b border-white/15 pb-2.5">
        <div>
          <p className="text-[8px] font-semibold text-white/55">COURT 1</p>
          <p className="mt-0.5 text-[10px] font-bold">Balanced Mix</p>
        </div>
        <span className="flex items-center gap-1 text-[8px] font-semibold text-white/70">
          <span className="h-1.5 w-1.5 rounded-full bg-[#e45b4f]" /> Live
        </span>
      </div>
      <div className="mt-2.5 flex items-center justify-between border-y border-white/15 bg-white/5 px-2.5 py-1.5">
        <span className="text-[8px] text-white/60">Round timer</span>
        <strong className="font-mono text-[11px]">11:42</strong>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-3.5 text-center">
        <div>
          <p className="text-[10px] font-semibold">Van + AJ</p>
          <strong className="mt-2 block font-mono text-5xl leading-none">8</strong>
        </div>
        <span className="text-[9px] text-white/60">VS</span>
        <div>
          <p className="text-[10px] font-semibold">Mika + Bea</p>
          <strong className="mt-2 block font-mono text-5xl leading-none">6</strong>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 border-t border-white/15 pt-3 text-center font-mono text-sm">
        <span className="rounded-md bg-white/10 py-2">− &nbsp; +</span>
        <span className="rounded-md bg-white/10 py-2">− &nbsp; +</span>
      </div>
    </div>
  );
}

function RepayVisual() {
  const payments = [
    ["Van", "Paid upfront", "₱2,400"],
    ["AJ", "Confirmed", "₱300"],
    ["Mika", "Proof sent", "₱300"],
  ] as const;
  return (
    <div className="h-full bg-white p-4 text-[#171719]">
      <p className="text-[9px] text-[#6b6b70]">COURT REPAYMENT</p>
      <div className="mt-2 flex items-end justify-between">
        <div>
          <strong className="font-mono text-2xl">₱2,400</strong>
          <p className="mt-1 text-[9px] text-[#6b6b70]">7 paying players · ₱300 each</p>
        </div>
        <span className="text-[9px] font-semibold text-[#39764e]">2 confirmed</span>
      </div>
      <ul className="mt-3 divide-y divide-[#e5e5e1] border-y border-[#deded9]">
        {payments.map(([name, status, amount], index) => (
          <li key={name} className="flex items-center gap-2 py-2.5">
            <MiniAvatar name={name} index={index} />
            <span className="min-w-0 flex-1">
              <strong className="block text-[10px]">{name}</strong>
              <span className="block text-[8px] text-[#6b6b70]">{status}</span>
            </span>
            <span className="font-mono text-[9px] font-semibold">{amount}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SyncVisual() {
  return (
    <div className="flex h-full flex-col bg-white p-3.5 text-[#171719]">
      <div className="flex items-center gap-2 border-b border-[#deded9] pb-3">
        <div className="flex -space-x-1">
          <MiniAvatar name="V" />
          <MiniAvatar name="A" index={1} />
          <MiniAvatar name="M" index={2} />
        </div>
        <div>
          <p className="text-[10px] font-bold">Saturday Night Pickle</p>
          <p className="text-[8px] text-[#39764e]">8 players in sync</p>
        </div>
      </div>
      <div className="flex-1 space-y-3 py-3 text-[9px]">
        <p className="text-center text-[8px] text-[#66666c]">AJ joined the game</p>
        <div className="flex items-end gap-2">
          <MiniAvatar name="M" index={2} />
          <p className="max-w-[75%] rounded-lg rounded-bl-sm bg-[#efefec] px-3 py-2">Parking is open beside Court 2.</p>
        </div>
        <div className="flex justify-end">
          <p className="max-w-[78%] rounded-lg rounded-br-sm bg-[#5962d9] px-3 py-2 text-white">
            Perfect. I’ll bring the extra balls.
          </p>
        </div>
        <p className="text-center text-[8px] text-[#66666c]">Court 1 match started</p>
      </div>
      <div className="flex h-9 items-center justify-between rounded-lg border border-[#deded9] px-3 text-[9px] text-[#66666c]">
        Message the group <span className="font-semibold text-[#5962d9]">Send</span>
      </div>
    </div>
  );
}

function RememberVisual() {
  return (
    <div className="h-full bg-[#ecece8] p-3.5 text-[#171719]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[8px] font-semibold text-[#5f5f64]">SESSION RECAP</p>
          <h4 className="mt-1 text-xs font-bold">Choose your story</h4>
        </div>
        <span className="text-[8px] text-[#5f5f64]">3 of 7</span>
      </div>
      <div className="mt-3 grid grid-cols-3 items-center gap-2">
        <div className="aspect-[9/16] rounded-md border border-[#d8d8d3] bg-[#f7f6f1] p-2">
          <p className="text-[6px] text-[#6b6b70]">MY GAME</p>
          <strong className="mt-8 block font-mono text-base">3–1</strong>
          <p className="mt-1 text-[7px] font-bold">Van</p>
          <p className="mt-4 border-t border-black/10 pt-2 text-[6px]">#2 · +12</p>
        </div>
        <div className="aspect-[9/16] rounded-md bg-[#18233b] p-2 text-white shadow-sm">
          <p className="text-[6px] text-white/60">WINNING TEAM</p>
          <p className="mt-8 text-[9px] font-bold leading-tight">Van + AJ</p>
          <strong className="mt-3 block font-mono text-xl">3</strong>
          <p className="text-[6px] text-white/60">wins together</p>
        </div>
        <div className="aspect-[9/16] rounded-md bg-[#11131a] p-2 text-white">
          <p className="text-[6px] text-white/60">STANDINGS</p>
          <div className="mt-6 space-y-2 text-[6px]">
            <p className="flex justify-between">
              <span>1 Van</span>
              <b>3–1</b>
            </p>
            <p className="flex justify-between">
              <span>2 AJ</span>
              <b>2–2</b>
            </p>
            <p className="flex justify-between">
              <span>3 Mika</span>
              <b>2–2</b>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MarketingHighlightVisual({ name }: { name: HighlightVisualName }) {
  if (name === "find") return <FindVisual />;
  if (name === "plan") return <PlanVisual />;
  if (name === "invite") return <InviteVisual />;
  if (name === "organize") return <OrganizeVisual />;
  if (name === "play") return <PlayVisual />;
  if (name === "repay") return <RepayVisual />;
  if (name === "sync") return <SyncVisual />;
  return <RememberVisual />;
}
