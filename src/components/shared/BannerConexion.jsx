import React from "react";
import { C } from "../../constants/colores";

export default function BannerConexion({ firebaseOK }) {
  if (firebaseOK) return null;

  return (
    <div style={{
      background: C.rojo,
      color: "white",
      textAlign: "center",
      padding: "12px",
      fontWeight: "bold",
      fontSize: "14px",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      ⚠️ Sin conexión — revisa tu internet. Los pedidos no se están enviando.
    </div>
  );
}