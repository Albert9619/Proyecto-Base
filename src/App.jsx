import React, { useState, useEffect, useRef } from 'react';
import { db } from './firebaseConfig';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy, updateDoc } from "firebase/firestore";

// --- ESTILOS ---
const MONO_NARANJA = "#f97316";
const MONO_VERDE = "#16a34a";
const MONO_AZUL = "#3b82f6";
const MONO_TEXTO = "#333333";
const MONO_ROJO = "#ef4444";
const MONO_AMARILLO = "#fbbf24";

let beepAudio = null;
const playBeep = () => {
  if (!beepAudio) {
    beepAudio = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ9vT19vT19vT19vT19vT19v");
  }
  beepAudio.play().catch(() => {});
};

const pulseStyle = `
  @keyframes mono-pulse {
    0%   { box-shadow: 0 5px 15px rgba(251,191,36,0.2); transform: scale(1); }
    50%  { box-shadow: 0 5px 25px rgba(251,191,36,0.5); transform: scale(1.02); }
    100% { box-shadow: 0 5px 15px rgba(251,191,36,0.2); transform: scale(1); }
  }
  .pedido-pendiente { animation: mono-pulse 1.6s ease-in-out infinite; }

  @keyframes alerta-pulse {
    0%   { transform: scale(1); background: #ef4444; }
    50%  { transform: scale(1.05); background: #b91c1c; }
    100% { transform: scale(1); background: #ef4444; }
  }
  .alerta-notif { animation: alerta-pulse 1s infinite; }
  
  .card-hover:hover { transform: translateY(-5px); transition: 0.3s; }
  .scroll-hide::-webkit-scrollbar { display: none; }

  /* Estilos para Impresión de QRs */
  @media print {
    .no-print { display: none !important; }
    .print-area { display: block !important; padding: 0 !important; }
    .qr-grid-print { 
      display: grid !important; 
      grid-template-columns: repeat(2, 1fr) !important; 
      gap: 40px !important; 
      background: white !important;
    }
  }
`;

