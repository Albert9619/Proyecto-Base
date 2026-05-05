import React from "react";
import { C } from "../../constants/colores";

export default function PantallaAgradecimiento({ visible, onVolver }) {
  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: C.naranja,
      zIndex: 10000,
      display: "flex", justifyContent: "center", alignItems: "center",
      color: "white",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <div style={{ textAlign: "center", padding: "40px" }}>
        <div style={{ fontSize: "72px", marginBottom: "16px" }}>🍊</div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "36px", margin: "0 0 8px" }}>
          ¡Pedido recibido!
        </h1>
        <p style={{ fontSize: "18px", opacity: .9, margin: "0 0 32px" }}>
          Estamos preparando tu orden con todo el amor 👨‍🍳
        </p>
        <button
          onClick={onVolver}
          style={{
            padding: "16px 40px", borderRadius: "30px",
            border: "none", background: "white",
            color: C.naranja, fontWeight: "900",
            fontSize: "16px", cursor: "pointer",
          }}
        >
          Volver al menú
        </button>
      </div>
    </div>
  );
}