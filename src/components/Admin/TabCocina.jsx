import React from 'react';
import { C } from '../../constants/colores';
import { safeText } from '../../utils/helpers';

export default function TabCocina({ pedidos, actualizarEstado }) {
  const pedidosActivos = pedidos.filter(p => p.estado !== "entregado" && p.estado !== "pagado");

  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(360px, 1fr))", gap:"24px" }}>
      {pedidosActivos.map(p => (
        <div key={p.id} 
             className={p.estado === "pendiente" ? "pedido-pendiente" : ""}
             style={{
               background:"white", padding:"26px", borderRadius:"32px",
               border: p.estado === "pendiente" ? `4px solid ${C.amarillo}` : `4px solid ${C.azul}`,
               boxShadow:"0 8px 24px rgba(0,0,0,.04)"
             }}>
          
          <div style={{ borderBottom:`2px solid #f1f5f9`, paddingBottom:"12px", marginBottom:"16px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:"24px", fontWeight:"900", color:C.texto }}>{safeText(p.ubicacion)}</span>
              <span style={{ fontSize:"14px", color:C.textoSub, background:"#f1f5f9", padding:"6px 12px", borderRadius:"12px" }}>{safeText(p.hora)}</span>
            </div>
            <div style={{ fontSize:"15px", color:C.textoSub, marginTop:"6px", fontWeight:"600" }}>
              👤 {safeText(p.nombre)} {p.telefono && <span> · 📞 {p.telefono}</span>}
            </div>
            {p.notaGeneral && (
              <div style={{ background:"#fff1f2", color:C.rojo, padding:"10px 14px", borderRadius:"12px", marginTop:"10px", fontWeight:"800", borderLeft:`5px solid ${C.rojo}`, fontSize:"14px" }}>
                🔔 {safeText(p.notaGeneral)}
              </div>
            )}
          </div>

          {(p.productos || []).map((it, i) => (
            <div key={i} style={{ marginBottom:"10px" }}>
              <div style={{ fontSize:"20px", fontWeight:"700", color:"#334155" }}>{it.cantidad}x {safeText(it.nombre)}</div>
              {it.detalle && <small style={{ color:C.textoSub }}>{it.detalle}</small>}
            </div>
          ))}

          <div style={{ display:"flex", gap:"10px", marginTop:"20px" }}>
            {p.estado === "pendiente" && (
              <button className="btn-accion" onClick={() => actualizarEstado(p.id, "preparando")}
                style={{ flex:1, background:C.azul, color:"white", border:"none", padding:"18px", borderRadius:"16px", fontWeight:"900" }}>
                FRITAR 👨‍🍳
              </button>
            )}
            {p.estado === "preparando" && (
              <button className="btn-accion" onClick={() => actualizarEstado(p.id, "entregado")}
                style={{ flex:1, background:C.verde, color:"white", border:"none", padding:"18px", borderRadius:"16px", fontWeight:"900" }}>
                DESPACHAR ✅
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}