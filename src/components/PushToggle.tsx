"use client";

import { useEffect, useState } from "react";
import { subscribeToPush, unsubscribeFromPush, isPushSubscribed } from "@/lib/push";

export function PushToggle({ shopId }: { shopId: string }) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    isPushSubscribed().then((v) => {
      setEnabled(v);
      setLoading(false);
    });
    if (typeof Notification !== "undefined" && Notification.permission === "denied") {
      setDenied(true);
    }
  }, []);

  const toggle = async () => {
    setLoading(true);
    if (enabled) {
      const ok = await unsubscribeFromPush(shopId);
      if (ok) setEnabled(false);
    } else {
      const ok = await subscribeToPush(shopId);
      if (ok) {
        setEnabled(true);
      } else if (Notification.permission === "denied") {
        setDenied(true);
      }
    }
    setLoading(false);
  };

  if (denied) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-500">
        <span>🔕</span>
        <span>설정에서 알림을 허용해주세요</span>
      </div>
    );
  }

  return (
    <label className="flex cursor-pointer items-center gap-3">
      <span className="text-sm font-medium text-gray-700">알림 받기</span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={loading}
        onClick={toggle}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
          enabled ? "bg-[#FF6B35]" : "bg-gray-300"
        } ${loading ? "opacity-50" : ""}`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}
