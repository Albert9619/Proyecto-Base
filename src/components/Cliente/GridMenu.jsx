import React from "react";
import { C } from "../../constants/colores";
import { CATEGORIAS } from "../../constants/menuBase";
import CardProducto from "../../components/shared/CardProducto";

export default function GridMenu({
  menu,
  categoriaActiva,
  onCategoria,
  cantidades,
  selecciones,
  onCantidad,
  onSeleccion,
  onAgregar,
}) {
  const productosFiltrados = menu.filter(p => p.categoria === categoriaActiva);

  return (
    <>
      {/* Filtros de categoría */}
      <div
        className="scroll-hide"
        style={{
          display: "flex", gap: "10px",
          overflowX: "auto", padding: "20px 20px 8px",
        }}
      >
        {CATEGORIAS.map(cat => (
          <button
            key={cat}
            onClick={() => onCategoria(cat)}
            style={{
              padding: "12px 26px",
              borderRadius: "30px",
              border: "none",
              background: categoriaActiva === cat ? C.naranja : "white",
              color:      categoriaActiva === cat ? "white"   : C.texto,
              fontWeight: "700",
              fontSize: "14px",
              whiteSpace: "nowrap",
              cursor: "pointer",
              boxShadow: categoriaActiva === cat
                ? `0 6px 16px rgba(249,115,22,.3)`
                : `0 2px 8px rgba(0,0,0,.06)`,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid de productos */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: "16px",
        padding: "16px 20px",
        maxWidth: "1200px",
        margin: "0 auto",
      }}>
        {productosFiltrados.map(p => (
          <CardProducto
            key={p.id}
            producto={p}
            cantidad={cantidades[p.id] || 1}
            seleccion={selecciones[p.id] || {}}
            onCantidad={val  => onCantidad(p.id, val)}
            onSeleccion={sel => onSeleccion(p.id, sel)}
            onAgregar={() => onAgregar(p)}
          />
        ))}
      </div>
    </>
  );
}