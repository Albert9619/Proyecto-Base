import React from 'react';
import { db } from '../../firebaseConfig';
import { doc, deleteDoc } from "firebase/firestore";
import { C } from '../../constants/colores';
import { safeMoney } from '../../utils/helpers';

export default function TabCaja({ pedidos, mostrarToast }) {
  
  // --- LÓGICA DE CÁLCULOS ---
  const pagados = pedidos.filter(p => p.estado === "pagado");
  
  const vLocal  = pagados.filter(p => p.tipo === "mesa").reduce((a, p) => a + (p.total || 0), 0);
  const vDomi   = pagados.filter(p => p.tipo === "domicilio").reduce((a, p) => a + (p.total || 0), 0);
  const tVendido = vLocal + vDomi;
  
  const ticketProm = pagados.length > 0 ? tVendido / pagados.length : 0;

  // --- ACCIONES ---
  const generarReporteWhatsApp = () => {
    const fecha = new Date().toLocaleDateString("es-CO");
    const msg = 
      `*CIERRE DE CAJA - LA NAVE NARANJA* 🍊%0A` +
      `📅 Fecha: ${fecha}%0A%0A` +
      `💰 *VENTA TOTAL: $${safeMoney(tVendido)}*%0A` +
      `📦 Pedidos Pagados: ${pagados.length}%0A%0A` +
      `🏠 Consumo Local: $${safeMoney(vLocal)}%0A` +
      `🛵 Domicilios: $${safeMoney(vDomi)}%0A%0A` +
      `📈 Ticket Promedio: $${safeMoney(ticketProm)}%0A` +
      `--------------------------------%0A` +
      `Generado por Ortega Gestión Digital`;

    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const cerrarDia = async () => {
    if (window.confirm("¿Estás seguro de cerrar el día? Se borrarán los registros de pedidos pagados de la pantalla actual.")) {
      try {
        // Borramos solo los pedidos pagados de Firebase
        const promesas = pagados.map(p => deleteDoc(doc(db, "pedidos", p.id)));
        await Promise.all(promesas);
        mostrarToast("✅ Caja cerrada y limpia.");
      } catch (error) {
        console.error(error);
        mostrarToast("❌ Error al cerrar caja.");
      }
    }
  };

  return (
    <div style={{ background:"white", padding:"32px", borderRadius:"36px", boxShadow:"0 8px 24px rgba(0,0,0,.04)" }}>
      <h2 style={{ margin:"0 0 28px", fontWeight:"800", color: C.texto }}>📊 Caja del Día</h2>

      {/* Grid de Metas Principales */}
      <div style={{ 
        display:"grid", 
        gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", 
        gap:"18px", marginBottom:"32px" 
      }}>
        {[
          { label:"💰 Ventas totales", valor:`$${safeMoney(tVendido)}`, color:C.naranja },
          { label:"📦 Pedidos",         valor:pagados.length,          color:C.azul   },
          { label:"📈 Ticket promedio", valor:`$${safeMoney(ticketProm)}`,color:C.verde  },
        ].map(m => (
          <div key={m.label} 
            style={{ 
              padding:"22px", borderRadius:"24px", background:"#f8fafc", 
              borderLeft:`6px solid ${m.color}`, textAlign:"center" 
            }}>
            <div style={{ fontSize:"12px", fontWeight:"700", color:C.textoSub, marginBottom:"8px", textTransform: 'uppercase' }}>
              {m.label}
            </div>
            <div style={{ fontSize:"28px", fontWeight:"900", color:C.texto }}>
              {m.valor}
            </div>
          </div>
        ))}
      </div>

      {/* Desglose Local vs Domicilio */}
      <div style={{ display:"flex", gap:"14px", marginBottom:"32px" }}>
        {[
          { label:"🏠 Venta Local",      valor:vLocal, color:C.verde, bg:"#f0fdf4" },
          { label:"🛵 Venta Domicilio", valor:vDomi,  color:C.azul,  bg:"#eff6ff" },
        ].map(d => (
          <div key={d.label} 
            style={{ flex:1, padding:"20px", background:d.bg, borderRadius:"20px", textAlign:"center" }}>
            <div style={{ fontSize:"13px", fontWeight:"700", color:d.color }}>
              {d.label}
            </div>
            <div style={{ fontSize:"22px", fontWeight:"900", color:C.texto, marginTop:"6px" }}>
              ${safeMoney(d.valor)}
            </div>
          </div>
        ))}
      </div>

      {/* Botones de Acción */}
      <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
        <button className="btn-accion" onClick={generarReporteWhatsApp}
          style={{ 
            padding:"20px", background:"#25D366", color:"white", 
            borderRadius:"22px", border:"none", fontWeight:"900", 
            fontSize:"16px", cursor:"pointer", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
          }}>
          📲 ENVIAR REPORTE A WHATSAPP
        </button>

        <button className="btn-accion" onClick={cerrarDia}
          style={{ 
            padding:"20px", background:C.texto, color:"white", 
            borderRadius:"22px", border:"none", fontWeight:"900", 
            fontSize:"16px", cursor:"pointer"
          }}>
          🏁 CERRAR DÍA Y LIMPIAR TABLERO
        </button>
      </div>

      <p style={{ textAlign: 'center', marginTop: '20px', color: C.textoSub, fontSize: '12px' }}>
        Nota: El cierre de día elimina los pedidos pagados de la vista actual para iniciar una nueva jornada.
      </p>
    </div>
  );
}