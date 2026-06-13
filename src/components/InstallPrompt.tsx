"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("install-prompt-dismissed");
    if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    // Don't show if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!show) return null;

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    setShow(false);
  };

  const dismiss = () => {
    localStorage.setItem("install-prompt-dismissed", String(Date.now()));
    setShow(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white px-4 py-3 shadow-lg md:hidden">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-700">홈 화면에 추가하면 더 편리해요!</p>
        <div className="flex gap-2">
          <button
            onClick={dismiss}
            className="rounded-lg px-3 py-1.5 text-sm text-gray-500"
          >
            나중에
          </button>
          <button
            onClick={install}
            className="rounded-lg bg-[#FF6B35] px-3 py-1.5 text-sm font-medium text-white"
          >
            설치하기
          </button>
        </div>
      </div>
    </div>
  );
}
