import React, { useState, useEffect } from 'react';
import { db } from './firebaseConfig';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy, updateDoc } from "firebase/firestore";

// ==========================================
// 🔴 COMPONENTE UI: MINISWITCH
// ==========================================
const MiniSwitch = ({ activo, onClick }) => (
  <div onClick={onClick} style={{ width: '46px', height: '24px', backgroundColor: activo ? "#16a34a" : '#cbd5e1', borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: '0.3s', flexShrink: 0 }}>
    <div style={{ width: '18px', height: '18px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: activo ? '25px' : '3px', transition: '0.3s cubic-bezier(0.18, 0.89, 0.35, 1.15)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
  </div>
);

const MONO_NARANJA = "#f97316";
const MONO_VERDE = "#16a34a";
const MONO_AZUL = "#3b82f6";
const MONO_TEXTO = "#333333";

// Sonido de notificación (Base64 corto)
const beep = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ9vT19vT19vT19vT19vT19v");

// (Productos Base se mantienen igual...)
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
  { id: "lzEcQicq9WUrxw7FEaq7", nombre: "Arroz Especial del Día", precio: 6000, categoria: "Arroces", disponible: true, imagen: "/arroz-pollo.jpg" }
];

const extrasArrozBase = [{ id: 'huevo', nombre: "Huevo Cocido", disponible: true, precio: 1000 }, { id: 'queso', nombre: "Tajada de Queso", disponible: true, precio: 1000 }];
const salsasIniciales = [{ id: "roja", nombre: "🔴 Roja", disponible: true }, { id: "pique", nombre: "🔥 Pique", disponible: true }, { id: "suero", nombre: "🥛 Suero", disponible: true }];

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [tabActiva, setTabActiva] = useState("pedidos"); 
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [manualOverride, setManualOverride] = useState(true);
  const [categoriaActiva, setCategoriaActiva] = useState("Fritos");
  const [productosFB, setProductosFB] = useState([]);
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
    if (mesaURL) { setMesa(mesaURL); setDireccion(`Mesa ${mesaURL}`); setNombre("Cliente Local"); setMetodoPago("Caja"); }
  }, []);

  // 🔔 Sincronización con Sonido
  useEffect(() => {
    const q = query(collection(db, "pedidos"), orderBy("timestamp", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" && isAdmin) { beep.play().catch(() => {}); }
      });
      setPedidosFB(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [isAdmin]);

  useEffect(() => {
    const p = localStorage.getItem("mono_p");
    if (p) setPedido(JSON.parse(p));
  }, []);

  useEffect(() => { localStorage.setItem("mono_p", JSON.stringify(pedido)); }, [pedido]);

  const agregarAlCarrito = (p) => {
    const sel = selecciones[p.id] || {};
    const cant = cantidades[p.id] || 1;
    if (p.disponible === false) return alert("Agotado");
    if (p.opciones && !sel.sabor && p.categoria === "Fritos") return alert("Elige un sabor");
    let precioB = p.tamanos ? (sel.tamano?.precio || p.tamanos[0].precio) : (p.precio || 0);
    setPedido([...pedido, { idUnico: Date.now(), nombre: p.nombre, cantidad: cant, subtotal: precioB * cant, detalle: sel.sabor || '' }]);
    setNotificacion("¡Añadido! 🥟");
    setTimeout(() => setNotificacion(""), 2000);
  };

  const procesarPedido = async () => {
    if (!mesa && (!nombre || !direccion || !metodoPago)) return alert("Faltan datos");
    const total = pedido.reduce((acc, i) => acc + i.subtotal, 0);
    const id = `ORD-${Date.now()}`;
    await setDoc(doc(db, "pedidos", id), {
      nombre, ubicacion: mesa ? `MESA ${mesa}` : direccion, productos: pedido,
      total, pago: metodoPago, timestamp: Date.now(), hora: new Date().toLocaleTimeString([], { hour:'numeric', minute:'2-digit' }), 
      estado: "pendiente", notas
    });

    if (!mesa) {
      const msg = `*🛵 DOMICILIO*\n👤: ${nombre}\n💰: $${total.toLocaleString()}`;
      window.open(`https://wa.me/573148686455?text=${encodeURIComponent(msg)}`);
    }
    setAgradecimiento(true); setPedido([]);
  };

  const actualizarEstado = async (id, nuevoEstado) => {
    await updateDoc(doc(db, "pedidos", id), { estado: nuevoEstado });
  };

  // ==========================================
  // 🔴 VISTA ADMINISTRADOR (ESTADOS + CAJA)
  // ==========================================
  if (isAdmin) {
    const ventasHoy = pedidosFB.reduce((acc, p) => acc + p.total, 0);
    return (
      <div style={{padding: '20px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif'}}>
        <div style={{maxWidth:'1100px', margin:'0 auto'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', mb:'20px'}}>
             <h1 style={{color: MONO_NARANJA}}>Monitor POS 🐒</h1>
             <div style={{background: MONO_TEXTO, color:'white', padding:'10px 20px', borderRadius:'15px'}}>
                Ventas del Día: <strong>${ventasHoy.toLocaleString()}</strong>
             </div>
             <button onClick={() => setIsAdmin(false)} style={{padding:'10px 20px', borderRadius:'10px', background:'#eee', border:'none'}}>Salir</button>
          </div>

          <div style={{display:'flex', gap:'10px', mb:'25px'}}>
             <button onClick={() => setTabActiva("pedidos")} style={{flex:1, padding:'15px', borderRadius:'15px', border:'none', background: tabActiva === "pedidos" ? MONO_NARANJA : 'white', color: tabActiva === "pedidos" ? 'white' : MONO_TEXTO, fontWeight:'bold', cursor:'pointer'}}>🧾 Comandas</button>
             <button onClick={() => setTabActiva("mesas")} style={{flex:1, padding:'15px', borderRadius:'15px', border:'none', background: tabActiva === "mesas" ? MONO_NARANJA : 'white', color: tabActiva === "mesas" ? 'white' : MONO_TEXTO, fontWeight:'bold', cursor:'pointer'}}>🪑 Mesas</button>
          </div>

          {tabActiva === "pedidos" && (
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px, 1fr))', gap:'20px'}}>
              {pedidosFB.filter(p => p.estado !== "finalizado").map(p => (
                <div key={p.id} style={{background:'white', padding:'20px', borderRadius:'30px', borderLeft:`10px solid ${p.estado === 'pendiente' ? '#fbbf24' : p.estado === 'preparando' ? MONO_AZUL : MONO_VERDE}`, boxShadow:'0 5px 15px rgba(0,0,0,0.05)'}}>
                  <div style={{display:'flex', justifyContent:'space-between'}}>
                     <strong>{p.ubicacion}</strong>
                     <span style={{fontSize:'12px', background:'#eee', padding:'2px 8px', borderRadius:'10px'}}>{p.hora}</span>
                  </div>
                  <div style={{margin:'15px 0', fontSize:'14px'}}>
                    {p.productos.map((item, i) => ( <div key={i}>• {item.cantidad}x {item.nombre} <small>({item.detalle})</small></div> ))}
                    {p.notas && <div style={{mt:'10px', color:MONO_NARANJA, fontWeight:'bold'}}>⚠️ {p.notas}</div>}
                  </div>
                  <div style={{display:'flex', gap:'5px'}}>
                     {p.estado === 'pendiente' && <button onClick={() => actualizarEstado(p.id, 'preparando')} style={{flex:1, background:MONO_AZUL, color:'white', border:'none', padding:'10px', borderRadius:'10px', fontWeight:'bold'}}>Preparar 👨‍🍳</button>}
                     {p.estado === 'preparando' && <button onClick={() => actualizarEstado(p.id, 'listo')} style={{flex:1, background:MONO_VERDE, color:'white', border:'none', padding:'10px', borderRadius:'10px', fontWeight:'bold'}}>¡Listo! ✅</button>}
                     {p.estado === 'listo' && <button onClick={() => actualizarEstado(p.id, 'finalizado')} style={{flex:1, background:MONO_TEXTO, color:'white', border:'none', padding:'10px', borderRadius:'10px', fontWeight:'bold'}}>Entregado 🏁</button>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tabActiva === "mesas" && (
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'20px'}}>
              {[1,2,3,4,5,6,7,8,9,10].map(n => {
                const mesaPed = pedidosFB.filter(p => p.ubicacion === `MESA ${n}` && p.estado !== "finalizado");
                const total = mesaPed.reduce((acc, p) => acc + p.total, 0);
                return (
                  <div key={n} style={{background: mesaPed.length > 0 ? '#fff7ed' : 'white', padding:'20px', borderRadius:'25px', textAlign:'center', border: mesaPed.length > 0 ? `2px solid ${MONO_NARANJA}` : '1px solid #eee'}}>
                    <h3>MESA {n}</h3>
                    {mesaPed.length > 0 ? (
                      <>
                        <div style={{fontSize:'24px', fontWeight:'900', color:MONO_NARANJA}}>${total.toLocaleString()}</div>
                        <button onClick={() => mesaPed.forEach(p => actualizarEstado(p.id, 'finalizado'))} style={{marginTop:'10px', width:'100%', padding:'10px', background:MONO_TEXTO, color:'white', border:'none', borderRadius:'10px', fontWeight:'bold'}}>PAGAR CUENTA 💸</button>
                      </>
                    ) : <span style={{color:'#999'}}>Mesa Libre</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // (Vista Cliente se mantiene con tu diseño actual...)
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#fffcf5', minHeight: '100vh', paddingBottom: '120px' }}>
      {notificacion && <div style={{position:'fixed', top:'20px', left:'50%', transform:'translateX(-50%)', background: MONO_VERDE, color:'white', padding:'15px 30px', borderRadius:'50px', zIndex: 10000, fontWeight:'bold'}}>{notificacion}</div>}
      
      <header style={{textAlign:'center', padding:'40px', background:'white', borderRadius:'0 0 50px 50px', boxShadow:'0 5px 30px rgba(0,0,0,0.05)'}}>
        <h1 onClick={() => setMostrarLogin(true)} style={{color: MONO_NARANJA, fontSize:'2.5rem', fontWeight:'900', cursor:'pointer'}}>Fritos El Mono 🐒</h1>
        <div style={{marginTop:'10px', background:'#fff7ed', padding:'8px 20px', borderRadius:'20px', fontWeight:'bold', display:'inline-block'}}>Arroz de hoy: {tipoArrozHoy}</div>
      </header>

      {/* Grid de Productos (con tus estilos) */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px', padding: '25px'}}>
        {productosBase.filter(p => p.categoria === categoriaActiva).map(p => (
          <div key={p.id} style={{background:'white', padding:'20px', borderRadius:'40px', boxShadow:'0 10px 20px rgba(0,0,0,0.02)', textAlign:'center'}}>
            <h3>{p.nombre}</h3>
            <p style={{color:MONO_NARANJA, fontWeight:'900', fontSize:'22px'}}>${p.precio.toLocaleString()}</p>
            <button onClick={() => agregarAlCarrito(p)} style={{width:'100%', padding:'15px', background:MONO_NARANJA, color:'white', borderRadius:'20px', border:'none', fontWeight:'bold'}}>Añadir 🛒</button>
          </div>
        ))}
      </div>

      {pedido.length > 0 && (
        <div style={{ maxWidth: '600px', margin: '20px auto', background: 'white', padding: '30px', borderRadius: '40px', border: `5px solid ${MONO_NARANJA}` }}>
          <h2>🛒 Tu Pedido</h2>
          {pedido.map(item => (
            <div key={item.idUnico} style={{ display: 'flex', justifyContent: 'space-between', mb:'10px' }}>
              <span>{item.cantidad}x {item.nombre}</span>
              <strong>${item.subtotal.toLocaleString()}</strong>
            </div>
          ))}
          <div style={{textAlign:'right', mt:'20px', fontSize:'24px', fontWeight:'900'}}>Total: ${pedido.reduce((acc,i)=>acc+i.subtotal,0).toLocaleString()}</div>
          <button onClick={procesarPedido} style={{width:'100%', mt:'20px', padding:'20px', background: mesa ? MONO_NARANJA : MONO_VERDE, color:'white', borderRadius:'25px', border:'none', fontWeight:'900'}}>{mesa ? "PEDIR A COCINA 👨‍🍳" : "WHATSAPP 📲"}</button>
        </div>
      )}

      {/* LOGIN MODAL */}
      {mostrarLogin && (
        <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.9)', zIndex:20000, display:'flex', justifyContent:'center', alignItems:'center'}}>
          <div style={{background:'white', padding:'40px', borderRadius:'30px', textAlign:'center'}}>
            <h3>Acceso Mono Admin</h3>
            <input type="password" onChange={e => setPinInput(e.target.value)} style={{padding:'15px', borderRadius:'15px', textAlign:'center', fontSize:'20px'}} />
            <button onClick={() => { if(pinInput === "mono2026") setIsAdmin(true); setMostrarLogin(false); }} style={{display:'block', width:'100%', marginTop:'15px', padding:'15px', background:MONO_NARANJA, color:'white', border:'none', borderRadius:'15px', fontWeight:'bold'}}>Entrar</button>
          </div>
        </div>
      )}

      {agradecimiento && (
        <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:MONO_NARANJA, zIndex:10000, display:'flex', justifyContent:'center', alignItems:'center', color:'white', textAlign:'center'}}>
          <div><h1>¡Pedido Recibido!</h1><button onClick={() => setAgradecimiento(false)} style={{marginTop:'30px', padding:'15px 40px', borderRadius:'30px', border:'none', background:'white', color:MONO_NARANJA, fontWeight:'900'}}>Cerrar</button></div>
        </div>
      )}
    </div>
  );
}