import { doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { generarIdPedido, generarIdAlerta } from "../utils/helpers";

// ─── Pedidos ──────────────────────────────────────────────────

export const crearPedido = async ({
  nombre, telefono, ubicacion, productos,
  notaGeneral, total, tipo,
}) => {
  const id = generarIdPedido();
  await setDoc(doc(db, "pedidos", id), {
    nombre,
    telefono,
    ubicacion,
    productos,
    notaGeneral,
    total,
    timestamp: Date.now(),
    hora: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    estado: "pendiente",
    tipo,
  });
  return id;
};

export const actualizarEstadoPedido = (id, estado) =>
  updateDoc(doc(db, "pedidos", id), { estado });

export const eliminarPedido = (id) =>
  deleteDoc(doc(db, "pedidos", id));

// ─── Alertas de mesa ─────────────────────────────────────────

export const crearAlerta = async (mesa, tipo) => {
  const id = generarIdAlerta(mesa);
  await setDoc(doc(db, "alertas", id), {
    mesa,
    tipo,
    timestamp: Date.now(),
    hora: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  });
  return id;
};

export const eliminarAlerta = (id) =>
  deleteDoc(doc(db, "alertas", id));

// ─── Productos ───────────────────────────────────────────────

export const toggleDisponibilidad = (id, actual) =>
  updateDoc(doc(db, "productos", id), { disponible: !actual });

export const actualizarPrecio = async (id, val) => {
  const p = parseInt(val);
  if (isNaN(p) || p < 0) throw new Error("Precio inválido");
  await updateDoc(doc(db, "productos", id), { precio: p });
};

export const crearProducto = async ({ nombre, precio, categoria, imagen }) => {
  const id = `prod-${Date.now()}`;
  await setDoc(doc(db, "productos", id), {
    nombre: nombre.trim(),
    precio: parseInt(precio),
    categoria,
    imagen: imagen.trim() ||
      "https://images.unsplash.com/photo-1619177383920-59f776369527?q=80&w=500&auto=format&fit=crop",
    disponible: true,
    popular: false,
  });
  return id;
};