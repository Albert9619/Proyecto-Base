import React, { useState, useEffect } from 'react';
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
    0%   { box-shadow: 0 5px 15px rgba(251,191,36,0.3); transform: scale(1); }
    50%  { box-shadow: 0 5px 30px rgba(251,191,36,0.7); transform: scale(1.02); }
    100% { box-shadow: 0 5px 15px rgba(251,191,36,0.3); transform: scale(1); }
  }
  .pedido-pendiente { animation: mono-pulse 1.6s ease-in-out infinite; }

  @keyframes alerta-pulse {
    0%   { box-shadow: 0 5px 15px rgba(239,68,68,0.3); transform: scale(1); }
    50%  { box-shadow: 0 5px 30px rgba(239,68,68,0.8); transform: scale(1.02); }
    100% { box-shadow: 0 5px 15px rgba(239,68,68,0.3); transform: scale(1); }
  }
  .alerta-mesa { animation: alerta-pulse 1.2s ease-in-out infinite; }
`;

// --- DATA ---
const productosBase = [
  { id: "1", nombre: "Empanada Crujiente", precio: 1500, categoria: "Fritos", disponible: true, imagen: "/empanada.jpg", opciones: ["Carne", "Pollo", "Arroz"] },
  { id: "2", nombre: "Papa Rellena", precio: 2500, categoria: "Fritos", disponible: true, imagen: "/papa-rellena.jpg", opciones: ["Carne", "Huevo"] },
  { id: "3", nombre: "Pastel de Pollo", precio: 2500, categoria: "Fritos", disponible: true, imagen: "/pastel-pollo.jpg" },
  { id: "4", nombre: "Arepa con Huevo y Carne", precio: 3500, categoria: "Fritos", disponible: true, imagen: "/api-logo.jpg" },
  { id: "7", nombre: "Palitos de Queso", precio: 2000, categoria: "Fritos", disponible: true, imagen: "/palito-queso.jpg" },
  { id: "d1", nombre: "Desayuno Tradicional", precio: 8000, categoria: "Desayunos", disponible: true, imagen: "/desayuno-carne.jpg", config: ["Patacón", "Arepa"] },
  { id: "d2", nombre: "Desayuno Especial", precio: 10000, categoria: "Desayunos", disponible: true, imagen: "/desayuno-huevo.jpg", config: ["Carne Desmechada", "Pollo"] },
  { id: "MM1", nombre: "Jugo Natural Helado", precio: 0, categoria: "Bebidas", disponible: true, imagen: "/jugo-natural.jpg", sabores: ["Avena", "Maracuyá"], tamanos: [{ n: "Pequeño", p: 1000 }, { n: "Mediano", p: 1500 }, { n: "Grande", p: 2000 }] },
  { id: "b1", nombre: "Coca-Cola", precio: 0, categoria: "Bebidas", disponible: true, imagen: "/cocacola.jpg", tamanos: [{ n: "Mini", p: 2500 }, { n: "Personal", p: 3500 }, { n: "Familiar", p: 6500 }] },
  { id: "b2", nombre: "Pony Malta", precio: 0, categoria: "Bebidas", disponible: true, imagen: "/malta.jpg", tamanos: [{ n: "Mini", p: 2500 }, { n: "Personal", p: 3500 }] },
  { id: "lz1", nombre: "Arroz Especial", precio: 6000, categoria: "Arroces", disponible: true, imagen: "/arroz-pollo.jpg" }
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

  const hoy = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"][new Date().getDay()];
  const tipoArrozHoy = ["lunes", "miércoles", "viernes"].includes(hoy) ? "Pollo" : "Cerdo";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get('mesa');
    if (m) { setMesa(m); setNombre(`Cliente Mesa ${m}`); }
  }, []);

  const prevCountRef = React.useRef(0);
  useEffect(() => {
    const q = query(collection(db, "pedidos"), orderBy("timestamp", "asc"));
    return onSnapshot(q, (s) => {
      const data = s.docs.map(d => ({ id: d.id, ...d.data() }));
      if (data.length > prevCountRef.current && isAdmin) {
        playBeep();
        document.title = "( ! ) NUEVO PEDIDO";
      } else {
        document.title = "Fritos El Mono 🐒";
      }
      prevCountRef.current = data.length;
      setPedidosFB(data);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  // ✅ NEW 4: Listener para alertas de mesero
  useEffect(() => {
    const q = query(collection(db, "alertas"), orderBy("timestamp", "asc"));
    return onSnapshot(q, (s) => {
      const data = s.docs.map(d => ({ id: d.id, ...d.data() }));
      if (data.length > 0 && isAdmin) playBeep();
      setAlertasFB(data);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const agregarAlCarrito = (p) => {
    const sel = selecciones[p.id] || {};
    const cant = cantidades[p.id] || 1;
    const precioF = p.precio || (sel.tamano ? sel.tamano.p : 0);
    const det = [sel.sabor, sel.tamano?.n, sel.config].filter(Boolean).join(' · ');
    const idUnico = Date.now();
    setPedido(prev => [...prev, { idUnico, nombre: p.nombre, cantidad: cant, subtotal: precioF * cant, detalle: det }]);
  };

  // ✅ NEW 3: Eliminar item del carrito
  const eliminarDelCarrito = (idUnico) => {
    setPedido(prev => prev.filter(it => it.idUnico !== idUnico));
    setNotas(prev => { const n = { ...prev }; delete n[idUnico]; return n; });
  };

  const procesarPedido = async () => {
    if (!mesa && !direccion.trim()) { setErrorDireccion(true); return; }
    setErrorDireccion(false);
    const total = pedido.reduce((acc, i) => acc + i.subtotal, 0);
    // ✅ NEW 1: Guardar nota por item
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

  // ✅ NEW 4: Enviar alerta al admin
  const enviarAlerta = async (tipo) => {
    if (!mesa) return;
    await setDoc(doc(db, "alertas", `ALERTA-${mesa}-${Date.now()}`), {
      mesa, tipo, timestamp: Date.now(),
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    setAlertaEnviada(tipo);
    setTimeout(() => setAlertaEnviada(null), 4000);
  };

  const descartarAlerta = async (id) => {
    await deleteDoc(doc(db, "alertas", id));
  };

  const pedidosMesaActual = pedidosFB.filter(p => p.ubicacion === `MESA ${mesa}` && p.estado !== "pagado");
  const totalAcumuladoMesa = pedidosMesaActual.reduce((acc, p) => acc + (p.total || 0), 0);

  // ==========================================
  // 🔴 VISTA ADMINISTRADOR
  // ==========================================
  if (isAdmin) {
    const pagados = pedidosFB.filter(p => p.estado === "pagado");
    const vMesa = pagados.filter(p => p.tipo === "mesa").reduce((acc, p) => acc + (p.total || 0), 0);
    const vDomi = pagados.filter(p => p.tipo === "domicilio").reduce((acc, p) => acc + (p.total || 0), 0);
    const tVendido = vMesa + vDomi;
    const pendientes = pedidosFB.filter(p => p.estado === 'pendiente').length;

    return (
      <>
        <style>{pulseStyle}</style>
        <div style={{ padding: '20px', background: pendientes > 0 ? '#fff7ed' : '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h1 style={{ color: MONO_NARANJA }}>Admin Mono {pendientes > 0 ? '🔔' : '🐒'}</h1>
              <div style={{ background: MONO_TEXTO, color: 'white', padding: '10px 20px', borderRadius: '15px' }}>
                Caja Hoy: <strong>${tVendido.toLocaleString()}</strong>
              </div>
              <button onClick={() => setIsAdmin(false)} style={{ padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>Salir</button>
            </div>

            {/* ✅ NEW 4: Alertas de mesa pulsando arriba del todo */}
            {alertasFB.length > 0 && (
              <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {alertasFB.map(a => (
                  <div key={a.id} className="alerta-mesa" style={{ background: 'white', padding: '15px 25px', borderRadius: '20px', border: `3px solid ${MONO_ROJO}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                      {a.tipo === 'mesero' ? '🙋' : '💳'} Mesa {a.mesa} — {a.tipo === 'mesero' ? 'Llama al mesero' : 'Pide la cuenta'}
                      <small style={{ color: '#999', marginLeft: '8px' }}>({a.hora})</small>
                    </span>
                    <button onClick={() => descartarAlerta(a.id)} style={{ background: MONO_ROJO, color: 'white', border: 'none', borderRadius: '10px', padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}>
                      Atendido ✓
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
              <button onClick={() => setTabActiva("pedidos")} style={{ flex: 1, padding: '15px', borderRadius: '15px', background: tabActiva === "pedidos" ? MONO_NARANJA : "white", border: pendientes > 0 && tabActiva !== "pedidos" ? `3px solid ${MONO_ROJO}` : 'none', fontWeight: 'bold', cursor: 'pointer' }}>👨‍🍳 Cocina ({pendientes})</button>
              <button onClick={() => setTabActiva("mesas")} style={{ flex: 1, padding: '15px', borderRadius: '15px', background: tabActiva === "mesas" ? MONO_NARANJA : "white", fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>💰 Cobros</button>
              <button onClick={() => setTabActiva("caja")} style={{ flex: 1, padding: '15px', borderRadius: '15px', background: tabActiva === "caja" ? "#000" : "white", color: tabActiva === "caja" ? "white" : "black", fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>📊 Caja</button>
            </div>

            {tabActiva === "pedidos" && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                {pedidosFB.filter(p => p.estado !== "entregado" && p.estado !== "pagado").map(p => (
                  <div key={p.id} className={p.estado === 'pendiente' ? 'pedido-pendiente' : ''} style={{ background: 'white', padding: '20px', borderRadius: '25px', borderLeft: `10px solid ${p.estado === 'pendiente' ? MONO_AMARILLO : MONO_AZUL}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>{p.ubicacion}</strong>
                      <small>{p.hora} (${p.total.toLocaleString()})</small>
                    </div>
                    {p.productos.map((it, i) => (
                      <div key={i} style={{ fontSize: '14px', marginTop: '6px' }}>
                        • {it.cantidad}x {it.nombre}
                        {it.detalle && <span style={{ color: '#888' }}> — {it.detalle}</span>}
                        {/* ✅ NEW 1: Nota visible en cocina */}
                        {it.nota && <div style={{ marginLeft: '14px', color: MONO_ROJO, fontSize: '13px' }}>📝 {it.nota}</div>}
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: '5px', marginTop: '15px' }}>
                      {p.estado === 'pendiente' && <button onClick={() => actualizarEstado(p.id, 'preparando')} style={{ flex: 1, background: MONO_AZUL, color: 'white', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}>Preparar</button>}
                      {p.estado === 'preparando' && <button onClick={() => actualizarEstado(p.id, 'entregado')} style={{ flex: 1, background: MONO_VERDE, color: 'white', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}>Entregado ✅</button>}
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
                  if (mesaPed.length === 0) return <div key={n} style={{ background: 'white', padding: '20px', borderRadius: '20px', border: '1px dashed #ccc', textAlign: 'center', color: '#999' }}>Mesa {n}</div>;
                  return (
                    <div key={n} style={{ background: 'white', padding: '25px', borderRadius: '30px', border: `2px solid ${isReady ? MONO_ROJO : MONO_NARANJA}` }}>
                      <h3 style={{ margin: 0, textAlign: 'center' }}>MESA {n}</h3>
                      <div style={{ fontSize: '28px', fontWeight: '900', textAlign: 'center', margin: '10px 0' }}>${totalM.toLocaleString()}</div>
                      <button onClick={() => { if (window.confirm("¿Cobrar?")) mesaPed.forEach(p => actualizarEstado(p.id, 'pagado')); }} style={{ width: '100%', padding: '15px', background: isReady ? MONO_ROJO : MONO_TEXTO, color: 'white', border: 'none', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' }}>COBRAR 💸</button>
                    </div>
                  );
                })}
                <div style={{ gridColumn: '1/-1', marginTop: '30px' }}>
                  <h3>🛵 Domicilios por Cobrar</h3>
                  <div style={{ display: 'flex', gap: '10px', overflowX: 'auto' }}>
                    {pedidosFB.filter(p => p.tipo === "domicilio" && p.estado !== "pagado").map(p => (
                      <div key={p.id} style={{ minWidth: '220px', background: 'white', padding: '20px', borderRadius: '20px', border: `2px solid ${MONO_AZUL}` }}>
                        <strong>{p.nombre}</strong><br />
                        <small style={{ color: '#666' }}>{p.ubicacion}</small><br />
                        <span style={{ fontSize: '22px', fontWeight: '900' }}>${p.total?.toLocaleString()}</span>
                        <button onClick={() => actualizarEstado(p.id, 'pagado')} style={{ width: '100%', marginTop: '10px', background: MONO_VERDE, color: 'white', border: 'none', borderRadius: '10px', padding: '10px', cursor: 'pointer' }}>PAGADO ✅</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tabActiva === "caja" && (
              <div style={{ background: 'white', padding: '40px', borderRadius: '40px' }}>
                <h2>Cierre de Caja 📊</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', margin: '30px 0' }}>
                  <div style={{ padding: '20px', background: '#fff7ed', borderRadius: '20px', border: `2px solid ${MONO_NARANJA}`, textAlign: 'center' }}>
                    <span>CAJA TOTAL</span><div style={{ fontSize: '35px', fontWeight: '950' }}>${tVendido.toLocaleString()}</div>
                  </div>
                  <div style={{ padding: '20px', background: '#f0fdf4', borderRadius: '20px', border: `2px solid ${MONO_VERDE}`, textAlign: 'center' }}>
                    <span>LOCAL</span><div style={{ fontSize: '35px', fontWeight: '950' }}>${vMesa.toLocaleString()}</div>
                  </div>
                  <div style={{ padding: '20px', background: '#eff6ff', borderRadius: '20px', border: `2px solid ${MONO_AZUL}`, textAlign: 'center' }}>
                    <span>DOMICILIOS</span><div style={{ fontSize: '35px', fontWeight: '950' }}>${vDomi.toLocaleString()}</div>
                  </div>
                </div>
                <button onClick={() => { if (window.confirm("¿Reiniciar?")) pagados.forEach(p => deleteDoc(doc(db, "pedidos", p.id))); }} style={{ width: '100%', padding: '20px', background: MONO_TEXTO, color: 'white', borderRadius: '20px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>REINICIAR DÍA</button>
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
      <div style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#fffcf5', minHeight: '100vh', paddingBottom: '120px' }}>

        {/* Botón Pre-cuenta flotante */}
        {mesa && totalAcumuladoMesa > 0 && (
          <button onClick={() => setVerPrecuenta(true)} style={{ position: 'fixed', bottom: '160px', right: '20px', background: MONO_TEXTO, color: 'white', padding: '15px 25px', borderRadius: '50px', border: 'none', fontWeight: '900', boxShadow: '0 10px 20px rgba(0,0,0,0.2)', zIndex: 5000 }}>
            📄 Mi cuenta (${totalAcumuladoMesa.toLocaleString()})
          </button>
        )}

        {/* ✅ NEW 4: Botones Llamar mesero / Pedir cuenta — solo en mesas */}
        {mesa && (
          <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px', zIndex: 5000 }}>
            <button
              onClick={() => enviarAlerta('mesero')}
              disabled={!!alertaEnviada}
              style={{ padding: '13px 20px', borderRadius: '40px', border: 'none', background: alertaEnviada ? '#ccc' : MONO_AZUL, color: 'white', fontWeight: 'bold', cursor: alertaEnviada ? 'default' : 'pointer', boxShadow: '0 5px 15px rgba(0,0,0,0.15)', fontSize: '14px' }}
            >
              🙋 Llamar mesero
            </button>
            <button
              onClick={() => enviarAlerta('cuenta')}
              disabled={!!alertaEnviada}
              style={{ padding: '13px 20px', borderRadius: '40px', border: 'none', background: alertaEnviada ? '#ccc' : MONO_VERDE, color: 'white', fontWeight: 'bold', cursor: alertaEnviada ? 'default' : 'pointer', boxShadow: '0 5px 15px rgba(0,0,0,0.15)', fontSize: '14px' }}
            >
              💳 Pedir la cuenta
            </button>
          </div>
        )}

        {/* Feedback al cliente tras enviar alerta */}
        {alertaEnviada && (
          <div style={{ position: 'fixed', bottom: '90px', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '10px 20px', borderRadius: '20px', fontSize: '14px', color: MONO_VERDE, fontWeight: 'bold', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', zIndex: 5001 }}>
            ✅ {alertaEnviada === 'mesero' ? '¡Mesero en camino!' : '¡Ya va la cuenta!'}
          </div>
        )}

        {/* Modal Pre-cuenta con estado en tiempo real */}
        {verPrecuenta && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <div style={{ background: 'white', width: '100%', maxWidth: '450px', borderRadius: '40px', padding: '30px', position: 'relative' }}>
              <button onClick={() => setVerPrecuenta(false)} style={{ position: 'absolute', top: 20, right: 20, border: 'none', background: '#eee', borderRadius: '50%', width: '35px', height: '35px' }}>✕</button>
              <h2 style={{ textAlign: 'center' }}>Mesa {mesa} 🐒</h2>
              <div style={{ maxHeight: '350px', overflowY: 'auto', borderTop: '2px dashed #ddd', paddingTop: '15px' }}>
                {pedidosMesaActual.map(p => (
                  <div key={p.id} style={{ marginBottom: '12px', borderBottom: '1px solid #eee', paddingBottom: '12px' }}>
                    {/* ✅ NEW 2: Estado del pedido en tiempo real para el cliente */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: p.estado === 'entregado' ? MONO_VERDE : p.estado === 'preparando' ? MONO_AZUL : MONO_AMARILLO }}>
                        {ESTADO_LABEL[p.estado]?.emoji} {ESTADO_LABEL[p.estado]?.texto}
                      </span>
                      <small style={{ color: '#bbb' }}>{p.hora}</small>
                    </div>
                    {p.productos.map((it, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', paddingLeft: '8px' }}>
                        <span>
                          {it.cantidad}x {it.nombre}
                          {it.detalle && <small style={{ color: '#999' }}> ({it.detalle})</small>}
                        </span>
                        <strong>${it.subtotal.toLocaleString()}</strong>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '20px', padding: '20px', background: '#fff7ed', borderRadius: '20px', textAlign: 'center' }}>
                <strong>TOTAL: ${totalAcumuladoMesa.toLocaleString()}</strong>
              </div>
            </div>
          </div>
        )}

        <header style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '0 0 50px 50px', boxShadow: '0 5px 30px rgba(0,0,0,0.05)' }}>
          <h1 onClick={() => setMostrarLogin(true)} style={{ color: MONO_NARANJA, fontSize: '2.5rem', fontWeight: '900', cursor: 'pointer' }}>Fritos El Mono 🐒</h1>
          <div style={{ marginTop: '10px', background: '#fff7ed', padding: '8px 20px', borderRadius: '20px', fontWeight: 'bold', display: 'inline-block' }}>Arroz: {tipoArrozHoy}</div>
        </header>

        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '25px' }}>
          {["Fritos", "Desayunos", "Arroces", "Bebidas"].map(cat => (
            <button key={cat} onClick={() => setCategoriaActiva(cat)} style={{ padding: '12px 25px', borderRadius: '30px', border: 'none', background: categoriaActiva === cat ? MONO_NARANJA : 'white', color: categoriaActiva === cat ? 'white' : MONO_TEXTO, fontWeight: 'bold', cursor: 'pointer' }}>{cat}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px', padding: '0 20px' }}>
          {productosBase.filter(p => p.categoria === categoriaActiva).map(p => {
            const sel = selecciones[p.id] || {};
            const cant = cantidades[p.id] || 1;
            const pActual = p.tamanos ? (sel.tamano?.p || p.tamanos[0].p) : (p.precio || 0);
            return (
              <div key={p.id} style={{ background: 'white', padding: '25px', borderRadius: '40px', textAlign: 'center', boxShadow: '0 10px 20px rgba(0,0,0,0.02)' }}>
                <h3>{p.nombre}</h3>
                <p style={{ color: MONO_NARANJA, fontWeight: '900', fontSize: '22px' }}>${pActual.toLocaleString()}</p>

                {p.opciones && (
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '15px' }}>
                    {p.opciones.map(o => (
                      <button key={o} onClick={() => setSelecciones({ ...selecciones, [p.id]: { ...sel, sabor: o } })} style={{ padding: '8px 12px', borderRadius: '12px', border: sel.sabor === o ? `2px solid ${MONO_NARANJA}` : '1px solid #eee', background: sel.sabor === o ? '#fff7ed' : 'white', cursor: 'pointer' }}>{o}</button>
                    ))}
                  </div>
                )}

                {p.config && (
                  <div style={{ marginBottom: '15px' }}>
                    <p style={{ fontSize: '12px', color: '#999', margin: '0 0 8px' }}>Acompañamiento:</p>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      {p.config.map(c => (
                        <button key={c} onClick={() => setSelecciones({ ...selecciones, [p.id]: { ...sel, config: c } })} style={{ padding: '8px 12px', borderRadius: '12px', border: sel.config === c ? `2px solid ${MONO_NARANJA}` : '1px solid #eee', background: sel.config === c ? '#fff7ed' : 'white', cursor: 'pointer' }}>{c}</button>
                      ))}
                    </div>
                  </div>
                )}

                {p.tamanos && (
                  <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', marginBottom: '15px' }}>
                    {p.tamanos.map(t => (
                      <button key={t.n} onClick={() => setSelecciones({ ...selecciones, [p.id]: { ...sel, tamano: t } })} style={{ padding: '8px 12px', borderRadius: '12px', border: sel.tamano?.n === t.n ? `2px solid ${MONO_NARANJA}` : '1px solid #eee', background: sel.tamano?.n === t.n ? '#fff7ed' : 'white', cursor: 'pointer' }}>{t.n}</button>
                    ))}
                  </div>
                )}

                {p.sabores && (
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '15px' }}>
                    {p.sabores.map(s => (
                      <button key={s} onClick={() => setSelecciones({ ...selecciones, [p.id]: { ...sel, sabor: s } })} style={{ padding: '8px 12px', borderRadius: '12px', border: sel.sabor === s ? `2px solid ${MONO_NARANJA}` : '1px solid #eee', background: sel.sabor === s ? '#fff7ed' : 'white', cursor: 'pointer' }}>{s}</button>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '15px' }}>
                  <button onClick={() => setCantidades({ ...cantidades, [p.id]: Math.max(1, cant - 1) })} style={{ cursor: 'pointer' }}>-</button>
                  <strong>{cant}</strong>
                  <button onClick={() => setCantidades({ ...cantidades, [p.id]: cant + 1 })} style={{ cursor: 'pointer' }}>+</button>
                </div>
                <button onClick={() => agregarAlCarrito(p)} style={{ width: '100%', padding: '15px', background: MONO_NARANJA, color: 'white', borderRadius: '20px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Añadir 🛒</button>
              </div>
            );
          })}
        </div>

        {/* Carrito */}
        {pedido.length > 0 && (
          <div style={{ maxWidth: '600px', margin: '40px auto', background: 'white', padding: '30px', borderRadius: '40px', border: `5px solid ${MONO_NARANJA}`, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <h2>🛒 Pedido Nuevo</h2>
            {pedido.map(it => (
              <div key={it.idUnico} style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span>
                    <strong>{it.cantidad}x</strong> {it.nombre}
                    {it.detalle && <><br /><small style={{ color: '#999' }}>{it.detalle}</small></>}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <strong>${it.subtotal.toLocaleString()}</strong>
                    {/* ✅ NEW 3: Botón eliminar */}
                    <button onClick={() => eliminarDelCarrito(it.idUnico)} style={{ background: '#fee2e2', border: 'none', borderRadius: '8px', color: MONO_ROJO, padding: '4px 10px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                  </div>
                </div>
                {/* ✅ NEW 1: Nota por item */}
                <input
                  type="text"
                  placeholder="📝 Nota (ej: sin cebolla)..."
                  value={notas[it.idUnico] || ""}
                  onChange={e => setNotas(prev => ({ ...prev, [it.idUnico]: e.target.value }))}
                  style={{ width: '100%', marginTop: '8px', padding: '8px 12px', borderRadius: '10px', border: '1px solid #eee', fontSize: '13px', color: '#555', boxSizing: 'border-box' }}
                />
              </div>
            ))}

            {!mesa && (
              <div style={{ marginTop: '15px' }}>
                <input
                  type="text"
                  placeholder="📍 Dirección de entrega *"
                  value={direccion}
                  onChange={e => { setDireccion(e.target.value); setErrorDireccion(false); }}
                  style={{ width: '100%', padding: '15px', borderRadius: '15px', border: errorDireccion ? `2px solid ${MONO_ROJO}` : '1px solid #ddd', outline: 'none', boxSizing: 'border-box' }}
                />
                {errorDireccion && <p style={{ color: MONO_ROJO, fontSize: '13px', margin: '6px 0 0 5px' }}>⚠️ Por favor ingresa la dirección de entrega</p>}
              </div>
            )}

            <button onClick={procesarPedido} style={{ width: '100%', marginTop: '20px', padding: '20px', background: MONO_NARANJA, color: 'white', borderRadius: '25px', border: 'none', fontWeight: '900', fontSize: '18px', cursor: 'pointer' }}>CONFIRMAR PEDIDO 👨‍🍳</button>
          </div>
        )}

        {mostrarLogin && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 20000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ background: 'white', padding: '40px', borderRadius: '30px', textAlign: 'center', maxWidth: '320px', width: '100%' }}>
              <input type="password" placeholder="PIN" onChange={e => setPinInput(e.target.value)} style={{ padding: '15px', borderRadius: '15px', textAlign: 'center', fontSize: '20px', width: '100%' }} />
              <button onClick={() => { if (pinInput === "mono2026") { setIsAdmin(true); setMostrarLogin(false); } }} style={{ display: 'block', width: '100%', marginTop: '15px', padding: '15px', background: MONO_NARANJA, color: 'white', border: 'none', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' }}>Entrar</button>
              <button onClick={() => setMostrarLogin(false)} style={{ marginTop: '10px', background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}>Cerrar</button>
            </div>
          </div>
        )}

        {agradecimiento && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: MONO_NARANJA, zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', textAlign: 'center', padding: '20px' }}>
            <div>
              <h1>¡Recibido!</h1>
              <p>Tu pedido está en cocina.</p>
              <button onClick={() => setAgradecimiento(false)} style={{ marginTop: '30px', padding: '15px 40px', borderRadius: '30px', border: 'none', background: 'white', color: MONO_NARANJA, fontWeight: '900', cursor: 'pointer' }}>Volver al Menú</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
