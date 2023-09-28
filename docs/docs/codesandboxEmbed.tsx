import React from "react";

export function CodesandboxEmbed({
  path,
}: {
  path: string;
}) {
  return (
    <iframe
      src={`https://codesandbox.io/embed/${path}?autoresize=1&fontsize=14&hidenavigation=1&theme=dark&view=preview&module=%2Fsrc%2Fapp.tsx`}
      style={{
        width: "100%",
        height: 500,
        outline: "1px solid #252525",
        border: 0,
        borderRadius: 8,
        marginBottom: 16,
        marginTop: 16,
        zIndex: 100,
      }}
      title="natuerlich-example"
      allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
      sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
      loading="lazy"
    />
  );
}
