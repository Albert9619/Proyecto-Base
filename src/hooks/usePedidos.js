import { useState, useEffect, useRef } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";

// ── Beep discreto para nuevos pedidos en admin ────────────────
let _audio = null;
const playBeep = () => {
  try {
    if (!_audio) {
      _audio = new Audio(
        "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ9vT19vT19vT19vT19vT19v"
      );
    }
    _audio.play().catch(() => {});
  } catch (_) {}
};

export function usePedidos({ isAdmin = false } = {}) {
  const [pedidos,     setPedidos]     = useState([]);
  const [firebaseOK,  setFirebaseOK]  = useState(true);
  const prevCount = useRef(0);

  useEffect(() => {
    try {
      const q = query(collection(db, "pedidos"), orderBy("timestamp", "asc"));
      const unsub = onSnapshot(
        q,
        (snap) => {
          setFirebaseOK(true);
          const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));

          if (isAdmin && data.length > prevCount.current) {
            playBeep();
            document.title = "( ! ) NUEVO PEDIDO";
          } else {
            document.title = "La Nave Naranja 🍊";
          }

          prevCount.current = data.length;
          setPedidos(data);
        },
        () => setFirebaseOK(false),
      );
      return unsub;
    } catch {
      setFirebaseOK(false);
    }
  }, [isAdmin]);

  // Derivados útiles
  const pendientes   = pedidos.filter(p => p.estado === "pendiente");
  const pagados      = pedidos.filter(p => p.estado === "pagado");

  const pedidosDeMesa = (mesa) =>
    pedidos.filter(p => p.ubicacion === `MESA ${mesa}` && p.estado !== "pagado");

  return {
    pedidos,
    pendientes,
    pagados,
    firebaseOK,
    pedidosDeMesa,
    numPendientes: pendientes.length,
  };
}