"use client";

import { useState } from "react";
import { Check, HelpCircle, Share2, X } from "lucide-react";

type Choice = "going" | "maybe" | "declined";
const choices: { value: Choice; label: string; icon: typeof Check }[] = [
  { value: "going", label: "Join", icon: Check },
  { value: "maybe", label: "Maybe", icon: HelpCircle },
  { value: "declined", label: "Can't make it", icon: X },
];

export function RsvpControl() {
  const [selected, setSelected] = useState<Choice | null>(null);
  const [message, setMessage] = useState("");

  async function share() {
    if (navigator.share) await navigator.share({ title: "Saturday Night Pickle", url: window.location.href });
    else { await navigator.clipboard.writeText(window.location.href); setMessage("Link copied"); }
  }

  return <div>
    <div className="grid grid-cols-2 gap-2 sm:flex">
      {choices.map(({ value, label, icon: Icon }, index) => <button key={value} onClick={() => { setSelected(value); setMessage(value === "going" ? "You're in. See you Saturday!" : "RSVP saved"); }} aria-pressed={selected === value} className={`pressable min-h-12 rounded-[10px] border px-4 text-sm font-semibold ${index === 0 ? "col-span-2 sm:col-span-1" : ""} ${selected === value || (!selected && value === "going") ? "border-primary bg-primary text-white" : "border-line bg-canvas hover:bg-surface"}`}><Icon className="mr-2 inline" size={17} />{label}</button>)}
      <button onClick={share} className="pressable min-h-12 rounded-[10px] border border-line px-4 text-sm font-semibold hover:bg-surface"><Share2 className="mr-2 inline" size={17} />Share</button>
    </div>
    <p aria-live="polite" className="mt-3 min-h-5 text-sm font-medium text-primary">{message}</p>
  </div>;
}
