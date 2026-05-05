import React from "react";
import { C } from "../../constants/colores";

export default function Toast({ mensaje }) {
  if (!mensaje) return null;

  return (
    <div style={{
      position: "fixed",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      background: C.texto,
      color: "white",
      padding: "13px 28px",
      borderRadius: "50px",
      zIndex: 99999,
      fontWeight: "700",
      fontSize: "14px",
      boxShadow: "0 8px 24px rgba(0,0,0,.25)",
      animation: "fadeInDown .35s ease",
      whiteSpace: "nowrap",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      {mensaje}
    </div>
  );
}