import React from "react";
import { C } from "../../constants/colores";
import { safeText, safeMoney } from "../../utils/helpers";

export default function CardProducto({
  producto,
  cantidad,
  seleccion,
  onCantidad,
  onSeleccion,
  onAgregar,
}) {
  const p      = producto;
  const sel    = seleccion || {};
  const cant   = cantidad  || 1;
  const precio =
    p.precio > 0 ? p.precio :
    sel.tamano   ? sel.tamano.p :
    p.tamanos?.[0]?.p || 0;

  return (
    <div
      className="card-producto"
      style={{
        background: "rgba(255,255,255,.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRadius: "28px",
        border: "1px solid rgba(255,255,255,.5)",
        padding: "14px",
        boxShadow: "0 6px 20px rgba(0,0,0,.05)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Badge popular */}
      {p.popular && (
        <div style={{
          position: "absolute", top: "12px", right: "12px",
          background: C.amarillo, color: "#451a03",
          padding: "4px 10px", borderRadius: "14px",
          fontSize: "10px", fontWeight: "800", zIndex: 10,
        }}>
          🔥 TOP
        </div>
      )}

      {/* Capa agotado */}
      {!p.disponible && (
        <div style={{
          position: "absolute", inset: 0,
          background: "rgba(255,255,255,.75)",
          backdropFilter: "blur(4px)", zIndex: 25,
          display: "flex", justifyContent: "center", alignItems: "center",
          borderRadius: "28px",
        }}>
          <span style={{
            transform: "rotate(-10deg)",
            border: `3px solid ${C.rojo}`,
            padding: "6px 12px", borderRadius: "12px",
            fontWeight: "900", color: C.rojo, fontSize: "14px",
          }}>
            AGOTADO
          </span>
        </div>
      )}

      {/* Imagen */}
      <div style={{ borderRadius: "20px", overflow: "hidden", height: "140px", marginBottom: "12px" }}>
        <img
          src={p.imagen || "https://images.unsplash.com/photo-1619177383920-59f776369527?q=80&w=500&auto=format&fit=crop"}
          alt={safeText(p.nombre)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* Nombre y precio */}
      <h3 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: "700", color: "#0f172a", lineHeight: "1.2" }}>
        {safeText(p.nombre)}
      </h3>
      <div style={{ color: C.naranja, fontWeight: "800", fontSize: "18px", marginBottom: "12px" }}>
        ${safeMoney(precio)}
      </div>

      {/* Selectores de sabor / tamaño */}
      {(p.sabores || p.tamanos) && (
        <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
          {p.sabores && (
            <select
              disabled={!p.disponible}
              onChange={e => onSeleccion?.({ ...sel, sabor: e.target.value })}
              style={{
                flex: 1, padding: "8px", borderRadius: "10px",
                border: "1px solid #e2e8f0", fontSize: "12px",
                background: "white", fontWeight: "600", outline: "none",
              }}
            >
              <option>Sabor</option>
              {p.sabores.map(s => <option key={s}>{safeText(s)}</option>)}
            </select>
          )}
          {p.tamanos && (
            <select
              disabled={!p.disponible}
              onChange={e => onSeleccion?.({ ...sel, tamano: p.tamanos.find(t => t.n === e.target.value) })}
              style={{
                flex: 1, padding: "8px", borderRadius: "10px",
                border: "1px solid #e2e8f0", fontSize: "12px",
                background: "white", fontWeight: "600", outline: "none",
              }}
            >
              <option>Tam.</option>
              {p.tamanos.map(t => <option key={t.n}>{safeText(t.n)}</option>)}
            </select>
          )}
        </div>
      )}

      {/* Cantidad */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#f8fafc", borderRadius: "14px",
        padding: "4px 8px", marginBottom: "10px",
        border: "1px solid #f1f5f9",
      }}>
        <button
          disabled={!p.disponible}
          onClick={() => onCantidad?.(Math.max(1, cant - 1))}
          style={{ border: "none", background: "none", fontWeight: "bold", color: "#64748b", padding: "4px 10px", fontSize: "20px", cursor: "pointer" }}
        >−</button>
        <strong style={{ fontSize: "15px", color: C.texto }}>{cant}</strong>
        <button
          disabled={!p.disponible}
          onClick={() => onCantidad?.(cant + 1)}
          style={{ border: "none", background: "none", fontWeight: "bold", color: "#64748b", padding: "4px 10px", fontSize: "20px", cursor: "pointer" }}
        >+</button>
      </div>

      {/* Botón agregar */}
      <button
        disabled={!p.disponible}
        onClick={() => onAgregar?.()}
        style={{
          width: "100%", padding: "13px",
          background: p.disponible ? C.naranja : "#cbd5e1",
          color: "white", borderRadius: "16px", border: "none",
          fontWeight: "800", fontSize: "13px", cursor: "pointer",
          boxShadow: p.disponible ? `0 6px 14px rgba(249,115,22,.28)` : "none",
        }}
      >
        Agregar 🛒
      </button>
    </div>
  );
}