import React, { useState } from 'react';
import { db } from '../../firebaseConfig';
import { doc, updateDoc, setDoc } from "firebase/firestore";
import { C } from '../../constants/colores';
import { safeText, safeMoney } from '../../utils/helpers';
import { CATEGORIAS } from '../../constants/menuBase';

export default function TabGestion({ menu, mostrarToast }) {
  const [modalProducto, setModalProducto] = useState(false);
  const [nuevoP, setNuevoP] = useState({ nombre:"", precio:"", categoria:"Fritos", imagen:"" });

  const toggleDisponibilidad = async (id, actual) => {
    try { await updateDoc(doc(db, "productos", id), { disponible: !actual }); }
    catch { mostrarToast("Error al actualizar."); }
  };

  const crearProducto = async () => {
    if (!nuevoP.nombre.trim() || !nuevoP.precio) return mostrarToast("Llena los campos.");
    try {
      const id = `prod-${Date.now()}`;
      await setDoc(doc(db, "productos", id), { ...nuevoP, precio: parseInt(nuevoP.precio), disponible: true });
      setModalProducto(false);
      mostrarToast("✅ Producto creado.");
    } catch { mostrarToast("Error al crear."); }
  };

  return (
    <div style={{ background:"white", padding:"32px", borderRadius:"36px", boxShadow:"0 8px 24px rgba(0,0,0,.04)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"24px" }}>
        <h2 style={{ margin:0, fontWeight:"800" }}>Inventario</h2>
        <button className="btn-accion" onClick={() => setModalProducto(true)}
          style={{ background:C.naranja, color:"white", border:"none", padding:"14px 24px", borderRadius:"16px", fontWeight:"800" }}>
          + Agregar Producto
        </button>
      </div>

      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:`2px solid #f1f5f9` }}>
              <th style={{ padding:"14px", textAlign:"left", color:C.textoSub }}>Producto</th>
              <th style={{ padding:"14px", textAlign:"left", color:C.textoSub }}>Precio</th>
              <th style={{ padding:"14px", textAlign:"left", color:C.textoSub }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {menu.map(p => (
              <tr key={p.id} style={{ borderBottom:"1px solid #f8fafc", background: p.disponible ? "transparent" : "#fff1f2" }}>
                <td style={{ padding:"16px", fontWeight:"700" }}>{safeText(p.nombre)}</td>
                <td style={{ padding:"16px" }}>${safeMoney(p.precio)}</td>
                <td style={{ padding:"16px" }}>
                  <button className="btn-accion" onClick={() => toggleDisponibilidad(p.id, p.disponible)}
                    style={{ padding:"10px 18px", borderRadius:"14px", border:"none", background: p.disponible ? C.verde : C.rojo, color:"white", fontWeight:"800" }}>
                    {p.disponible ? "✓ HABILITADO" : "✗ AGOTADO"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Aquí podrías insertar el ModalProducto si lo deseas modularizar más */}
    </div>
  );
}