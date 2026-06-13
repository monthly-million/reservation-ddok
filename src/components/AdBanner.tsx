interface AdBannerProps {
  slot?: string;
  format?: "auto" | "horizontal" | "vertical" | "rectangle";
}

export function AdBanner({ slot, format = "auto" }: AdBannerProps) {
  if (process.env.NODE_ENV !== "production" || !slot) {
    return (
      <div className="flex h-[90px] w-full items-center justify-center rounded border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-400">
        광고 영역
      </div>
    );
  }

  return (
    <ins
      className="adsbygoogle block"
      data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  );
}
