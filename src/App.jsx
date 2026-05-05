import React, { useState, useEffect, useRef } from 'react';
import { db } from './firebaseConfig';
import {
  collection, onSnapshot, doc, setDoc, deleteDoc,
  query, orderBy, updateDoc
} from "firebase/firestore";

// ─────────────────────────────────────────────
// PALETA DE COLORES
// ─────────────────────────────────────────────
const C = {
  naranja:   "#f97316",
  naranjaOsc:"#ea6c0a",
  verde:     "#16a34a",
  azul:      "#3b82f6",
  rojo:      "#ef4444",
  amarillo:  "#fbbf24",
  texto:     "#1e293b",
  textoSub:  "#64748b",
  fondo:     "#fffcf5",
  blanco:    "#ffffff",
};

// ─────────────────────────────────────────────
// AUDIO (beep discreto en admin)
// ─────────────────────────────────────────────
let beepAudio = null;
const playBeep = () => {
  try {
    if (!beepAudio) {
      beepAudio = new Audio(
        "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ9vT19vT19vT19vT19vT19v"
      );
    }
    beepAudio.play().catch(() => {});
  } catch (_) {}
};

// ─────────────────────────────────────────────
// CSS GLOBAL
// ─────────────────────────────────────────────
const globalCSS = `
  * { box-sizing: border-box; }

  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');

  body { font-family: 'Plus Jakarta Sans', sans-serif; }

  @keyframes pulse-amarillo {
    0%,100% { box-shadow: 0 5px 15px rgba(251,191,36,.2); transform: scale(1); }
    50%      { box-shadow: 0 5px 25px rgba(251,191,36,.5); transform: scale(1.02); }
  }
  @keyframes pulse-rojo {
    0%,100% { background:#ef4444; transform:scale(1); }
    50%     { background:#b91c1c; transform:scale(1.05); }
  }
  @keyframes fadeInDown {
    from { opacity:0; transform:translateY(-12px) translateX(-50%); }
    to   { opacity:1; transform:translateY(0)     translateX(-50%); }
  }
  @keyframes fadeInUp {
    from { opacity:0; transform:translateY(20px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position:  400px 0; }
  }

  .pedido-pendiente  { animation: pulse-amarillo 1.6s ease-in-out infinite; }
  .alerta-notif      { animation: pulse-rojo 1s infinite; }

  .card-producto {
    transition: transform .3s cubic-bezier(.175,.885,.32,1.275),
                box-shadow .3s ease;
  }
  .card-producto:hover {
    transform: translateY(-6px);
    box-shadow: 0 20px 40px rgba(249,115,22,.15) !important;
  }

  .btn-accion {
    transition: transform .15s ease, filter .15s ease;
    cursor: pointer;
  }
  .btn-accion:active  { transform: scale(.94); filter: brightness(.88); }
  .btn-accion:disabled { opacity:.5; cursor:not-allowed; transform:none !important; }
  .btn-accion:focus   { outline: none; }

  .scroll-hide::-webkit-scrollbar { display: none; }
  .scroll-hide { -ms-overflow-style: none; scrollbar-width: none; }

  .tab-pill {
    transition: background .2s, color .2s, box-shadow .2s;
  }

  @media print {
    .no-print  { display:none !important; }
    .qr-print  {
      display: grid !important;
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 40px !important;
      background: white !important;
    }
  }
`;

// ─────────────────────────────────────────────
// DATOS FALLBACK (mientras Firebase carga)
// ─────────────────────────────────────────────
const PRODUCTOS_BASE = [
  { id:"1",   nombre:"Empanada Crujiente",    precio:1500,  categoria:"Fritos",    disponible:true,  popular:true,
    imagen:"https://images.unsplash.com/photo-1628113310823-927610ddf5c9?q=80&w=400&auto=format&fit=crop",
    opciones:["Carne","Pollo","Arroz"] },
  { id:"2",   nombre:"Papa Rellena",           precio:2500,  categoria:"Fritos",    disponible:true,
    imagen:"https://images.unsplash.com/photo-1626074353765-517a681e40be?q=80&w=400&auto=format&fit=crop",
    opciones:["Carne","Huevo"] },
  { id:"3",   nombre:"Pastel de Pollo",        precio:2500,  categoria:"Fritos",    disponible:true,
    imagen:"https://images.unsplash.com/photo-1585109649139-366815a0d713?q=80&w=400&auto=format&fit=crop" },
  { id:"4",   nombre:"Arepa con Huevo y Carne",precio:3500,  categoria:"Fritos",    disponible:true,  popular:true,
    imagen:"https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=400&auto=format&fit=crop" },
  { id:"7",   nombre:"Palitos de Queso",       precio:2000,  categoria:"Fritos",    disponible:true,
    imagen:"https://images.unsplash.com/photo-1541592106381-b31e9221c004?q=80&w=400&auto=format&fit=crop" },
  { id:"d1",  nombre:"Desayuno Tradicional",   precio:8000,  categoria:"Desayunos", disponible:true,
    imagen:"https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?q=80&w=400&auto=format&fit=crop" },
  { id:"MM1", nombre:"Jugo Natural Helado",    precio:0,     categoria:"Bebidas",   disponible:true,
    imagen:"https://images.unsplash.com/photo-1544145945-f904253d0c7e?q=80&w=400&auto=format&fit=crop",
    sabores:["Avena","Maracuyá"],
    tamanos:[{n:"Pequeño",p:1000},{n:"Mediano",p:1500},{n:"Grande",p:2000}] },
  { id:"b1",  nombre:"Coca-Cola",              precio:0,     categoria:"Bebidas",   disponible:true,
    imagen:"https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=400&auto=format&fit=crop",
    tamanos:[{n:"Mini",p:2500},{n:"Personal",p:3500},{n:"Familiar",p:6500}] },
  { id:"lz1", nombre:"Arroz Especial",         precio:6000,  categoria:"Arroces",   disponible:true,
    imagen:"https://images.unsplash.com/photo-1512058560366-cd242d458690?q=80&w=400&auto=format&fit=crop" },
];

