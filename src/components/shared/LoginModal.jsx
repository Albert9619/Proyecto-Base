import React, { useState } from "react";
import { C } from "../../constants/colores";

const PIN_CORRECTO = "nave2026";

export default function LoginModal({ onLogin, onCerrar }) {
  const [pin,   setPin]   = useState("");
  const [error, setError] = useState(false);

  const intentarLogin = () => {
    if (pin === PIN_CORRECTO) {
      setError(false);
      onLogin();
    } else {
      setError(true);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,.9)",
      zIndex: 20000,
      display: "flex", justifyContent: "center", alignItems: "center",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <div style={{
        background: "white", padding: "40px",
        borderRadius: "36px", textAlign: "center", minWidth: "280px",
      }}>
        <h2 style={{ margin: "0 0 20px", fontWeight: "900" }}>Acceso Admin</h2>

        <input
          type="password"
          placeholder="PIN"
          value={pin}
          onChange={e => { setPin(e.target.value); setError(false); }}
          onKeyDown={e => e.key === "Enter" && intentarLogin()}
          style={{
            padding: "18px", borderRadius: "16px",
            border: `2px solid ${error ? C.rojo : "#e2e8f0"}`,
            fontSize: "20px", textAlign: "center",
            width: "100%", boxSizing: "border-box",
            outline: "none", letterSpacing: "6px",
          }}
        />

        {error && (
          <p style={{ color: C.rojo, fontSize: "13px", margin: "8px 0 0", fontWeight: "600" }}>
            PIN incorrecto
          </p>
        )}

        <button
          onClick={intentarLogin}
          style={{
            display: "block", width: "100%", marginTop: "12px",
            padding: "18px", background: C.naranja,
            color: "white", border: "none", borderRadius: "16px",
            fontWeight: "900", fontSize: "16px", cursor: "pointer",
          }}>
          Entrar
        </button>

        <button
          onClick={onCerrar}
          style={{
            background: "none", border: "none",
            marginTop: "12px", color: "#94a3b8", cursor: "pointer",
          }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}