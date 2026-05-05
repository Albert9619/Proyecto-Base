import React, { useState, useEffect } from 'react';
import { C } from '../../constants/colores';

export default function TabQRs() {
  // Estado para la URL base (donde está alojada la app)
  const [baseUrl, setBaseUrl] = useState(window.location.origin);

  // Cantidad de mesas a generar (por defecto 10)
  const mesas = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div style={{ background: "white", padding: "36px", borderRadius: "36px", boxShadow: "0 8px 24px rgba(0,0,0,.04)" }}>
      
      <div className="no-print">
        <h2 style={{ margin: "0 0 8px", fontWeight: "800" }}>Códigos QR por Mesa 📌</h2>
        <p style={{ color: C.textoSub, marginBottom: "24px" }}>
          Imprime estos códigos y colócalos en cada mesa. Al escanearlos, el sistema detectará automáticamente el número de mesa.
        </p>

        <div style={{ marginBottom: "30px" }}>
          <label style={{ display: "block", fontWeight: "700", fontSize: "13px", marginBottom: "8px", color: C.textoSub }}>
            URL del sistema (Vercel o Local)
          </label>
          <input 
            type="text" 
            value={baseUrl} 
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://la-nave-naranja.vercel.app"
            style={{ 
              width: "100%", padding: "15px", borderRadius: "15px", 
              border: "2px solid #e2e8f0", fontSize: "14px", outline: "none",
              boxSizing: "border-box" 
            }} 
          />
        </div>

        <button 
          className="btn-accion" 
          onClick={() => window.print()}
          style={{ 
            background: C.naranja, color: "white", border: "none", 
            padding: "16px 32px", borderRadius: "18px", 
            fontWeight: "800", marginBottom: "40px", cursor: "pointer",
            boxShadow: `0 8px 20px ${C.naranja}44`
          }}
        >
          🖨️ Imprimir todos los QRs
        </button>
      </div>

      {/* Grid de QRs */}
      <div className="qr-print" 
        style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", 
          gap: "30px" 
        }}
      >
        {mesas.map((n) => {
          // Generamos el link con el parámetro de mesa
          const linkMesa = `${baseUrl.replace(/\/$/, "")}?mesa=${n}`;
          // Usamos la API gratuita de qrserver
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(linkMesa)}`;

          return (
            <div key={n} 
              style={{ 
                textAlign: "center", padding: "24px", 
                border: "2px solid #f1f5f9", borderRadius: "24px",
                background: "white"
              }}
            >
              <div style={{ fontWeight: "900", fontSize: "20px", marginBottom: "16px", color: C.texto }}>
                MESA {n}
              </div>
              
              <img 
                src={qrUrl} 
                alt={`QR Mesa ${n}`} 
                style={{ width: "100%", maxWidth: "180px", height: "auto", marginBottom: "12px" }} 
              />
              
              <div style={{ fontSize: "10px", color: C.textoSub, wordBreak: "break-all" }}>
                {linkMesa}
              </div>
            </div>
          );
        })}
      </div>

      {/* Estilos específicos para la impresión */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .qr-print { 
            display: grid !important; 
            grid-template-columns: repeat(2, 1fr) !important; 
            gap: 20px !important; 
          }
          .qr-print > div {
            page-break-inside: avoid;
            border: 1px solid #eee !important;
          }
        }
      `}</style>
    </div>
  );
}