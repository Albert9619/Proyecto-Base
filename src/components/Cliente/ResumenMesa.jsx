import React from "react";
import { C } from "../../constants/colores";
import { safeMoney } from "../../utils/helpers";

export default function ResumenMesa({ mesa, pedidos }) {
  if (!mesa || pedidos.length === 0) return null;

  const total = pedidos.reduce((acc, p) => acc + (p.total || 0), 0);

  return (
    <div style={{
      maxWidth: "580px",
      margin: "12px auto",
      padding: "20px 24px",
      background: "white",
      borderRadius: "28px",
      border: "1px solid #e2e8f0",
      boxShadow: "0 4px 16px rgba(0,0,0,.05)",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <h3 style={{ margin: "0 0 12px", fontSize: "16px", color: C.texto }}>
        🧾 Tu consumo — Mesa {mesa}
      </h3>

      {pedidos.map((p, i) => (
        <div key={i} style={{
          display: "flex", justifyContent: "space-between",
          fontSize: "14px", marginBottom: "6px", color: C.textoSub,
        }}>
          <span>Pedido {p.hora} · <em>{p.estado}</em></span>
          <span style={{ fontWeight: "700", color: C.texto }}>${safeMoney(p.total)}</span>
        </div>
      ))}

      <div style={{
        borderTop: "1px dashed #cbd5e1",
        marginTop: "12px", paddingTop: "12px",
        display: "flex", justifyContent: "space-between",
        fontWeight: "800", color: C.verde, fontSize: "15px",
      }}>
        <span>TOTAL A PAGAR</span>
        <span>${safeMoney(total)}</span>
      </div>
    </div>
  );
}