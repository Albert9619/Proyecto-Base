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

// HELPERS DE SEGURIDAD
const safeText = (val) => {
  if (val === null || val === undefined) return "";
  if (typeof val === 'object') return val.nombre || "Error de dato";
  return String(val);
};

const safeMoney = (val) => {
  const n = Number(val);
  return isNaN(n) ? "0" : n.toLocaleString();
};

export default function App() {
  // --- 1. ESTADOS (TODOS LOS HOOKS AL PRINCIPIO) ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [tabActiva, setTabActiva] = useState("pedidos");
  const [pedidosFB, setPedidosFB] = useState([]);
  const [alertasFB, setAlertasFB] = useState([]);
  const [menuFB, setMenuFB] = useState([]); 

  // Persistencia del Carrito
  const [pedido, setPedido] = useState(() => {
    const guardado = localStorage.getItem('pedido_el_mono');
    return guardado ? JSON.parse(guardado) : [];
  });

  const [notas, setNotas] = useState(() => {
    const guardado = localStorage.getItem('notas_el_mono');
    return guardado ? JSON.parse(guardado) : {};
  });

  // Estados de Interfaz y Cliente
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

  // NUEVOS ESTADOS CORREGIDOS (Para que no den error en el return)
  const [notificacion, setNotificacion] = useState(null);

  // --- 2. REFERENCIAS (REFS) ---
  const ticketRef = useRef(null);
  const prevPedidosRef = useRef(0);
  const prevAlertasRef = useRef(0);

  // --- 3. LÓGICA DE APOYO (VARIABLES DERIVADAS) ---
  const hoy = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"][new Date().getDay()];
  const tipoArrozHoy = ["lunes", "miércoles", "viernes"].includes(hoy) ? "Pollo" : "Cerdo";

  const numPendientes = pedidosFB.filter(p => p.estado === 'pendiente').length;
  const workload = numPendientes <= 3 ? { t: "Cocina Despejada", c: MONO_VERDE, m: "5-10 min" } :
                   numPendientes <= 8 ? { t: "Cocina con Flujo", c: MONO_AMARILLO, m: "15-20 min" } :
                   { t: "Cocina a Tope", c: MONO_ROJO, m: "25-30 min" };

  // --- 4. FUNCIONES DE ACCIÓN ---

  // Desplazamiento suave al ticket
  const irAlTicket = () => {
    ticketRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

const agregarAlCarrito = (p) => {
  const sel = selecciones[p.id] || {};
  const cant = cantidades[p.id] || 1;
  const precioBase = (p.precio && p.precio > 0) ? p.precio : (sel.tamano ? sel.tamano.p : (p.tamanos?.[0]?.p || 0));
  const det = [sel.sabor, sel.tamano?.n, sel.config].filter(Boolean).join(' · ');
  
  setPedido(prev => [...prev, { 
    idUnico: Date.now(), 
    nombre: safeText(p.nombre), 
    cantidad: cant, 
    subtotal: precioBase * cant, 
    detalle: det 
  }]);

  // Notificación visual para el cliente
  setNotificacion(`¡${cant}x ${safeText(p.nombre)} añadido!`);
  setTimeout(() => setNotificacion(null), 2500);
};

 

  const vaciarCarrito = () => {
    if (window.confirm("¿Quieres quitar todos los productos del carrito?")) {
      setPedido([]);
      setNotas({});
      localStorage.removeItem('pedido_el_mono');
      localStorage.removeItem('notas_el_mono');
    }const agrega
  };

  const toggleDisponibilidad = async (id, estadoActual) => {
    await updateDoc(doc(db, "productos", id), { disponible: !estadoActual });
  };

  const actualizarPrecio = async (id, nuevoPrecio) => {
    const p = parseInt(nuevoPrecio);
    if (!isNaN(p)) await updateDoc(doc(db, "productos", id), { precio: p });
  };

  // --- 5. EFECTOS (SIDE EFFECTS) ---

  // Guardar en localStorage automáticamente al cambiar el pedido o notas
  useEffect(() => {
    localStorage.setItem('pedido_el_mono', JSON.stringify(pedido));
    localStorage.setItem('notas_el_mono', JSON.stringify(notas));
  }, [pedido, notas]);

  // (Siguen aquí tus otros useEffects de Firebase...)

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

  useEffect(() => {
    localStorage.setItem('pedido_el_mono', JSON.stringify(pedido));
    localStorage.setItem('notas_el_mono', JSON.stringify(notas));
}, [pedido, notas]);


  // Para eliminar un solo producto
const eliminarDelCarrito = (idUnico) => {
  setPedido(prev => prev.filter(it => it.idUnico !== idUnico));
  // También eliminamos la nota asociada para no dejar basura en el estado
  setNotas(prev => {
    const n = { ...prev };
    delete n[idUnico];
    return n;
  });
};



const agrega
  const procesarPedido = async () => {
  if (!mesa && !direccion.trim()) { 
    setErrorDireccion(true); 
    return; 
  }

  // 1. Añade esto con tus otros hooks
const ticketRef = useRef(null);
const [notificacion, setNotificacion] = useState(null);

// 2. Función para hacer scroll suave hasta el ticket
const irAlTicket = () => {
  ticketRef.current?.scrollIntoView({ behavior: 'smooth' });
};
  
  setErrorDireccion(false);
  const total = pedido.reduce((acc, i) => acc + i.subtotal, 0);
  const productosConNotas = pedido.map(it => ({ ...it, nota: notas[it.idUnico] || "" }));

  try {
    // 1. Enviamos a Firebase
    await setDoc(doc(db, "pedidos", `ORD-${Date.now()}`), {
      nombre: safeText(nombre), 
      ubicacion: mesa ? `MESA ${mesa}` : direccion.trim(),
      productos: productosConNotas, 
      total, 
      timestamp: Date.now(),
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      estado: "pendiente", 
      tipo: mesa ? "mesa" : "domicilio"
    });

    // 2. NUEVO: Limpiamos la persistencia del navegador
    localStorage.removeItem('pedido_el_mono');
    localStorage.removeItem('notas_el_mono');

    // 3. Limpiamos el estado de la App
    setAgradecimiento(true); 
    setPedido([]); 
    setNotas({});

  } catch (error) {
    console.error("Error al enviar el pedido:", error);
    alert("Hubo un error al procesar tu pedido. Intenta de nuevo.");
  }
};
  const actualizarEstado = async (id, estado) => { await updateDoc(doc(db, "pedidos", id), { estado }); };
  const enviarAlerta = async (tipo) => {
    if (!mesa) return;
    await setDoc(doc(db, "alertas", `ALERTA-${mesa}-${Date.now()}`), { mesa, tipo, timestamp: Date.now(), hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    setAlertaEnviada(tipo); setTimeout(() => setAlertaEnviada(null), 4000);
  };

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
              <h1 style={{ color: MONO_NARANJA, fontSize: '32px', margin: 0 }}>Panel Admin 🐒</h1>
              <div style={{ background: MONO_TEXTO, color: 'white', padding: '12px 25px', borderRadius: '20px', fontSize: '20px' }}>Total Hoy: <strong>${safeMoney(tVendido)}</strong></div>
              <button onClick={() => setIsAdmin(false)} style={{ padding: '12px 20px', borderRadius: '12px', border: 'none', background: '#ddd', fontWeight: 'bold' }}>Salir</button>
            </div>

            {alertasFB.map(a => (
              <div key={a.id} className="alerta-notif" style={{ padding: '20px', borderRadius: '20px', marginBottom: '15px', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '22px', fontWeight: '900' }}>{a.tipo === 'mesero' ? '🙋 LLAMADO' : '💳 CUENTA'} - MESA {a.mesa}</span>
                <button onClick={() => deleteDoc(doc(db, "alertas", a.id))} style={{ background: 'white', color: MONO_ROJO, border: 'none', padding: '12px 25px', borderRadius: '12px', fontWeight: 'bold' }}>ATENDER</button>
              </div>
            ))}

            <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', overflowX: 'auto' }} className="scroll-hide">
              <button onClick={() => setTabActiva("pedidos")} style={{ flex: 1, padding: '20px', borderRadius: '20px', background: tabActiva === "pedidos" ? MONO_NARANJA : "white", fontSize: '18px', fontWeight: 'bold', border: numPendientes > 0 ? `4px solid ${MONO_ROJO}` : 'none' }}>COCINA ({numPendientes})</button>
              <button onClick={() => setTabActiva("gestion")} style={{ flex: 1, padding: '20px', borderRadius: '20px', background: tabActiva === "gestion" ? MONO_AZUL : "white", color: tabActiva === "gestion" ? "white" : "black", fontSize: '18px', fontWeight: 'bold', border: 'none' }}>GESTIÓN</button>
              <button onClick={() => setTabActiva("mesas")} style={{ flex: 1, padding: '20px', borderRadius: '20px', background: tabActiva === "mesas" ? MONO_NARANJA : "white", fontSize: '18px', fontWeight: 'bold', border: 'none' }}>COBROS</button>
              <button onClick={() => setTabActiva("qrs")} style={{ flex: 1, padding: '20px', borderRadius: '20px', background: tabActiva === "qrs" ? MONO_AZUL : "white", color: tabActiva === "qrs" ? "white" : "black", fontSize: '18px', fontWeight: 'bold', border: 'none' }}>QRs</button>
              <button onClick={() => setTabActiva("caja")} style={{ flex: 1, padding: '20px', borderRadius: '20px', background: tabActiva === "caja" ? "#000" : "white", color: tabActiva === "caja" ? "white" : "black", fontSize: '18px', fontWeight: 'bold', border: 'none' }}>CAJA</button>
            </div>

            {tabActiva === "pedidos" && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '25px' }}>
                {pedidosFB.filter(p => p.estado !== "entregado" && p.estado !== "pagado").map(p => (
                  <div key={p.id} className={p.estado === 'pendiente' ? 'pedido-pendiente' : ''} style={{ background: 'white', padding: '25px', borderRadius: '35px', border: p.estado === 'pendiente' ? `4px solid ${MONO_AMARILLO}` : `4px solid ${MONO_AZUL}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}><span style={{ fontSize: '26px', fontWeight: '900' }}>{safeText(p.ubicacion)}</span><span style={{ fontSize: '18px' }}>{safeText(p.hora)}</span></div>
                    {p.productos.map((it, i) => (
                      <div key={i} style={{ marginBottom: '12px' }}><div style={{ fontSize: '22px', fontWeight: '700' }}>{it.cantidad}x {safeText(it.nombre)}</div>{it.nota && <div style={{ background: '#fee2e2', color: MONO_ROJO, padding: '8px', borderRadius: '10px', marginTop: '5px', fontWeight: 'bold' }}>📝 {safeText(it.nota)}</div>}</div>
                    ))}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                      {p.estado === 'pendiente' && <button onClick={() => actualizarEstado(p.id, 'preparando')} style={{ flex: 1, background: MONO_AZUL, color: 'white', border: 'none', padding: '15px', borderRadius: '15px', fontWeight: '900' }}>FRITAR 👨‍🍳</button>}
                      {p.estado === 'preparando' && <button onClick={() => actualizarEstado(p.id, 'entregado')} style={{ flex: 1, background: MONO_VERDE, color: 'white', border: 'none', padding: '15px', borderRadius: '15px', fontWeight: '900' }}>DESPACHAR ✅</button>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tabActiva === "gestion" && (
              <div style={{ background: 'white', padding: '30px', borderRadius: '40px' }}>
                <h2 style={{ color: MONO_TEXTO }}>Inventario y Precios 📋</h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead><tr style={{ borderBottom: '2px solid #eee' }}><th style={{ padding: '15px' }}>Producto</th><th style={{ padding: '15px' }}>Precio ($)</th><th style={{ padding: '15px' }}>Estado</th></tr></thead>
                  <tbody>
                    {menuFB.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '15px', fontWeight: 'bold' }}>{safeText(p.nombre)}</td>
                        <td style={{ padding: '15px' }}><input type="number" defaultValue={p.precio} onBlur={(e) => actualizarPrecio(p.id, e.target.value)} style={{ width: '100px', padding: '8px', borderRadius: '10px', border: '1px solid #ddd' }} /></td>
                        <td style={{ padding: '15px' }}><button onClick={() => toggleDisponibilidad(p.id, p.disponible)} style={{ padding: '10px 20px', borderRadius: '30px', border: 'none', background: p.disponible ? MONO_VERDE : MONO_ROJO, color: 'white', fontWeight: 'bold' }}>{p.disponible ? "HABILITADO" : "AGOTADO"}</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                      <h3 style={{ margin: 0 }}>MESA {n}</h3><div style={{ fontSize: '28px', fontWeight: '900', margin: '15px 0' }}>${safeMoney(totalM)}</div>
                      <button onClick={() => { if (window.confirm("¿Cobrar?")) mesaPed.forEach(p => actualizarEstado(p.id, 'pagado')); }} style={{ width: '100%', padding: '15px', background: isReady ? MONO_ROJO : MONO_TEXTO, color: 'white', border: 'none', borderRadius: '15px', fontWeight: 'bold' }}>PAGAR CUENTA 💸</button>
                    </div>
                  );
                })}
                {/* SECCIÓN DE DOMICILIOS POR COBRAR */}
                <div style={{ gridColumn: '1/-1', marginTop: '30px' }}>
                  <h3 style={{ paddingLeft: '10px' }}>🛵 Domicilios por Cobrar</h3>
                  <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px' }} className="scroll-hide">
                    {pedidosFB.filter(p => p.tipo === "domicilio" && p.estado !== "pagado").map(p => (
                      <div key={p.id} style={{ minWidth: '250px', background: 'white', padding: '20px', borderRadius: '25px', border: `2px solid ${MONO_AZUL}` }}>
                        <strong>{safeText(p.nombre)}</strong><br/><small>{safeText(p.ubicacion)}</small><br/>
                        <div style={{ fontSize: '22px', fontWeight: 'bold', margin: '10px 0' }}>${safeMoney(p.total)}</div>
                        <button onClick={() => actualizarEstado(p.id, 'pagado')} style={{ width: '100%', padding: '12px', background: MONO_VERDE, color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold' }}>RECIBÍ PAGO ✅</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tabActiva === "caja" && (
              <div style={{ background: 'white', padding: '40px', borderRadius: '40px' }}>
                <h2 style={{ color: MONO_NARANJA }}>Cuadre de Turno 📊</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                  <div style={{ padding: '30px', background: '#fff7ed', borderRadius: '25px', border: `2px solid ${MONO_NARANJA}`, textAlign: 'center' }}>
                    <small style={{ color: '#666' }}>RECAUDO TOTAL</small>
                    <div style={{ fontSize: '42px', fontWeight: '950' }}>${safeMoney(tVendido)}</div>
                  </div>
                  <div style={{ padding: '25px', background: '#f0fdf4', borderRadius: '25px', border: `2px solid ${MONO_VERDE}`, textAlign: 'center' }}>
                    <small style={{ color: '#666' }}>VENTAS LOCAL</small>
                    <div style={{ fontSize: '28px', fontWeight: 'bold' }}>${safeMoney(vLocal)}</div>
                  </div>
                  <div style={{ padding: '25px', background: '#eff6ff', borderRadius: '25px', border: `2px solid ${MONO_AZUL}`, textAlign: 'center' }}>
                    <small style={{ color: '#666' }}>VENTAS DOMICILIO</small>
                    <div style={{ fontSize: '28px', fontWeight: 'bold' }}>${safeMoney(vDomi)}</div>
                  </div>
                </div>
                <button onClick={() => { if (window.confirm("¿Reiniciar Turno?")) pagados.forEach(p => deleteDoc(doc(db, "pedidos", p.id))); }} style={{ width: '100%', padding: '25px', background: MONO_TEXTO, color: 'white', borderRadius: '20px', fontWeight: 'bold', border: 'none', fontSize: '18px' }}>FINALIZAR DÍA Y LIMPIAR CAJA 🏁</button>
              </div>
            )}

            {tabActiva === "qrs" && (
              <div style={{ background: 'white', padding: '40px', borderRadius: '40px' }}>
                <h2>Generador de Códigos QR 📌</h2>
                <input type="text" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '15px', border: '2px solid #ddd', marginBottom: '20px' }} />
                <button onClick={() => window.print()} style={{ background: MONO_NARANJA, color: 'white', border: 'none', padding: '15px 30px', borderRadius: '15px', fontWeight: 'bold' }}>🖨️ Imprimir Códigos</button>
                <div className="qr-grid-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '30px', marginTop: '30px' }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <div key={n} style={{ textAlign: 'center', padding: '20px', border: '1px solid #eee', borderRadius: '25px' }}>
                      <strong>MESA {n}</strong><br/>
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(baseUrl.replace(/\/$/, "") + "?mesa=" + n)}`} style={{ width: '180px', marginTop: '15px' }} />
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
      <div style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#fffcf5', minHeight: '100vh', paddingBottom: '180px' }}>
        <header style={{ position: 'relative', height: '220px', background: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(https://images.unsplash.com/photo-1541592106381-b31e9221c004?q=80&w=1000&auto=format&fit=crop)`, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white', borderRadius: '0 0 50px 50px' }}>
          <h1 onClick={() => setMostrarLogin(true)} style={{ fontSize: '2.8rem', margin: 0, fontWeight: '900', cursor: 'pointer' }}>Fritos El Mono</h1>
          <p>El sabor más crocante de Carepa 🐒</p>
          <div style={{ position: 'absolute', bottom: '-25px', background: 'white', padding: '12px 25px', borderRadius: '50px', boxShadow: '0 5px 20px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: workload.c }}></div>
            <span style={{ color: MONO_TEXTO, fontWeight: 'bold' }}>{safeText(workload.t)} · {safeText(workload.m)} aprox.</span>
          </div>
        </header>

        {notificacion && (
  <div style={{
    position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
    background: MONO_TEXTO, color: 'white', padding: '12px 25px', borderRadius: '50px',
    zIndex: 9999, fontWeight: 'bold', boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
    animation: 'mono-pulse 0.5s ease-out'
  }}>
    ✅ {notificacion}
  </div>
)}

        <div style={{ textAlign: 'center', marginTop: '50px' }}><div style={{ background: '#fff7ed', padding: '8px 20px', borderRadius: '20px', fontWeight: 'bold', color: MONO_NARANJA }}>Arroz Hoy: {safeText(tipoArrozHoy)}</div></div>

        <div className="scroll-hide" style={{ display: 'flex', gap: '12px', overflowX: 'auto', padding: '20px 25px' }}>
          {["Fritos", "Desayunos", "Arroces", "Bebidas"].map(cat => (
            <button key={cat} onClick={() => setCategoriaActiva(cat)} style={{ padding: '12px 28px', borderRadius: '30px', border: 'none', background: categoriaActiva === cat ? MONO_NARANJA : 'white', color: categoriaActiva === cat ? 'white' : MONO_TEXTO, fontWeight: 'bold' }}>{cat}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))', gap: '20px', padding: '0 20px' }}>
          {(menuFB.length > 0 ? menuFB : productosBase).filter(p => p.categoria === categoriaActiva).map(p => {
            const sel = selecciones[p.id] || {};
            const cant = cantidades[p.id] || 1;
            const pActual = (p.precio && p.precio > 0) ? p.precio : (sel.tamano ? sel.tamano.p : (p.tamanos?.[0]?.p || 0));
            return (
              <div key={p.id} className="card-hover" style={{ background: 'white', borderRadius: '35px', overflow: 'hidden', position: 'relative', opacity: p.disponible ? 1 : 0.5 }}>
                {!p.disponible && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255,255,255,0.4)', zIndex: 20, display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', color: MONO_ROJO }}>AGOTADO ❌</div>}
                <div style={{ height: '140px', background: `url(${p.imagen}) center/cover` }} />
                <div style={{ padding: '15px', textAlign: 'center' }}>
                  <h3 style={{ margin: '0 0 5px', fontSize: '15px', height: '35px' }}>{safeText(p.nombre)}</h3>
                  <div style={{ color: MONO_NARANJA, fontWeight: '900', fontSize: '18px' }}>${safeMoney(pActual)}</div>
                  
                  {p.sabores && (
                    <select disabled={!p.disponible} onChange={(e) => setSelecciones({...selecciones, [p.id]: {...sel, sabor: e.target.value}})} style={{ width: '100%', padding: '8px', borderRadius: '12px', border: '1px solid #eee', marginBottom: '10px', fontSize: '12px' }}>
                      <option>Sabor...</option>{p.sabores.map(s => <option key={s} value={s}>{safeText(s)}</option>)}
                    </select>
                  )}
                  {p.tamanos && (
                    <select disabled={!p.disponible} onChange={(e) => setSelecciones({...selecciones, [p.id]: {...sel, tamano: p.tamanos.find(t => t.n === e.target.value)}})} style={{ width: '100%', padding: '8px', borderRadius: '12px', border: '1px solid #eee', marginBottom: '10px', fontSize: '12px' }}>
                      <option>Tamaño...</option>{p.tamanos.map(t => <option key={t.n} value={t.n}>{safeText(t.n)} (${safeMoney(t.p)})</option>)}
                    </select>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', margin: '10px 0' }}>
                    <button disabled={!p.disponible} onClick={() => setCantidades({ ...cantidades, [p.id]: Math.max(1, cant - 1) })}>-</button>
                    <strong>{cant}</strong>
                    <button disabled={!p.disponible} onClick={() => setCantidades({ ...cantidades, [p.id]: cant + 1 })}>+</button>
                  </div>
                  <button disabled={!p.disponible} onClick={() => agregarAlCarrito(p)} style={{ width: '100%', padding: '12px', background: p.disponible ? MONO_NARANJA : '#ccc', color: 'white', borderRadius: '18px', border: 'none', fontWeight: 'bold' }}>Añadir 🛒</button>
                </div>
              </div>
            );
          })}
        </div>

        {mesa && (
          <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px', zIndex: 5000, width: '90%', maxWidth: '450px' }}>
            <button onClick={() => enviarAlerta('mesero')} style={{ flex: 1, padding: '18px', borderRadius: '25px', background: MONO_AZUL, color: 'white', fontWeight: 'bold', border: 'none' }}>🙋 Llamar Mesero</button>
            <button onClick={() => enviarAlerta('cuenta')} style={{ flex: 1, padding: '18px', borderRadius: '25px', background: MONO_VERDE, color: 'white', fontWeight: 'bold', border: 'none' }}>💳 Pedir Cuenta</button>
          </div>
        )}

       {/* 1. NOTIFICACIÓN TOAST (Aparece arriba) */}
{notificacion && (
  <div style={{
    position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
    background: MONO_TEXTO, color: 'white', padding: '12px 25px', borderRadius: '50px',
    zIndex: 30000, fontWeight: 'bold', boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
    animation: 'mono-pulse 0.5s ease-out'
  }}>
    ✅ {notificacion}
  </div>
)}

{/* 2. BOTÓN FLOTANTE (Acceso rápido al ticket) */}
{pedido.length > 0 && (
  <button 
    onClick={irAlTicket}
    style={{
      position: 'fixed', bottom: mesa ? '100px' : '30px', right: '20px',
      background: MONO_NARANJA, color: 'white', width: '65px', height: '65px',
      borderRadius: '50%', border: 'none', fontSize: '28px', cursor: 'pointer',
      boxShadow: '0 5px 20px rgba(249,115,22,0.4)', zIndex: 4000,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}
  >
    🛒
    <span style={{
      position: 'absolute', top: '0', right: '0', background: 'white',
      color: MONO_NARANJA, width: '24px', height: '24px', borderRadius: '50%',
      fontSize: '14px', fontWeight: 'bold', display: 'flex', 
      justifyContent: 'center', alignItems: 'center', border: `2px solid ${MONO_NARANJA}`
    }}>
      {pedido.length}
    </span>
  </button>
)}

{/* 3. EL TICKET (Tu código con la Ref añadida) */}
{pedido.length > 0 && (
  <div ref={ticketRef} style={{ maxWidth: '600px', margin: '40px auto', background: 'white', padding: '30px', borderRadius: '40px', border: `5px solid ${MONO_NARANJA}`, boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
    
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
      <h2 style={{ margin: 0 }}>🛒 Tu Pedido</h2>
      <button 
        onClick={vaciarCarrito}
        style={{ background: '#fee2e2', color: MONO_ROJO, border: 'none', padding: '8px 15px', borderRadius: '12px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
      >
        Vaciar Todo
      </button>
    </div>

    {pedido.map(it => (
      <div key={it.idUnico} style={{ padding: '15px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold' }}>{it.cantidad}x {safeText(it.nombre)}</div>
          {it.detalle && <small style={{ color: '#666' }}>{it.detalle}</small>}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontWeight: '900', color: MONO_TEXTO }}>${safeMoney(it.subtotal)}</span>
          <button 
            onClick={() => eliminarDelCarrito(it.idUnico)}
            style={{ background: '#fee2e2', border: 'none', color: MONO_ROJO, padding: '10px', borderRadius: '12px', cursor: 'pointer', fontSize: '18px' }}
            title="Eliminar"
          >
            🗑️
          </button>
        </div>
      </div>
    ))}

    <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '2px solid #eee', display: 'flex', justifyContent: 'space-between', fontSize: '22px', fontWeight: '900' }}>
      <span>Total:</span>
      <span>${safeMoney(pedido.reduce((acc, i) => acc + i.subtotal, 0))}</span>
    </div>

    {!mesa && (
      <input 
        type="text" 
        placeholder="📍 Dirección de entrega..." 
        value={direccion} 
        onChange={(e) => setDireccion(e.target.value)} 
        style={{ width: '100%', padding: '15px', marginTop: '15px', borderRadius: '15px', border: errorDireccion ? `2px solid ${MONO_ROJO}` : '1px solid #eee', boxSizing: 'border-box' }} 
      />
    )}

    <button 
      onClick={procesarPedido} 
      style={{ width: '100%', marginTop: '20px', padding: '20px', background: MONO_NARANJA, color: 'white', borderRadius: '25px', border: 'none', fontWeight: '900', fontSize: '18px', cursor: 'pointer' }}
    >
      CONFIRMAR PEDIDO 👨‍🍳
    </button>
  </div>
)}
        {mostrarLogin && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 20000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ background: 'white', padding: '40px', borderRadius: '35px', textAlign: 'center' }}>
              <input type="password" placeholder="PIN" onChange={e => setPinInput(e.target.value)} style={{ padding: '18px', borderRadius: '15px' }} />
              <button onClick={() => { if (pinInput === "mono2026") { setIsAdmin(true); setMostrarLogin(false); } }} style={{ display: 'block', width: '100%', marginTop: '10px', padding: '18px', background: MONO_NARANJA, color: 'white', border: 'none', borderRadius: '15px' }}>Entrar</button>
              <button onClick={() => setMostrarLogin(false)} style={{ background: 'none', border: 'none', marginTop: '10px', color: '#999' }}>Cerrar</button>
            </div>
          </div>
        )}

        {agradecimiento && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: MONO_NARANJA, zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
            <div style={{ textAlign: 'center' }}><h1>¡Listo!</h1><p>Tu pedido está en cocina.</p><button onClick={() => setAgradecimiento(false)} style={{ marginTop: '20px', padding: '15px 40px', borderRadius: '30px', border: 'none', background: 'white', color: MONO_NARANJA, fontWeight: 'bold' }}>Cerrar</button></div>
          </div>
        )}
      </div>
    </>
  );
}