import React, { useState, useEffect } from 'react';
import { db } from './firebaseConfig';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy, addDoc } from "firebase/firestore";

// ==========================================
// 🔴 CONSTANTES Y ESTADOS OPERATIVOS
// ==========================================
const MONO_NARANJA = "#f97316";
const MONO_VERDE = "#16a34a";
const MONO_AZUL = "#3b82f6";
const MONO_TEXTO = "#333333";

const sonidoNotificacion = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ9vT19vT19vT19vT19vT19v");

// ==========================================
// 🔴 DATOS MAESTROS (RESTAURADOS)
// ==========================================
const productosBase = [
  { id: "1", nombre: "Empanada Crujiente", precio: 1500, categoria: "Fritos", disponible: true, imagen: "/empanada.jpg", opciones: [{ nombre: "Carne", disponible: true }, { nombre: "Pollo", disponible: true }, { nombre: "Arroz", disponible: true }] },
  { id: "2", nombre: "Papa Rellena de la Casa", precio: 2500, categoria: "Fritos", disponible: true, imagen: "/papa-rellena.jpg", opciones: [{ nombre: "Carne", disponible: true }, { nombre: "Huevo", disponible: true }] },
  { id: "3", nombre: "Pastel de Pollo Hojaldrado", precio: 2500, categoria: "Fritos", disponible: true, imagen: "/pastel-pollo.jpg" },
  { id: "4", nombre: "Arepa con Huevo y Carne", precio: 3500, categoria: "Fritos", disponible: true, imagen: "/api-logo.jpg" },
  { id: "7", nombre: "Palitos de Queso Costeño", precio: 2000, categoria: "Fritos", disponible: true, imagen: "/palito-queso.jpg" },
  { id: "d1", nombre: "Desayuno Tradicional", precio: 8000, categoria: "Desayunos", disponible: true, imagen: "/desayuno-carne.jpg", config: { acompanamiento: ["Patacón", "Arepa"], huevos: ["Revueltos", "Pericos"], jugos: ["Avena", "Maracuyá"] } },
  { id: "MMuffStcgfJe5ow5X4qV", nombre: "Jugo Natural Helado", precio: 0, categoria: "Bebidas", disponible: true, imagen: "/jugo-natural.jpg", sabores: [{ nombre: "Avena", disponible: true }, { nombre: "Maracuyá", disponible: true }], tamanos: [{ nombre: "Pequeño", precio: 1000, disponible: true }, { nombre: "Mediano", precio: 1500, disponible: true }, { nombre: "Grande", precio: 2000, disponible: true }] },
  { id: "b1", nombre: "Coca-Cola", precio: 0, categoria: "Bebidas", disponible: true, imagen: "/cocacola.jpg", tamanos: [{ nombre: "Mini", precio: 2500, disponible: true }, { nombre: "Personal", precio: 3500, disponible: true }, { nombre: "Familiar", precio: 6500, disponible: true }] },
  { id: "lzEcQicq9WUrxw7FEaq7", nombre: "Arroz Especial del Día", precio: 6000, categoria: "Arroces", disponible: true, imagen: "/arroz-pollo.jpg" }
];

const salsasIniciales = [{ id: "r", nombre: "🔴 Roja" }, { id: "p", nombre: "🔥 Pique" }, { id: "s", nombre: "🥛 Suero" }];

