import React from "react";

export default function YouTubeEmbed({
  path,
}: {
  path: string;
}) {
  return (
    <iframe
      src={`https://www.youtube.com/embed/${path}`}
      style={{
        width: 560,
        height: 315,
        border: "0px"
      }}
      title="YouTube video player"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      loading="lazy"
    />
  );
}
