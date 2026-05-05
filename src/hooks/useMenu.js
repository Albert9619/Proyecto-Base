import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { PRODUCTOS_BASE } from "../constants/menuBase";

export function useMenu() {
  const [menuFB,    setMenuFB]    = useState([]);
  const [cargando,  setCargando]  = useState(true);

  useEffect(() => {
    try {
      const q = query(collection(db, "productos"), orderBy("nombre", "asc"));
      const unsub = onSnapshot(
        q,
        (snap) => {
          setMenuFB(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          setCargando(false);
        },
        () => setCargando(false),
      );
      return unsub;
    } catch {
      setCargando(false);
    }
  }, []);

  // Fallback a datos locales si Firebase no cargó nada aún
  const menu = menuFB.length > 0 ? menuFB : PRODUCTOS_BASE;

  return { menu, cargando };
}