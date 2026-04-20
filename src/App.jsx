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
  { id: "MM1", nombre: "Jugo Natural Helado", precio: 0, categoria: "Bebidas", disponible: true, imagen: "https://images.unsplash.com/photo-1544145945-f904253d0c7e?q=80&w=400&auto=format&fit=crop", sabores: ["Avena", "Maracuyá"], tamanos: [{ n: "Pequeño", p: 1000 }, { n: "Mediano", p: 1500 }, { n: "Grande", p: 2000 }] },
  { id: "b1", nombre: "Coca-Cola", precio: 0, categoria: "Bebidas", disponible: true, imagen: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=400&auto=format&fit=crop", tamanos: [{ n: "Mini", p: 2500 }, { n: "Personal", p: 3500 }, { n: "Familiar", p: 6500 }] }
];

const ESTADO_LABEL = {
  pendiente:  { emoji: "🟡", texto: "En cola..." },
  preparando: { emoji: "👨‍🍳", texto: "Preparando" },
  entregado:  { emoji: "✅", texto: "¡Listo!" },
};

// HELPERS DE SEGURIDAD
const safeText = (val) => {
  if (!val) return "";
  if (typeof val === 'object') return val.nombre || "Error";
  return String(val);
};

const safeMoney = (val) => {
  const n = Number(val);
  return isNaN(n) ? "0" : n.toLocaleString();
};

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [tabActiva, setTabActiva] = useState("pedidos");
  const [pedidosFB, setPedidosFB] = useState([]);
  const [alertasFB, setAlertasFB] = useState([]);
  const [menuFB, setMenuFB] = useState([]); 
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

  const prevPedidosRef = useRef(0);
  const prevAlertasRef = useRef(0);

  useEffect(() => {
    const q = query(collection(db, "productos"), orderBy("categoria", "asc"));
    return onSnapshot(q, (s) => {
      const data = s.docs.map(d => ({ id: d.id, ...d.data() }));
      setMenuFB(data);
      if (s.empty) productosBase.forEach(p => setDoc(doc(db, "productos", p.id), p));
    });
  }, []);

  useEffect(() => {
    const q = query(collection(db, "pedidos"), orderBy("timestamp", "asc"));
    return onSnapshot(q, (s) => {
      const data = s.docs.map(d => ({ id: d.id, ...d.data() }));
      if (data.length > prevPedidosRef.current && isAdmin) playBeep();
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
    const precioBase = (p.precio && p.precio > 0) ? p.precio : (sel.tamano ? sel.tamano.p : (p.tamanos?.[0]?.p || 0));
    const det = [sel.sabor, sel.tamano?.n, sel.config].filter(Boolean).join(' · ');
    setPedido(prev => [...prev, { idUnico: Date.now(), nombre: safeText(p.nombre), cantidad: cant, subtotal: precioBase * cant, detalle: det }]);
  };

  const procesarPedido = async () => {
    if (!mesa && !direccion.trim()) { setErrorDireccion(true); return; }
    const total = pedido.reduce((acc, i) => acc + i.subtotal, 0);
    await setDoc(doc(db, "pedidos", `ORD-${Date.now()}`), {
      nombre: safeText(nombre), ubicacion: mesa ? `MESA ${mesa}` : direccion.trim(),
      productos: pedido.map(it => ({ ...it, nota: notas[it.idUnico] || "" })),
      total, timestamp: Date.now(),
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      estado: "pendiente", tipo: mesa ? "mesa" : "domicilio"
    });
    setAgradecimiento(true); setPedido([]);
  };

  const actualizarEstado = async (id, estado) => { await updateDoc(doc(db, "pedidos", id), { estado }); };

  const numPendientes = pedidosFB.filter(p => p.estado === 'pendiente').length;

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
        <div style={{ padding: '20px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
          <div className="no-print" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h1 style={{ color: MONO_NARANJA, fontSize: '32px' }}>Panel Admin 🐒</h1>
              <button onClick={() => setIsAdmin(false)} style={{ padding: '10px 20px', borderRadius: '12px', border: 'none', background: '#ddd', fontWeight: 'bold' }}>Salir</button>
            </div>

            {alertasFB.map(a => (
              <div key={a.id} className="alerta-notif" style={{ padding: '20px', borderRadius: '20px', marginBottom: '15px', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '20px', fontWeight: 'bold' }}>MESA {a.mesa} solicita {a.tipo.toUpperCase()}</span>
                <button onClick={() => deleteDoc(doc(db, "alertas", a.id))} style={{ background: 'white', color: MONO_ROJO, border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold' }}>ATENDER</button>
              </div>
            ))}

            <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', overflowX: 'auto' }} className="scroll-hide">
              {["pedidos", "gestion", "mesas", "qrs", "caja"].map(t => (
                <button key={t} onClick={() => setTabActiva(t)} style={{ flex: 1, padding: '15px', borderRadius: '15px', background: tabActiva === t ? MONO_NARANJA : "white", fontWeight: 'bold', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {t.toUpperCase()} {t === 'pedidos' && `(${numPendientes})`}
                </button>
              ))}
            </div>

            {tabActiva === "pedidos" && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
                {pedidosFB.filter(p => p.estado !== "entregado" && p.estado !== "pagado").map(p => (
                  <div key={p.id} className={p.estado === 'pendiente' ? 'pedido-pendiente' : ''} style={{ background: 'white', padding: '25px', borderRadius: '35px', border: p.estado === 'pendiente' ? `4px solid ${MONO_AMARILLO}` : `4px solid ${MONO_AZUL}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px' }}><span style={{ fontSize: '24px', fontWeight: 'bold' }}>{safeText(p.ubicacion)}</span><span>{safeText(p.hora)}</span></div>
                    {p.productos.map((it, i) => (
                      <div key={i} style={{ marginTop: '10px' }}><strong>{it.cantidad}x {safeText(it.nombre)}</strong><br/><small>{safeText(it.detalle)}</small></div>
                    ))}
                    <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                      {p.estado === 'pendiente' && <button onClick={() => actualizarEstado(p.id, 'preparando')} style={{ flex: 1, padding: '15px', background: MONO_AZUL, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>FRITAR</button>}
                      {p.estado === 'preparando' && <button onClick={() => actualizarEstado(p.id, 'entregado')} style={{ flex: 1, padding: '15px', background: MONO_VERDE, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>DESPACHAR</button>}
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
                  if (mesaPed.length === 0) return <div key={n} style={{ background: 'white', padding: '20px', borderRadius: '25px', textAlign: 'center', color: '#ccc' }}>Mesa {n} libre</div>;
                  return (
                    <div key={n} style={{ background: 'white', padding: '25px', borderRadius: '35px', border: `3px solid ${MONO_NARANJA}`, textAlign: 'center' }}>
                      <h3>MESA {n}</h3><div style={{ fontSize: '24px', fontWeight: 'bold' }}>${safeMoney(totalM)}</div>
                      <button onClick={() => { if(window.confirm("¿Pagar?")) mesaPed.forEach(p => actualizarEstado(p.id, 'pagado')); }} style={{ width: '100%', marginTop: '15px', padding: '12px', background: MONO_TEXTO, color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold' }}>COBRAR</button>
                    </div>
                  );
                })}
                {/* ✅ REINTEGRADO: BLOQUE DE DOMICILIOS POR COBRAR */}
                <div style={{ gridColumn: '1/-1', marginTop: '30px' }}>
                  <h3>🛵 Domicilios por Cobrar</h3>
                  <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px' }} className="scroll-hide">
                    {pedidosFB.filter(p => p.tipo === "domicilio" && p.estado !== "pagado").map(p => (
                      <div key={p.id} style={{ minWidth: '250px', background: 'white', padding: '20px', borderRadius: '25px', border: `2px solid ${MONO_AZUL}` }}>
                        <strong>{safeText(p.nombre)}</strong><br/><small>{safeText(p.ubicacion)}</small><br/>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', margin: '10px 0' }}>${safeMoney(p.total)}</div>
                        <button onClick={() => actualizarEstado(p.id, 'pagado')} style={{ width: '100%', padding: '10px', background: MONO_VERDE, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>RECIBÍ PAGO</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tabActiva === "caja" && (
              <div style={{ background: 'white', padding: '40px', borderRadius: '40px' }}>
                <h2>Cuadre de Turno 📊</h2>
                {/* ✅ REINTEGRADO: DESGLOSE DE CAJA */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                  <div style={{ padding: '25px', background: '#fff7ed', borderRadius: '25px', textAlign: 'center', border: `2px solid ${MONO_NARANJA}` }}>
                    <small>TOTAL VENTAS</small><div style={{ fontSize: '32px', fontWeight: 'bold' }}>${safeMoney(tVendido)}</div>
                  </div>
                  <div style={{ padding: '25px', background: '#f0fdf4', borderRadius: '25px', textAlign: 'center', border: `2px solid ${MONO_VERDE}` }}>
                    <small>VENTAS LOCAL</small><div style={{ fontSize: '24px', fontWeight: 'bold' }}>${safeMoney(vLocal)}</div>
                  </div>
                  <div style={{ padding: '25px', background: '#eff6ff', borderRadius: '25px', textAlign: 'center', border: `2px solid ${MONO_AZUL}` }}>
                    <small>VENTAS DOMICILIO</small><div style={{ fontSize: '24px', fontWeight: 'bold' }}>${safeMoney(vDomi)}</div>
                  </div>
                </div>
                <button onClick={() => { if(window.confirm("¿Limpiar Caja?")) pagados.forEach(p => deleteDoc(doc(db, "pedidos", p.id))); }} style={{ width: '100%', padding: '20px', background: MONO_TEXTO, color: 'white', border: 'none', borderRadius: '15px', fontWeight: 'bold' }}>REINICIAR DÍA</button>
              </div>
            )}
            
            {tabActiva === "gestion" && (
              <div style={{ background: 'white', padding: '30px', borderRadius: '30px' }}>
                <h2>Inventario 📋</h2>
                {menuFB.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid #eee' }}>
                    <span>{safeText(p.nombre)}</span>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input type="number" defaultValue={p.precio} onBlur={(e) => actualizarPrecio(p.id, e.target.value)} style={{ width: '80px', padding: '5px' }} />
                      <button onClick={() => toggleDisponibilidad(p.id, p.disponible)} style={{ padding: '5px 15px', borderRadius: '20px', border: 'none', background: p.disponible ? MONO_VERDE : MONO_ROJO, color: 'white', fontWeight: 'bold' }}>{p.disponible ? "OK" : "AGOTADO"}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tabActiva === "qrs" && (
              <div style={{ background: 'white', padding: '40px', borderRadius: '40px' }}>
                <h2>Generador QR 📌</h2>
                <input type="text" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '20px' }} />
                <button onClick={() => window.print()} style={{ background: MONO_NARANJA, color: 'white', border: 'none', padding: '15px 30px', borderRadius: '12px' }}>🖨️ IMPRIMIR</button>
                <div className="qr-grid-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '30px', marginTop: '30px' }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <div key={n} style={{ textAlign: 'center', border: '1px solid #eee', padding: '20px' }}>
                      <strong>MESA {n}</strong><br/><img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(baseUrl + "?mesa=" + n)}`} style={{ width: '150px' }} />
                    </div>
                  ))}
                </div>
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
      <div style={{ fontFamily: 'sans-serif', backgroundColor: '#fffcf5', minHeight: '100vh', paddingBottom: '100px' }}>
        <header style={{ height: '200px', background: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(https://images.unsplash.com/photo-1541592106381-b31e9221c004?q=80&w=1000&auto=format&fit=crop)`, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
          <h1 onClick={() => setMostrarLogin(true)} style={{ fontSize: '2.5rem', cursor: 'pointer' }}>Fritos El Mono</h1>
          <p>Carepa, Antioquia 🐒</p>
        </header>

        <div className="scroll-hide" style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '20px' }}>
          {["Fritos", "Desayunos", "Arroces", "Bebidas"].map(cat => (
            <button key={cat} onClick={() => setCategoriaActiva(cat)} style={{ padding: '12px 25px', borderRadius: '25px', border: 'none', background: categoriaActiva === cat ? MONO_NARANJA : 'white', fontWeight: 'bold' }}>{cat}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px', padding: '0 15px' }}>
          {menuFB.filter(p => p.categoria === categoriaActiva).map(p => {
            const sel = selecciones[p.id] || {};
            const cant = cantidades[p.id] || 1;
            const pActual = (p.precio && p.precio > 0) ? p.precio : (sel.tamano ? sel.tamano.p : (p.tamanos?.[0]?.p || 0));
            return (
              <div key={p.id} className="card-hover" style={{ background: 'white', borderRadius: '25px', overflow: 'hidden', position: 'relative', opacity: p.disponible ? 1 : 0.5 }}>
                {!p.disponible && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255,255,255,0.5)', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', color: 'red' }}>AGOTADO</div>}
                <div style={{ height: '120px', background: `url(${p.imagen}) center/cover` }} />
                <div style={{ padding: '10px', textAlign: 'center' }}>
                  <h4 style={{ margin: '5px 0' }}>{safeText(p.nombre)}</h4>
                  <div style={{ color: MONO_NARANJA, fontWeight: 'bold' }}>${safeMoney(pActual)}</div>
                  {p.sabores && <select onChange={(e) => setSelecciones({...selecciones, [p.id]: {...sel, sabor: e.target.value}})} style={{ width: '100%', marginTop: '5px' }}><option>Sabor...</option>{p.sabores.map(s => <option key={s} value={s}>{s}</option>)}</select>}
                  {p.tamanos && <select onChange={(e) => setSelecciones({...selecciones, [p.id]: {...sel, tamano: p.tamanos.find(t => t.n === e.target.value)}})} style={{ width: '100%', marginTop: '5px' }}><option>Tamaño...</option>{p.tamanos.map(t => <option key={t.n} value={t.n}>{t.n} (${safeMoney(t.p)})</option>)}</select>}
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', margin: '10px 0' }}>
                    <button onClick={() => setCantidades({...cantidades, [p.id]: Math.max(1, cant-1)})}>-</button>
                    <strong>{cant}</strong>
                    <button onClick={() => setCantidades({...cantidades, [p.id]: cant+1})}>+</button>
                  </div>
                  <button onClick={() => agregarAlCarrito(p)} disabled={!p.disponible} style={{ width: '100%', padding: '10px', background: MONO_NARANJA, color: 'white', border: 'none', borderRadius: '15px', fontWeight: 'bold' }}>Añadir 🛒</button>
                </div>
              </div>
            );
          })}
        </div>

        {mesa && (
          <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px', width: '90%', zIndex: 100 }}>
            <button onClick={() => setVerPrecuenta(true)} style={{ flex: 1, padding: '15px', background: MONO_TEXTO, color: 'white', border: 'none', borderRadius: '15px', fontWeight: 'bold' }}>VER CUENTA</button>
            <button onClick={() => { if(window.confirm("¿Llamar mesero?")) setAlertaEnviada('mesero'); }} style={{ flex: 1, padding: '15px', background: MONO_AZUL, color: 'white', border: 'none', borderRadius: '15px', fontWeight: 'bold' }}>MESERO 🙋</button>
          </div>
        )}

        {pedido.length > 0 && (
          <div style={{ margin: '30px 15px', padding: '20px', background: 'white', borderRadius: '25px', border: `3px solid ${MONO_NARANJA}` }}>
            <h3>🛒 Mi Carrito</h3>
            {pedido.map(it => (
              <div key={it.idUnico} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                <span>{it.cantidad}x {it.nombre}</span><span>${safeMoney(it.subtotal)}</span>
              </div>
            ))}
            {!mesa && <input type="text" placeholder="Dirección de envío..." value={direccion} onChange={e => setDireccion(e.target.value)} style={{ width: '100%', padding: '15px', marginTop: '15px', borderRadius: '15px', border: errorDireccion ? '2px solid red' : '1px solid #ddd' }} />}
            <button onClick={procesarPedido} style={{ width: '100%', padding: '20px', marginTop: '20px', background: MONO_NARANJA, color: 'white', border: 'none', borderRadius: '15px', fontWeight: 'bold', fontSize: '18px' }}>ENVIAR PEDIDO 👨‍🍳</button>
          </div>
        )}

        {agradecimiento && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: MONO_NARANJA, zDisplay: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
             <div style={{ textAlign: 'center', color: 'white', padding: '40px' }}>
                <h1>¡Pedido Recibido!</h1><p>Estamos trabajando en ello.</p>
                <button onClick={() => setAgradecimiento(false)} style={{ padding: '15px 40px', borderRadius: '20px', border: 'none', background: 'white', color: MONO_NARANJA, fontWeight: 'bold' }}>VOLVER</button>
             </div>
          </div>
        )}

        {mostrarLogin && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ background: 'white', padding: '30px', borderRadius: '25px', textAlign: 'center' }}>
              <h3>Acceso Admin</h3>
              <input type="password" onChange={e => setPinInput(e.target.value)} style={{ padding: '10px', fontSize: '20px', textAlign: 'center' }} />
              <button onClick={() => { if(pinInput === "mono2026") { setIsAdmin(true); setMostrarLogin(false); } }} style={{ display: 'block', width: '100%', marginTop: '10px', padding: '10px', background: MONO_NARANJA, color: 'white', border: 'none' }}>ENTRAR</button>
              <button onClick={() => setMostrarLogin(false)} style={{ background: 'none', border: 'none', marginTop: '10px', color: '#999' }}>Cerrar</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}