// --- DATA ---
const productosBase = [
  { id: "1", nombre: "Empanada Crujiente", precio: 1500, categoria: "Fritos", disponible: true, popular: true, imagen: "https://images.unsplash.com/photo-1628113310823-927610ddf5c9?q=80&w=400&auto=format&fit=crop", opciones: ["Carne", "Pollo", "Arroz"] },
  { id: "2", nombre: "Papa Rellena", precio: 2500, categoria: "Fritos", disponible: true, imagen: "https://images.unsplash.com/photo-1626074353765-517a681e40be?q=80&w=400&auto=format&fit=crop", opciones: ["Carne", "Huevo"] },
  { id: "3", nombre: "Pastel de Pollo", precio: 2500, categoria: "Fritos", disponible: true, imagen: "https://images.unsplash.com/photo-1585109649139-366815a0d713?q=80&w=400&auto=format&fit=crop" },
  { id: "4", nombre: "Arepa con Huevo y Carne", precio: 3500, categoria: "Fritos", disponible: true, popular: true, imagen: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=400&auto=format&fit=crop" },
  { id: "7", nombre: "Palitos de Queso", precio: 2000, categoria: "Fritos", disponible: true, imagen: "https://images.unsplash.com/photo-1541592106381-b31e9221c004?q=80&w=400&auto=format&fit=crop" },
  { id: "d1", nombre: "Desayuno Tradicional", precio: 8000, categoria: "Desayunos", disponible: true, imagen: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?q=80&w=400&auto=format&fit=crop", config: ["Patacón", "Arepa"] },
  { id: "MM1", nombre: "Jugo Natural Helado", precio: 0, categoria: "Bebidas", disponible: true, imagen: "https://images.unsplash.com/photo-1544145945-f904253d0c7e?q=80&w=400&auto=format&fit=crop", sabores: ["Avena", "Maracuyá"], tamanos: [{ n: "Pequeño", p: 1000 }, { n: "Mediano", p: 1500 }, { n: "Grande", p: 2000 }] },
  { id: "b1", nombre: "Coca-Cola", precio: 0, categoria: "Bebidas", disponible: true, imagen: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=400&auto=format&fit=crop", tamanos: [{ n: "Mini", p: 2500 }, { n: "Personal", p: 3500 }, { n: "Familiar", p: 6500 }] },
  { id: "lz1", nombre: "Arroz Especial", precio: 6000, categoria: "Arroces", disponible: true, imagen: "https://images.unsplash.com/photo-1512058560366-cd242d458690?q=80&w=400&auto=format&fit=crop" }
];

const ESTADO_LABEL = {
  pendiente:  { emoji: "🟡", texto: "En cola..." },
  preparando: { emoji: "👨‍🍳", texto: "Preparando" },
  entregado:  { emoji: "✅", texto: "¡Listo!" },
};

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [tabActiva, setTabActiva] = useState("pedidos");
  const [pedidosFB, setPedidosFB] = useState([]);
  const [alertasFB, setAlertasFB] = useState([]);
  const [menuFB, setMenuFB] = useState([]); // ✅ Estado para sincronizar el menú dinámico
  const [pedido, setPedido] = useState([]);
  const [notas, setNotas] = useState({});
  const [mesa, setMesa] = useState(null);
  const [categoriaActiva, setCategoriaActiva] = useState("Fritos");
  const [selecciones, setSelecciones] = useState({});
  const [cantidades, setCantidades] = useState({});
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [errorDireccion, setErrorDireccion] = useState(false);
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [verPrecuenta, setVerPrecuenta] = useState(false);
  const [agradecimiento, setAgradecimiento] = useState(false);
  const [alertaEnviada, setAlertaEnviada] = useState(null);
  const [baseUrl, setBaseUrl] = useState(window.location.origin);

  const hoy = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"][new Date().getDay()];
  const tipoArrozHoy = ["lunes", "miércoles", "viernes"].includes(hoy) ? "Pollo" : "Cerdo";

  const prevPedidosRef = useRef(0);
  const prevAlertasRef = useRef(0);

  const numPendientes = pedidosFB.filter(p => p.estado === 'pendiente').length;
  const workload = numPendientes <= 3 ? { t: "Cocina Despejada", c: MONO_VERDE, m: "5-10 min" } :
                   numPendientes <= 8 ? { t: "Cocina con Flujo", c: MONO_AMARILLO, m: "15-20 min" } :
                   { t: "Cocina a Tope", c: MONO_ROJO, m: "25-30 min" };

  // ✅ NUEVO: Sincronización del Inventario con Firebase
  useEffect(() => {
    const q = query(collection(db, "productos"), orderBy("categoria", "asc"));
    return onSnapshot(q, (s) => {
      const data = s.docs.map(d => ({ id: d.id, ...d.data() }));
      setMenuFB(data);
      // Si la base de datos está vacía, la poblamos con los productos base
      if (data.length === 0) {
        productosBase.forEach(p => setDoc(doc(db, "productos", p.id), p));
      }
    });
  }, []);

  // ✅ NUEVO: Controladores de Precio y Switch
  const toggleDisponibilidad = async (id, estadoActual) => {
    await updateDoc(doc(db, "productos", id), { disponible: !estadoActual });
  };

  const actualizarPrecio = async (id, nuevoPrecio) => {
    const p = parseInt(nuevoPrecio);
    if (!isNaN(p)) await updateDoc(doc(db, "productos", id), { precio: p });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get('mesa');
    if (m) { setMesa(m); setNombre(`Cliente Mesa ${m}`); }
  }, []);

  useEffect(() => {
    const q = query(collection(db, "pedidos"), orderBy("timestamp", "asc"));
    return onSnapshot(q, (s) => {
      const data = s.docs.map(d => ({ id: d.id, ...d.data() }));
      if (data.length > prevPedidosRef.current && isAdmin) {
        playBeep(); document.title = "( ! ) NUEVO PEDIDO";
      } else {
        document.title = "Fritos El Mono 🐒";
      }
      prevPedidosRef.current = data.length;
      setPedidosFB(data);
    });
  }, [isAdmin]);

  useEffect(() => {
    const q = query(collection(db, "alertas"), orderBy("timestamp", "asc"));
    return onSnapshot(q, (s) => {
      const data = s.docs.map(d => ({ id: d.id, ...d.data() }));
      if (data.length > prevAlertasRef.current && isAdmin) playBeep();
      prevAlertasRef.current = data.length;
      setAlertasFB(data);
    });
  }, [isAdmin]);

  const agregarAlCarrito = (p) => {
    const sel = selecciones[p.id] || {};
    const cant = cantidades[p.id] || 1;
    const precioF = p.precio || (sel.tamano ? sel.tamano.p : 0);
    const det = [sel.sabor, sel.tamano?.n, sel.config].filter(Boolean).join(' · ');
    const idUnico = Date.now();
    setPedido(prev => [...prev, { idUnico, nombre: p.nombre, cantidad: cant, subtotal: precioF * cant, detalle: det }]);
  };

  const eliminarDelCarrito = (idUnico) => {
    setPedido(prev => prev.filter(it => it.idUnico !== idUnico));
    setNotas(prev => { const n = {...prev}; delete n[idUnico]; return n; });
  };

  const procesarPedido = async () => {
    if (!mesa && !direccion.trim()) { setErrorDireccion(true); return; }
    setErrorDireccion(false);
    const total = pedido.reduce((acc, i) => acc + i.subtotal, 0);
    const productosConNotas = pedido.map(it => ({ ...it, nota: notas[it.idUnico] || "" }));
    
    await setDoc(doc(db, "pedidos", `ORD-${Date.now()}`), {
      nombre,
      ubicacion: mesa ? `MESA ${mesa}` : direccion.trim(),
      productos: productosConNotas,
      total, timestamp: Date.now(),
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      estado: "pendiente", tipo: mesa ? "mesa" : "domicilio"
    });
    setAgradecimiento(true); setPedido([]); setNotas({});
  };

  const actualizarEstado = async (id, estado) => {
    await updateDoc(doc(db, "pedidos", id), { estado });
  };

  const enviarAlerta = async (tipo) => {
    if (!mesa) return;
    await setDoc(doc(db, "alertas", `ALERTA-${mesa}-${Date.now()}`), { mesa, tipo, timestamp: Date.now(), hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    setAlertaEnviada(tipo); setTimeout(() => setAlertaEnviada(null), 4000);
  };

  const descartarAlerta = async (id) => { await deleteDoc(doc(db, "alertas", id)); };

  const pedidosMesaActual = pedidosFB.filter(p => p.ubicacion === `MESA ${mesa}` && p.estado !== "pagado");
  const totalAcumuladoMesa = pedidosMesaActual.reduce((acc, p) => acc + (p.total || 0), 0);

  // ==========================================
  // 🔴 VISTA ADMINISTRADOR
  // ==========================================
  if (isAdmin) {
    const pagados = pedidosFB.filter(p => p.estado === "pagado");
    const vLocal = pagados.filter(p => p.tipo === "mesa").reduce((acc, p) => acc + (p.total || 0), 0);
    const vDomi = pagados.filter(p => p.tipo === "domicilio").reduce((acc, p) => acc + (p.total || 0), 0);
    const tVendido = vLocal + vDomi;

    return (
      <>
        <style>{pulseStyle}</style>
        <div style={{ padding: '20px', background: numPendientes > 0 ? '#fee2e2' : '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
          <div className="no-print" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h1 style={{ color: MONO_NARANJA, fontSize: '32px', margin: 0 }}>Panel Admin {numPendientes > 0 ? '🔔' : '🐒'}</h1>
              <div style={{ background: MONO_TEXTO, color: 'white', padding: '12px 25px', borderRadius: '20px', fontSize: '20px' }}>
                Total Caja: <strong>${tVendido.toLocaleString()}</strong>
              </div>
              <button onClick={() => setIsAdmin(false)} style={{ padding: '12px 20px', borderRadius: '12px', border: 'none', background: '#ddd', fontWeight: 'bold', cursor: 'pointer' }}>Salir</button>
            </div>

            {alertasFB.map(a => (
              <div key={a.id} className="alerta-notif" style={{ padding: '20px', borderRadius: '20px', marginBottom: '15px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '22px', fontWeight: '900' }}>{a.tipo === 'mesero' ? '🙋 LLAMADO' : '💳 CUENTA'} - MESA {a.mesa}</span>
                <button onClick={() => descartarAlerta(a.id)} style={{ background: 'white', color: MONO_ROJO, border: 'none', padding: '12px 25px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>ATENDER</button>
              </div>
            ))}

            <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', overflowX: 'auto' }} className="scroll-hide">
              <button onClick={() => setTabActiva("pedidos")} style={{ flex: 1, padding: '20px', borderRadius: '20px', background: tabActiva === "pedidos" ? MONO_NARANJA : "white", fontSize: '20px', fontWeight: 'bold', border: numPendientes > 0 ? `4px solid ${MONO_ROJO}` : 'none', cursor: 'pointer', whiteSpace:'nowrap' }}>👨‍🍳 COCINA ({numPendientes})</button>
              <button onClick={() => setTabActiva("gestion")} style={{ flex: 1, padding: '20px', borderRadius: '20px', background: tabActiva === "gestion" ? MONO_AZUL : "white", color: tabActiva === "gestion" ? "white" : "black", fontSize: '20px', fontWeight: 'bold', border: 'none', cursor: 'pointer', whiteSpace:'nowrap' }}>📦 GESTIÓN</button>
              <button onClick={() => setTabActiva("mesas")} style={{ flex: 1, padding: '20px', borderRadius: '20px', background: tabActiva === "mesas" ? MONO_NARANJA : "white", fontSize: '20px', fontWeight: 'bold', border: 'none', cursor: 'pointer', whiteSpace:'nowrap' }}>💰 COBROS</button>
              <button onClick={() => setTabActiva("qrs")} style={{ flex: 1, padding: '20px', borderRadius: '20px', background: tabActiva === "qrs" ? MONO_AZUL : "white", color: tabActiva === "qrs" ? "white" : "black", fontSize: '20px', fontWeight: 'bold', border: 'none', cursor: 'pointer', whiteSpace:'nowrap' }}>📌 QRs</button>
              <button onClick={() => setTabActiva("caja")} style={{ flex: 1, padding: '20px', borderRadius: '20px', background: tabActiva === "caja" ? "#000" : "white", color: tabActiva === "caja" ? "white" : "black", fontSize: '20px', fontWeight: 'bold', border: 'none', cursor: 'pointer', whiteSpace:'nowrap' }}>📊 CAJA</button>
            </div>

            {/* ✅ NUEVA VISTA DE GESTIÓN (Switches y Precios) */}
            {tabActiva === "gestion" && (
              <div style={{ background: 'white', padding: '30px', borderRadius: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                <h2 style={{ color: MONO_TEXTO }}>Inventario y Precios 📋</h2>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #eee' }}>
                        <th style={{ padding: '15px' }}>Producto</th>
                        <th style={{ padding: '15px' }}>Precio ($)</th>
                        <th style={{ padding: '15px' }}>Disponibilidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {menuFB.map(p => (
                        <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '15px', fontWeight: 'bold' }}>{p.nombre}</td>
                          <td style={{ padding: '15px' }}>
                            <input 
                              type="number" 
                              defaultValue={p.precio} 
                              onBlur={(e) => actualizarPrecio(p.id, e.target.value)}
                              style={{ width: '100px', padding: '8px', borderRadius: '10px', border: '1px solid #ddd' }}
                            />
                          </td>
                          <td style={{ padding: '15px' }}>
                            <button 
                              onClick={() => toggleDisponibilidad(p.id, p.disponible)}
                              style={{ 
                                padding: '10px 20px', 
                                borderRadius: '30px', 
                                border: 'none', 
                                background: p.disponible ? MONO_VERDE : MONO_ROJO, 
                                color: 'white', 
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              {p.disponible ? "HABILITADO" : "AGOTADO"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tabActiva === "pedidos" && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '25px' }}>
                {pedidosFB.filter(p => p.estado !== "entregado" && p.estado !== "pagado").map(p => (
                  <div key={p.id} className={p.estado === 'pendiente' ? 'pedido-pendiente' : ''} style={{ background: 'white', padding: '25px', borderRadius: '35px', border: p.estado === 'pendiente' ? `4px solid ${MONO_AMARILLO}` : `4px solid ${MONO_AZUL}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
                      <span style={{ fontSize: '26px', fontWeight: '900' }}>{p.ubicacion}</span>
                      <span style={{ fontSize: '18px' }}>{p.hora}</span>
                    </div>
                    {p.productos.map((it, i) => (
                      <div key={i} style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '22px', fontWeight: '700' }}>{it.cantidad}x {it.nombre}</div>
                        {it.detalle && <div style={{ color: '#666', fontSize: '15px' }}>{it.detalle}</div>}
                        {it.nota && <div style={{ background: '#fee2e2', color: MONO_ROJO, padding: '8px', borderRadius: '10px', marginTop: '5px', fontWeight: 'bold', fontSize: '16px' }}>📝 {it.nota}</div>}
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                      {p.estado === 'pendiente' && <button onClick={() => actualizarEstado(p.id, 'preparando')} style={{ flex: 1, background: MONO_AZUL, color: 'white', border: 'none', padding: '15px', borderRadius: '15px', fontWeight: '900', cursor: 'pointer' }}>FRITAR 👨‍🍳</button>}
                      {p.estado === 'preparando' && <button onClick={() => actualizarEstado(p.id, 'entregado')} style={{ flex: 1, background: MONO_VERDE, color: 'white', border: 'none', padding: '15px', borderRadius: '15px', fontWeight: '900', cursor: 'pointer' }}>DESPACHAR ✅</button>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tabActiva === "mesas" && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => {
                  const mesaPed = pedidosFB.filter(p => p.ubicacion === `MESA ${n}` && p.estado !== "pagado");
                  const totalM = mesaPed.reduce((acc, p) => acc + (p.total || 0), 0);
                  const isReady = mesaPed.length > 0 && mesaPed.every(p => p.estado === 'entregado');
                  if (mesaPed.length === 0) return <div key={n} style={{ background: 'white', padding: '20px', borderRadius: '25px', border: '1px dashed #ccc', textAlign: 'center', color: '#999' }}>Mesa {n}</div>;
                  return (
                    <div key={n} style={{ background: 'white', padding: '25px', borderRadius: '35px', border: `3px solid ${isReady ? MONO_ROJO : MONO_NARANJA}`, textAlign: 'center' }}>
                      <h3 style={{ margin: 0 }}>MESA {n}</h3>
                      <div style={{ fontSize: '28px', fontWeight: '900', margin: '15px 0' }}>${totalM.toLocaleString()}</div>
                      <button onClick={() => { if (window.confirm("¿Cobrar?")) mesaPed.forEach(p => actualizarEstado(p.id, 'pagado')); }} style={{ width: '100%', padding: '15px', background: isReady ? MONO_ROJO : MONO_TEXTO, color: 'white', border: 'none', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' }}>PAGAR CUENTA 💸</button>
                    </div>
                  );
                })}
                <div style={{ gridColumn: '1/-1', marginTop: '30px' }}>
                  <h3>🛵 Domicilios por Cobrar</h3>
                  <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px' }}>
                    {pedidosFB.filter(p => p.tipo === "domicilio" && p.estado !== "pagado").map(p => (
                      <div key={p.id} style={{ minWidth: '240px', background: 'white', padding: '20px', borderRadius: '25px', border: `2px solid ${MONO_AZUL}` }}>
                        <strong>{p.nombre}</strong><br />
                        <small>{p.ubicacion}</small><br />
                        <span style={{ fontSize: '22px', fontWeight: '900' }}>${p.total?.toLocaleString()}</span>
                        <button onClick={() => actualizarEstado(p.id, 'pagado')} style={{ width: '100%', marginTop: '12px', background: MONO_VERDE, color: 'white', border: 'none', borderRadius: '12px', padding: '10px', fontWeight: 'bold', cursor: 'pointer' }}>RECIBÍ PAGO ✅</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

           {tabActiva === "qrs" && (
  <div style={{ background: 'white', padding: '40px', borderRadius: '40px' }}>
    <h2 style={{ color: MONO_NARANJA }}>Generador de Códigos QR 📌</h2>
    <p>Verifica que la dirección de tu app sea correcta (asegúrate de que incluya el https://):</p>
    <input 
      type="text" 
      value={baseUrl} 
      onChange={(e) => setBaseUrl(e.target.value)} 
      placeholder="https://tu-app.web.app"
      style={{ width: '100%', padding: '15px', borderRadius: '15px', border: '2px solid #ddd', marginBottom: '20px', fontSize: '16px' }} 
    />
    <button onClick={() => window.print()} style={{ background: MONO_NARANJA, color: 'white', border: 'none', padding: '15px 30px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '30px' }}>🖨️ Imprimir Códigos</button>
    
    <div className="qr-grid-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '30px' }}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => {
        const qrUrl = `${baseUrl.replace(/\/$/, "")}?mesa=${n}`;
        return (
          <div key={n} style={{ textAlign: 'center', padding: '20px', border: '1px solid #eee', borderRadius: '25px', background: 'white' }}>
            <strong style={{ fontSize: '20px', display: 'block', marginBottom: '10px' }}>MESA {n}</strong>
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrUrl)}`} 
              alt={`QR Mesa ${n}`} 
              style={{ width: '100%', maxWidth: '180px', minHeight: '180px', backgroundColor: '#f9f9f9' }} 
            />
            <p style={{ fontSize: '10px', color: '#999', marginTop: '10px' }}>Fritos El Mono 🐒</p>
          </div>
        );
      })}
      <div style={{ textAlign: 'center', padding: '20px', border: '2px solid #eee', borderRadius: '25px', background: '#fffcf5' }}>
        <strong style={{ fontSize: '20px', display: 'block', marginBottom: '10px' }}>DOMICILIOS</strong>
        <img 
          src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(baseUrl)}`} 
          alt="QR Domicilio" 
          style={{ width: '100%', maxWidth: '180px', minHeight: '180px', backgroundColor: '#f9f9f9' }} 
        />
        <p style={{ fontSize: '10px', color: '#999', marginTop: '10px' }}>¡Pide desde casa! 🛵</p>
      </div>
    </div>
  </div>
)}

            {tabActiva === "caja" && (
              <div style={{ background: 'white', padding: '40px', borderRadius: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                <h2 style={{ color: MONO_NARANJA, marginBottom: '30px' }}>Cuadre de Turno 📊</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '25px', marginBottom: '40px' }}>
                  <div style={{ padding: '30px', background: '#fff7ed', borderRadius: '25px', border: `2px solid ${MONO_NARANJA}`, textAlign: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#666' }}>RECAUDO TOTAL</span>
                    <div style={{ fontSize: '42px', fontWeight: '950' }}>${tVendido.toLocaleString()}</div>
                  </div>
                  <div style={{ padding: '30px', background: '#f0fdf4', borderRadius: '25px', border: `2px solid ${MONO_VERDE}`, textAlign: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#666' }}>VENTAS LOCAL</span>
                    <div style={{ fontSize: '35px', fontWeight: '900' }}>${vLocal.toLocaleString()}</div>
                  </div>
                  <div style={{ padding: '30px', background: '#eff6ff', borderRadius: '25px', border: `2px solid ${MONO_AZUL}`, textAlign: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#666' }}>VENTAS DOMICILIO</span>
                    <div style={{ fontSize: '35px', fontWeight: '900' }}>${vDomi.toLocaleString()}</div>
                  </div>
                </div>
                <button onClick={() => { if (window.confirm("¿Reiniciar Turno?")) pagados.forEach(p => deleteDoc(doc(db, "pedidos", p.id))); }} style={{ width: '100%', padding: '25px', background: MONO_TEXTO, color: 'white', borderRadius: '20px', fontWeight: 'bold', border: 'none', fontSize: '18px', cursor: 'pointer' }}>FINALIZAR DÍA Y LIMPIAR CAJA 🏁</button>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // ==========================================
  // 🟡 VISTA CLIENTE
  // ==========================================
  return (
    <>
      <style>{pulseStyle}</style>
      <div style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#fffcf5', minHeight: '100vh', paddingBottom: '180px' }}>
        
        {/* HEADER HERO */}
        <header style={{ position: 'relative', height: '220px', background: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(https://images.unsplash.com/photo-1541592106381-b31e9221c004?q=80&w=1000&auto=format&fit=crop)`, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white', borderRadius: '0 0 50px 50px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
          <h1 onClick={() => setMostrarLogin(true)} style={{ fontSize: '2.8rem', margin: 0, fontWeight: '900', textShadow: '2px 2px 10px rgba(0,0,0,0.5)', cursor: 'pointer' }}>Fritos El Mono</h1>
          <p style={{ margin: '5px 0', opacity: 0.9, fontWeight: '500' }}>El sabor más crocante de Carepa 🐒</p>
          
          <div style={{ position: 'absolute', bottom: '-25px', background: 'white', padding: '12px 25px', borderRadius: '50px', boxShadow: '0 5px 20px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 100 }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: workload.c }}></div>
            <span style={{ color: MONO_TEXTO, fontWeight: 'bold', fontSize: '14px' }}>{workload.t} · <span style={{ color: workload.c }}>{workload.m} aprox.</span></span>
          </div>
        </header>

        {/* INFO DÍA */}
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <div style={{ background: '#fff7ed', padding: '8px 20px', borderRadius: '20px', fontWeight: 'bold', display: 'inline-block', color: MONO_NARANJA }}>Arroz Hoy: {tipoArrozHoy}</div>
        </div>

        {/* CATEGORÍAS */}
        <div className="scroll-hide" style={{ display: 'flex', gap: '12px', overflowX: 'auto', padding: '20px 25px' }}>
          {["Fritos", "Desayunos", "Arroces", "Bebidas"].map(cat => (
            <button key={cat} onClick={() => setCategoriaActiva(cat)} style={{ padding: '12px 28px', borderRadius: '30px', border: 'none', background: categoriaActiva === cat ? MONO_NARANJA : 'white', color: categoriaActiva === cat ? 'white' : MONO_TEXTO, fontWeight: 'bold', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', whiteSpace: 'nowrap', cursor: 'pointer' }}>{cat}</button>
          ))}
        </div>

        {/* ✅ TARJETAS DE PRODUCTO DINÁMICAS (Ocultan si están agotados) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))', gap: '20px', padding: '0 20px' }}>
          {(menuFB.length > 0 ? menuFB : productosBase)
            .filter(p => p.categoria === categoriaActiva)
            .map(p => {
            const sel = selecciones[p.id] || {};
            const cant = cantidades[p.id] || 1;
            const pActual = p.tamanos ? (sel.tamano?.p || p.tamanos[0].p) : (p.precio || 0);
            return (
              <div key={p.id} className="card-hover" style={{ 
                background: 'white', 
                borderRadius: '35px', 
                overflow: 'hidden', 
                boxShadow: '0 10px 20px rgba(0,0,0,0.03)', 
                position: 'relative',
                opacity: p.disponible ? 1 : 0.5 
              }}>
                {p.popular && p.disponible && <div style={{ position: 'absolute', top: '15px', left: '15px', background: MONO_NARANJA, color: 'white', padding: '5px 12px', borderRadius: '15px', fontSize: '10px', fontWeight: 'bold', zIndex: 10 }}>🔥 POPULAR</div>}
                
                {/* Overlay si está agotado */}
                {!p.disponible && (
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255,255,255,0.4)', zIndex: 20, display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', color: MONO_ROJO }}>AGOTADO ❌</div>
                )}

                <div style={{ height: '140px', background: `url(${p.imagen}) center/cover`, borderBottom: '4px solid #fffcf5' }} />
                <div style={{ padding: '15px', textAlign: 'center' }}>
                  <h3 style={{ margin: '0 0 5px', fontSize: '15px', height: '35px' }}>{p.nombre}</h3>
                  <div style={{ color: MONO_NARANJA, fontWeight: '900', fontSize: '18px', marginBottom: '10px' }}>${pActual.toLocaleString()}</div>
                  
                  {p.opciones && (
                    <select disabled={!p.disponible} onChange={(e) => setSelecciones({...selecciones, [p.id]: {...sel, sabor: e.target.value}})} style={{ width: '100%', padding: '8px', borderRadius: '12px', border: '1px solid #eee', marginBottom: '10px', fontSize: '12px', background: '#f8fafc' }}>
                      <option>Sabor...</option>
                      {p.opciones.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  )}

                  {p.tamanos && (
                    <select disabled={!p.disponible} onChange={(e) => setSelecciones({...selecciones, [p.id]: {...sel, tamano: p.tamanos.find(t => t.n === e.target.value)}})} style={{ width: '100%', padding: '8px', borderRadius: '12px', border: '1px solid #eee', marginBottom: '10px', fontSize: '12px', background: '#f8fafc' }}>
                      <option>Tamaño...</option>
                      {p.tamanos.map(t => <option key={t.n} value={t.n}>{t.n} (${t.p.toLocaleString()})</option>)}
                    </select>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '10px' }}>
                    <button disabled={!p.disponible} onClick={() => setCantidades({ ...cantidades, [p.id]: Math.max(1, cant - 1) })} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #eee', background: 'white', cursor: 'pointer' }}>-</button>
                    <strong style={{ fontSize: '16px' }}>{cant}</strong>
                    <button disabled={!p.disponible} onClick={() => setCantidades({ ...cantidades, [p.id]: cant + 1 })} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #eee', background: 'white', cursor: 'pointer' }}>+</button>
                  </div>
                  <button disabled={!p.disponible} onClick={() => agregarAlCarrito(p)} style={{ width: '100%', padding: '12px', background: p.disponible ? MONO_NARANJA : '#ccc', color: 'white', borderRadius: '18px', border: 'none', fontWeight: 'bold', cursor: p.disponible ? 'pointer' : 'default' }}>
                    {p.disponible ? "Añadir 🛒" : "Agotado"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* BOTONES FLOTANTES MESA */}
        {mesa && (
          <>
            <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px', zIndex: 5000, width: '90%', maxWidth: '450px' }}>
              <button onClick={() => enviarAlerta('mesero')} style={{ flex: 1, padding: '18px', borderRadius: '25px', border: 'none', background: MONO_AZUL, color: 'white', fontWeight: 'bold', boxShadow: '0 8px 20px rgba(0,0,0,0.15)', cursor: 'pointer' }}>🙋 Llamar Mesero</button>
              <button onClick={() => enviarAlerta('cuenta')} style={{ flex: 1, padding: '18px', borderRadius: '25px', border: 'none', background: MONO_VERDE, color: 'white', fontWeight: 'bold', boxShadow: '0 8px 20px rgba(0,0,0,0.15)', cursor: 'pointer' }}>💳 Pedir Cuenta</button>
            </div>
            {totalAcumuladoMesa > 0 && (
              <button onClick={() => setVerPrecuenta(true)} style={{ position: 'fixed', bottom: '100px', right: '20px', background: MONO_TEXTO, color: 'white', padding: '15px 25px', borderRadius: '50px', border: 'none', fontWeight: '900', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 4000, cursor: 'pointer' }}>
                📄 Ver Mi Cuenta (${totalAcumuladoMesa.toLocaleString()})
              </button>
            )}
          </>
        )}

        {/* FEEDBACK ALERTA ENVIADA */}
        {alertaEnviada && (
          <div style={{ position: 'fixed', bottom: '110px', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '10px 25px', borderRadius: '20px', border: `2px solid ${MONO_VERDE}`, fontWeight: 'bold', zIndex: 6000 }}>
            ✅ Solicitud enviada a caja
          </div>
        )}

        {/* CARRITO */}
        {pedido.length > 0 && (
          <div style={{ maxWidth: '600px', margin: '40px auto', background: 'white', padding: '30px', borderRadius: '40px', border: `5px solid ${MONO_NARANJA}`, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <h2 style={{ textAlign: 'center', margin: '0 0 20px' }}>🛒 Tu Pedido Nuevo</h2>
            {pedido.map(it => (
              <div key={it.idUnico} style={{ padding: '15px 0', borderBottom: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span>
                    <strong style={{fontSize:'18px'}}>{it.cantidad}x</strong> {it.nombre} 
                    {it.detalle && <><br /><small style={{ color: '#999' }}>{it.detalle}</small></>}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <strong>${it.subtotal.toLocaleString()}</strong>
                    <button onClick={() => eliminarDelCarrito(it.idUnico)} style={{ background: '#fee2e2', border: 'none', borderRadius: '8px', color: MONO_ROJO, padding: '5px 10px', cursor: 'pointer' }}>✕</button>
                  </div>
                </div>
                <input type="text" placeholder="📝 Nota (ej: sin cebolla, extra pique...)" value={notas[it.idUnico] || ""} onChange={e => setNotas(prev => ({ ...prev, [it.idUnico]: e.target.value }))} style={{ width: '100%', marginTop: '10px', padding: '12px', borderRadius: '15px', border: '1px solid #eee', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
            ))}
            {!mesa && (
              <div style={{ marginTop: '20px' }}>
                <input type="text" placeholder="📍 Dirección de entrega *" value={direccion} onChange={e => { setDireccion(e.target.value); setErrorDireccion(false); }} style={{ width: '100%', padding: '18px', borderRadius: '20px', border: errorDireccion ? `3px solid ${MONO_ROJO}` : '1px solid #ddd', boxSizing: 'border-box', outline: 'none' }} />
                {errorDireccion && <p style={{ color: MONO_ROJO, fontSize: '13px', margin: '8px 0 0' }}>⚠️ Falta la dirección para el domicilio</p>}
              </div>
            )}
            <button onClick={procesarPedido} style={{ width: '100%', marginTop: '25px', padding: '22px', background: MONO_NARANJA, color: 'white', borderRadius: '25px', border: 'none', fontWeight: '900', fontSize: '20px', cursor: 'pointer' }}>CONFIRMAR PEDIDO 👨‍🍳</button>
          </div>
        )}

        {/* MODAL PRE-CUENTA */}
        {verPrecuenta && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <div style={{ background: 'white', width: '100%', maxWidth: '450px', borderRadius: '40px', padding: '30px', position: 'relative' }}>
              <button onClick={() => setVerPrecuenta(false)} style={{ position: 'absolute', top: 20, right: 20, border: 'none', background: '#eee', borderRadius: '50%', width: '35px', height: '35px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
              <h2 style={{ textAlign: 'center', marginTop: 0 }}>Mesa {mesa} 🐒</h2>
              <div style={{ maxHeight: '400px', overflowY: 'auto', borderTop: '2px dashed #ddd', paddingTop: '15px' }}>
                {pedidosMesaActual.map(p => (
                  <div key={p.id} style={{ marginBottom: '15px', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: p.estado === 'entregado' ? MONO_VERDE : p.estado === 'preparando' ? MONO_AZUL : MONO_AMARILLO }}>
                        {ESTADO_LABEL[p.estado]?.emoji} {ESTADO_LABEL[p.estado]?.texto}
                      </span>
                      <small style={{ color: '#aaa' }}>{p.hora}</small>
                    </div>
                    {p.productos.map((it, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', paddingLeft: '8px' }}>
                        <span>{it.cantidad}x {it.nombre} <small style={{color:'#999'}}>({it.detalle})</small></span>
                        <strong>${it.subtotal.toLocaleString()}</strong>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '20px', padding: '20px', background: '#fff7ed', borderRadius: '25px', textAlign: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#666' }}>TOTAL ACUMULADO</span>
                <div style={{ fontSize: '38px', fontWeight: '950', color: MONO_NARANJA }}>${totalAcumuladoMesa.toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}

        {/* LOGIN MODAL */}
        {mostrarLogin && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 20000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ background: 'white', padding: '40px', borderRadius: '35px', textAlign: 'center', maxWidth: '340px', width: '100%' }}>
              <h3 style={{marginTop:0}}>Acceso Mono Admin</h3>
              <input type="password" placeholder="PIN" onChange={e => setPinInput(e.target.value)} style={{ padding: '18px', borderRadius: '15px', textAlign: 'center', fontSize: '22px', width: '100%', border: '1px solid #ddd', boxSizing: 'border-box' }} />
              <button onClick={() => { if (pinInput === "mono2026") { setIsAdmin(true); setMostrarLogin(false); } else { alert("PIN Erróneo"); } }} style={{ display: 'block', width: '100%', marginTop: '15px', padding: '18px', background: MONO_NARANJA, color: 'white', borderRadius: '15px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '18px' }}>Entrar</button>
              <button onClick={() => setMostrarLogin(false)} style={{ marginTop: '15px', background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}>Cerrar</button>
            </div>
          </div>
        )}

        {/* AGRADECIMIENTO */}
        {agradecimiento && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: MONO_NARANJA, zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', textAlign: 'center', padding: '20px' }}>
            <div style={{animation: 'mono-pulse 1.6s infinite'}}>
              <h1 style={{fontSize:'3.5rem', margin:0}}>¡Listo!</h1>
              <p style={{fontSize:'1.2rem'}}>Tu pedido está en cocina.</p>
              <button onClick={() => setAgradecimiento(false)} style={{ marginTop: '40px', padding: '18px 50px', borderRadius: '35px', border: 'none', background: 'white', color: MONO_NARANJA, fontWeight: '900', fontSize: '1.2rem', cursor: 'pointer' }}>Volver al Menú</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}