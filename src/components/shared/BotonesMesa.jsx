import React from "react";
import { C } from "../../constants/colores";

export default function BotonesMesa({ mesa, alertaEnviada, onLlamarMesero, onPedirCuenta }) {
  if (!mesa) return null;

  return (
    <div style={{
      position: "fixed", bottom: "24px", left: "50%",
      transform: "translateX(-50%)",
      display: "flex", gap: "10px",
      width: "90%", maxWidth: "440px",
      zIndex: 5000,
    }}>
      <button
        disabled={alertaEnviada === "mesero"}
        onClick={onLlamarMesero}
        style={{
          flex: 1, padding: "18px", borderRadius: "24px", border: "none",
          background: alertaEnviada === "mesero" ? "#94a3b8" : C.azul,
          color: "white", fontWeight: "800", fontSize: "14px",
          cursor: alertaEnviada === "mesero" ? "not-allowed" : "pointer",
          boxShadow: `0 8px 20px ${C.azul}44`,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        {alertaEnviada === "mesero" ? "✓ Enviado" : "🙋 Llamar Mesero"}
      </button>

      <button
        onClick={onPedirCuenta}
        style={{
          flex: 1, padding: "18px", borderRadius: "24px", border: "none",
          background: C.verde, color: "white", fontWeight: "800",
          fontSize: "14px", cursor: "pointer",
          boxShadow: `0 8px 20px ${C.verde}44`,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        💳 Pedir Cuenta
      </button>
    </div>
  );
}