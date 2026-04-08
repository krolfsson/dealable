import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #ec4899, #a855f7, #7c3aed)",
          borderRadius: 40,
        }}
      >
        <span style={{ fontSize: 120 }}>💜</span>
      </div>
    ),
    { ...size }
  );
}