export default function App() {
  // --- ESTADOS DE ADMINISTRACIÓN ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [tabActiva, setTabActiva] = useState("pedidos");
  const [mostrarLogin, setMostrarLogin] = useState(false); // <--- REPARADO: Aquí estaba el error
  const [pinInput, setPinInput] = useState("");
  
  // --- ESTADOS DE DATOS ---
  const [productosFB, setProductosFB] = useState([]);
  const [pedidosFB, setPedidosFB] = useState([]);
  const [pedido, setPedido] = useState([]);
  const [manualOverride, setManualOverride] = useState(true);
  
  // --- ESTADOS DE CLIENTE ---
  const [mesa, setMesa] = useState(null);
  const [categoriaActiva, setCategoriaActiva] = useState("Fritos");
  const [selecciones, setSelecciones] = useState({});
  const [cantidades, setCantidades] = useState({});
  const [salsasElegidas, setSalsasElegidas] = useState([]);
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [metodoPago, setMetodoPago] = useState("");
  const [notas, setNotas] = useState("");
  const [agradecimiento, setAgradecimiento] = useState(false);
  const [notificacion, setNotificacion] = useState("");

  // 1. Efecto inicial: Detectar Mesa y cargar pedido local
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mesaURL = params.get('mesa');
    if (mesaURL) { 
      setMesa(mesaURL); 
      setNombre("Cliente Mesa " + mesaURL); 
      setMetodoPago("Caja"); 
    }
    const saved = localStorage.getItem("mono_p");
    if (saved) setPedido(JSON.parse(saved));
  }, []);

  // 2. Efecto Firebase: Productos y Pedidos (con sonido)
  useEffect(() => {
    const unsubProd = onSnapshot(collection(db, "productos"), (s) => setProductosFB(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const q = query(collection(db, "pedidos"), orderBy("timestamp", "desc"));
    const unsubPedidos = onSnapshot(q, (snapshot) => {
      const nuevos = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      if (nuevos.length > pedidosFB.length && pedidosFB.length > 0) {
        sonidoNotificacion.play().catch(() => {});
      }
      setPedidosFB(nuevos);
    });
    return () => { unsubProd(); unsubPedidos(); };
  }, [pedidosFB.length]);

  // Guardar carrito automáticamente
  useEffect(() => { localStorage.setItem("mono_p", JSON.stringify(pedido)); }, [pedido]);

  const productosMostrar = productosBase.map(p => {
    const pFB = productosFB.find(f => f.id === p.id);
    return pFB ? { ...p, ...pFB } : p;
  });

  const agregarAlCarrito = (p) => {
    const sel = selecciones[p.id] || {};
    const cant = cantidades[p.id] || 1;
    if (!p.disponible) return alert("Agotado temporalmente");
    if (p.opciones && !sel.sabor && p.categoria === "Fritos") return alert("Elige un sabor");

    let precioB = p.precio || 0;
    if (sel.tamano) precioB = sel.tamano.precio || 0;
    
    let det = `${sel.sabor || ''} ${sel.tamano?.nombre || ''}`;
    setPedido([...pedido, { idUnico: Date.now(), nombre: p.nombre, cantidad: cant, subtotal: precioB * cant, detalle: det.trim() }]);
    setNotificacion("¡Añadido! 🥟");
    setTimeout(() => setNotificacion(""), 2000);
  };

  const procesarPedido = async () => {
    if (!mesa && (!nombre || !direccion || !metodoPago)) return alert("Faltan datos de envío");
    const total = pedido.reduce((acc, i) => acc + i.subtotal, 0);

    await setDoc(doc(db, "pedidos", `ORD-${Date.now()}`), {
      nombre, ubicacion: mesa ? `MESA ${mesa}` : direccion, productos: pedido,
      salsas: salsasElegidas, total, pago: metodoPago, timestamp: Date.now(),
      hora: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      estado: "pendiente", notas
    });

    if (!mesa) {
      const lista = pedido.map(i => `• ${i.cantidad}x ${i.nombre}`).join('\n');
      window.open(`https://wa.me/573148686455?text=${encodeURIComponent(`*🛵 DOMICILIO*\n${lista}\n💰: $${total.toLocaleString()}`)}`);
    }
    setAgradecimiento(true); setPedido([]);
  };

  // ==========================================
  // 🔴 VISTA ADMINISTRADOR (SISTEMA POS)
  // ==========================================
  if (isAdmin) {
    return (
      <div style={{padding: '20px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif'}}>
        <div style={{maxWidth:'950px', margin:'0 auto'}}>
          <header style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
            <h1 style={{color: MONO_NARANJA}}>Monitor Mono 🐒</h1>
            <button onClick={() => setIsAdmin(false)} style={{padding:'10px 20px', borderRadius:'15px', border:'none', background:MONO_TEXTO, color:'white', cursor:'pointer'}}>Cerrar</button>
          </header>

          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'20px'}}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => {
              const mesaPedidos = pedidosFB.filter(p => p.ubicacion === `MESA ${n}`);
              if (mesaPedidos.length === 0) return null;
              const totalMesa = mesaPedidos.reduce((acc, p) => acc + p.total, 0);

              return (
                <div key={n} style={{background:'white', padding:'20px', borderRadius:'30px', border:`3px solid ${MONO_NARANJA}`, boxShadow:'0 10px 25px rgba(0,0,0,0.05)'}}>
                  <h2 style={{margin:0}}>MESA {n}</h2>
                  <div style={{margin:'15px 0', maxHeight:'300px', overflowY:'auto'}}>
                    {mesaPedidos.map(p => (
                      <div key={p.id} style={{padding:'10px', borderRadius:'15px', background: p.estado === 'pendiente' ? '#fffbeb' : p.estado === 'cocinando' ? '#eff6ff' : '#f0fdf4', marginBottom:'10px', border:'1px solid #eee'}}>
                        <div style={{fontSize:'12px', display:'flex', justifyContent:'space-between'}}>
                           <strong>{p.hora}</strong> <span>{p.estado.toUpperCase()}</span>
                        </div>
                        {p.productos.map((prod, i) => ( <div key={i} style={{fontSize:'14px'}}>• {prod.cantidad}x {prod.nombre} {prod.detalle}</div> ))}
                        <div style={{marginTop:'10px', display:'flex', gap:'5px'}}>
                           {p.estado === 'pendiente' && <button onClick={() => setDoc(doc(db, "pedidos", p.id), { estado: "cocinando" }, { merge: true })} style={{flex:1, background:MONO_AZUL, color:'white', border:'none', borderRadius:'8px', padding:'8px'}}>Cocinando</button>}
                           {p.estado === 'cocinando' && <button onClick={() => setDoc(doc(db, "pedidos", p.id), { estado: "listo" }, { merge: true })} style={{flex:1, background:MONO_VERDE, color:'white', border:'none', borderRadius:'8px', padding:'8px'}}>¡Listo!</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{fontSize:'32px', fontWeight:'900', textAlign:'center', padding:'15px', background:'#fff7ed', borderRadius:'20px'}}>
                    ${totalMesa.toLocaleString()}
                  </div>
                  <button onClick={async () => {
                    if(window.confirm(`¿Mesa ${n} pagada?`)) {
                      mesaPedidos.forEach(async (p) => {
                        await addDoc(collection(db, "ventas_historial"), { ...p, finalizado: Date.now() });
                        await deleteDoc(doc(db, "pedidos", p.id));
                      });
                    }
                  }} style={{width:'100%', marginTop:'15px', padding:'18px', background:MONO_TEXTO, color:'white', borderRadius:'15px', fontWeight:'bold', border:'none', cursor:'pointer'}}>COBRAR Y LIMPIAR 💸</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 🟡 VISTA CLIENTE
  // ==========================================
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#fffcf5', minHeight: '100vh', paddingBottom: '100px' }}>
      {notificacion && <div style={{position:'fixed', top:'20px', left:'50%', transform:'translateX(-50%)', background: MONO_VERDE, color:'white', padding:'12px 25px', borderRadius:'50px', zIndex: 10000, fontWeight:'bold'}}>{notificacion}</div>}
      
      <header style={{textAlign:'center', padding:'30px', background:'white', borderRadius:'0 0 50px 50px', boxShadow:'0 5px 20px rgba(0,0,0,0.05)'}}>
        <h1 onClick={() => setMostrarLogin(true)} style={{color: MONO_NARANJA, margin:0, cursor:'pointer'}}>Fritos El Mono 🐒</h1>
      </header>

      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '20px' }}>
        {["Fritos", "Desayunos", "Arroces", "Bebidas"].map(cat => (
          <button key={cat} onClick={() => setCategoriaActiva(cat)} style={{ padding: '10px 20px', borderRadius: '25px', border: 'none', background: categoriaActiva === cat ? MONO_NARANJA : 'white', fontWeight:'bold', cursor:'pointer' }}>{cat}</button>
        ))}
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', padding: '0 20px'}}>
        {productosMostrar.filter(p => p.categoria === categoriaActiva).map(p => {
            const sel = selecciones[p.id] || {};
            const cant = cantidades[p.id] || 1;
            const pActual = sel.tamano ? sel.tamano.precio : p.precio;
            return (
              <div key={p.id} style={{background: 'white', padding: '20px', borderRadius: '35px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', opacity: p.disponible ? 1 : 0.6}}>
                <img src={p.imagen} style={{ width: '100%', height: '160px', borderRadius: '25px', objectFit: 'cover' }} alt={p.nombre} />
                <h3 style={{margin:'15px 0 5px'}}>{p.nombre}</h3>
                <p style={{color: MONO_NARANJA, fontWeight: '900', fontSize:'22px'}}>${pActual.toLocaleString()}</p>
                
                {p.opciones && (
                  <div style={{display:'flex', gap:'5px', flexWrap:'wrap', marginBottom:'10px'}}>
                    {p.opciones.map(o => (
                      <button key={o.nombre} onClick={() => setSelecciones({...selecciones, [p.id]: {...sel, sabor: o.nombre}})} style={{padding:'6px 12px', borderRadius:'10px', border: sel.sabor === o.nombre ? `2px solid ${MONO_NARANJA}` : '1px solid #eee', background: sel.sabor === o.nombre ? '#fff7ed' : 'white'}}>{o.nombre}</button>
                    ))}
                  </div>
                )}

                <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'20px', marginBottom:'15px'}}>
                   <button onClick={() => setCantidades({...cantidades, [p.id]: Math.max(1, cant - 1)})} style={{width:'35px', height:'35px', borderRadius:'50%'}}>-</button>
                   <strong style={{fontSize:'20px'}}>{cant}</strong>
                   <button onClick={() => setCantidades({...cantidades, [p.id]: cant + 1})} style={{width:'35px', height:'35px', borderRadius:'50%', background:MONO_NARANJA, color:'white', border:'none'}}>+</button>
                </div>
                <button onClick={() => agregarAlCarrito(p)} disabled={!p.disponible} style={{width:'100%', padding:'15px', background:MONO_NARANJA, color:'white', borderRadius:'18px', border:'none', fontWeight:'bold', cursor:'pointer'}}>Añadir 🛒</button>
              </div>
            );
        })}
      </div>

      {pedido.length > 0 && (
        <div style={{ maxWidth: '650px', margin: '40px auto', background: 'white', padding: '30px', borderRadius: '40px', border: `5px solid ${MONO_NARANJA}`, boxShadow:'0 20px 40px rgba(0,0,0,0.1)' }}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
             <h2 style={{margin:0}}>🛒 Tu Ticket</h2>
             <button onClick={() => setPedido([])} style={{color:'red', border:'none', background:'none', fontWeight:'bold'}}>Vaciar</button>
          </div>
          {pedido.map(item => (
            <div key={item.idUnico} style={{ display: 'flex', justifyContent: 'space-between', padding:'12px 0', borderBottom:'1px solid #eee' }}>
              <span><strong>{item.cantidad}x</strong> {item.nombre} <br /><small>{item.detalle}</small></span>
              <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                <strong>${item.subtotal.toLocaleString()}</strong>
                <button onClick={() => setPedido(pedido.filter(i => i.idUnico !== item.idUnico))} style={{background:'none', border:'none', cursor:'pointer'}}>❌</button>
              </div>
            </div>
          ))}

          <div style={{marginTop:'25px', textAlign:'right'}}>
            <h2 style={{color:MONO_NARANJA, fontSize:'32px', fontWeight:'900'}}>Total: ${ pedido.reduce((acc, i) => acc + i.subtotal, 0).toLocaleString() }</h2>
          </div>

          {!mesa ? (
            <div style={{display:'flex', flexDirection:'column', gap:'10px', marginTop:'20px'}}>
               <input type="text" placeholder="Tu nombre" onChange={e => setNombre(e.target.value)} style={{padding:'15px', borderRadius:'12px', border:'1px solid #ddd'}} />
               <input type="text" placeholder="Dirección exacta" onChange={e => setDireccion(e.target.value)} style={{padding:'15px', borderRadius:'12px', border:'1px solid #ddd'}} />
               <select onChange={e => setMetodoPago(e.target.value)} style={{padding:'15px', borderRadius:'12px', border:'1px solid #ddd', fontWeight:'bold'}}>
                  <option value="">-- Pago --</option><option value="Efectivo">Efectivo</option><option value="Nequi">Nequi</option>
               </select>
            </div>
          ) : (
            <div style={{padding:'15px', background:'#ecfdf5', borderRadius:'15px', textAlign:'center', color:'#065f46', fontWeight:'bold', marginTop:'20px', border:'2px solid #10b981'}}>
               📍 PIDIENDO DESDE LA MESA {mesa}
            </div>
          )}
          
          <button onClick={procesarPedido} style={{width:'100%', padding:'22px', background: mesa ? MONO_NARANJA : MONO_VERDE, color:'white', borderRadius:'20px', border:'none', fontWeight:'900', fontSize:'20px', marginTop:'20px', cursor:'pointer'}}>
            {mesa ? "PEDIR A COCINA 👨‍🍳" : "WHATSAPP 📲"}
          </button>
        </div>
      )}

      {/* LOGIN MODAL */}
      {mostrarLogin && (
        <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.85)', zIndex:20000, display:'flex', justifyContent:'center', alignItems:'center'}}>
          <div style={{background:'white', padding:'40px', borderRadius:'30px', textAlign:'center'}}>
            <h3>Acceso Mono Admin</h3>
            <input type="password" onChange={e => setPinInput(e.target.value)} style={{padding:'15px', borderRadius:'15px', textAlign:'center', border:'1px solid #ddd'}} />
            <button onClick={() => { if(pinInput === "mono2026") setIsAdmin(true); setMostrarLogin(false); }} style={{display:'block', width:'100%', marginTop:'15px', padding:'15px', background:MONO_NARANJA, color:'white', border:'none', borderRadius:'15px', fontWeight:'bold'}}>Entrar</button>
            <button onClick={() => setMostrarLogin(false)} style={{marginTop:'10px', background:'none', border:'none', color:'#999'}}>Cancelar</button>
          </div>
        </div>
      )}

      {agradecimiento && (
        <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:MONO_NARANJA, zIndex:10000, display:'flex', justifyContent:'center', alignItems:'center', color:'white', textAlign:'center'}}>
          <div><h1>¡Pedido Recibido!</h1><button onClick={() => setAgradecimiento(false)} style={{padding:'15px 40px', borderRadius:'30px', border:'none', background:'white', color:MONO_NARANJA, fontWeight:'900', cursor:'pointer'}}>Volver</button></div>
        </div>
      )}
    </div>
  );
}