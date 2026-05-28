import { ImageResponse } from "next/og";

export const alt = "Dealable – Rabattkoder & rea från svenska butiker";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #7c3aed 100%)",
          fontFamily: "sans-serif",
          padding: "60px",
        }}
      >
        {/* Logo */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-2px",
            marginBottom: 20,
          }}
        >
          dealable
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 32,
            fontWeight: 600,
            color: "#e9d5ff",
            marginBottom: 40,
            textAlign: "center",
          }}
        >
          Rabattkoder &amp; rea från svenska butiker
        </div>

        {/* Brand pills */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            justifyContent: "center",
            maxWidth: 900,
          }}
        >
          {[
            "Samsung", "Jotex", "Outnorth", "Nelly", "Dyson",
            "Apotek Hjärtat", "SharkNinja", "Xiaomi", "Rugvista",
          ].map((brand) => (
            <div
              key={brand}
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: 100,
                padding: "8px 20px",
                fontSize: 22,
                fontWeight: 600,
                color: "#fff",
              }}
            >
              {brand}
            </div>
          ))}
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            fontSize: 22,
            color: "#c4b5fd",
            fontWeight: 500,
          }}
        >
          dealable.se
        </div>
      </div>
    ),
    { ...size }
  );
}
