import React, { useRef } from "react";
import { C } from "../../constants/colores";
import { safeText, safeMoney } from "../../utils/helpers";

export default function Carrito({
  carrito,
  mesa,
  totalCarrito,
  notaPedido,
  onNota,
  nombre, onNombre,
  telefono, onTelefono,
  direccion, onDireccion,
  errorCampos,
  enviando,
  onEliminar,
  onVaciar,
  onConfirmar,
}) {
  const ticketRef = useRef(null);

  if (carrito.length === 0) return null;

  return (
    <>
      {/* Botón flotante carrito */}
      <button
        onClick={() => ticketRef.current?.scrollIntoView({ behavior: "smooth" })}
        style={{
          position: "fixed",
          bottom: mesa ? "100px" : "28px",
          right: "20px",
          background: C.naranja,
          color: "white",
          width: "64px", height: "64px",
          borderRadius: "50%",
          border: "none",
          fontSize: "26px",
          cursor: "pointer",
          boxShadow: `0 8px 24px rgba(249,115,22,.45)`,
          zIndex: 4000,
          display: "flex", justifyContent: "center", alignItems: "center",
        }}
      >
        🛒
        <span style={{
          position: "absolute", top: 0, right: 0,
          background: "white", color: C.naranja,
          width: "22px", height: "22px",
          borderRadius: "50%", fontSize: "12px", fontWeight: "900",
          display: "flex", justifyContent: "center", alignItems: "center",
          border: `2px solid ${C.naranja}`,
        }}>
          {carrito.length}
        </span>
      </button>

      {/* Ticket */}
      <div
        ref={ticketRef}
        style={{
          maxWidth: "580px", margin: "32px auto",
          background: "white", padding: "30px",
          borderRadius: "36px",
          border: `4px solid ${C.naranja}`,
          boxShadow: `0 12px 32px rgba(249,115,22,.12)`,
          animation: "fadeInUp .4s ease",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ margin: 0, fontWeight: "900" }}>🛒 Tu Pedido</h2>
          <button
            onClick={onVaciar}
            style={{
              background: "#fee2e2", color: C.rojo, border: "none",
              padding: "8px 16px", borderRadius: "12px",
              fontWeight: "700", fontSize: "12px", cursor: "pointer",
            }}
          >
            Vaciar todo
          </button>
        </div>

        {/* Items */}
        {carrito.map(it => (
          <div key={it.idUnico} style={{ padding: "14px 0", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "700", fontSize: "15px" }}>
                  {it.cantidad}x {safeText(it.nombre)}
                </div>
                {it.detalle && <small style={{ color: C.textoSub }}>{it.detalle}</small>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontWeight: "900", color: C.texto }}>${safeMoney(it.subtotal)}</span>
                <button
                  onClick={() => onEliminar(it.idUnico)}
                  style={{
                    background: "#fee2e2", border: "none",
                    color: C.rojo, padding: "8px 10px",
                    borderRadius: "10px", fontSize: "14px", cursor: "pointer",
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Nota */}
        <input
          type="text"
          placeholder="📝 Nota general (ej: sin cebolla, traer cambio...)"
          value={notaPedido}
          onChange={e => onNota(e.target.value)}
          style={{
            width: "100%", marginTop: "18px", padding: "14px",
            borderRadius: "14px", border: "1px solid #e2e8f0",
            background: "#f8fafc", fontSize: "14px",
            outline: "none", boxSizing: "border-box",
          }}
        />

        {/* Total */}
        <div style={{
          marginTop: "20px", paddingTop: "16px",
          borderTop: "2px solid #f1f5f9",
          display: "flex", justifyContent: "space-between",
          fontSize: "22px", fontWeight: "900",
        }}>
          <span>Total</span>
          <span style={{ color: C.naranja }}>${safeMoney(totalCarrito)}</span>
        </div>

        {/* Campos domicilio */}
        {!mesa && (
          <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { placeholder: "👤 Nombre completo *",        value: nombre,    onChange: onNombre,    error: errorCampos && !nombre.trim()    },
              { placeholder: "📞 Teléfono de contacto *",   value: telefono,  onChange: onTelefono,  error: errorCampos && !telefono.trim(),  type: "tel" },
              { placeholder: "📍 Dirección y barrio *",     value: direccion, onChange: onDireccion, error: errorCampos && !direccion.trim() },
            ].map((f, i) => (
              <input
                key={i}
                type={f.type || "text"}
                placeholder={f.placeholder}
                value={f.value}
                onChange={e => f.onChange(e.target.value)}
                style={{
                  width: "100%", padding: "14px", borderRadius: "14px",
                  border: `${f.error ? `2px solid ${C.rojo}` : "1px solid #e2e8f0"}`,
                  fontSize: "14px", outline: "none", boxSizing: "border-box",
                }}
              />
            ))}
            {errorCampos && (
              <p style={{ color: C.rojo, fontSize: "13px", margin: 0, fontWeight: "600" }}>
                ⚠️ Por favor completa todos los campos obligatorios.
              </p>
            )}
          </div>
        )}

        {/* Botón confirmar */}
        <button
          onClick={onConfirmar}
          disabled={enviando}
          style={{
            width: "100%", marginTop: "20px", padding: "20px",
            background: enviando ? "#94a3b8" : C.naranja,
            color: "white", borderRadius: "24px", border: "none",
            fontWeight: "900", fontSize: "17px", cursor: enviando ? "not-allowed" : "pointer",
            boxShadow: enviando ? "none" : `0 8px 20px rgba(249,115,22,.35)`,
          }}
        >
          {enviando ? "⏳ Enviando pedido..." : "CONFIRMAR PEDIDO 👨‍🍳"}
        </button>
      </div>
    </>
  );
}