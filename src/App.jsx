import React, { useState, useEffect } from 'react';
import { db } from './firebaseConfig';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy, updateDoc } from "firebase/firestore";

// ==========================================
// 🔴 CONSTANTES DE DISEÑO
// ==========================================
const MONO_NARANJA = "#f97316";
const MONO_VERDE = "#16a34a";
const MONO_AZUL = "#3b82f6";
const MONO_TEXTO = "#333333";
const beep = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ9vT19vT19vT19vT19vT19v");

// ==========================================
// 🔴 DATA MAESTRA DE PRODUCTOS
// ==========================================
const productosBase = [
  { id: "1", nombre: "Empanada Crujiente", precio: 1500, categoria: "Fritos", disponible: true, opciones: ["Carne", "Pollo", "Arroz"] },
  { id: "2", nombre: "Papa Rellena", precio: 2500, categoria: "Fritos", disponible: true, opciones: ["Carne", "Huevo"] },
  { id: "3", nombre: "Pastel de Pollo", precio: 2500, categoria: "Fritos", disponible: true },
  { id: "4", nombre: "Arepa con Huevo y Carne", precio: 3500, categoria: "Fritos", disponible: true },
  { id: "7", nombre: "Palito de Queso", precio: 2000, categoria: "Fritos", disponible: true },
  { id: "d1", nombre: "Desayuno Tradicional", precio: 8000, categoria: "Desayunos", disponible: true, config: { huevos: ["Revueltos", "Pericos"], acompañamiento: ["Arepa", "Patacón"] } },
  { id: "d2", nombre: "Desayuno Especial", precio: 10000, categoria: "Desayunos", disponible: true, config: { proteina: ["Carne Desmechada", "Pollo"], acompañamiento: ["Arepa", "Patacón"] } },
  { id: "MM1", nombre: "Jugo Natural Helado", precio: 0, categoria: "Bebidas", disponible: true, sabores: ["Avena", "Maracuyá"], tamanos: [{ n: "Pequeño", p: 1000 }, { n: "Mediano", p: 1500 }, { n: "Grande", p: 2000 }] },
  { id: "b1", nombre: "Coca-Cola", precio: 0, categoria: "Bebidas", disponible: true, tamanos: [{ n: "Mini", p: 2500 }, { n: "Personal", p: 3500 }, { n: "Familiar", p: 6500 }] },
  { id: "b2", nombre: "Pony Malta", precio: 0, categoria: "Bebidas", disponible: true, tamanos: [{ n: "Mini", p: 2500 }, { n: "Personal", p: 3500 }] },
  { id: "b3", nombre: "Agua Cielo", precio: 2000, categoria: "Bebidas", disponible: true },
  { id: "b4", nombre: "Tinto / Café", precio: 1000, categoria: "Bebidas", disponible: true, opciones: ["Tinto", "Café con Leche (+500)"] },
  { id: "lz1", nombre: "Arroz del Día", precio: 6000, categoria: "Arroces", disponible: true, opciones: ["Tajada", "Yuca", "Huevo (+1000)"] }
];

