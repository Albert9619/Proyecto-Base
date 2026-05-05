import React, { useState } from 'react';
import { db } from '../../firebaseConfig';
import { doc, updateDoc, setDoc } from "firebase/firestore";
import { C } from '../../constants/colores';
import { safeText, safeMoney } from '../../utils/helpers';
import { CATEGORIAS } from '../../constants/menuBase';

export default function TabGestion({ menu, mostrarToast }) {
  const [modalProducto, setModalProducto] = useState(false);
  const [nuevoP, setNuevoP] = useState({
    nombre: "", precio: "", categoria: "Fritos", imagen: ""
  });

  // ── Acciones Firebase ──────────────────────────────────────

  const toggleDisponibilidad = async (id, actual) => {
    try {
      await updateDoc(doc(db, "productos", id), { disponible: !actual });
      mostrarToast(actual ? "Producto marcado como agotado." : "Producto habilitado ✓");
    } catch {
      mostrarToast("Error al actualizar disponibilidad.");
    }
  };

  const actualizarPrecio = async (id, valor) => {
    const precio = parseInt(valor);
    if (isNaN(precio) || precio < 0) return;
    try {
      await updateDoc(doc(db, "productos", id), { precio });
      mostrarToast("Precio actualizado ✓");
    } catch {
      mostrarToast("Error al actualizar precio.");
    }
  };

  const crearProducto = async () => {
    if (!nuevoP.nombre.trim() || !nuevoP.precio) {
      mostrarToast("⚠️ Nombre y precio son obligatorios.");
      return;
    }
    try {
      const id = `prod-${Date.now()}`;
      await setDoc(doc(db, "productos", id), {
        nombre:     nuevoP.nombre.trim(),
        precio:     parseInt(nuevoP.precio),
        categoria:  nuevoP.categoria,
        imagen:     nuevoP.imagen.trim() ||
          "https://images.unsplash.com/photo-1619177383920-59f776369527?q=80&w=500&auto=format&fit=crop",
        disponible: true,
        popular:    false,
      });
      setModalProducto(false);
      setNuevoP({ nombre: "", precio: "", categoria: "Fritos", imagen: "" });
      mostrarToast("✅ Producto creado correctamente.");
    } catch {
      mostrarToast("Error al crear el producto.");
    }
  };

  // ── Render ─────────────────────────────────────────────────

  return (
    <>
      {/* ── Tabla de inventario ── */}
      <div style={{
        background: "white", padding: "32px",
        borderRadius: "36px", boxShadow: "0 8px 24px rgba(0,0,0,.04)"
      }}>

        {/* Encabezado */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: "24px"
        }}>
          <div>
            <h2 style={{ margin: 0, fontWeight: "800", color: C.texto }}>
              Inventario y Precios
            </h2>
            <p style={{ margin: "4px 0 0", color: C.textoSub, fontSize: "13px" }}>
              {menu.length} productos en el menú
            </p>
          </div>
          <button
            className="btn-accion"
            onClick={() => setModalProducto(true)}
            style={{
              background: C.naranja, color: "white", border: "none",
              padding: "14px 24px", borderRadius: "16px",
              fontWeight: "800", fontSize: "14px"
            }}
          >
            + Agregar Producto
          </button>
        </div>

        {/* Tabla */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
                {["Producto", "Categoría", "Precio ($)", "Estado"].map(h => (
                  <th key={h} style={{
                    padding: "14px 16px", textAlign: "left",
                    color: C.textoSub, fontSize: "13px",
                    fontWeight: "700", textTransform: "uppercase",
                    letterSpacing: ".5px"
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {menu.map(p => (
                <tr
                  key={p.id}
                  style={{
                    borderBottom: "1px solid #f8fafc",
                    background: p.disponible ? "transparent" : "#fff1f2",
                    transition: "background .2s"
                  }}
                >
                  {/* Nombre */}
                  <td style={{ padding: "16px" }}>
                    <div style={{ fontWeight: "700", color: C.texto, fontSize: "15px" }}>
                      {safeText(p.nombre)}
                    </div>
                    {p.popular && (
                      <span style={{
                        fontSize: "11px", fontWeight: "800",
                        color: "#92400e", background: "#fef3c7",
                        padding: "2px 8px", borderRadius: "10px",
                        marginTop: "4px", display: "inline-block"
                      }}>
                        🔥 TOP
                      </span>
                    )}
                  </td>

                  {/* Categoría */}
                  <td style={{ padding: "16px" }}>
                    <span style={{
                      background: "#f1f5f9", padding: "4px 12px",
                      borderRadius: "12px", fontSize: "13px",
                      fontWeight: "600", color: C.textoSub
                    }}>
                      {p.categoria}
                    </span>
                  </td>

                  {/* Precio editable */}
                  <td style={{ padding: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ color: C.textoSub, fontSize: "14px" }}>$</span>
                      <input
                        type="number"
                        defaultValue={p.precio}
                        onBlur={e => actualizarPrecio(p.id, e.target.value)}
                        style={{
                          width: "90px", padding: "10px 12px",
                          borderRadius: "12px", border: "1px solid #e2e8f0",
                          fontWeight: "700", fontSize: "14px", outline: "none",
                          transition: "border .2s"
                        }}
                        onFocus={e => e.target.style.borderColor = C.naranja}
                        onBlurCapture={e => e.target.style.borderColor = "#e2e8f0"}
                      />
                    </div>
                  </td>

                  {/* Disponibilidad */}
                  <td style={{ padding: "16px" }}>
                    <button
                      className="btn-accion"
                      onClick={() => toggleDisponibilidad(p.id, p.disponible)}
                      style={{
                        padding: "10px 18px", borderRadius: "14px",
                        border: "none", fontWeight: "800", fontSize: "12px",
                        minWidth: "120px", color: "white",
                        background: p.disponible ? C.verde : C.rojo,
                        boxShadow: p.disponible
                          ? "0 4px 10px rgba(22,163,74,.2)"
                          : "0 4px 10px rgba(239,68,68,.2)"
                      }}
                    >
                      {p.disponible ? "✓ HABILITADO" : "✗ AGOTADO"}
                    </button>
                  </td>
                </tr>
              ))}

              {/* Estado vacío */}
              {menu.length === 0 && (
                <tr>
                  <td colSpan={4} style={{
                    padding: "48px", textAlign: "center",
                    color: C.textoSub, fontSize: "15px"
                  }}>
                    No hay productos. Agrega el primero 👆
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal: Nuevo Producto ── */}
      {modalProducto && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,.6)", zIndex: 50000,
          display: "flex", justifyContent: "center",
          alignItems: "center", padding: "20px"
        }}>
          <div style={{
            background: "white", padding: "36px",
            borderRadius: "36px", width: "100%", maxWidth: "440px",
            boxShadow: "0 20px 60px rgba(0,0,0,.2)"
          }}>
            <h2 style={{ margin: "0 0 8px", fontWeight: "900" }}>
              Agregar Producto
            </h2>
            <p style={{ margin: "0 0 24px", color: C.textoSub, fontSize: "13px" }}>
              El producto quedará disponible de inmediato en el menú.
            </p>

            {/* Campos del formulario */}
            {[
              { label: "Nombre del producto *", key: "nombre", type: "text",
                placeholder: "ej. Empanada de pipián" },
              { label: "Precio en pesos (COP) *", key: "precio", type: "number",
                placeholder: "ej. 1500" },
              { label: "URL de imagen (opcional)", key: "imagen", type: "text",
                placeholder: "https://..." },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: "16px" }}>
                <label style={{
                  display: "block", fontWeight: "700",
                  fontSize: "13px", marginBottom: "6px", color: C.textoSub
                }}>
                  {f.label}
                </label>
                <input
                  type={f.type}
                  placeholder={f.placeholder}
                  value={nuevoP[f.key]}
                  onChange={e => setNuevoP({ ...nuevoP, [f.key]: e.target.value })}
                  style={{
                    width: "100%", padding: "14px", borderRadius: "14px",
                    border: "1px solid #e2e8f0", fontSize: "15px",
                    outline: "none", boxSizing: "border-box"
                  }}
                />
              </div>
            ))}

            {/* Selector de categoría */}
            <div style={{ marginBottom: "28px" }}>
              <label style={{
                display: "block", fontWeight: "700",
                fontSize: "13px", marginBottom: "6px", color: C.textoSub
              }}>
                Categoría
              </label>
              <select
                value={nuevoP.categoria}
                onChange={e => setNuevoP({ ...nuevoP, categoria: e.target.value })}
                style={{
                  width: "100%", padding: "14px", borderRadius: "14px",
                  border: "1px solid #e2e8f0", fontSize: "15px",
                  outline: "none", background: "white"
                }}
              >
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            {/* Botones */}
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                className="btn-accion"
                onClick={() => {
                  setModalProducto(false);
                  setNuevoP({ nombre: "", precio: "", categoria: "Fritos", imagen: "" });
                }}
                style={{
                  flex: 1, padding: "16px", borderRadius: "16px",
                  border: "none", background: "#f1f5f9",
                  fontWeight: "700", color: C.texto
                }}
              >
                Cancelar
              </button>
              <button
                className="btn-accion"
                onClick={crearProducto}
                style={{
                  flex: 2, padding: "16px", borderRadius: "16px",
                  border: "none", background: C.naranja,
                  color: "white", fontWeight: "900", fontSize: "15px"
                }}
              >
                Guardar Producto ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}