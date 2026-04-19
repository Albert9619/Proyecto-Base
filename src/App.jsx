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

const MONO_NARANJA = "#f97316";
const MONO_VERDE = "#16a34a";
const MONO_TEXTO = "#333333";

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [tabActiva, setTabActiva] = useState("productos"); 
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [tiendaAbierta, setTiendaAbierta] = useState(true);
  const [manualOverride, setManualOverride] = useState(null); 
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
  const [horaEntrega, setHoraEntrega] = useState(""); 
  const [pagoCon, setPagoCon] = useState(""); 
  const [notas, setNotas] = useState("");
  const [agradecimiento, setAgradecimiento] = useState(false);
  const [mesa, setMesa] = useState(null);

  const hoy = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"][new Date().getDay()];
  const tipoArrozHoy = ["lunes", "miércoles", "viernes"].includes(hoy) ? "Pollo" : "Cerdo";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mesaURL = params.get('mesa');
    if (mesaURL) {
      setMesa(mesaURL);
      setDireccion(`Mesa ${mesaURL}`); 
    }
  }, []);

  // 🕒 LÓGICA DE CIERRE AUTOMÁTICO REPARADA
  useEffect(() => {
    const verificarEstado = () => {
      const ahora = new Date();
      const hora = ahora.getHours();
      const minutos = ahora.getMinutes();
      const tiempoActualEnMinutos = (hora * 60) + minutos;
      const estaEnHorario = tiempoActualEnMinutos >= 360 && tiempoActualEnMinutos < 690; // 6:00 AM a 11:30 AM
      setTiendaAbierta(estaEnHorario);
    };
    verificarEstado();
    const t = setInterval(verificarEstado, 30000);
    return () => clearInterval(t);
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
    try { await setDoc(doc(db, col, id), datos, { merge: true }); } 
    catch (e) { console.error(e); }
  };

  const eliminarPedido = async (id) => {
    if (window.confirm("¿Orden entregada? Se quitará de la pantalla.")) {
      await deleteDoc(doc(db, "pedidos", id));
    }
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
    setCantidades({ ...cantidades, [p.id]: 1 });
    setSelecciones({ ...selecciones, [p.id]: {} });
    setNotificacion("¡Añadido! 🥟");
    setTimeout(() => setNotificacion(""), 2000);
  };

  const enviarWhatsApp = async () => {
    if (!nombre || !direccion || !metodoPago) return alert("Faltan datos");
    const horaActual = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    const tComida = pedido.reduce((acc, i) => acc + i.subtotal, 0);
    const cDom = mesa ? 0 : (tComida < 8000 ? 2000 : 0);
    const tFinal = tComida + cDom;
    
    // 💾 GUARDAR EN FIREBASE ANTES DE ENVIAR
    const idPedido = `ORDEN-${Date.now()}`;
    await setDoc(doc(db, "pedidos", idPedido), {
      id: idPedido,
      nombre,
      ubicacion: mesa ? `MESA ${mesa}` : direccion,
      productos: pedido,
      salsas: salsasElegidas,
      total: tFinal,
      pago: metodoPago,
      timestamp: Date.now(),
      hora: horaActual,
      notas
    });

    const lista = pedido.map(i => `• ${i.cantidad}x ${i.nombre} (${i.detalle})`).join('\n');
    const msg = `*${mesa ? `🪑 MESA ${mesa}` : '🛵 DOMICILIO'}*\n👤: ${nombre}\n🧾: \n${lista}\n💰: $${tFinal.toLocaleString()}\n💳: ${metodoPago}\n📝: ${notas}`;
    
    window.open(`https://wa.me/573148686455?text=${encodeURIComponent(msg)}`);
    setAgradecimiento(true);
    setPedido([]);
  };

  // 🔴 PANEL DE ADMINISTRADOR (EL CAMBIO QUE PEDISTE)
  if (isAdmin) {
    return (
      <div style={{padding: '20px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif'}}>
        <div style={{maxWidth:'850px', margin:'0 auto'}}>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'30px', alignItems: 'center'}}>
            <h1 style={{color: MONO_NARANJA}}>Admin 🐒</h1>
            <button onClick={() => setIsAdmin(false)} style={{padding:'10px 15px', borderRadius:'10px', background:MONO_TEXTO, color:'white', border:'none'}}>Cerrar</button>
          </div>

          {/* 📋 TABS INTERFACE */}
          <div style={{display:'flex', gap:'10px', marginBottom:'25px', background:'#e2e8f0', padding:'5px', borderRadius:'15px'}}>
             <button onClick={() => setTabActiva("productos")} style={{flex:1, padding:'12px', borderRadius:'10px', border:'none', fontWeight:'bold', cursor:'pointer', background: tabActiva === "productos" ? 'white' : 'transparent', boxShadow: tabActiva === "productos" ? '0 2px 5px rgba(0,0,0,0.1)' : 'none'}}>📦 Productos</button>
             <button onClick={() => setTabActiva("pedidos")} style={{flex:1, padding:'12px', borderRadius:'10px', border:'none', fontWeight:'bold', cursor:'pointer', background: tabActiva === "pedidos" ? 'white' : 'transparent', boxShadow: tabActiva === "pedidos" ? '0 2px 5px rgba(0,0,0,0.1)' : 'none'}}>📝 Pedidos ({pedidosFB.length})</button>
          </div>

          {/* TAB 1: GESTIÓN DE DISPONIBILIDAD */}
          {tabActiva === "productos" && (
            <>
              <div style={{background:'white', padding:'20px', borderRadius:'20px', marginBottom:'20px', display:'flex', justifyContent:'space-between', alignItems:'center', border:`2px solid ${MONO_VERDE}`}}>
                <strong>Control de Tienda</strong>
                <MiniSwitch activo={manualOverride ?? tiendaAbierta} onClick={() => guardarCambio("ajuste", "tienda", { abierta: !(manualOverride ?? tiendaAbierta) })} />
              </div>

              {["Fritos", "Desayunos", "Arroces", "Bebidas"].map(cat => (
                <div key={cat} style={{background:'white', padding:'25px', borderRadius:'25px', marginBottom:'20px', boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
                  <h3 style={{marginTop:0, borderBottom:'2px solid #f1f5f9', paddingBottom:'10px'}}>{cat}</h3>
                  {productosMostrar.filter(p => p.categoria === cat).map(p => (
                    <div key={p.id} style={{padding:'12px 0', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <span style={{fontWeight: p.disponible ? '600' : '400', color: p.disponible ? '#000' : '#999'}}>{p.nombre}</span>
                      <MiniSwitch activo={p.disponible} onClick={() => guardarCambio("productos", p.id, { disponible: !p.disponible })} />
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}

          {/* TAB 2: MONITOR DE COCINA */}
          {tabActiva === "pedidos" && (
            <div style={{display:'grid', gap:'15px'}}>
              {pedidosFB.length === 0 ? (
                <div style={{textAlign:'center', padding:'40px', background:'white', borderRadius:'20px'}}>No hay pedidos por ahora 🐒💤</div>
              ) : (
                pedidosFB.map(p => (
                  <div key={p.id} style={{background:'white', padding:'20px', borderRadius:'20px', borderLeft:`8px solid ${p.ubicacion.includes('MESA') ? '#f97316' : '#3b82f6'}`, boxShadow:'0 4px 6px rgba(0,0,0,0.05)'}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                      <div>
                        <h3 style={{margin:0}}>{p.ubicacion}</h3>
                        <p style={{margin:0, fontSize:'14px', color:'#666'}}>{p.hora} - {p.nombre}</p>
                      </div>
                      <button onClick={() => eliminarPedido(p.id)} style={{background:'#16a34a', color:'white', border:'none', padding:'8px 15px', borderRadius:'8px', fontWeight:'bold', cursor:'pointer'}}>LISTO ✅</button>
                    </div>
                    <div style={{background:'#f8fafc', padding:'12px', borderRadius:'10px', marginTop:'15px'}}>
                      {p.productos.map((item, idx) => (
                        <div key={idx} style={{fontSize:'14px', marginBottom:'4px'}}>• <strong>{item.cantidad}x</strong> {item.nombre} <small>({item.detalle})</small></div>
                      ))}
                    </div>
                    {p.notas && <div style={{marginTop:'10px', color:MONO_NARANJA, fontSize:'13px'}}>📝 <em>"{p.notas}"</em></div>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 🟡 VISTA DEL CLIENTE (Mantiene toda tu lógica visual)
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#fffcf5', minHeight: '100vh', paddingBottom: '120px', color: MONO_TEXTO }}>
      <style>{`.card-mono { transition: 0.3s; } .card-mono:hover { transform: translateY(-10px); } .opcion-btn { padding: 10px; border-radius: 12px; border: 1px solid #ddd; background: white; cursor: pointer; font-weight: bold; font-size: 13px; } .opcion-btn.active { background: ${MONO_NARANJA}; color: white; border-color: ${MONO_NARANJA}; } .salsa-chip { padding: 12px; border-radius: 15px; border: 2px solid #eee; background: white; cursor: pointer; font-weight: bold; font-size: 13px; } .salsa-chip.active { border-color: ${MONO_NARANJA}; background: #fff7ed; color: ${MONO_NARANJA}; } .no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      
      {/* Modals Login y Agradecimiento */}
      {mostrarLogin && (
        <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.85)', zIndex:40000, display:'flex', justifyContent:'center', alignItems:'center'}}>
          <div style={{background:'white', padding:'30px', borderRadius:'30px', textAlign:'center', width:'90%', maxWidth:'350px'}}>
            <h3>Acceso Admin</h3>
            <input type="password" placeholder="PIN" onChange={(e) => setPinInput(e.target.value)} style={{width:'100%', padding:'15px', borderRadius:'15px', border:'1px solid #ddd', marginBottom:'15px', textAlign:'center'}} />
            <button onClick={() => { if(pinInput === "mono2026") { setIsAdmin(true); setMostrarLogin(false); } else { alert("Error"); } }} style={{width:'100%', background:MONO_NARANJA, color:'white', border:'none', padding:'15px', borderRadius:'15px', fontWeight:'bold'}}>Entrar</button>
          </div>
        </div>
      )}

      {agradecimiento && (
        <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:MONO_NARANJA, zIndex:30000, display:'flex', justifyContent:'center', alignItems:'center', textAlign:'center', color:'white', padding:'20px'}}>
          <div>
            <span style={{fontSize:'80px'}}>🐒</span>
            <h2>¡Pedido en camino!</h2>
            <button onClick={() => setAgradecimiento(false)} style={{marginTop:'30px', background:'white', color:MONO_NARANJA, padding:'15px 40px', borderRadius:'50px', border:'none', fontWeight:'bold'}}>Ok</button>
          </div>
        </div>
      )}

      <header style={{textAlign: 'center', background: 'white', borderRadius: '0 0 50px 50px', marginBottom: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', overflow:'hidden'}}>
        <img src="/logo-fritos-el-mono.jpg" alt="Logo" style={{width: '100%', height: '220px', objectFit: 'cover'}} />
        <div style={{padding: '25px 0'}}>
            <h1 onClick={() => setMostrarLogin(true)} style={{color: MONO_NARANJA, margin:'0', fontSize: '2.5rem', fontWeight: '900'}}>Fritos El Mono 🐒</h1>
        </div>
      </header>

      <div className="no-scrollbar" style={{ display: 'flex', gap: '12px', marginBottom: '40px', overflowX: 'auto', padding: '0 20px' }}>
        {["Fritos", "Desayunos", "Arroces", "Bebidas"].map(cat => (
          <button key={cat} onClick={() => setCategoriaActiva(cat)} style={{ padding: '14px 28px', borderRadius: '30px', border: 'none', backgroundColor: categoriaActiva === cat ? MONO_NARANJA : 'white', color: categoriaActiva === cat ? 'white' : MONO_TEXTO, fontWeight: 'bold', flexShrink: 0 }}>{cat}</button>
        ))}
      </div>

      {/* Grid de Productos */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '30px', padding: '0 20px'}}>
        {productosMostrar.filter(p => p.categoria === categoriaActiva).map(p => {
            const sel = selecciones[p.id] || {};
            const cant = cantidades[p.id] || 1;
            const precio = (p.tamanos && p.tamanos.length > 0) ? (sel.tamano?.precio || p.tamanos[0]?.precio) : p.precio;
            
            return (
              <div key={p.id} className="card-mono" style={{background: 'white', borderRadius: '40px', padding: '20px', boxShadow: '0 10px 20px rgba(0,0,0,0.02)', opacity: p.disponible === false ? 0.6 : 1}}>
                <img src={p.imagen} alt={p.nombre} style={{ width: '100%', height: '180px', borderRadius: '25px', objectFit: 'cover' }} />
                <h3>{p.nombre}</h3>
                <p style={{color: MONO_NARANJA, fontWeight: '900', fontSize: '22px'}}>${precio.toLocaleString()}</p>
                
                {(p.opciones || p.sabores) && (
                  <div style={{display: 'flex', gap: '5px', marginBottom: '10px'}}>{(p.opciones || p.sabores).filter(o => o.disponible).map(o => (
                    <button key={o.nombre} onClick={() => setSelecciones({...selecciones, [p.id]: {...sel, sabor: o.nombre}})} className={`opcion-btn ${sel.sabor === o.nombre ? 'active' : ''}`}>{o.nombre}</button>
                  ))}</div>
                )}

                <div style={{display:'flex', alignItems:'center', gap:'15px', marginBottom:'15px'}}>
                   <button onClick={() => setCantidades({...cantidades, [p.id]: Math.max(1, cant - 1)})} style={{width:'30px'}}>-</button>
                   <span>{cant}</span>
                   <button onClick={() => setCantidades({...cantidades, [p.id]: cant + 1})}>+</button>
                </div>
                <button onClick={() => agregarAlCarrito(p)} disabled={p.disponible === false} style={{background: p.disponible !== false ? MONO_NARANJA : '#ccc', width:'100%', color:'white', padding:'15px', borderRadius:'15px', border:'none', fontWeight:'bold'}}>Añadir 🛒</button>
              </div>
            );
        })}
      </div>

      {/* Carrito */}
      {pedido.length > 0 && (
        <div style={{ maxWidth: '750px', margin: '40px auto', background: 'white', padding: '30px', borderRadius: '40px', border: `4px solid ${MONO_NARANJA}` }}>
          <h2>🛒 Tu Orden</h2>
          {pedido.map(item => (
            <div key={item.idUnico} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
              <span>{item.cantidad}x {item.nombre} <br/> <small>{item.detalle}</small></span>
              <strong>${item.subtotal.toLocaleString()}</strong>
            </div>
          ))}

          <div style={{ marginTop: '20px', textAlign: 'right' }}>
             <p>Domicilio: <strong>{mesa ? '¡LOCAL!' : `$${domCosto.toLocaleString()}`}</strong></p>
             <h2 style={{ color: MONO_NARANJA }}>Total: ${(totalSinDom + (mesa ? 0 : domCosto)).toLocaleString()}</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
            <input type="text" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} style={{padding:'15px', borderRadius:'15px', border:'1px solid #ddd'}} />
            {!mesa ? (
              <input type="text" placeholder="Dirección" value={direccion} onChange={(e) => setDireccion(e.target.value)} style={{padding:'15px', borderRadius:'15px', border:'1px solid #ddd'}} />
            ) : (
              <div style={{padding:'15px', background:'#ecfdf5', borderRadius:'15px', color:'#065f46', textAlign:'center', fontWeight:'bold'}}>📍 MESA {mesa}</div>
            )}
            <textarea placeholder="Notas..." value={notas} onChange={(e) => setNotas(e.target.value)} style={{padding:'15px', borderRadius:'15px', border:'1px solid #ddd'}} />
            <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} style={{padding:'15px', borderRadius:'15px', border:'1px solid #ddd'}}>
              <option value="">-- Pago --</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Nequi">Nequi</option>
            </select>
            <button onClick={enviarWhatsApp} style={{ background: MONO_VERDE, color: 'white', padding: '20px', borderRadius: '20px', border: 'none', fontWeight: 'bold', fontSize: '18px' }}>WhatsApp 📲</button>
          </div>
        </div>
      )}
    </div>
  );
}