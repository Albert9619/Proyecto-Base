import React, { useState, useEffect } from 'react';
import { db } from './firebaseConfig';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy } from "firebase/firestore";

// ==========================================
// 🔴 COMPONENTE MINISWITCH (UI)
// ==========================================
const MiniSwitch = ({ activo, onClick }) => (
  <div onClick={onClick} style={{ width: '46px', height: '24px', backgroundColor: activo ? "#16a34a" : '#cbd5e1', borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: '0.3s', flexShrink: 0 }}>
    <div style={{ width: '18px', height: '18px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: activo ? '25px' : '3px', transition: '0.3s cubic-bezier(0.18, 0.89, 0.35, 1.15)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
  </div>
);

const MONO_NARANJA = "#f97316";
const MONO_VERDE = "#16a34a";
const MONO_TEXTO = "#333333";

// ==========================================
// 🔴 DATOS MAESTROS
// ==========================================
const productosBase = [
  { id: "1", nombre: "Empanada Crujiente", precio: 1500, categoria: "Fritos", disponible: true, imagen: "/empanada.jpg", opciones: [{ nombre: "Carne", disponible: true }, { nombre: "Pollo", disponible: true }, { nombre: "Arroz", disponible: true }] },
  { id: "2", nombre: "Papa Rellena de la Casa", precio: 2500, categoria: "Fritos", disponible: true, imagen: "/papa-rellena.jpg", opciones: [{ nombre: "Carne", disponible: true }, { nombre: "Huevo", disponible: true }] },
  { id: "3", nombre: "Pastel de Pollo Hojaldrado", precio: 2500, categoria: "Fritos", disponible: true, imagen: "/pastel-pollo.jpg" },
  { id: "4", nombre: "Arepa con Huevo y Carne", precio: 3500, categoria: "Fritos", disponible: true, imagen: "/api-logo.jpg" },
  { id: "7", nombre: "Palitos de Queso Costeño", precio: 2000, categoria: "Fritos", disponible: true, imagen: "/palito-queso.jpg" },
  { id: "d1", nombre: "Desayuno Tradicional", precio: 8000, categoria: "Desayunos", disponible: true, imagen: "/desayuno-carne.jpg", config: { acompanamiento: ["Patacón", "Arepa"], huevos: ["Revueltos", "Pericos"], jugos: ["Avena", "Maracuyá"] } },
  { id: "d2", nombre: "Desayuno Especial", precio: 10000, categoria: "Desayunos", disponible: true, imagen: "/desayuno-huevo.jpg", config: { acompanamiento: ["Patacón", "Arepa"], proteina: ["Carne desmechada", "Pollo desmechado"], jugos: ["Avena", "Maracuyá"] } },
  { id: "MMuffStcgfJe5ow5X4qV", nombre: "Jugo Natural Helado", precio: 0, categoria: "Bebidas", disponible: true, imagen: "/jugo-natural.jpg", sabores: [{ nombre: "Avena", disponible: true }, { nombre: "Maracuyá", disponible: true }], tamanos: [{ nombre: "Pequeño", precio: 1000, disponible: true }, { nombre: "Mediano", precio: 1500, disponible: true }, { nombre: "Grande", precio: 2000, disponible: true }] },
  { id: "b1", nombre: "Coca-Cola", precio: 0, categoria: "Bebidas", disponible: true, imagen: "/cocacola.jpg", tamanos: [{ nombre: "Mini", precio: 2500, disponible: true }, { nombre: "Personal", precio: 3500, disponible: true }, { nombre: "Familiar", precio: 6500, disponible: true }] },
  { id: "b2", nombre: "Pony Malta", precio: 0, categoria: "Bebidas", disponible: true, imagen: "/malta.jpg", tamanos: [{ nombre: "Mini", precio: 2500, disponible: true }, { nombre: "Personal", precio: 3500, disponible: true }] },
  { id: "b3", nombre: "Agua Cielo", precio: 2000, categoria: "Bebidas", disponible: true, imagen: "/agua.jpg"},
  { id: "b4", nombre: "Tinto Tradicional", precio: 1000, categoria: "Bebidas", disponible: true, imagen: "/tinto.jpg" },
  { id: "b5", nombre: "Café con Leche", precio: 1500, categoria: "Bebidas", disponible: true, imagen: "/cafe-leche.jpg" },
  { id: "b6", nombre: "Chocolate Caliente", precio: 1500, categoria: "Bebidas", disponible: true, imagen: "/chocolate.jpg", sabores: [{ nombre: "Con Leche", disponible: true }, { nombre: "Sin Leche", disponible: true }] },
  { id: "b7", nombre: "Aromáticas", precio: 1000, categoria: "Bebidas", disponible: true, imagen: "/aromática.jpg" , sabores: [{ nombre: "Manzanilla", disponible: true},{nombre: "Hierbabuena", disponible: true},{nombre: "Limoncillo", disponible: true},{nombre: "Frutos Rojos", disponible: true}]},
  { id: "milo1", nombre: "Milo Refrescante", precio: 4000, categoria: "Bebidas", disponible: true, imagen: "/milo.jpg" }, 
  { id: "lzEcQicq9WUrxw7FEaq7", nombre: "Arroz Especial del Día", precio: 6000, categoria: "Arroces", disponible: true, imagen: "/arroz-pollo.jpg" }
];

const extrasArrozBase = [
  { id: 'tajada', nombre: "Tajadas", disponible: true, precio: 0 },
  { id: 'yuca', nombre: "Yuca", disponible: true, precio: 0 },
  { id: 'huevo', nombre: "Huevo Cocido", disponible: true, precio: 1000 },
  { id: 'queso', nombre: "Tajada de Queso", disponible: true, precio: 1000 }
];

const salsasIniciales = [
  { id: "roja", nombre: "🔴 Roja", disponible: true },
  { id: "rosada", nombre: "💗 Rosada", disponible: true },
  { id: "pique", nombre: "🔥 Pique", disponible: true },
  { id: "suero", nombre: "🥛 Suero", disponible: true },
  { id: "suero_p", nombre: "🥛🔥 Suero Picante", disponible: true }
];

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [tabActiva, setTabActiva] = useState("productos"); 
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [manualOverride, setManualOverride] = useState(true); 
  const [categoriaActiva, setCategoriaActiva] = useState("Fritos");
  const [productosFB, setProductosFB] = useState([]);
  const [extrasFB, setExtrasFB] = useState([]);
  const [salsasFB, setSalsasFB] = useState([]);
  const [pedidosFB, setPedidosFB] = useState([]); 
  const [pedido, setPedido] = useState([]);
  const [selecciones, setSelecciones] = useState({});
  const [cantidades, setCantidades] = useState({});
  const [salsasElegidas, setSalsasElegidas] = useState([]);
  const [notificacion, setNotificacion] = useState("");
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [metodoPago, setMetodoPago] = useState("");
  const [notas, setNotas] = useState("");
  const [agradecimiento, setAgradecimiento] = useState(false);
  const [mesa, setMesa] = useState(null);

  const hoy = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"][new Date().getDay()];
  const tipoArrozHoy = ["lunes", "miércoles", "viernes"].includes(hoy) ? "Pollo" : "Cerdo";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mesaURL = params.get('mesa');
    if (mesaURL) { setMesa(mesaURL); setDireccion(`Mesa ${mesaURL}`); }
  }, []);

  useEffect(() => {
    const unsubProd = onSnapshot(collection(db, "productos"), (s) => setProductosFB(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubExtras = onSnapshot(collection(db, "extrasArroz"), (s) => setExtrasFB(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubSalsas = onSnapshot(collection(db, "salsas"), (s) => setSalsasFB(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubTienda = onSnapshot(doc(db, "ajuste", "tienda"), (s) => { if (s.exists()) setManualOverride(s.data().abierta); });
    const qPedidos = query(collection(db, "pedidos"), orderBy("timestamp", "desc"));
    const unsubPedidos = onSnapshot(qPedidos, (s) => setPedidosFB(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubProd(); unsubExtras(); unsubSalsas(); unsubTienda(); unsubPedidos(); };
  }, []);

  useEffect(() => {
    const p = localStorage.getItem("pedido_mono_storage");
    if (p) setPedido(JSON.parse(p));
  }, []);

  useEffect(() => {
    localStorage.setItem("pedido_mono_storage", JSON.stringify(pedido));
  }, [pedido]);

  const fusionar = (base, fb) => {
    const mapa = {};
    base.forEach(p => mapa[p.id] = { ...p });
    fb.forEach(p => { if (mapa[p.id]) mapa[p.id] = { ...mapa[p.id], ...p }; });
    return Object.values(mapa);
  };

  const productosMostrar = fusionar(productosBase, productosFB);
  const extrasMostrar = fusionar(extrasArrozBase, extrasFB);
  const salsasMostrar = fusionar(salsasIniciales, salsasFB);

  const guardarCambio = async (col, id, datos) => {
    try { await setDoc(doc(db, col, id), datos, { merge: true }); } catch (e) { console.error(e); }
  };

  const agregarAlCarrito = (p) => {
    const sel = selecciones[p.id] || {};
    const cant = cantidades[p.id] || 1;
    if (p.disponible === false) return alert("Agotado");
    if (p.opciones && !sel.sabor && p.categoria === "Fritos") return alert("Elige un sabor");
    
    let precioB = p.precio || 0;
    if (sel.tamano) precioB = sel.tamano.precio || 0;
    const extrasP = (sel.extras || []).reduce((acc, n) => acc + (extrasMostrar.find(e => e.nombre === n)?.precio || 0), 0);
    const subtotal = (precioB + extrasP + (sel.agrandar ? 1000 : 0)) * cant;
    
    let det = `${sel.sabor || ''} ${sel.tamano?.nombre || ''} ${sel.extras?.length > 0 ? 'Ex: '+sel.extras.join(', ') : ''}`;
    if (p.categoria === "Desayunos") det += `(${sel.acompanamiento}, ${sel.huevos || sel.proteina}, ${sel.jugo})`;
    
    setPedido([...pedido, { idUnico: Date.now(), nombre: p.nombre, cantidad: cant, subtotal, detalle: det.trim() }]);
    setNotificacion("¡Añadido! 🥟");
    setTimeout(() => setNotificacion(""), 2000);
  };

  // 🚀 LÓGICA DE PEDIDO MEJORADA
  const procesarPedido = async () => {
    if (!mesa && (!nombre || !direccion || !metodoPago)) {
        return alert("Para domicilios necesitamos Nombre, Dirección y Pago");
    }

    const tComida = pedido.reduce((acc, i) => acc + i.subtotal, 0);
    const tFinal = tComida + (mesa ? 0 : (tComida < 8000 ? 2000 : 0));
    const horaActual = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

    const idPedido = `ORD-${Date.now()}`;
    await setDoc(doc(db, "pedidos", idPedido), {
      nombre: mesa ? "Cliente Local" : nombre,
      ubicacion: mesa ? `MESA ${mesa}` : direccion,
      productos: pedido,
      salsas: salsasElegidas,
      total: tFinal,
      pago: mesa ? "Pago en Caja" : metodoPago,
      timestamp: Date.now(),
      hora: horaActual,
      notas
    });

    if (mesa) {
      setAgradecimiento(true);
      setPedido([]);
    } else {
      const lista = pedido.map(i => `• ${i.cantidad}x ${i.nombre} (${i.detalle})`).join('\n');
      const msg = `*🛵 DOMICILIO*\n👤: ${nombre}\n🧾:\n${lista}\n💰: $${tFinal.toLocaleString()}\n💳: ${metodoPago}\n📝: ${notas}`;
      window.open(`https://wa.me/573148686455?text=${encodeURIComponent(msg)}`);
      setAgradecimiento(true);
      setPedido([]);
    }
  };

  const eliminarDelCarrito = (idUnico) => setPedido(pedido.filter(item => item.idUnico !== idUnico));
  const vaciarCarrito = () => { if(window.confirm("¿Borrar todo el pedido?")) setPedido([]); };

  // ==========================================
  // 🔴 VISTA ADMINISTRADOR (CON MONITOR DE COBRO)
  // ==========================================
  if (isAdmin) {
    return (
      <div style={{padding: '20px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif'}}>
        <div style={{maxWidth:'850px', margin:'0 auto'}}>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'25px', alignItems: 'center'}}>
            <h1 style={{color: MONO_NARANJA}}>Panel Mono 🐒</h1>
            <button onClick={() => setIsAdmin(false)} style={{padding:'10px 15px', borderRadius:'10px', background:MONO_TEXTO, color:'white', border:'none', cursor:'pointer'}}>Cerrar</button>
          </div>

          <div style={{display:'flex', gap:'10px', marginBottom:'25px', background:'#e2e8f0', padding:'5px', borderRadius:'15px'}}>
             <button onClick={() => setTabActiva("productos")} style={{flex:1, padding:'12px', borderRadius:'10px', border:'none', fontWeight:'bold', cursor:'pointer', background: tabActiva === "productos" ? 'white' : 'transparent', boxShadow: tabActiva === "productos" ? '0 2px 5px rgba(0,0,0,0.1)' : 'none'}}>📦 Productos</button>
             <button onClick={() => setTabActiva("pedidos")} style={{flex:1, padding:'12px', borderRadius:'10px', border:'none', fontWeight:'bold', cursor:'pointer', background: tabActiva === "pedidos" ? 'white' : 'transparent', boxShadow: tabActiva === "pedidos" ? '0 2px 5px rgba(0,0,0,0.1)' : 'none'}}>📝 Pedidos ({pedidosFB.length})</button>
             <button onClick={() => setTabActiva("mesas")} style={{flex:1, padding:'12px', borderRadius:'10px', border:'none', fontWeight:'bold', cursor:'pointer', background: tabActiva === "mesas" ? 'white' : 'transparent', boxShadow: tabActiva === "mesas" ? '0 2px 5px rgba(0,0,0,0.1)' : 'none'}}>🪑 Mesas QR</button>
          </div>

          {/* TAB: PRODUCTOS */}
          {tabActiva === "productos" && (
            <>
              <div style={{background:'white', padding:'20px', borderRadius:'20px', marginBottom:'20px', display:'flex', justifyContent:'space-between', alignItems:'center', border:`2px solid ${MONO_VERDE}`}}>
                <strong>Control Global Tienda</strong>
                <MiniSwitch activo={manualOverride} onClick={() => guardarCambio("ajuste", "tienda", { abierta: !manualOverride })} />
              </div>
              {["Fritos", "Desayunos", "Arroces", "Bebidas"].map(cat => (
                <div key={cat} style={{background:'white', padding:'20px', borderRadius:'25px', marginBottom:'20px', boxShadow:'0 2px 10px rgba(0,0,0,0.05)'}}>
                  <h3 style={{marginTop:0, borderBottom:'2px solid #f1f5f9', paddingBottom:'10px'}}>{cat}</h3>
                  {productosMostrar.filter(p => p.categoria === cat).map(p => (
                    <div key={p.id} style={{padding:'12px 0', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <span style={{color: p.disponible ? '#333' : '#ccc'}}>{p.nombre}</span>
                      <MiniSwitch activo={p.disponible} onClick={() => guardarCambio("productos", p.id, { disponible: !p.disponible })} />
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}

          {/* TAB: PEDIDOS (MONITOR DE COBRO) */}
          {tabActiva === "pedidos" && (
            <div style={{display:'grid', gap:'15px'}}>
              {pedidosFB.length === 0 ? ( <div style={{textAlign:'center', padding:'40px', background:'white', borderRadius:'20px'}}>No hay pedidos pendientes 🐒💤</div> ) : (
                pedidosFB.map(p => {
                  const esMesa = p.ubicacion?.includes('MESA');
                  return (
                    <div key={p.id} style={{background:'white', padding:'20px', borderRadius:'20px', borderLeft:`12px solid ${esMesa ? MONO_NARANJA : MONO_VERDE}`, boxShadow:'0 4px 6px rgba(0,0,0,0.05)'}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                        <div>
                          <h2 style={{margin:0, color: esMesa ? MONO_NARANJA : MONO_VERDE}}>{p.ubicacion}</h2>
                          <p style={{margin:0, fontSize:'14px', color:'#666'}}>{p.hora} - {p.nombre}</p>
                        </div>
                        <button onClick={() => { if(window.confirm("¿Orden despachada y cobrada?")) deleteDoc(doc(db, "pedidos", p.id)) }} style={{background:MONO_TEXTO, color:'white', border:'none', padding:'12px 20px', borderRadius:'12px', fontWeight:'bold', cursor:'pointer'}}>LISTO ✅</button>
                      </div>
                      <div style={{background:'#f8fafc', padding:'15px', borderRadius:'15px', marginTop:'15px'}}>
                        {p.productos?.map((item, idx) => ( <div key={idx} style={{fontSize:'16px', marginBottom:'5px'}}>• <strong>{item.cantidad}x</strong> {item.nombre} <small style={{color:'#666'}}>({item.detalle})</small></div> ))}
                        {p.salsas?.length > 0 && <div style={{marginTop:'10px', fontSize:'13px', color:'#555'}}>🍯 Salsas: {p.salsas.join(', ')}</div>}
                      </div>

                      {/* SECCIÓN DE CUENTA / COBRO */}
                      <div style={{marginTop:'20px', display:'flex', justifyContent:'space-between', alignItems:'center', background: esMesa ? '#fff7ed' : '#f0fdf4', padding:'15px', borderRadius:'15px', border: `1px dashed ${esMesa ? MONO_NARANJA : MONO_VERDE}`}}>
                          <div>
                              <span style={{fontSize:'12px', fontWeight:'bold', display:'block', color:'#666'}}>PAGO: {p.pago}</span>
                              <span style={{fontSize:'18px', fontWeight:'900'}}>TOTAL CUENTA:</span>
                          </div>
                          <strong style={{fontSize:'32px', color: MONO_TEXTO}}>${p.total?.toLocaleString()}</strong>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB: GENERADOR DE QR REPARADO */}
          {tabActiva === "mesas" && (
            <div style={{background:'white', padding:'30px', borderRadius:'30px'}}>
              <h2 style={{marginTop:0}}>Generador QR Dinámico 🏁</h2>
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:'20px'}}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => {
                  const base = window.location.origin; // Detecta automáticamente el link de Vercel
                  const urlMesa = `${base}/?mesa=${n}`;
                  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(urlMesa)}`;
                  return (
                    <div key={n} style={{border:'2px solid #eee', borderRadius:'20px', padding:'15px', textAlign:'center', background:'white'}}>
                      <div style={{marginBottom:'10px', fontWeight:'900', color:MONO_NARANJA}}>MESA {n}</div>
                      <img src={qrUrl} alt={`Mesa ${n}`} style={{width:'100%', borderRadius:'10px'}} />
                      <a href={qrUrl} target="_blank" rel="noreferrer" style={{fontSize:'11px', color:'#3b82f6', textDecoration:'none', marginTop:'10px', display:'block'}}>Abrir Imagen</a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // 🟡 VISTA CLIENTE
  // ==========================================
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#fffcf5', minHeight: '100vh', paddingBottom: '120px', color: MONO_TEXTO }}>
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      
      {notificacion && <div style={{position:'fixed', top:'20px', left:'50%', transform:'translateX(-50%)', background: MONO_VERDE, color:'white', padding:'15px 30px', borderRadius:'50px', zIndex: 10000, fontWeight:'bold', boxShadow:'0 5px 15px rgba(0,0,0,0.1)'}}>{notificacion}</div>}
      
      {mostrarLogin && (
        <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.85)', zIndex:40000, display:'flex', justifyContent:'center', alignItems:'center'}}>
          <div style={{background:'white', padding:'30px', borderRadius:'30px', textAlign:'center', width:'90%', maxWidth:'350px'}}>
            <h3 style={{marginBottom:'20px'}}>Acceso Admin</h3>
            <input type="password" placeholder="PIN" onChange={(e) => setPinInput(e.target.value)} style={{width:'100%', padding:'15px', borderRadius:'15px', border:'1px solid #ddd', marginBottom:'15px', textAlign:'center', fontSize:'18px'}} />
            <button onClick={() => { if(pinInput === "mono2026") { setIsAdmin(true); setMostrarLogin(false); } else { alert("PIN Incorrecto"); } }} style={{width:'100%', background:MONO_NARANJA, color:'white', border:'none', padding:'15px', borderRadius:'15px', fontWeight:'900', cursor:'pointer'}}>Entrar</button>
            <button onClick={() => setMostrarLogin(false)} style={{marginTop:'15px', background:'none', border:'none', color:'#999', cursor:'pointer'}}>Cancelar</button>
          </div>
        </div>
      )}

      {agradecimiento && (
        <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:MONO_NARANJA, zIndex:30000, display:'flex', justifyContent:'center', alignItems:'center', textAlign:'center', color:'white', padding:'20px'}}>
          <div><span style={{fontSize:'80px'}}>🐒</span><h2>¡Pedido Recibido!</h2><p>El Mono ya está trabajando en tu orden.</p><button onClick={() => setAgradecimiento(false)} style={{marginTop:'30px', background:'white', color:MONO_NARANJA, border:'none', padding:'15px 40px', borderRadius:'50px', fontWeight:'900', cursor:'pointer'}}>Volver al Menú</button></div>
        </div>
      )}

      <header style={{textAlign: 'center', background: 'white', borderRadius: '0 0 50px 50px', marginBottom: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', overflow:'hidden'}}>
        <img src="/logo-fritos-el-mono.jpg" alt="Logo" style={{width: '100%', height: '220px', objectFit: 'cover'}} />
        <div style={{padding: '25px 0'}}>
            <h1 onClick={() => setMostrarLogin(true)} style={{color: MONO_NARANJA, margin:'0', fontSize: '2.5rem', fontWeight: '900', cursor:'pointer'}}>Fritos El Mono 🐒</h1>
        </div>
      </header>

      <div className="no-scrollbar" style={{ display: 'flex', gap: '12px', marginBottom: '40px', overflowX: 'auto', padding: '0 20px' }}>
        {["Fritos", "Desayunos", "Arroces", "Bebidas"].map(cat => (
          <button key={cat} onClick={() => setCategoriaActiva(cat)} style={{ padding: '14px 28px', borderRadius: '30px', border: 'none', backgroundColor: categoriaActiva === cat ? MONO_NARANJA : 'white', color: categoriaActiva === cat ? 'white' : MONO_TEXTO, fontWeight: 'bold', flexShrink: 0, boxShadow:'0 4px 10px rgba(0,0,0,0.05)', cursor:'pointer' }}>{cat}</button>
        ))}
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '30px', padding: '0 20px', maxWidth:'1200px', margin:'0 auto'}}>
        {productosMostrar.filter(p => p.categoria === categoriaActiva).map(p => {
            const sel = selecciones[p.id] || {};
            const cant = cantidades[p.id] || 1;
            const precioActual = p.tamanos ? (sel.tamano?.precio || p.tamanos[0]?.precio || 0) : (p.precio || 0);
            return (
              <div key={p.id} style={{background: 'white', borderRadius: '40px', padding: '20px', boxShadow: '0 10px 20px rgba(0,0,0,0.02)', border:'1px solid #f1f5f9', opacity: p.disponible === false ? 0.6 : 1}}>
                <img src={p.imagen} alt={p.nombre} style={{ width: '100%', height: '180px', borderRadius: '25px', objectFit: 'cover' }} />
                <h3 style={{margin: '15px 0 5px 0', fontWeight: '800'}}>{p.nombre}</h3>
                <p style={{color: MONO_NARANJA, fontWeight: '900', fontSize: '24px', margin:'0 0 15px 0'}}>${precioActual.toLocaleString()}</p>
                
                {(p.opciones || p.sabores) && (
                  <div style={{display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px'}}>
                    {(p.opciones || p.sabores).filter(o => o.disponible).map(o => (
                      <button key={o.nombre} onClick={() => setSelecciones({...selecciones, [p.id]: {...sel, sabor: o.nombre}})} style={{padding:'8px 12px', borderRadius:'10px', border:'1px solid #ddd', background: sel.sabor === o.nombre ? MONO_NARANJA : 'white', color: sel.sabor === o.nombre ? 'white' : '#333', fontWeight:'bold', cursor:'pointer'}}>{o.nombre}</button>
                    ))}
                  </div>
                )}

                {p.tamanos && (
                  <div style={{display: 'flex', gap: '5px', marginBottom: '10px'}}>
                    {p.tamanos.filter(t => t.disponible).map(t => (
                      <button key={t.nombre} onClick={() => setSelecciones({...selecciones, [p.id]: {...sel, tamano: t}})} style={{padding:'8px 12px', borderRadius:'10px', border:'1px solid #ddd', background: sel.tamano?.nombre === t.nombre ? MONO_NARANJA : 'white', color: sel.tamano?.nombre === t.nombre ? 'white' : '#333', fontWeight:'bold', cursor:'pointer'}}>{t.nombre}</button>
                    ))}
                  </div>
                )}

                <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'15px', marginBottom:'15px'}}>
                   <button onClick={() => setCantidades({...cantidades, [p.id]: Math.max(1, cant - 1)})} style={{width:'40px', height:'40px', borderRadius:'50%', border:'1px solid #ddd', cursor:'pointer'}}>-</button>
                   <span style={{fontWeight:'900', fontSize:'20px'}}>{cant}</span>
                   <button onClick={() => setCantidades({...cantidades, [p.id]: cant + 1})} style={{width:'40px', height:'40px', borderRadius:'50%', background:MONO_NARANJA, color:'white', border:'none', cursor:'pointer'}}>+</button>
                </div>
                <button onClick={() => agregarAlCarrito(p)} disabled={p.disponible === false || !manualOverride} style={{background: (p.disponible !== false && manualOverride) ? MONO_NARANJA : '#ccc', color:'white', border:'none', padding:'18px', borderRadius:'20px', fontWeight:'900', cursor:'pointer', width:'100%'}}>{p.disponible === false ? 'AGOTADO' : 'Añadir 🛒'}</button>
              </div>
            );
        })}
      </div>

      {/* TICKET DE PEDIDO */}
      {pedido.length > 0 && (
        <div style={{ maxWidth: '750px', margin: '50px auto 100px', background: 'white', padding: '40px', borderRadius: '40px', border: `5px solid ${MONO_NARANJA}`, boxShadow: '0 20px 45px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: '900', margin: 0 }}>🛒 Tu Pedido</h2>
            <button onClick={vaciarCarrito} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Vaciar Todo</button>
          </div>

          {pedido.map(item => (
            <div key={item.idUnico} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', padding: '15px 0', alignItems: 'center' }}>
              <span style={{flex: 1}}><strong>{item.cantidad}x</strong> {item.nombre} <br /><small>{item.detalle}</small></span>
              <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                <strong style={{fontSize: '18px'}}>${item.subtotal.toLocaleString()}</strong>
                <button onClick={() => eliminarDelCarrito(item.idUnico)} style={{background:'none', border:'none', color:'#ef4444', fontSize:'20px', cursor:'pointer', padding:'5px'}}>❌</button>
              </div>
            </div>
          ))}

          <div style={{ marginTop: '30px', background: '#f8fafc', padding: '25px', borderRadius: '25px' }}>
            <h3 style={{margin: '0 0 15px 0'}}>Salsas:</h3>
            <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
              {salsasMostrar.filter(s => s.disponible).map(s => (
                <button key={s.id} onClick={() => setSalsasElegidas(salsasElegidas.includes(s.nombre) ? salsasElegidas.filter(x => x !== s.nombre) : [...salsasElegidas, s.nombre])} style={{padding:'10px 15px', borderRadius:'12px', border: salsasElegidas.includes(s.nombre) ? `2px solid ${MONO_NARANJA}` : '1px solid #ddd', background: salsasElegidas.includes(s.nombre) ? '#fff7ed' : 'white', cursor:'pointer', fontWeight:'bold'}}>{s.nombre}</button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '20px', textAlign: 'right' }}>
             <p>Subtotal: <strong>${pedido.reduce((acc, i) => acc + i.subtotal, 0).toLocaleString()}</strong></p>
             <p>Domicilio: <strong>{mesa ? '¡LOCAL!' : (pedido.reduce((acc, i) => acc + i.subtotal, 0) < 8000 ? '$2.000' : '¡GRATIS!')}</strong></p>
             <h2 style={{ color: MONO_NARANJA, fontSize: '38px', fontWeight: '900' }}>Total: ${(pedido.reduce((acc, i) => acc + i.subtotal, 0) + (mesa ? 0 : (pedido.reduce((acc, i) => acc + i.subtotal, 0) < 8000 ? 2000 : 0))).toLocaleString()}</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '25px' }}>
            {/* CAMPOS CONDICIONALES: Solo se ven si NO es mesa */}
            {!mesa && (
              <>
                <input type="text" placeholder="Tu nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} style={{ padding: '18px', borderRadius: '15px', border: '1px solid #ddd' }} />
                <input type="text" placeholder="Dirección exacta" value={direccion} onChange={(e) => setDireccion(e.target.value)} style={{ padding: '18px', borderRadius: '15px', border: '1px solid #ddd' }} />
                <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} style={{ padding: '18px', borderRadius: '15px', border: '1px solid #ddd', fontWeight: 'bold' }}>
                  <option value="">-- ¿Cómo pagas? --</option><option value="Efectivo">Efectivo</option><option value="Nequi">Nequi</option>
                </select>
              </>
            )}

            {/* AVISO DE MESA */}
            {mesa && (
              <div style={{ padding: '18px', background: '#ecfdf5', borderRadius: '15px', border: '2px solid #10b981', color: '#065f46', fontWeight: 'bold', textAlign: 'center' }}>
                📍 Estas pidiendo desde la MESA {mesa}
              </div>
            )}

            <textarea placeholder="Notas opcionales..." value={notas} onChange={(e) => setNotas(e.target.value)} style={{ padding: '18px', borderRadius: '15px', border: '1px solid #ddd', height: '80px' }} />
            
            <button 
              onClick={procesarPedido} 
              style={{ 
                background: mesa ? MONO_NARANJA : MONO_VERDE, 
                color: 'white', 
                padding: '22px', 
                borderRadius: '25px', 
                fontWeight: '900', 
                fontSize: '20px', 
                cursor:'pointer',
                border: 'none'
              }}
            >
              {mesa ? `PEDIR A COCINA 👨‍🍳` : `WhatsApp 📲`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}