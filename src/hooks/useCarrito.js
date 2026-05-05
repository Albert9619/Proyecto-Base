import { useState, useEffect } from "react";
import { safeText } from "../utils/helpers";

const STORAGE_KEY = "carrito_nave";

const leerStorage = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
};

export function useCarrito() {
  const [carrito, setCarrito] = useState(leerStorage);

  // Persistir en localStorage en cada cambio
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito));
  }, [carrito]);

  const agregar = (producto, { selecciones = {}, cantidad = 1 } = {}) => {
    const { tamano, sabor } = selecciones[producto.id] || {};
    const precio =
      producto.precio > 0 ? producto.precio :
      tamano             ? tamano.p :
      producto.tamanos?.[0]?.p || 0;

    const detalle = [sabor, tamano?.n].filter(Boolean).join(" · ");

    setCarrito(prev => [
      ...prev,
      {
        idUnico:  Date.now(),
        nombre:   safeText(producto.nombre),
        cantidad,
        subtotal: precio * cantidad,
        detalle,
      },
    ]);
  };

  const eliminar = (idUnico) =>
    setCarrito(prev => prev.filter(i => i.idUnico !== idUnico));

  const vaciar = () => setCarrito([]);

  const total = carrito.reduce((acc, i) => acc + i.subtotal, 0);

  return { carrito, agregar, eliminar, vaciar, total };
}