const CATEGORIAS = ["Fritos", "Desayunos", "Arroces", "Bebidas"];

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const safeText  = (v) => {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") return v.nombre || "";
  return String(v);
};
const safeMoney = (v) => {
  const n = Number(v);
  return isNaN(n) ? "0" : n.toLocaleString("es-CO");
};

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────
export default function App() {

  // ── Estado global ──────────────────────────
  const [isAdmin,      setIsAdmin]      = useState(false);
  const [tabActiva,    setTabActiva]    = useState("pedidos");
  const [pedidosFB,    setPedidosFB]    = useState([]);
  const [alertasFB,    setAlertasFB]    = useState([]);
  const [menuFB,       setMenuFB]       = useState([]);
  const [firebaseOK,   setFirebaseOK]   = useState(true); // salud de conexión

  // ── Carrito (persistente) ──────────────────
  const [carrito,   setCarrito]   = useState(() => {
    try { return JSON.parse(localStorage.getItem("carrito_nave") || "[]"); }
    catch { return []; }
  });

  // ── UI cliente ─────────────────────────────
  const [mesa,          setMesa]          = useState(null);
  const [categoriaActiva, setCategoriaActiva] = useState("Fritos");
  const [selecciones,   setSelecciones]   = useState({});
  const [cantidades,    setCantidades]    = useState({});
  const [nombre,        setNombre]        = useState("");
  const [telefono,      setTelefono]      = useState("");
  const [direccion,     setDireccion]     = useState("");
  const [notaPedido,    setNotaPedido]    = useState("");
  const [errorCampos,   setErrorCampos]   = useState(false);
  const [enviando,      setEnviando]      = useState(false);
  const [agradecimiento,setAgradecimiento]= useState(false);
  const [alertaEnviada, setAlertaEnviada] = useState(null);
  const [toast,         setToast]         = useState(null);

  // ── UI admin ───────────────────────────────
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [pinInput,     setPinInput]     = useState("");
  const [baseUrl,      setBaseUrl]      = useState(window.location.origin);

  // ── Modal nuevo producto ───────────────────
  const [modalProducto, setModalProducto] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre:"", precio:"", categoria:"Fritos", imagen:"", disponible:true
  });

  // ── Refs ───────────────────────────────────
  const ticketRef      = useRef(null);
  const prevPedidos    = useRef(0);
  const prevAlertas    = useRef(0);

  // ── Datos derivados ────────────────────────
  const dias    = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
  const hoy     = dias[new Date().getDay()];
  const arrozHoy = ["lunes","miércoles","viernes"].includes(hoy) ? "Pollo" : "Cerdo";

  const numPendientes = pedidosFB.filter(p => p.estado === "pendiente").length;
  const workload =
    numPendientes <= 3 ? { texto:"Cocina despejada", color:C.verde,    tiempo:"5-10 min" } :
    numPendientes <= 8 ? { texto:"Cocina con flujo", color:C.amarillo,  tiempo:"15-20 min" } :
                         { texto:"Cocina a tope",    color:C.rojo,      tiempo:"25-30 min" };

  const pedidosMesaActual = pedidosFB.filter(
    p => p.ubicacion === `MESA ${mesa}` && p.estado !== "pagado"
  );
  const totalAcumuladoMesa = pedidosMesaActual.reduce((a, p) => a + (p.total || 0), 0);

  const totalCarrito = carrito.reduce((a, i) => a + i.subtotal, 0);
  const menuActivo   = menuFB.length > 0 ? menuFB : PRODUCTOS_BASE;

  // ─────────────────────────────────────────
  // EFECTOS
  // ─────────────────────────────────────────

  // Leer mesa desde URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get("mesa");
    if (m) { setMesa(m); setNombre(`Cliente Mesa ${m}`); }
  }, []);

  // Persistir carrito
  useEffect(() => {
    localStorage.setItem("carrito_nave", JSON.stringify(carrito));
  }, [carrito]);

  // Escuchar pedidos en Firebase
  useEffect(() => {
    try {
      const q = query(collection(db, "pedidos"), orderBy("timestamp", "asc"));
      return onSnapshot(q,
        (snap) => {
          setFirebaseOK(true);
          const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          if (isAdmin && data.length > prevPedidos.current) {
            playBeep();
            document.title = "( ! ) NUEVO PEDIDO";
          } else {
            document.title = "La Nave Naranja 🍊";
          }
          prevPedidos.current = data.length;
          setPedidosFB(data);
        },
        () => setFirebaseOK(false)
      );
    } catch { setFirebaseOK(false); }
  }, [isAdmin]);

  // Escuchar alertas de mesa
  useEffect(() => {
    try {
      const q = query(collection(db, "alertas"), orderBy("timestamp", "asc"));
      return onSnapshot(q,
        (snap) => {
          const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          if (isAdmin && data.length > prevAlertas.current) playBeep();
          prevAlertas.current = data.length;
          setAlertasFB(data);
        },
        () => {}
      );
    } catch {}
  }, [isAdmin]);

  // Escuchar menú de Firebase
  useEffect(() => {
    try {
      const q = query(collection(db, "productos"), orderBy("nombre", "asc"));
      return onSnapshot(q,
        (snap) => {
          setMenuFB(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        },
        () => {}
      );
    } catch {}
  }, []);

  // ─────────────────────────────────────────
  // HELPERS UI
  // ─────────────────────────────────────────
  const mostrarToast = (msg, duracion = 2500) => {
    setToast(msg);
    setTimeout(() => setToast(null), duracion);
  };

  const irAlTicket = () => ticketRef.current?.scrollIntoView({ behavior:"smooth" });

  // ─────────────────────────────────────────
  // ACCIONES CLIENTE
  // ─────────────────────────────────────────
  const agregarAlCarrito = (p) => {
    const sel  = selecciones[p.id] || {};
    const cant = cantidades[p.id]  || 1;
    const precio =
      p.precio > 0 ? p.precio :
      sel.tamano   ? sel.tamano.p :
      p.tamanos?.[0]?.p || 0;
    const detalle = [sel.sabor, sel.tamano?.n].filter(Boolean).join(" · ");

    setCarrito(prev => [
      ...prev,
      { idUnico: Date.now(), nombre: safeText(p.nombre), cantidad: cant,
        subtotal: precio * cant, detalle }
    ]);
    mostrarToast(`${cant}x ${safeText(p.nombre)} añadido al carrito 🛒`);
  };

  const eliminarDelCarrito = (idUnico) => {
    setCarrito(prev => prev.filter(i => i.idUnico !== idUnico));
  };

  const vaciarCarrito = () => {
    if (window.confirm("¿Quitar todos los productos del carrito?")) {
      setCarrito([]);
    }
  };

  const procesarPedido = async () => {
    // Validación
    if (!mesa && (!nombre.trim() || !telefono.trim() || !direccion.trim())) {
      setErrorCampos(true);
      return;
    }
    if (carrito.length === 0) return;

    setEnviando(true);
    setErrorCampos(false);

    try {
      await setDoc(doc(db, "pedidos", `ORD-${Date.now()}`), {
        nombre:      safeText(nombre),
        telefono:    safeText(telefono),
        ubicacion:   mesa ? `MESA ${mesa}` : direccion.trim(),
        productos:   carrito,
        notaGeneral: notaPedido,
        total:       totalCarrito,
        timestamp:   Date.now(),
        hora:        new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }),
        estado:      "pendiente",
        tipo:        mesa ? "mesa" : "domicilio",
      });

      mostrarToast("🚀 ¡Pedido enviado!");
      setTimeout(() => {
        setCarrito([]);
        setNotaPedido("");
        setEnviando(false);
        setAgradecimiento(true);
      }, 1200);
    } catch (err) {
      console.error(err);
      alert("Error al enviar el pedido. Revisa tu conexión.");
      setEnviando(false);
    }
  };

  const enviarAlerta = async (tipo) => {
    if (!mesa) return;
    try {
      await setDoc(doc(db, "alertas", `ALERTA-${mesa}-${Date.now()}`), {
        mesa, tipo, timestamp: Date.now(),
        hora: new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }),
      });
      setAlertaEnviada(tipo);
      setTimeout(() => setAlertaEnviada(null), 4000);
    } catch { mostrarToast("Sin conexión. Llama al mesero."); }
  };

  // ─────────────────────────────────────────
  // ACCIONES ADMIN
  // ─────────────────────────────────────────
  const actualizarEstado = async (id, estado) => {
    try { await updateDoc(doc(db, "pedidos", id), { estado }); }
    catch { mostrarToast("Error al actualizar."); }
  };

  const toggleDisponibilidad = async (id, actual) => {
    try { await updateDoc(doc(db, "productos", id), { disponible: !actual }); }
    catch { mostrarToast("Error al actualizar."); }
  };

  const actualizarPrecio = async (id, val) => {
    const p = parseInt(val);
    if (!isNaN(p) && p >= 0) {
      try { await updateDoc(doc(db, "productos", id), { precio: p }); }
      catch { mostrarToast("Error al actualizar precio."); }
    }
  };

  const crearProducto = async () => {
    const { nombre: nom, precio, categoria, imagen } = nuevoProducto;
    if (!nom.trim() || !precio) { mostrarToast("Nombre y precio son obligatorios."); return; }
    try {
      const id = `prod-${Date.now()}`;
      await setDoc(doc(db, "productos", id), {
        nombre: nom.trim(),
        precio: parseInt(precio),
        categoria,
        imagen: imagen.trim() || "https://images.unsplash.com/photo-1619177383920-59f776369527?q=80&w=500&auto=format&fit=crop",
        disponible: true,
        popular: false,
      });
      setModalProducto(false);
      setNuevoProducto({ nombre:"", precio:"", categoria:"Fritos", imagen:"", disponible:true });
      mostrarToast("✅ Producto creado.");
    } catch { mostrarToast("Error al crear producto."); }
  };

  const generarReporteWhatsApp = () => {
    const pagados = pedidosFB.filter(p => p.estado === "pagado");
    const vLocal  = pagados.filter(p => p.tipo === "mesa").reduce((a, p) => a + (p.total||0), 0);
    const vDomi   = pagados.filter(p => p.tipo === "domicilio").reduce((a, p) => a + (p.total||0), 0);
    const total   = vLocal + vDomi;
    const msg =
      `*CIERRE DE CAJA - LA NAVE NARANJA* 🍊%0A` +
      `📅 ${new Date().toLocaleDateString("es-CO")}%0A` +
      `💰 *Total: $${safeMoney(total)}*%0A` +
      `📦 Pedidos: ${pedidosFB.length}%0A` +
      `🏠 Local: $${safeMoney(vLocal)}%0A` +
      `🛵 Domicilios: $${safeMoney(vDomi)}`;
    // Cambia el número por el del dueño: wa.me/57XXXXXXXXXX
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  // ═════════════════════════════════════════
  // RENDER — BANNER DE CONEXIÓN
  // ═════════════════════════════════════════
  const BannerSinConexion = () => !firebaseOK ? (
    <div style={{
      background: C.rojo, color:"white", textAlign:"center",
      padding:"12px", fontWeight:"bold", fontSize:"14px"
    }}>
      ⚠️ Sin conexión — revisa tu internet. Los pedidos no se están enviando.
    </div>
  ) : null;

  // ═════════════════════════════════════════
  // RENDER — TOAST
  // ═════════════════════════════════════════
  const Toast = () => toast ? (
    <div style={{
      position:"fixed", top:"20px", left:"50%",
      transform:"translateX(-50%)",
      background:C.texto, color:"white",
      padding:"13px 28px", borderRadius:"50px",
      zIndex:99999, fontWeight:"700", fontSize:"14px",
      boxShadow:"0 8px 24px rgba(0,0,0,.25)",
      animation:"fadeInDown .35s ease",
      whiteSpace:"nowrap"
    }}>
      {toast}
    </div>
  ) : null;

  // ═════════════════════════════════════════════════════════════
  // RENDER — VISTA ADMIN
  // ═════════════════════════════════════════════════════════════
  if (isAdmin) {
    const pagados = pedidosFB.filter(p => p.estado === "pagado");
    const vLocal  = pagados.filter(p => p.tipo === "mesa").reduce((a,p)=>a+(p.total||0),0);
    const vDomi   = pagados.filter(p => p.tipo === "domicilio").reduce((a,p)=>a+(p.total||0),0);
    const tVendido = vLocal + vDomi;
    const ticketProm = pedidosFB.length > 0 ? tVendido / pedidosFB.length : 0;

    return (
      <>
        <style>{globalCSS}</style>
        <BannerSinConexion />
        <Toast />

        <div style={{ minHeight:"100vh", background: numPendientes > 0 ? "#fff7ed" : "#f8fafc",
                      fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
          <div className="no-print" style={{ maxWidth:"1280px", margin:"0 auto", padding:"24px" }}>

            {/* ── Header Admin ── */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"24px" }}>
              <div>
                <h1 style={{ margin:0, fontSize:"28px", fontWeight:"800", color:C.naranja,
                             fontFamily:"'Syne', sans-serif" }}>
                  La Nave Naranja 🍊
                </h1>
                <p style={{ margin:0, color:C.textoSub, fontSize:"13px" }}>Panel de administración</p>
              </div>
              <div style={{ display:"flex", gap:"12px", alignItems:"center" }}>
                <div style={{ background:"white", padding:"14px 22px", borderRadius:"20px",
                              fontWeight:"800", fontSize:"18px", color:C.texto,
                              boxShadow:"0 4px 12px rgba(0,0,0,.06)" }}>
                  Hoy: <span style={{ color:C.naranja }}>${safeMoney(tVendido)}</span>
                </div>
                <button className="btn-accion" onClick={() => setIsAdmin(false)}
                  style={{ padding:"14px 22px", borderRadius:"16px", border:"none",
                           background:"#e2e8f0", fontWeight:"700", color:C.texto }}>
                  Salir
                </button>
              </div>
            </div>

            {/* ── Alertas de mesa ── */}
            {alertasFB.map(a => (
              <div key={a.id} className="alerta-notif"
                style={{ padding:"18px 24px", borderRadius:"20px", marginBottom:"12px",
                         color:"white", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:"20px", fontWeight:"900" }}>
                  {a.tipo === "mesero" ? "🙋 LLAMADO" : "💳 CUENTA"} — MESA {a.mesa}
                  <span style={{ fontSize:"14px", fontWeight:"400", marginLeft:"10px", opacity:.8 }}>
                    {a.hora}
                  </span>
                </span>
                <button className="btn-accion"
                  onClick={() => deleteDoc(doc(db, "alertas", a.id))}
                  style={{ background:"white", color:C.rojo, border:"none",
                           padding:"12px 24px", borderRadius:"12px", fontWeight:"800" }}>
                  ATENDER ✓
                </button>
              </div>
            ))}

            {/* ── Tabs ── */}
            <div className="scroll-hide"
              style={{ display:"flex", gap:"10px", marginBottom:"28px", overflowX:"auto" }}>
              {[
                { id:"pedidos", label:`COCINA (${numPendientes})`, color:C.naranja,
                  badge: numPendientes > 0 },
                { id:"gestion", label:"MENÚ",      color:C.azul   },
                { id:"mesas",   label:"COBROS",    color:C.verde  },
                { id:"qrs",     label:"QRs",       color:C.azul   },
                { id:"caja",    label:"CAJA",      color:C.texto  },
              ].map(t => (
                <button key={t.id} className="tab-pill btn-accion"
                  onClick={() => setTabActiva(t.id)}
                  style={{
                    padding:"16px 28px", borderRadius:"20px", border: t.badge ? `3px solid ${C.rojo}` : "none",
                    background: tabActiva === t.id ? t.color : "white",
                    color:      tabActiva === t.id ? "white"  : C.texto,
                    fontWeight:"800", fontSize:"15px", whiteSpace:"nowrap",
                    boxShadow: tabActiva === t.id ? `0 8px 20px ${t.color}44` : "0 2px 8px rgba(0,0,0,.05)"
                  }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* ══ TAB: COCINA ══ */}
            {tabActiva === "pedidos" && (
              <div style={{ display:"grid",
                            gridTemplateColumns:"repeat(auto-fill, minmax(360px, 1fr))",
                            gap:"24px" }}>
                {pedidosFB
                  .filter(p => p.estado !== "entregado" && p.estado !== "pagado")
                  .map(p => (
                    <div key={p.id}
                      className={p.estado === "pendiente" ? "pedido-pendiente" : ""}
                      style={{
                        background:"white", padding:"26px", borderRadius:"32px",
                        border: p.estado === "pendiente"
                          ? `4px solid ${C.amarillo}`
                          : `4px solid ${C.azul}`,
                        boxShadow:"0 8px 24px rgba(0,0,0,.04)"
                      }}>

                      {/* Encabezado */}
                      <div style={{ borderBottom:`2px solid #f1f5f9`,
                                    paddingBottom:"12px", marginBottom:"16px" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <span style={{ fontSize:"24px", fontWeight:"900", color:C.texto }}>
                            {safeText(p.ubicacion)}
                          </span>
                          <span style={{ fontSize:"14px", color:C.textoSub,
                                         background:"#f1f5f9", padding:"6px 12px",
                                         borderRadius:"12px" }}>
                            {safeText(p.hora)}
                          </span>
                        </div>
                        <div style={{ fontSize:"15px", color:C.textoSub, marginTop:"6px", fontWeight:"600" }}>
                          👤 {safeText(p.nombre)}
                          {p.telefono && <span> · 📞 {p.telefono}</span>}
                        </div>
                        {p.notaGeneral && (
                          <div style={{
                            background:"#fff1f2", color:C.rojo,
                            padding:"10px 14px", borderRadius:"12px",
                            marginTop:"10px", fontWeight:"800",
                            borderLeft:`5px solid ${C.rojo}`, fontSize:"14px"
                          }}>
                            🔔 {safeText(p.notaGeneral)}
                          </div>
                        )}
                      </div>

                      {/* Productos */}
                      {(p.productos || []).map((it, i) => (
                        <div key={i} style={{ marginBottom:"10px" }}>
                          <div style={{ fontSize:"20px", fontWeight:"700", color:"#334155" }}>
                            {it.cantidad}x {safeText(it.nombre)}
                          </div>
                          {it.detalle && (
                            <small style={{ color:C.textoSub }}>{it.detalle}</small>
                          )}
                        </div>
                      ))}

                      {/* Botones */}
                      <div style={{ display:"flex", gap:"10px", marginTop:"20px" }}>
                        {p.estado === "pendiente" && (
                          <button className="btn-accion"
                            onClick={() => actualizarEstado(p.id, "preparando")}
                            style={{ flex:1, background:C.azul, color:"white",
                                     border:"none", padding:"18px",
                                     borderRadius:"16px", fontWeight:"900", fontSize:"15px" }}>
                            FRITAR 👨‍🍳
                          </button>
                        )}
                        {p.estado === "preparando" && (
                          <button className="btn-accion"
                            onClick={() => actualizarEstado(p.id, "entregado")}
                            style={{ flex:1, background:C.verde, color:"white",
                                     border:"none", padding:"18px",
                                     borderRadius:"16px", fontWeight:"900", fontSize:"15px" }}>
                            DESPACHAR ✅
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                {pedidosFB.filter(p => p.estado !== "entregado" && p.estado !== "pagado").length === 0 && (
                  <div style={{ gridColumn:"1/-1", textAlign:"center",
                                padding:"60px 20px", color:C.textoSub }}>
                    <div style={{ fontSize:"48px", marginBottom:"12px" }}>✅</div>
                    <div style={{ fontSize:"20px", fontWeight:"700" }}>Cocina al día</div>
                    <div style={{ fontSize:"14px" }}>No hay pedidos pendientes.</div>
                  </div>
                )}
              </div>
            )}

            {/* ══ TAB: MENÚ (Gestión) ══ */}
            {tabActiva === "gestion" && (
              <div style={{ background:"white", padding:"32px", borderRadius:"36px",
                            boxShadow:"0 8px 24px rgba(0,0,0,.04)" }}>
                <div style={{ display:"flex", justifyContent:"space-between",
                               alignItems:"center", marginBottom:"24px" }}>
                  <h2 style={{ margin:0, fontWeight:"800" }}>Inventario y Precios</h2>
                  <button className="btn-accion"
                    onClick={() => setModalProducto(true)}
                    style={{ background:C.naranja, color:"white", border:"none",
                             padding:"14px 24px", borderRadius:"16px",
                             fontWeight:"800", fontSize:"14px" }}>
                    + Agregar Producto
                  </button>
                </div>

                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead>
                      <tr style={{ borderBottom:`2px solid #f1f5f9` }}>
                        {["Producto","Categoría","Precio ($)","Estado"].map(h => (
                          <th key={h} style={{ padding:"14px 16px", textAlign:"left",
                                               color:C.textoSub, fontSize:"13px",
                                               fontWeight:"700", textTransform:"uppercase",
                                               letterSpacing:".5px" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {menuActivo.map(p => (
                        <tr key={p.id}
                          style={{ borderBottom:"1px solid #f8fafc",
                                   background: p.disponible ? "transparent" : "#fff1f2" }}>
                          <td style={{ padding:"16px" }}>
                            <div style={{ fontWeight:"700", color:C.texto }}>{safeText(p.nombre)}</div>
                          </td>
                          <td style={{ padding:"16px" }}>
                            <span style={{ background:"#f1f5f9", padding:"4px 12px",
                                           borderRadius:"12px", fontSize:"13px",
                                           fontWeight:"600", color:C.textoSub }}>
                              {p.categoria}
                            </span>
                          </td>
                          <td style={{ padding:"16px" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                              <span style={{ color:C.textoSub, fontSize:"14px" }}>$</span>
                              <input type="number" defaultValue={p.precio}
                                onBlur={e => actualizarPrecio(p.id, e.target.value)}
                                style={{ width:"90px", padding:"10px 12px", borderRadius:"12px",
                                         border:"1px solid #e2e8f0", fontWeight:"700",
                                         fontSize:"14px", outline:"none" }} />
                            </div>
                          </td>
                          <td style={{ padding:"16px" }}>
                            <button className="btn-accion"
                              onClick={() => toggleDisponibilidad(p.id, p.disponible)}
                              style={{ padding:"10px 18px", borderRadius:"14px", border:"none",
                                       background: p.disponible ? C.verde : C.rojo,
                                       color:"white", fontWeight:"800", fontSize:"12px",
                                       minWidth:"110px" }}>
                              {p.disponible ? "✓ HABILITADO" : "✗ AGOTADO"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ══ TAB: COBROS ══ */}
            {tabActiva === "mesas" && (
              <div>
                <div style={{ display:"grid",
                              gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))",
                              gap:"20px", marginBottom:"40px" }}>
                  {[1,2,3,4,5,6,7,8,9,10].map(n => {
                    const mesaPed = pedidosFB.filter(
                      p => p.ubicacion === `MESA ${n}` && p.estado !== "pagado"
                    );
                    const totalM = mesaPed.reduce((a,p) => a + (p.total||0), 0);
                    const lista  = mesaPed.map(p =>
                      (p.productos||[]).map(it => `${it.cantidad}x ${it.nombre}`).join(", ")
                    ).join(" | ");
                    const listoParaCobrar = mesaPed.length > 0 &&
                      mesaPed.every(p => p.estado === "entregado");

                    if (mesaPed.length === 0) return (
                      <div key={n} style={{ background:"white", padding:"22px",
                                            borderRadius:"24px", textAlign:"center",
                                            border:"1px dashed #cbd5e1", color:"#94a3b8" }}>
                        <div style={{ fontSize:"20px", marginBottom:"4px" }}>🪑</div>
                        <div style={{ fontWeight:"700" }}>Mesa {n}</div>
                        <div style={{ fontSize:"12px" }}>Libre</div>
                      </div>
                    );
                    return (
                      <div key={n} style={{
                        background:"white", padding:"26px", borderRadius:"30px",
                        border:`3px solid ${listoParaCobrar ? C.rojo : C.naranja}`,
                        boxShadow:`0 8px 20px ${listoParaCobrar ? C.rojo : C.naranja}22`
                      }}>
                        <div style={{ fontWeight:"900", fontSize:"22px", marginBottom:"6px" }}>
                          Mesa {n}
                        </div>
                        {lista && (
                          <div style={{ fontSize:"12px", color:C.textoSub,
                                        marginBottom:"12px", lineHeight:"1.5" }}>
                            {lista}
                          </div>
                        )}
                        <div style={{ fontSize:"30px", fontWeight:"900",
                                       color:C.naranja, marginBottom:"16px" }}>
                          ${safeMoney(totalM)}
                        </div>
                        <button className="btn-accion"
                          onClick={() => {
                            if (window.confirm(`¿Cobrar la cuenta de la Mesa ${n}? ($${safeMoney(totalM)})`)) {
                              mesaPed.forEach(p => actualizarEstado(p.id, "pagado"));
                            }
                          }}
                          style={{ width:"100%", padding:"16px",
                                   background: listoParaCobrar ? C.rojo : C.texto,
                                   color:"white", border:"none", borderRadius:"16px",
                                   fontWeight:"900", fontSize:"14px" }}>
                          💸 COBRAR CUENTA
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Domicilios por cobrar */}
                <h3 style={{ marginBottom:"16px", paddingLeft:"4px" }}>🛵 Domicilios por cobrar</h3>
                <div className="scroll-hide"
                  style={{ display:"flex", gap:"16px", overflowX:"auto", paddingBottom:"8px" }}>
                  {pedidosFB
                    .filter(p => p.tipo === "domicilio" && p.estado !== "pagado")
                    .map(p => (
                      <div key={p.id}
                        style={{ minWidth:"240px", background:"white", padding:"22px",
                                  borderRadius:"26px", border:`2px solid ${C.azul}` }}>
                        <div style={{ fontWeight:"800", fontSize:"15px" }}>{safeText(p.nombre)}</div>
                        <div style={{ color:C.textoSub, fontSize:"13px", margin:"4px 0 8px" }}>
                          {safeText(p.ubicacion)}
                        </div>
                        <div style={{ fontSize:"24px", fontWeight:"900",
                                       color:C.naranja, marginBottom:"14px" }}>
                          ${safeMoney(p.total)}
                        </div>
                        <button className="btn-accion"
                          onClick={() => {
                            if (window.confirm("¿Marcar como pagado?"))
                              actualizarEstado(p.id, "pagado");
                          }}
                          style={{ width:"100%", padding:"13px", background:C.verde,
                                   color:"white", border:"none", borderRadius:"14px",
                                   fontWeight:"800", fontSize:"13px" }}>
                          ✅ RECIBÍ PAGO
                        </button>
                      </div>
                    ))}
                  {pedidosFB.filter(p => p.tipo === "domicilio" && p.estado !== "pagado").length === 0 && (
                    <div style={{ color:C.textoSub, padding:"20px" }}>
                      No hay domicilios pendientes.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══ TAB: CAJA ══ */}
            {tabActiva === "caja" && (
              <div style={{ background:"white", padding:"32px", borderRadius:"36px",
                            boxShadow:"0 8px 24px rgba(0,0,0,.04)" }}>
                <h2 style={{ margin:"0 0 28px", fontWeight:"800" }}>📊 Caja del Día</h2>

                <div style={{ display:"grid",
                              gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))",
                              gap:"18px", marginBottom:"32px" }}>
                  {[
                    { label:"💰 Ventas totales", valor:`$${safeMoney(tVendido)}`, color:C.naranja },
                    { label:"📦 Pedidos",         valor:pedidosFB.length,          color:C.azul   },
                    { label:"📈 Ticket promedio", valor:`$${safeMoney(ticketProm)}`,color:C.verde  },
                  ].map(m => (
                    <div key={m.label}
                      style={{ padding:"22px", borderRadius:"24px", background:"#f8fafc",
                                borderLeft:`6px solid ${m.color}`, textAlign:"center" }}>
                      <div style={{ fontSize:"12px", fontWeight:"700",
                                     color:C.textoSub, marginBottom:"8px" }}>
                        {m.label}
                      </div>
                      <div style={{ fontSize:"28px", fontWeight:"900", color:C.texto }}>
                        {m.valor}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display:"flex", gap:"14px", marginBottom:"32px" }}>
                  {[
                    { label:"🏠 Local",      valor:vLocal, color:C.verde, bg:"#f0fdf4" },
                    { label:"🛵 Domicilios", valor:vDomi,  color:C.azul,  bg:"#eff6ff" },
                  ].map(d => (
                    <div key={d.label}
                      style={{ flex:1, padding:"20px", background:d.bg,
                                borderRadius:"20px", textAlign:"center" }}>
                      <div style={{ fontSize:"13px", fontWeight:"700", color:d.color }}>
                        {d.label}
                      </div>
                      <div style={{ fontSize:"22px", fontWeight:"900", color:C.texto, marginTop:"6px" }}>
                        ${safeMoney(d.valor)}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
                  <button className="btn-accion" onClick={generarReporteWhatsApp}
                    style={{ padding:"20px", background:"#25D366", color:"white",
                             borderRadius:"22px", border:"none", fontWeight:"900",
                             fontSize:"16px" }}>
                    📲 ENVIAR REPORTE A WHATSAPP
                  </button>
                  <button className="btn-accion"
                    onClick={() => {
                      if (window.confirm("¿Cerrar el día? Se borrarán los pedidos pagados.")) {
                        pagados.forEach(p => deleteDoc(doc(db, "pedidos", p.id)));
                        mostrarToast("✅ Caja cerrada.");
                      }
                    }}
                    style={{ padding:"20px", background:C.texto, color:"white",
                             borderRadius:"22px", border:"none", fontWeight:"900",
                             fontSize:"16px" }}>
                    🏁 CERRAR DÍA Y LIMPIAR CAJA
                  </button>
                </div>
              </div>
            )}

            {/* ══ TAB: QRs ══ */}
            {tabActiva === "qrs" && (
              <div style={{ background:"white", padding:"36px", borderRadius:"36px" }}>
                <h2 style={{ margin:"0 0 8px", fontWeight:"800" }}>Códigos QR por Mesa 📌</h2>
                <p style={{ color:C.textoSub, marginBottom:"24px" }}>
                  Imprime y coloca un QR en cada mesa. El cliente escanea y hace su pedido.
                </p>
                <input type="text" value={baseUrl} onChange={e => setBaseUrl(e.target.value)}
                  placeholder="URL base del sistema"
                  style={{ width:"100%", padding:"15px", borderRadius:"15px",
                           border:"2px solid #e2e8f0", marginBottom:"20px",
                           fontSize:"14px", outline:"none", boxSizing:"border-box" }} />
                <button className="btn-accion" onClick={() => window.print()}
                  style={{ background:C.naranja, color:"white", border:"none",
                           padding:"14px 28px", borderRadius:"16px",
                           fontWeight:"800", marginBottom:"30px" }}>
                  🖨️ Imprimir Códigos
                </button>
                <div className="qr-print"
                  style={{ display:"grid",
                           gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))",
                           gap:"24px" }}>
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <div key={n}
                      style={{ textAlign:"center", padding:"24px",
                                border:"1px solid #e2e8f0", borderRadius:"24px" }}>
                      <div style={{ fontWeight:"900", fontSize:"18px", marginBottom:"12px" }}>
                        Mesa {n}
                      </div>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${
                          encodeURIComponent(baseUrl.replace(/\/$/, "") + "?mesa=" + n)
                        }`}
                        alt={`QR Mesa ${n}`}
                        style={{ width:"160px" }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ── Modal: Nuevo Producto ── */}
        {modalProducto && (
          <div style={{
            position:"fixed", inset:0, background:"rgba(0,0,0,.6)",
            zIndex:50000, display:"flex", justifyContent:"center", alignItems:"center",
            padding:"20px"
          }}>
            <div style={{ background:"white", padding:"36px", borderRadius:"36px",
                          width:"100%", maxWidth:"440px",
                          boxShadow:"0 20px 60px rgba(0,0,0,.2)" }}>
              <h2 style={{ margin:"0 0 24px", fontWeight:"900" }}>Agregar Producto</h2>

              {[
                { label:"Nombre del producto *", key:"nombre", type:"text",
                  placeholder:"ej. Empanada de pipián" },
                { label:"Precio (COP) *", key:"precio", type:"number",
                  placeholder:"ej. 1500" },
                { label:"URL de imagen (opcional)", key:"imagen", type:"text",
                  placeholder:"https://..." },
              ].map(f => (
                <div key={f.key} style={{ marginBottom:"16px" }}>
                  <label style={{ display:"block", fontWeight:"700",
                                   fontSize:"13px", marginBottom:"6px",
                                   color:C.textoSub }}>
                    {f.label}
                  </label>
                  <input type={f.type} placeholder={f.placeholder}
                    value={nuevoProducto[f.key]}
                    onChange={e => setNuevoProducto({...nuevoProducto, [f.key]: e.target.value})}
                    style={{ width:"100%", padding:"14px", borderRadius:"14px",
                             border:"1px solid #e2e8f0", fontSize:"15px",
                             outline:"none", boxSizing:"border-box" }} />
                </div>
              ))}

              <div style={{ marginBottom:"24px" }}>
                <label style={{ display:"block", fontWeight:"700",
                                 fontSize:"13px", marginBottom:"6px", color:C.textoSub }}>
                  Categoría
                </label>
                <select value={nuevoProducto.categoria}
                  onChange={e => setNuevoProducto({...nuevoProducto, categoria: e.target.value})}
                  style={{ width:"100%", padding:"14px", borderRadius:"14px",
                           border:"1px solid #e2e8f0", fontSize:"15px",
                           outline:"none", background:"white" }}>
                  {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div style={{ display:"flex", gap:"12px" }}>
                <button className="btn-accion" onClick={() => setModalProducto(false)}
                  style={{ flex:1, padding:"16px", borderRadius:"16px",
                           border:"none", background:"#f1f5f9",
                           fontWeight:"700", color:C.texto }}>
                  Cancelar
                </button>
                <button className="btn-accion" onClick={crearProducto}
                  style={{ flex:2, padding:"16px", borderRadius:"16px",
                           border:"none", background:C.naranja,
                           color:"white", fontWeight:"900", fontSize:"15px" }}>
                  Guardar Producto ✓
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Login modal */}
        {mostrarLogin && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.9)",
                        zIndex:20000, display:"flex", justifyContent:"center",
                        alignItems:"center" }}>
            <div style={{ background:"white", padding:"40px", borderRadius:"36px",
                          textAlign:"center", minWidth:"280px" }}>
              <h2 style={{ margin:"0 0 20px", fontWeight:"900" }}>Acceso Admin</h2>
              <input type="password" placeholder="PIN"
                onChange={e => setPinInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && pinInput === "nave2026") {
                    setIsAdmin(true); setMostrarLogin(false);
                  }
                }}
                style={{ padding:"18px", borderRadius:"16px", border:"2px solid #e2e8f0",
                         fontSize:"18px", textAlign:"center", width:"100%",
                         boxSizing:"border-box", outline:"none" }} />
              <button className="btn-accion"
                onClick={() => { if (pinInput === "nave2026") { setIsAdmin(true); setMostrarLogin(false); }}}
                style={{ display:"block", width:"100%", marginTop:"12px",
                         padding:"18px", background:C.naranja, color:"white",
                         border:"none", borderRadius:"16px", fontWeight:"900",
                         fontSize:"16px" }}>
                Entrar
              </button>
              <button onClick={() => setMostrarLogin(false)}
                style={{ background:"none", border:"none", marginTop:"12px",
                         color:"#94a3b8", cursor:"pointer" }}>
                Cerrar
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // ═════════════════════════════════════════════════════════════
  // RENDER — VISTA CLIENTE
  // ═════════════════════════════════════════════════════════════
  return (
    <>
      <style>{globalCSS}</style>
      <BannerSinConexion />
      <Toast />

      <div style={{ fontFamily:"'Plus Jakarta Sans', sans-serif",
                    background:C.fondo, minHeight:"100vh", paddingBottom:"160px" }}>

        {/* ── Header ── */}
        <header style={{
          position:"relative", height:"260px",
          background:`linear-gradient(to bottom, rgba(0,0,0,.05) 0%, rgba(0,0,0,.75) 100%),
                      url(https://images.unsplash.com/photo-1541592106381-b31e9221c004?q=80&w=1000&auto=format&fit=crop)`,
          backgroundSize:"cover", backgroundPosition:"center",
          display:"flex", flexDirection:"column",
          justifyContent:"flex-end", alignItems:"center",
          color:"white", borderRadius:"0 0 44px 44px",
          paddingBottom:"36px"
        }}>
          <h1 onClick={() => setMostrarLogin(true)}
            style={{ margin:0, fontSize:"2.4rem", fontWeight:"800",
                     fontFamily:"'Syne', sans-serif", letterSpacing:"-1px",
                     cursor:"pointer", textShadow:"0 2px 8px rgba(0,0,0,.3)" }}>
            La Nave Naranja 🍊
          </h1>
          <p style={{ margin:"4px 0 0", opacity:.85, fontSize:"15px", fontWeight:"500" }}>
            El sabor más crocante de la ciudad
          </p>

          {/* Badge de workload */}
          <div style={{
            marginTop:"14px", background:"rgba(255,255,255,.2)",
            backdropFilter:"blur(8px)", padding:"8px 18px",
            borderRadius:"20px", fontSize:"13px", fontWeight:"700",
            border:"1px solid rgba(255,255,255,.3)"
          }}>
            <span style={{ color: workload.color === C.verde ? "#86efac" :
                                    workload.color === C.amarillo ? "#fde68a" : "#fca5a5" }}>
              ●
            </span>{" "}
            {workload.texto} · Est. {workload.tiempo}
          </div>
        </header>

        {/* ── Banner arroz del día ── */}
        <div style={{ textAlign:"center", marginTop:"20px" }}>
          <span style={{ background:"#fff7ed", padding:"8px 20px", borderRadius:"20px",
                         fontWeight:"700", color:C.naranja, fontSize:"14px",
                         boxShadow:"0 2px 8px rgba(249,115,22,.1)" }}>
            🍚 Arroz del día: {arrozHoy}
          </span>
        </div>

        {/* ── Filtros de categoría ── */}
        <div className="scroll-hide"
          style={{ display:"flex", gap:"10px", overflowX:"auto",
                   padding:"20px 20px 8px" }}>
          {CATEGORIAS.map(cat => (
            <button key={cat} className="btn-accion"
              onClick={() => setCategoriaActiva(cat)}
              style={{
                padding:"12px 26px", borderRadius:"30px", border:"none",
                background: categoriaActiva === cat ? C.naranja : "white",
                color:      categoriaActiva === cat ? "white"  : C.texto,
                fontWeight:"700", fontSize:"14px", whiteSpace:"nowrap",
                boxShadow: categoriaActiva === cat
                  ? `0 6px 16px rgba(249,115,22,.3)`
                  : `0 2px 8px rgba(0,0,0,.06)`
              }}>
              {cat}
            </button>
          ))}
        </div>

        {/* ── Grid de productos ── */}
        <div style={{
          display:"grid",
          gridTemplateColumns:"repeat(auto-fill, minmax(160px, 1fr))",
          gap:"16px", padding:"16px 20px",
          maxWidth:"1200px", margin:"0 auto"
        }}>
          {menuActivo.filter(p => p.categoria === categoriaActiva).map(p => {
            const sel   = selecciones[p.id] || {};
            const cant  = cantidades[p.id]  || 1;
            const precio =
              p.precio > 0 ? p.precio :
              sel.tamano   ? sel.tamano.p :
              p.tamanos?.[0]?.p || 0;

            return (
              <div key={p.id} className="card-producto"
                style={{
                  background:"rgba(255,255,255,.85)",
                  backdropFilter:"blur(12px)",
                  WebkitBackdropFilter:"blur(12px)",
                  borderRadius:"28px",
                  border:"1px solid rgba(255,255,255,.5)",
                  padding:"14px",
                  boxShadow:"0 6px 20px rgba(0,0,0,.05)",
                  position:"relative", overflow:"hidden"
                }}>

                {/* Badge popular */}
                {p.popular && (
                  <div style={{
                    position:"absolute", top:"12px", right:"12px",
                    background:C.amarillo, color:"#451a03",
                    padding:"4px 10px", borderRadius:"14px",
                    fontSize:"10px", fontWeight:"800", zIndex:10
                  }}>
                    🔥 TOP
                  </div>
                )}

                {/* Capa agotado */}
                {!p.disponible && (
                  <div style={{
                    position:"absolute", inset:0,
                    background:"rgba(255,255,255,.75)",
                    backdropFilter:"blur(4px)", zIndex:25,
                    display:"flex", justifyContent:"center", alignItems:"center",
                    borderRadius:"28px"
                  }}>
                    <span style={{
                      transform:"rotate(-10deg)",
                      border:`3px solid ${C.rojo}`, padding:"6px 12px",
                      borderRadius:"12px", fontWeight:"900",
                      color:C.rojo, fontSize:"14px"
                    }}>
                      AGOTADO
                    </span>
                  </div>
                )}

                {/* Imagen */}
                <div style={{ borderRadius:"20px", overflow:"hidden",
                              height:"140px", marginBottom:"12px" }}>
                  <img
                    src={p.imagen ||
                      "https://images.unsplash.com/photo-1619177383920-59f776369527?q=80&w=500&auto=format&fit=crop"}
                    alt={safeText(p.nombre)}
                    style={{ width:"100%", height:"100%", objectFit:"cover" }}
                  />
                </div>

                {/* Info */}
                <h3 style={{ margin:"0 0 4px", fontSize:"15px",
                              fontWeight:"700", color:"#0f172a", lineHeight:"1.2" }}>
                  {safeText(p.nombre)}
                </h3>
                <div style={{ color:C.naranja, fontWeight:"800",
                              fontSize:"18px", marginBottom:"12px" }}>
                  ${safeMoney(precio)}
                </div>

                {/* Selectores */}
                {(p.sabores || p.tamanos) && (
                  <div style={{ display:"flex", gap:"6px", marginBottom:"10px" }}>
                    {p.sabores && (
                      <select disabled={!p.disponible}
                        onChange={e => setSelecciones({
                          ...selecciones, [p.id]: {...sel, sabor: e.target.value}
                        })}
                        style={{ flex:1, padding:"8px", borderRadius:"10px",
                                 border:"1px solid #e2e8f0", fontSize:"12px",
                                 background:"white", fontWeight:"600", outline:"none" }}>
                        <option>Sabor</option>
                        {p.sabores.map(s => <option key={s}>{safeText(s)}</option>)}
                      </select>
                    )}
                    {p.tamanos && (
                      <select disabled={!p.disponible}
                        onChange={e => setSelecciones({
                          ...selecciones,
                          [p.id]: {...sel, tamano: p.tamanos.find(t => t.n === e.target.value)}
                        })}
                        style={{ flex:1, padding:"8px", borderRadius:"10px",
                                 border:"1px solid #e2e8f0", fontSize:"12px",
                                 background:"white", fontWeight:"600", outline:"none" }}>
                        <option>Tam.</option>
                        {p.tamanos.map(t => <option key={t.n}>{safeText(t.n)}</option>)}
                      </select>
                    )}
                  </div>
                )}

                {/* Cantidad */}
                <div style={{
                  display:"flex", alignItems:"center",
                  justifyContent:"space-between",
                  background:"#f8fafc", borderRadius:"14px",
                  padding:"4px 8px", marginBottom:"10px",
                  border:"1px solid #f1f5f9"
                }}>
                  <button disabled={!p.disponible} className="btn-accion"
                    onClick={() => setCantidades({
                      ...cantidades, [p.id]: Math.max(1, cant - 1)
                    })}
                    style={{ border:"none", background:"none",
                             fontWeight:"bold", color:"#64748b",
                             padding:"4px 10px", fontSize:"20px" }}>
                    −
                  </button>
                  <strong style={{ fontSize:"15px", color:C.texto }}>{cant}</strong>
                  <button disabled={!p.disponible} className="btn-accion"
                    onClick={() => setCantidades({...cantidades, [p.id]: cant + 1})}
                    style={{ border:"none", background:"none",
                             fontWeight:"bold", color:"#64748b",
                             padding:"4px 10px", fontSize:"20px" }}>
                    +
                  </button>
                </div>

                <button disabled={!p.disponible} className="btn-accion"
                  onClick={() => agregarAlCarrito(p)}
                  style={{
                    width:"100%", padding:"13px",
                    background: p.disponible ? C.naranja : "#cbd5e1",
                    color:"white", borderRadius:"16px", border:"none",
                    fontWeight:"800", fontSize:"13px",
                    boxShadow: p.disponible ? `0 6px 14px rgba(249,115,22,.28)` : "none"
                  }}>
                  Agregar 🛒
                </button>
              </div>
            );
          })}
        </div>

        {/* ── Resumen de consumo para mesas ── */}
        {mesa && pedidosMesaActual.length > 0 && (
          <div style={{
            maxWidth:"580px", margin:"12px auto", padding:"20px 24px",
            background:"white", borderRadius:"28px",
            border:"1px solid #e2e8f0",
            boxShadow:"0 4px 16px rgba(0,0,0,.05)"
          }}>
            <h3 style={{ margin:"0 0 12px", fontSize:"16px", color:C.texto }}>
              🧾 Tu consumo — Mesa {mesa}
            </h3>
            {pedidosMesaActual.map((p, i) => (
              <div key={i} style={{
                display:"flex", justifyContent:"space-between",
                fontSize:"14px", marginBottom:"6px", color:C.textoSub
              }}>
                <span>Pedido {p.hora} · <em>{p.estado}</em></span>
                <span style={{ fontWeight:"700", color:C.texto }}>
                  ${safeMoney(p.total)}
                </span>
              </div>
            ))}
            <div style={{
              borderTop:"1px dashed #cbd5e1", marginTop:"12px",
              paddingTop:"12px", display:"flex",
              justifyContent:"space-between", fontWeight:"800",
              color:C.verde, fontSize:"15px"
            }}>
              <span>TOTAL A PAGAR</span>
              <span>${safeMoney(totalAcumuladoMesa)}</span>
            </div>
          </div>
        )}

        {/* ── Botones flotantes de mesa ── */}
        {mesa && (
          <div style={{
            position:"fixed", bottom:"24px", left:"50%",
            transform:"translateX(-50%)",
            display:"flex", gap:"10px",
            width:"90%", maxWidth:"440px", zIndex:5000
          }}>
            <button className="btn-accion"
              disabled={alertaEnviada === "mesero"}
              onClick={() => enviarAlerta("mesero")}
              style={{
                flex:1, padding:"18px", borderRadius:"24px", border:"none",
                background: alertaEnviada === "mesero" ? "#94a3b8" : C.azul,
                color:"white", fontWeight:"800", fontSize:"14px",
                boxShadow:`0 8px 20px ${C.azul}44`
              }}>
              {alertaEnviada === "mesero" ? "✓ Enviado" : "🙋 Llamar Mesero"}
            </button>
            <button className="btn-accion"
              onClick={() => enviarAlerta("cuenta")}
              style={{
                flex:1, padding:"18px", borderRadius:"24px", border:"none",
                background:C.verde, color:"white", fontWeight:"800",
                fontSize:"14px", boxShadow:`0 8px 20px ${C.verde}44`
              }}>
              💳 Pedir Cuenta
            </button>
          </div>
        )}

        {/* ── Botón flotante carrito ── */}
        {carrito.length > 0 && (
          <button className="btn-accion" onClick={irAlTicket}
            style={{
              position:"fixed",
              bottom: mesa ? "100px" : "28px",
              right:"20px",
              background:C.naranja, color:"white",
              width:"64px", height:"64px", borderRadius:"50%",
              border:"none", fontSize:"26px", cursor:"pointer",
              boxShadow:`0 8px 24px rgba(249,115,22,.45)`,
              zIndex:4000, display:"flex",
              justifyContent:"center", alignItems:"center"
            }}>
            🛒
            <span style={{
              position:"absolute", top:"0", right:"0",
              background:"white", color:C.naranja,
              width:"22px", height:"22px", borderRadius:"50%",
              fontSize:"12px", fontWeight:"900",
              display:"flex", justifyContent:"center", alignItems:"center",
              border:`2px solid ${C.naranja}`
            }}>
              {carrito.length}
            </span>
          </button>
        )}

        {/* ── Ticket / Carrito ── */}
        {carrito.length > 0 && (
          <div ref={ticketRef}
            style={{
              maxWidth:"580px", margin:"32px auto",
              background:"white", padding:"30px",
              borderRadius:"36px",
              border:`4px solid ${C.naranja}`,
              boxShadow:`0 12px 32px rgba(249,115,22,.12)`,
              animation:"fadeInUp .4s ease"
            }}>

            <div style={{ display:"flex", justifyContent:"space-between",
                           alignItems:"center", marginBottom:"20px" }}>
              <h2 style={{ margin:0, fontWeight:"900" }}>🛒 Tu Pedido</h2>
              <button className="btn-accion" onClick={vaciarCarrito}
                style={{ background:"#fee2e2", color:C.rojo, border:"none",
                          padding:"8px 16px", borderRadius:"12px",
                          fontWeight:"700", fontSize:"12px" }}>
                Vaciar todo
              </button>
            </div>

            {/* Items */}
            {carrito.map(it => (
              <div key={it.idUnico}
                style={{ padding:"14px 0", borderBottom:"1px solid #f1f5f9" }}>
                <div style={{ display:"flex", justifyContent:"space-between",
                               alignItems:"center" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:"700", fontSize:"15px" }}>
                      {it.cantidad}x {safeText(it.nombre)}
                    </div>
                    {it.detalle && (
                      <small style={{ color:C.textoSub }}>{it.detalle}</small>
                    )}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                    <span style={{ fontWeight:"900", color:C.texto }}>
                      ${safeMoney(it.subtotal)}
                    </span>
                    <button className="btn-accion"
                      onClick={() => eliminarDelCarrito(it.idUnico)}
                      style={{ background:"#fee2e2", border:"none",
                                color:C.rojo, padding:"8px 10px",
                                borderRadius:"10px", fontSize:"14px" }}>
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Nota general */}
            <input type="text"
              placeholder="📝 Nota general (ej: sin cebolla, traer cambio...)"
              value={notaPedido}
              onChange={e => setNotaPedido(e.target.value)}
              style={{ width:"100%", marginTop:"18px", padding:"14px",
                        borderRadius:"14px", border:"1px solid #e2e8f0",
                        background:"#f8fafc", fontSize:"14px",
                        outline:"none", boxSizing:"border-box" }} />

            {/* Total */}
            <div style={{
              marginTop:"20px", paddingTop:"16px",
              borderTop:"2px solid #f1f5f9",
              display:"flex", justifyContent:"space-between",
              fontSize:"22px", fontWeight:"900"
            }}>
              <span>Total</span>
              <span style={{ color:C.naranja }}>${safeMoney(totalCarrito)}</span>
            </div>

            {/* Campos domicilio */}
            {!mesa && (
              <div style={{ marginTop:"20px", display:"flex",
                            flexDirection:"column", gap:"10px" }}>
                {[
                  { placeholder:"👤 Nombre completo *", value:nombre,
                    onChange: e => setNombre(e.target.value),
                    error: errorCampos && !nombre.trim() },
                  { placeholder:"📞 Teléfono de contacto *", value:telefono,
                    onChange: e => setTelefono(e.target.value), type:"tel",
                    error: errorCampos && !telefono.trim() },
                  { placeholder:"📍 Dirección y barrio *", value:direccion,
                    onChange: e => setDireccion(e.target.value),
                    error: errorCampos && !direccion.trim() },
                ].map((f, i) => (
                  <input key={i} type={f.type || "text"}
                    placeholder={f.placeholder} value={f.value}
                    onChange={f.onChange}
                    style={{
                      width:"100%", padding:"14px", borderRadius:"14px",
                      border: f.error ? `2px solid ${C.rojo}` : "1px solid #e2e8f0",
                      fontSize:"14px", outline:"none", boxSizing:"border-box"
                    }} />
                ))}
                {errorCampos && (
                  <p style={{ color:C.rojo, fontSize:"13px", margin:"0", fontWeight:"600" }}>
                    ⚠️ Por favor completa todos los campos obligatorios.
                  </p>
                )}
              </div>
            )}

            {/* Botón confirmar */}
            <button className="btn-accion" onClick={procesarPedido}
              disabled={enviando}
              style={{
                width:"100%", marginTop:"20px", padding:"20px",
                background: enviando ? "#94a3b8" : C.naranja,
                color:"white", borderRadius:"24px", border:"none",
                fontWeight:"900", fontSize:"17px",
                boxShadow: enviando ? "none" : `0 8px 20px rgba(249,115,22,.35)`
              }}>
              {enviando ? "⏳ Enviando pedido..." : "CONFIRMAR PEDIDO 👨‍🍳"}
            </button>
          </div>
        )}

        {/* ── Modal login ── */}
        {mostrarLogin && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.9)",
                        zIndex:20000, display:"flex",
                        justifyContent:"center", alignItems:"center" }}>
            <div style={{ background:"white", padding:"40px", borderRadius:"36px",
                          textAlign:"center", minWidth:"280px" }}>
              <h2 style={{ margin:"0 0 20px", fontWeight:"900" }}>Acceso Admin</h2>
              <input type="password" placeholder="PIN"
                onChange={e => setPinInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && pinInput === "nave2026") {
                    setIsAdmin(true); setMostrarLogin(false);
                  }
                }}
                style={{ padding:"18px", borderRadius:"16px",
                          border:"2px solid #e2e8f0", fontSize:"20px",
                          textAlign:"center", width:"100%",
                          boxSizing:"border-box", outline:"none",
                          letterSpacing:"6px" }} />
              <button className="btn-accion"
                onClick={() => {
                  if (pinInput === "nave2026") { setIsAdmin(true); setMostrarLogin(false); }
                  else mostrarToast("PIN incorrecto.");
                }}
                style={{ display:"block", width:"100%", marginTop:"12px",
                          padding:"18px", background:C.naranja,
                          color:"white", border:"none", borderRadius:"16px",
                          fontWeight:"900", fontSize:"16px" }}>
                Entrar
              </button>
              <button onClick={() => setMostrarLogin(false)}
                style={{ background:"none", border:"none",
                          marginTop:"12px", color:"#94a3b8", cursor:"pointer" }}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* ── Pantalla de agradecimiento ── */}
        {agradecimiento && (
          <div style={{
            position:"fixed", inset:0,
            background:C.naranja, zIndex:10000,
            display:"flex", justifyContent:"center",
            alignItems:"center", color:"white"
          }}>
            <div style={{ textAlign:"center", padding:"40px" }}>
              <div style={{ fontSize:"72px", marginBottom:"16px" }}>🍊</div>
              <h1 style={{ fontFamily:"'Syne', sans-serif",
                            fontSize:"36px", margin:"0 0 8px" }}>
                ¡Pedido recibido!
              </h1>
              <p style={{ fontSize:"18px", opacity:.9, margin:"0 0 32px" }}>
                Estamos preparando tu orden con todo el amor 👨‍🍳
              </p>
              <button className="btn-accion"
                onClick={() => setAgradecimiento(false)}
                style={{ padding:"16px 40px", borderRadius:"30px",
                          border:"none", background:"white",
                          color:C.naranja, fontWeight:"900",
                          fontSize:"16px" }}>
                Volver al menú
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
