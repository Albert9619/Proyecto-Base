import React from "react";
import { C } from "../../constants/colores";

const WORKLOAD_COLORES = {
  ok:    "#86efac",
  medio: "#fde68a",
  lleno: "#fca5a5",
};

export default function Header({ workload, arrozDelDia, onAdminClick }) {
  return (
    <header style={{
      position: "relative",
      height: "260px",
      background: `linear-gradient(to bottom, rgba(0,0,0,.05) 0%, rgba(0,0,0,.75) 100%),
                   url(https://images.unsplash.com/photo-1541592106381-b31e9221c004?q=80&w=1000&auto=format&fit=crop)`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end",
      alignItems: "center",
      color: "white",
      borderRadius: "0 0 44px 44px",
      paddingBottom: "36px",
    }}>
      <h1
        onClick={onAdminClick}
        style={{
          margin: 0,
          fontSize: "2.4rem",
          fontWeight: "800",
          fontFamily: "'Syne', sans-serif",
          letterSpacing: "-1px",
          cursor: "pointer",
          textShadow: "0 2px 8px rgba(0,0,0,.3)",
        }}
      >
        La Nave Naranja 🍊
      </h1>

      <p style={{ margin: "4px 0 0", opacity: .85, fontSize: "15px", fontWeight: "500" }}>
        El sabor más crocante de la ciudad
      </p>

      <div style={{
        marginTop: "14px",
        background: "rgba(255,255,255,.2)",
        backdropFilter: "blur(8px)",
        padding: "8px 18px",
        borderRadius: "20px",
        fontSize: "13px",
        fontWeight: "700",
        border: "1px solid rgba(255,255,255,.3)",
      }}>
        <span style={{ color: WORKLOAD_COLORES[workload.nivel] }}>●</span>{" "}
        {workload.texto} · Est. {workload.tiempo}
      </div>

      <div style={{ marginTop: "10px" }}>
        <span style={{
          background: "#fff7ed",
          padding: "8px 20px",
          borderRadius: "20px",
          fontWeight: "700",
          color: C.naranja,
          fontSize: "14px",
          boxShadow: "0 2px 8px rgba(249,115,22,.1)",
        }}>
          🍚 Arroz del día: {arrozDelDia}
        </span>
      </div>
    </header>
  );
}