import { useState, useEffect, useRef } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";

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

export function useAlertas({ isAdmin = false } = {}) {
  const [alertas,  setAlertas]  = useState([]);
  const prevCount = useRef(0);

  useEffect(() => {
    try {
      const q = query(collection(db, "alertas"), orderBy("timestamp", "asc"));
      const unsub = onSnapshot(
        q,
        (snap) => {
          const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          if (isAdmin && data.length > prevCount.current) playBeep();
          prevCount.current = data.length;
          setAlertas(data);
        },
        () => {},
      );
      return unsub;
    } catch {}
  }, [isAdmin]);

  return { alertas };
}