const salsasBase = ["🔴 Roja", "🔥 Pique", "🥛 Suero"];

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [tabActiva, setTabActiva] = useState("pedidos");
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pedidosFB, setPedidosFB] = useState([]);
  const [pedido, setPedido] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState("Fritos");
  const [selecciones, setSelecciones] = useState({});
  const [cantidades, setCantidades] = useState({});
  const [salsasElegidas, setSalsasElegidas] = useState([]);
  const [mesa, setMesa] = useState(null);
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [metodoPago, setMetodoPago] = useState("");
  const [agradecimiento, setAgradecimiento] = useState(false);

  // 1. Efecto inicial: QR y Persistencia
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mesaURL = params.get('mesa');
    if (mesaURL) { setMesa(mesaURL); setNombre("Cliente Mesa " + mesaURL); setMetodoPago("Caja"); }
    const saved = localStorage.getItem("mono_cart");
    if (saved) setPedido(JSON.parse(saved));
  }, []);

  // 2. Efecto Firebase: Monitor Real-time
  useEffect(() => {
    const q = query(collection(db, "pedidos"), orderBy("timestamp", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach(change => { if (change.type === "added" && isAdmin) beep.play().catch(() => {}); });
      setPedidosFB(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [isAdmin]);

  useEffect(() => { localStorage.setItem("mono_cart", JSON.stringify(pedido)); }, [pedido]);

  // --- CONTROLADOR DE CARRITO ---
  const agregarAlCarrito = (p) => {
    const sel = selecciones[p.id] || {};
    const cant = cantidades[p.id] || 1;

    // Lógica de Precios
    let precioFinal = p.precio;
    if (sel.tamano) precioFinal = sel.tamano.p;
    if (sel.sabor === "Café con Leche (+500)") precioFinal = 1500;
    
    // Validaciones
    if (p.opciones && !sel.sabor && p.categoria === "Fritos") return alert("Selecciona un sabor");
    if (p.sabores && !sel.sabor) return alert("Selecciona un sabor");
    if (p.tamanos && !sel.tamano) return alert("Selecciona un tamaño");

    const det = `${sel.sabor || ''} ${sel.tamano?.n || ''} ${sel.extra || ''}`.trim();
    
    setPedido([...pedido, { idUnico: Date.now(), nombre: p.nombre, cantidad: cant, subtotal: precioFinal * cant, detalle: det }]);
    setCantidades({ ...cantidades, [p.id]: 1 }); // Reset cantidad
  };

  const procesarPedido = async () => {
    if (!mesa && (!nombre || !direccion)) return alert("Faltan datos de envío");
    const total = pedido.reduce((acc, i) => acc + i.subtotal, 0);
    await setDoc(doc(db, "pedidos", `ORD-${Date.now()}`), {
      nombre, ubicacion: mesa ? `MESA ${mesa}` : direccion, productos: pedido,
      salsas: salsasElegidas, total, timestamp: Date.now(), 
      hora: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }),
      estado: "pendiente"
    });
    setAgradecimiento(true); setPedido([]);
  };

  // ==========================================
  // 🔴 VISTA ADMINISTRADOR (ESTADOS SEPARADOS)
  // ==========================================
  if (isAdmin) {
    const ventasHoy = pedidosFB.filter(p => p.estado === "pagado").reduce((acc, p) => acc + p.total, 0);

    return (
      <div style={{padding: '20px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif'}}>
        <div style={{maxWidth:'1100px', margin:'0 auto'}}>
          <header style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
             <h1 style={{color: MONO_NARANJA}}>Admin Mono 🐒</h1>
             <div style={{textAlign:'right'}}>
               <span style={{fontSize:'12px'}}>Ventas Pagadas:</span>
               <div style={{fontSize:'24px', fontWeight:'900', color:MONO_VERDE}}>${ventasHoy.toLocaleString()}</div>
             </div>
             <button onClick={() => setIsAdmin(false)} style={{padding:'10px', borderRadius:'10px', cursor:'pointer'}}>Cerrar</button>
          </header>

          <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
             <button onClick={() => setTabActiva("pedidos")} style={{flex:1, padding:'15px', borderRadius:'15px', border:'none', background: tabActiva === "pedidos" ? MONO_NARANJA : 'white', fontWeight:'bold', cursor:'pointer'}}>👨‍🍳 Cocina</button>
             <button onClick={() => setTabActiva("mesas")} style={{flex:1, padding:'15px', borderRadius:'15px', border:'none', background: tabActiva === "mesas" ? MONO_NARANJA : 'white', fontWeight:'bold', cursor:'pointer'}}>💰 Caja Mesas</button>
          </div>

          {/* MONITOR COCINA: Desaparece al entregar */}
          {tabActiva === "pedidos" && (
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'20px'}}>
              {pedidosFB.filter(p => p.estado !== "entregado" && p.estado !== "pagado").map(p => (
                <div key={p.id} style={{background:'white', padding:'20px', borderRadius:'30px', borderLeft:`12px solid ${p.estado === 'pendiente' ? '#fbbf24' : MONO_AZUL}`, boxShadow:'0 5px 15px rgba(0,0,0,0.05)'}}>
                  <div style={{display:'flex', justifyContent:'space-between'}}><strong>{p.ubicacion}</strong><small>{p.hora}</small></div>
                  <div style={{margin:'10px 0'}}>
                    {p.productos.map((item, i) => ( <div key={i}>• {item.cantidad}x {item.nombre} <small>({item.detalle})</small></div> ))}
                    {p.salsas?.length > 0 && <div style={{fontSize:'11px', color:MONO_VERDE, mt:'5px'}}>Salsas: {p.salsas.join(', ')}</div>}
                  </div>
                  <div style={{display:'flex', gap:'5px'}}>
                     {p.estado === 'pendiente' && <button onClick={() => updateDoc(doc(db,"pedidos",p.id),{estado:'preparando'})} style={{flex:1, background:MONO_AZUL, color:'white', border:'none', padding:'10px', borderRadius:'10px', fontWeight:'bold'}}>Preparar</button>}
                     {p.estado === 'preparando' && <button onClick={() => updateDoc(doc(db,"pedidos",p.id),{estado:'entregado'})} style={{flex:1, background:MONO_VERDE, color:'white', border:'none', padding:'10px', borderRadius:'10px', fontWeight:'bold'}}>Entregado ✅</button>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CAJA MESAS: No desaparece hasta pagar */}
          {tabActiva === "mesas" && (
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'20px'}}>
              {[1,2,3,4,5,6,7,8,9,10].map(n => {
                const mesaPed = pedidosFB.filter(p => p.ubicacion === `MESA ${n}` && p.estado !== "pagado");
                const total = mesaPed.reduce((acc, p) => acc + p.total, 0);
                if (mesaPed.length === 0) return null;
                return (
                  <div key={n} style={{background:'white', padding:'25px', borderRadius:'30px', border:`2px solid ${MONO_NARANJA}`, boxShadow:'0 10px 20px rgba(0,0,0,0.05)'}}>
                    <h3 style={{margin:0}}>MESA {n}</h3>
                    <div style={{margin:'15px 0', fontSize:'14px', background:'#f8fafc', padding:'10px', borderRadius:'15px'}}>
                      {mesaPed.map(p => (
                        <div key={p.id} style={{borderBottom:'1px solid #eee', mb:'5px', pb:'5px'}}>
                          <small>{p.hora} - {p.estado}</small>
                          {p.productos.map((item, i) => ( <div key={i}>• {item.cantidad}x {item.nombre}</div> ))}
                        </div>
                      ))}
                    </div>
                    <div style={{fontSize:'32px', fontWeight:'900', textAlign:'center', color:MONO_NARANJA}}>${total.toLocaleString()}</div>
                    <button onClick={() => {if(window.confirm("¿Liberar mesa?")) mesaPed.forEach(p => updateDoc(doc(db,"pedidos",p.id),{estado:'pagado'}))}} style={{marginTop:'15px', width:'100%', padding:'15px', background:MONO_TEXTO, color:'white', border:'none', borderRadius:'15px', fontWeight:'bold', cursor:'pointer'}}>CERRAR CUENTA 💸</button>
                  </div>
                );
              })}
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
    <div style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#fffcf5', minHeight: '100vh', paddingBottom: '120px' }}>
      <header style={{textAlign:'center', padding:'40px', background:'white', borderRadius:'0 0 50px 50px', boxShadow:'0 5px 30px rgba(0,0,0,0.05)'}}>
        <h1 onClick={() => setMostrarLogin(true)} style={{color: MONO_NARANJA, fontSize:'2.5rem', fontWeight:'900', cursor:'pointer'}}>Fritos El Mono 🐒</h1>
        <div style={{marginTop:'10px', background:'#fff7ed', padding:'8px 20px', borderRadius:'20px', fontWeight:'bold', display:'inline-block'}}>Arroz: {tipoArrozHoy}</div>
      </header>

      {/* Categorías */}
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '25px' }}>
        {["Fritos", "Desayunos", "Arroces", "Bebidas"].map(cat => (
          <button key={cat} onClick={() => setCategoriaActiva(cat)} style={{ padding: '12px 25px', borderRadius: '30px', border: 'none', background: categoriaActiva === cat ? MONO_NARANJA : 'white', color: categoriaActiva === cat ? 'white' : MONO_TEXTO, fontWeight:'bold', cursor:'pointer' }}>{cat}</button>
        ))}
      </div>

      {/* Productos */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px', padding: '0 20px'}}>
        {productosBase.filter(p => p.categoria === categoriaActiva).map(p => {
          const sel = selecciones[p.id] || {};
          const cant = cantidades[p.id] || 1;
          const precioActual = p.tamanos ? (sel.tamano?.p || 0) : (p.precio || 0);

          return (
            <div key={p.id} style={{background:'white', padding:'25px', borderRadius:'40px', boxShadow:'0 10px 20px rgba(0,0,0,0.02)', textAlign:'center'}}>
              <h3 style={{margin:'0 0 10px'}}>{p.nombre}</h3>
              <p style={{color:MONO_NARANJA, fontWeight:'900', fontSize:'22px', mb:'15px'}}>${precioActual > 0 ? precioActual.toLocaleString() : "Selecciona"}</p>
              
              {/* CONTROLADOR DE SABORES / OPCIONES */}
              {p.opciones && (
                <div style={{display:'flex', gap:'5px', flexWrap:'wrap', justifyContent:'center', mb:'15px'}}>
                  {p.opciones.map(o => (
                    <button key={o} onClick={() => setSelecciones({...selecciones, [p.id]: {...sel, sabor: o}})} style={{padding:'8px 12px', borderRadius:'12px', border: sel.sabor === o ? `2px solid ${MONO_NARANJA}` : '1px solid #eee', background: sel.sabor === o ? '#fff7ed' : 'white', fontWeight:'bold', cursor:'pointer'}}>{o}</button>
                  ))}
                </div>
              )}

              {/* CONTROLADOR DE SABORES DE JUGOS */}
              {p.sabores && (
                <div style={{display:'flex', gap:'5px', justifyContent:'center', mb:'15px'}}>
                  {p.sabores.map(s => (
                    <button key={s} onClick={() => setSelecciones({...selecciones, [p.id]: {...sel, sabor: s}})} style={{padding:'8px 12px', borderRadius:'12px', border: sel.sabor === s ? `2px solid ${MONO_NARANJA}` : '1px solid #eee', background: sel.sabor === s ? '#fff7ed' : 'white', fontWeight:'bold', cursor:'pointer'}}>{s}</button>
                  ))}
                </div>
              )}

              {/* CONTROLADOR DE TAMAÑOS */}
              {p.tamanos && (
                <div style={{display:'flex', gap:'5px', justifyContent:'center', mb:'15px'}}>
                  {p.tamanos.map(t => (
                    <button key={t.n} onClick={() => setSelecciones({...selecciones, [p.id]: {...sel, tamano: t}})} style={{padding:'8px 12px', borderRadius:'12px', border: sel.tamano?.n === t.n ? `2px solid ${MONO_NARANJA}` : '1px solid #eee', background: sel.tamano?.n === t.n ? '#fff7ed' : 'white', fontWeight:'bold', cursor:'pointer'}}>{t.n}</button>
                  ))}
                </div>
              )}

              <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'15px', mb:'15px'}}>
                 <button onClick={() => setCantidades({...cantidades, [p.id]: Math.max(1, cant - 1)})} style={{width:'35px', height:'35px', borderRadius:'50%', border:'1px solid #ddd'}}>-</button>
                 <strong style={{fontSize:'18px'}}>{cant}</strong>
                 <button onClick={() => setCantidades({...cantidades, [p.id]: cant + 1})} style={{width:'35px', height:'35px', borderRadius:'50%', background:MONO_NARANJA, color:'white', border:'none'}}>+</button>
              </div>
              <button onClick={() => agregarAlCarrito(p)} style={{width:'100%', padding:'15px', background:MONO_NARANJA, color:'white', borderRadius:'20px', border:'none', fontWeight:'bold', cursor:'pointer'}}>Añadir 🛒</button>
            </div>
          );
        })}
      </div>

      {/* TICKET DE PEDIDO */}
      {pedido.length > 0 && (
        <div style={{ maxWidth: '600px', margin: '40px auto', background: 'white', padding: '30px', borderRadius: '40px', border: `5px solid ${MONO_NARANJA}`, boxShadow:'0 20px 40px rgba(0,0,0,0.1)' }}>
          <h2 style={{margin:'0 0 20px'}}>🛒 Tu Pedido</h2>
          {pedido.map(item => (
            <div key={item.idUnico} style={{ display: 'flex', justifyContent: 'space-between', padding:'10px 0', borderBottom:'1px solid #eee' }}>
              <span><strong>{item.cantidad}x</strong> {item.nombre} <br/><small>{item.detalle}</small></span>
              <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                <strong>${item.subtotal.toLocaleString()}</strong>
                <button onClick={() => setPedido(pedido.filter(i => i.idUnico !== item.idUnico))} style={{background:'none', border:'none', cursor:'pointer'}}>❌</button>
              </div>
            </div>
          ))}

          {/* Selector de Salsas */}
          <div style={{marginTop:'20px', background:'#f8fafc', padding:'15px', borderRadius:'20px'}}>
             <h4 style={{margin:'0 0 10px'}}>¿Salsas?</h4>
             <div style={{display:'flex', gap:'5px', flexWrap:'wrap'}}>
               {salsasBase.map(s => (
                 <button key={s} onClick={() => setSalsasElegidas(salsasElegidas.includes(s) ? salsasElegidas.filter(x => x !== s) : [...salsasElegidas, s])} style={{padding:'8px 12px', borderRadius:'10px', border: salsasElegidas.includes(s) ? `2px solid ${MONO_NARANJA}` : '1px solid #ddd', background: salsasElegidas.includes(s) ? '#fff7ed' : 'white', fontWeight:'bold'}}>{s}</button>
               ))}
             </div>
          </div>

          <div style={{textAlign:'right', mt:'20px', fontSize:'28px', fontWeight:'900', color:MONO_NARANJA}}>Total: ${pedido.reduce((acc,i)=>acc+i.subtotal,0).toLocaleString()}</div>
          
          <div style={{display:'flex', flexDirection:'column', gap:'10px', marginTop:'20px'}}>
             {!mesa && <input type="text" placeholder="Tu nombre" onChange={e => setNombre(e.target.value)} style={{padding:'15px', borderRadius:'12px', border:'1px solid #ddd'}} />}
             {mesa && <div style={{padding:'15px', background:'#ecfdf5', borderRadius:'15px', textAlign:'center', color:'#065f46', fontWeight:'bold'}}>📍 MESA {mesa}</div>}
             <button onClick={procesarPedido} style={{width:'100%', padding:'20px', background: mesa ? MONO_NARANJA : MONO_VERDE, color:'white', borderRadius:'25px', border:'none', fontWeight:'900', fontSize:'18px', cursor:'pointer'}}>{mesa ? "PEDIR A COCINA 👨‍🍳" : "WHATSAPP 📲"}</button>
          </div>
        </div>
      )}

      {/* LOGIN MODAL */}
      {mostrarLogin && (
        <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.9)', zIndex:20000, display:'flex', justifyContent:'center', alignItems:'center'}}>
          <div style={{background:'white', padding:'40px', borderRadius:'30px', textAlign:'center'}}>
            <h3>Acceso Mono Admin</h3>
            <input type="password" onChange={e => setPinInput(e.target.value)} style={{padding:'15px', borderRadius:'15px', textAlign:'center', fontSize:'20px'}} />
            <button onClick={() => { if(pinInput === "mono2026") setIsAdmin(true); setMostrarLogin(false); }} style={{display:'block', width:'100%', marginTop:'15px', padding:'15px', background:MONO_NARANJA, color:'white', border:'none', borderRadius:'15px', fontWeight:'bold'}}>Entrar</button>
            <button onClick={() => setMostrarLogin(false)} style={{marginTop:'10px', background:'none', border:'none', color:'#999'}}>Cancelar</button>
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