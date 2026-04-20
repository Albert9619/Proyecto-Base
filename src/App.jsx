import React, { useState, useEffect } from 'react';
import { db } from './firebaseConfig';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy, updateDoc } from "firebase/firestore";

// --- ESTILOS ---
const MONO_NARANJA = "#f97316";
const MONO_VERDE = "#16a34a";
const MONO_AZUL = "#3b82f6";
const MONO_TEXTO = "#333333";
const MONO_ROJO = "#ef4444";

const beep = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ9vT19vT19vT19vT19vT19v");

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

const salsasBase = ["🔴 Roja", "🔥 Pique", "🥛 Suero"];

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [tabActiva, setTabActiva] = useState("pedidos");
  const [pedidosFB, setPedidosFB] = useState([]);
  const [pedido, setPedido] = useState([]);
  const [mesa, setMesa] = useState(null);
  const [categoriaActiva, setCategoriaActiva] = useState("Fritos");
  const [selecciones, setSelecciones] = useState({});
  const [cantidades, setCantidades] = useState({});
  const [salsasElegidas, setSalsasElegidas] = useState([]);
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [metodoPago, setMetodoPago] = useState("");
  const [agradecimiento, setAgradecimiento] = useState(false);
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [verPrecuenta, setVerPrecuenta] = useState(false);

  const hoy = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"][new Date().getDay()];
  const tipoArrozHoy = ["lunes", "miércoles", "viernes"].includes(hoy) ? "Pollo" : "Cerdo";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get('mesa');
    if (m) { setMesa(m); setNombre(`Cliente Mesa ${m}`); setMetodoPago("Caja"); }
  }, []);

  useEffect(() => {
    const q = query(collection(db, "pedidos"), orderBy("timestamp", "asc"));
    return onSnapshot(q, (s) => {
      const data = s.docs.map(d => ({ id: d.id, ...d.data() }));
      if (data.length > pedidosFB.length && isAdmin) beep.play().catch(() => {});
      setPedidosFB(data);
    });
  }, [pedidosFB.length, isAdmin]);

  const agregarAlCarrito = (p) => {
    const sel = selecciones[p.id] || {};
    const cant = cantidades[p.id] || 1;
    let precioFinal = p.precio;
    if (sel.tamano) precioFinal = sel.tamano.p;
    const det = `${sel.sabor || ''} ${sel.tamano?.n || ''}`.trim();
    setPedido([...pedido, { idUnico: Date.now(), nombre: p.nombre, cantidad: cant, subtotal: precioFinal * cant, detalle: det }]);
  };

  const procesarPedido = async () => {
    const total = pedido.reduce((acc, i) => acc + i.subtotal, 0);
    await setDoc(doc(db, "pedidos", `ORD-${Date.now()}`), {
      nombre, ubicacion: mesa ? `MESA ${mesa}` : (direccion || "Domicilio"), 
      productos: pedido, salsas: salsasElegidas, total, timestamp: Date.now(), 
      hora: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }), 
      estado: "pendiente", tipo: mesa ? "mesa" : "domicilio"
    });
    setAgradecimiento(true); setPedido([]);
  };

  const actualizarEstado = async (id, estado) => {
    await updateDoc(doc(db, "pedidos", id), { estado });
  };

  // Pre-cuenta cliente
  const pedidosMesaActual = pedidosFB.filter(p => p.ubicacion === `MESA ${mesa}` && p.estado !== "pagado");
  const totalAcumuladoMesa = pedidosMesaActual.reduce((acc, p) => acc + (p.total || 0), 0);

  // ==========================================
  // 🔴 VISTA ADMINISTRADOR
  // ==========================================
  if (isAdmin) {
    const pagados = pedidosFB.filter(p => p.estado === "pagado");
    const tVendido = pagados.reduce((acc, p) => acc + (p.total || 0), 0);
    const vMesa = pagados.filter(p => p.tipo === "mesa").reduce((acc, p) => acc + (p.total || 0), 0);
    const vDomicilio = pagados.filter(p => p.tipo === "domicilio").reduce((acc, p) => acc + (p.total || 0), 0);

    return (
      <div style={{padding:'20px', background:'#f8fafc', minHeight:'100vh', fontFamily:'sans-serif'}}>
        <div style={{maxWidth:'1100px', margin:'0 auto'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
            <h1 style={{color:MONO_NARANJA}}>Admin Mono 🐒</h1>
            <button onClick={() => setIsAdmin(false)} style={{padding:'10px 20px', borderRadius:'10px', border:'none', cursor:'pointer'}}>Salir</button>
          </div>

          <div style={{display:'flex', gap:'10px', marginBottom:'25px'}}>
            <button onClick={() => setTabActiva("pedidos")} style={{flex:1, padding:'15px', borderRadius:'15px', background:tabActiva==="pedidos"?MONO_NARANJA:"white", fontWeight:'bold', border:'none', cursor:'pointer'}}>👨‍🍳 Cocina</button>
            <button onClick={() => setTabActiva("mesas")} style={{flex:1, padding:'15px', borderRadius:'15px', background:tabActiva==="mesas"?MONO_NARANJA:"white", fontWeight:'bold', border:'none', cursor:'pointer'}}>💰 Mesas</button>
            <button onClick={() => setTabActiva("caja")} style={{flex:1, padding:'15px', borderRadius:'15px', background:tabActiva==="caja"?"#000":"white", color:tabActiva==="caja"?"white":"black", fontWeight:'bold', border:'none', cursor:'pointer'}}>📊 Caja</button>
          </div>

          {tabActiva === "pedidos" && (
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'20px'}}>
              {pedidosFB.filter(p => p.estado !== "entregado" && p.estado !== "pagado").map(p => (
                <div key={p.id} style={{background:'white', padding:'20px', borderRadius:'25px', borderLeft:`10px solid ${p.estado==='pendiente'?'#fbbf24':MONO_AZUL}`, boxShadow:'0 5px 15px rgba(0,0,0,0.05)'}}>
                  <div style={{display:'flex', justifyContent:'space-between'}}><strong>{p.ubicacion}</strong> <small>{p.hora} (${p.total.toLocaleString()})</small></div>
                  <div style={{margin:'10px 0'}}>
                    {p.productos.map((it, i) => <div key={i} style={{fontSize:'14px'}}>• {it.cantidad}x {it.nombre}</div>)}
                  </div>
                  <div style={{display:'flex', gap:'5px'}}>
                    {p.estado === 'pendiente' && <button onClick={() => actualizarEstado(p.id, 'preparando')} style={{flex:1, background:MONO_AZUL, color:'white', border:'none', padding:'10px', borderRadius:'10px', fontWeight:'bold', cursor:'pointer'}}>Preparar</button>}
                    {p.estado === 'preparando' && <button onClick={() => actualizarEstado(p.id, 'entregado')} style={{flex:1, background:MONO_VERDE, color:'white', border:'none', padding:'10px', borderRadius:'10px', fontWeight:'bold', cursor:'pointer'}}>Entregado ✅</button>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tabActiva === "mesas" && (
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'20px'}}>
              {[1,2,3,4,5,6,7,8,9,10].map(n => {
                const mesaPed = pedidosFB.filter(p => p.ubicacion === `MESA ${n}` && p.estado !== "pagado");
                const totalMesa = mesaPed.reduce((acc, p) => acc + (p.total || 0), 0);
                const isReady = mesaPed.length > 0 && mesaPed.every(p => p.estado === 'entregado');
                if (mesaPed.length === 0) return <div key={n} style={{background:'white', padding:'20px', borderRadius:'20px', border:'1px dashed #ccc', textAlign:'center', color:'#999'}}>Mesa {n} (Libre)</div>;
                return (
                  <div key={n} style={{background:'white', padding:'25px', borderRadius:'30px', border:`2px solid ${isReady?MONO_ROJO:MONO_NARANJA}`}}>
                    <h3 style={{margin:0, textAlign:'center'}}>MESA {n}</h3>
                    <div style={{fontSize:'28px', fontWeight:'900', textAlign:'center', margin:'10px 0'}}>${totalMesa.toLocaleString()}</div>
                    <button onClick={() => {if(window.confirm("¿Cobrar?")) mesaPed.forEach(p => actualizarEstado(p.id, 'pagado'))}} style={{width:'100%', padding:'15px', background:isReady?MONO_ROJO:MONO_TEXTO, color:'white', border:'none', borderRadius:'15px', fontWeight:'bold', cursor:'pointer'}}>PAGAR CUENTA 💸</button>
                  </div>
                );
              })}
              {/* DOMICILIOS EN ESPERA DE COBRO */}
              <div style={{gridColumn:'1/-1', marginTop:'30px'}}>
                 <h3>🛵 Domicilios por Cobrar</h3>
                 <div style={{display:'flex', gap:'10px', overflowX:'auto'}}>
                    {pedidosFB.filter(p => p.tipo === "domicilio" && p.estado !== "pagado").map(p => (
                       <div key={p.id} style={{minWidth:'220px', background:'white', padding:'15px', borderRadius:'20px', border:`2px solid ${MONO_AZUL}`}}>
                          <strong>{p.nombre}</strong>
                          <div>Total: ${p.total.toLocaleString()}</div>
                          <button onClick={() => actualizarEstado(p.id, 'pagado')} style={{width:'100%', marginTop:'10px', background:MONO_VERDE, color:'white', border:'none', borderRadius:'10px', padding:'8px'}}>PAGADO ✅</button>
                       </div>
                    ))}
                 </div>
              </div>
            </div>
          )}

          {tabActiva === "caja" && (
            <div style={{background:'white', padding:'40px', borderRadius:'40px', boxShadow:'0 10px 30px rgba(0,0,0,0.05)'}}>
               <h2 style={{color:MONO_NARANJA, margin:0}}>Resumen de Hoy 📊</h2>
               <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'20px', margin:'30px 0'}}>
                  <div style={{padding:'20px', background:'#fff7ed', borderRadius:'25px', textAlign:'center', border:`2px solid ${MONO_NARANJA}`}}>
                     <span style={{fontSize:'12px'}}>TOTAL CAJA</span>
                     <div style={{fontSize:'32px', fontWeight:'950'}}>${tVendido.toLocaleString()}</div>
                  </div>
                  <div style={{padding:'20px', background:'#f0fdf4', borderRadius:'25px', textAlign:'center', border:`2px solid ${MONO_VERDE}`}}>
                     <span style={{fontSize:'12px'}}>DINERO LOCAL</span>
                     <div style={{fontSize:'32px', fontWeight:'950'}}>${vMesa.toLocaleString()}</div>
                  </div>
                  <div style={{padding:'20px', background:'#eff6ff', borderRadius:'25px', textAlign:'center', border:`2px solid ${MONO_AZUL}`}}>
                     <span style={{fontSize:'12px'}}>DINERO DOMICILIOS</span>
                     <div style={{fontSize:'32px', fontWeight:'950'}}>${vDomicilio.toLocaleString()}</div>
                  </div>
               </div>
               <button onClick={() => { if(window.confirm("¿Reiniciar?")) pagados.forEach(p => deleteDoc(doc(db,"pedidos",p.id))) }} style={{width:'100%', padding:'20px', background:MONO_TEXTO, color:'white', borderRadius:'20px', fontWeight:'bold', border:'none'}}>REINICIAR DÍA</button>
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
      
      {mesa && totalAcumuladoMesa > 0 && (
        <button onClick={() => setVerPrecuenta(true)} style={{ position:'fixed', bottom:'100px', right:'20px', background:MONO_TEXTO, color:'white', padding:'15px 25px', borderRadius:'50px', border:'none', fontWeight:'900', boxShadow:'0 10px 20px rgba(0,0,0,0.2)', zIndex:5000 }}>
          📄 Ver mi cuenta (${totalAcumuladoMesa.toLocaleString()})
        </button>
      )}

      {verPrecuenta && (
        <div style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.8)', zIndex:10000, display:'flex', justifyContent:'center', alignItems:'center', padding:'20px' }}>
          <div style={{ background:'white', width:'100%', maxWidth:'450px', borderRadius:'40px', padding:'30px', position:'relative' }}>
            <button onClick={() => setVerPrecuenta(false)} style={{ position:'absolute', top:20, right:20, border:'none', background:'#eee', borderRadius:'50%', width:'35px', height:'35px' }}>✕</button>
            <h2 style={{ textAlign:'center' }}>Mesa {mesa} 🐒</h2>
            <div style={{ maxHeight:'300px', overflowY:'auto', borderTop:'2px dashed #ddd', paddingTop:'15px' }}>
              {pedidosMesaActual.map(p => (
                <div key={p.id} style={{ marginBottom:'10px', borderBottom:'1px solid #eee', paddingBottom:'10px' }}>
                  {p.productos.map((it, i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:'14px' }}>
                      <span>{it.cantidad}x {it.nombre}</span>
                      <strong>${it.subtotal.toLocaleString()}</strong>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div style={{ marginTop:'20px', padding:'20px', background:'#fff7ed', borderRadius:'20px', textAlign:'center' }}>
              <strong>TOTAL: ${totalAcumuladoMesa.toLocaleString()}</strong>
            </div>
          </div>
        </div>
      )}

      <header style={{textAlign:'center', padding:'40px', background:'white', borderRadius:'0 0 50px 50px', boxShadow:'0 5px 30px rgba(0,0,0,0.05)'}}>
        <h1 onClick={() => setMostrarLogin(true)} style={{color: MONO_NARANJA, fontSize:'2.5rem', fontWeight:'900', cursor:'pointer'}}>Fritos El Mono 🐒</h1>
        <div style={{marginTop:'10px', background:'#fff7ed', padding:'8px 20px', borderRadius:'20px', fontWeight:'bold', display:'inline-block'}}>Arroz: {tipoArrozHoy}</div>
      </header>

      <div style={{ display:'flex', gap:'10px', overflowX:'auto', padding:'25px' }}>
        {["Fritos", "Desayunos", "Arroces", "Bebidas"].map(cat => (
          <button key={cat} onClick={() => setCategoriaActiva(cat)} style={{ padding:'12px 25px', borderRadius:'30px', border:'none', background:categoriaActiva===cat?MONO_NARANJA:'white', fontWeight:'bold' }}>{cat}</button>
        ))}
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:'25px', padding:'0 20px'}}>
        {productosBase.filter(p => p.categoria === categoriaActiva).map(p => (
          <div key={p.id} style={{background:'white', padding:'25px', borderRadius:'40px', textAlign:'center', boxShadow:'0 10px 20px rgba(0,0,0,0.02)'}}>
            <h3>{p.nombre}</h3>
            <button onClick={() => agregarAlCarrito(p)} style={{width:'100%', padding:'15px', background:MONO_NARANJA, color:'white', borderRadius:'20px', border:'none', fontWeight:'bold'}}>Añadir 🛒</button>
          </div>
        ))}
      </div>

      {pedido.length > 0 && (
        <div style={{ maxWidth: '600px', margin: '40px auto', background: 'white', padding: '30px', borderRadius: '40px', border: `5px solid ${MONO_NARANJA}` }}>
          <h2>🛒 Tu Pedido Nuevo</h2>
          {pedido.map(it => (
            <div key={it.idUnico} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #eee' }}>
              <span><strong>{it.cantidad}x</strong> {it.nombre}</span>
              <strong>${it.subtotal.toLocaleString()}</strong>
            </div>
          ))}
          <button onClick={procesarPedido} style={{width:'100%', marginTop:'20px', padding:'25px', background:MONO_NARANJA, color:'white', borderRadius:'25px', border:'none', fontWeight:'900'}}>PEDIR 👨‍🍳</button>
        </div>
      )}

      {mostrarLogin && (
        <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.9)', zIndex:20000, display:'flex', justifyContent:'center', alignItems:'center', padding:'20px'}}>
          <div style={{background:'white', padding:'40px', borderRadius:'30px', textAlign:'center'}}>
            <input type="password" onChange={e => setPinInput(e.target.value)} style={{padding:'15px', borderRadius:'15px', textAlign:'center', fontSize:'20px', width:'100%'}} />
            <button onClick={() => { if(pinInput === "mono2026") { setIsAdmin(true); setMostrarLogin(false); } }} style={{display:'block', width:'100%', marginTop:'15px', padding:'15px', background:MONO_NARANJA, color:'white', border:'none', borderRadius:'15px', fontWeight:'bold'}}>Entrar</button>
          </div>
        </div>
      )}
    </div>
  );
}