"use client";

import { useServerInsertedHTML } from "next/navigation";
import { useRef } from "react";

import { THEME_INIT_SCRIPT } from "@/lib/theme-init";

const DEVELOPMENT_CLEANUP_SCRIPT = `(()=>{if(!('serviceWorker'in navigator))return;const k='relay-development-sw-cleanup';if(!navigator.serviceWorker.controller){sessionStorage.removeItem(k);return}if(sessionStorage.getItem(k)==='1'){sessionStorage.removeItem(k);return}sessionStorage.setItem(k,'1');window.stop();Promise.all([navigator.serviceWorker.getRegistrations().then(r=>Promise.all(r.map(x=>x.unregister()))),('caches'in window?caches.keys().then(n=>Promise.all(n.filter(x=>x.startsWith('relay-pwa-')).map(x=>caches.delete(x)))):Promise.resolve())]).finally(()=>location.reload())})()`;

export function BootstrapScripts({ development }: { development: boolean }) {
  const inserted = useRef(false);

  // Emit parser-executed bootstrap scripts only in the server HTML stream.
  // Client recovery/HMR renders nothing, so React cannot create inert scripts.
  useServerInsertedHTML(() => {
    if (inserted.current) return null;
    inserted.current = true;
    return (
      <>
        {development ? (
          <script
            id="relay-development-sw-cleanup"
            dangerouslySetInnerHTML={{ __html: DEVELOPMENT_CLEANUP_SCRIPT }}
          />
        ) : null}
        <script
          id="relay-theme-init"
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
      </>
    );
  });

  return null;
}
