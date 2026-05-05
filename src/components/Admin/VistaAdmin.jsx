import React, { useState } from 'react';
import { db } from '../../firebaseConfig';
import { doc, deleteDoc } from "firebase/firestore";
import { C } from '../../constants/colores';
import { safeMoney } from '../../utils/helpers';

// Importación de las pestañas modulares
import TabCocina  from './TabCocina';
import TabGestion from './TabGestion';
import TabCaja    from './TabCaja';
import TabQRs     from './TabQRs';

export default function VistaAdmin({ 
  pedidos, 
  menu, 
  alertas, 
  actualizarEstado, 
  setIsAdmin, 
  mostrarToast 
}) {
  const [tabActiva, setTabActiva] = useState("pedidos");

  // Cálculos rápidos para el encabezado
  const pagados = pedidos.filter(p => p.estado === "pagado");
  const totalVendido = pagados.reduce((a, p) => a + (p.total || 0), 0);
  const numPendientes = pedidos.filter(p => p.estado === "pendiente").length;

  return (
    <div style={{ minHeight: "100vh", background: numPendientes > 0 ? "#fff7ed" : "#f8fafc" }}>
      <div className="no-print" style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px" }}>

        {/* --- CABECERA DEL PANEL --- */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "800", color: C.naranja, fontFamily: "'Syne', sans-serif" }}>
              La Nave Naranja 🍊
            </h1>
            <p style={{ margin: 0, color: C.textoSub, fontSize: "13px" }}>Administración Carepa</p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div style={{ background: "white", padding: "14px 22px", borderRadius: "20px", fontWeight: "800", fontSize: "18px", color: C.texto, boxShadow: "0 4px 12px rgba(0,0,0,.06)" }}>
              Hoy: <span style={{ color: C.naranja }}>${safeMoney(totalVendido)}</span>
            </div>
            <button className="btn-accion" onClick={() => setIsAdmin(false)}
              style={{ padding: "14px 22px", borderRadius: "16px", border: "none", background: "#e2e8f0", fontWeight: "700", color: C.texto }}>
              Salir
            </button>
          </div>
        </div>

        {/* --- ALERTAS PRIORITARIAS (MESA) --- */}
        {alertas.map(a => (
          <div key={a.id} className="alerta-notif"
            style={{ 
              padding: "18px 24px", borderRadius: "20px", marginBottom: "12px", 
              background: C.rojo, color: "white", display: "flex", 
              justifyContent: "space-between", alignItems: "center" 
            }}>
            <span style={{ fontSize: "20px", fontWeight: "900" }}>
              {a.tipo === "mesero" ? "🙋 LLAMADO" : "💳 CUENTA"} — MESA {a.mesa}
              <span style={{ fontSize: "14px", fontWeight: "400", marginLeft: "10px", opacity: .8 }}>{a.hora}</span>
            </span>
            <button className="btn-accion"
              onClick={() => deleteDoc(doc(db, "alertas", a.id))}
              style={{ background: "white", color: C.rojo, border: "none", padding: "12px 24px", borderRadius: "12px", fontWeight: "800" }}>
              ATENDER ✓
            </button>
          </div>
        ))}

        {/* --- SELECTOR DE PESTAÑAS --- */}
        <div className="scroll-hide" style={{ display: "flex", gap: "10px", marginBottom: "28px", overflowX: "auto" }}>
          {[
            { id: "pedidos", label: `COCINA (${numPendientes})`, color: C.naranja, badge: numPendientes > 0 },
            { id: "gestion", label: "MENÚ",      color: C.azul   },
            { id: "qrs",     label: "QRs",       color: C.azul   },
            { id: "caja",    label: "CAJA",      color: C.texto  },
          ].map(t => (
            <button key={t.id} className="tab-pill btn-accion"
              onClick={() => setTabActiva(t.id)}
              style={{
                padding: "16px 28px", borderRadius: "20px", 
                border: t.badge ? `3px solid ${C.rojo}` : "none",
                background: tabActiva === t.id ? t.color : "white",
                color:      tabActiva === t.id ? "white"  : C.texto,
                fontWeight: "800", fontSize: "15px", whiteSpace: "nowrap",
                boxShadow: tabActiva === t.id ? `0 8px 20px ${t.color}44` : "0 2px 8px rgba(0,0,0,.05)"
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* --- CONTENIDO DINÁMICO --- */}
        <main>
          {tabActiva === "pedidos" && <TabCocina pedidos={pedidos} actualizarEstado={actualizarEstado} />}
          {tabActiva === "gestion" && <TabGestion menu={menu} mostrarToast={mostrarToast} />}
          {tabActiva === "caja"    && <TabCaja pedidos={pedidos} mostrarToast={mostrarToast} />}
          {tabActiva === "qrs"     && <TabQRs />}
        </main>
      </div>
    </div>
  );
}