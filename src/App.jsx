import React, { useState, useEffect } from 'react';
import { db } from './firebaseConfig';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy, updateDoc } from "firebase/firestore";

// ==========================================
// 🔴 COMPONENTE UI: MINISWITCH
// ==========================================
const MiniSwitch = ({ activo, onClick }) => (
  <div onClick={onClick} style={{ width: '46px', height: '24px', backgroundColor: activo ? "#16a34a" : '#cbd5e1', borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: '0.3s', flexShrink: 0 }}>
    <div style={{ width: '18px', height: '18px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: activo ? '25px' : '3px', transition: '0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
  </div>
);

const MONO_NARANJA = "#f97316";
const MONO_VERDE = "#16a34a";
const MONO_AZUL = "#3b82f6";
const MONO_TEXTO = "#333333";
const MONO_ROJO = "#ef4444";

const beep = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ9vT19vT19vT19vT19vT19v");

// ==========================================
// 🔴 DATOS MAESTROS (LOS 17 PRODUCTOS)
// ==========================================
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
  { id: "b3", nombre: "Agua Cielo", precio: 2000, categoria: "Bebidas", disponible: true, imagen: "/agua.jpg" },
  { id: "b4", nombre: "Tinto Tradicional", precio: 1000, categoria: "Bebidas", disponible: true, imagen: "/tinto.jpg" },
  { id: "b5", nombre: "Café con Leche", precio: 1500, categoria: "Bebidas", disponible: true, imagen: "/cafe-leche.jpg" },
  { id: "b6", nombre: "Chocolate Caliente", precio: 1500, categoria: "Bebidas", disponible: true, imagen: "/chocolate.jpg", opciones: ["Con Leche", "Sin Leche"] },
  { id: "b7", nombre: "Aromáticas", precio: 1000, categoria: "Bebidas", disponible: true, imagen: "/aromatica.jpg", opciones: ["Manzanilla", "Hierbabuena", "Frutos Rojos"] },
  { id: "milo1", nombre: "Milo Refrescante", precio: 4000, categoria: "Bebidas", disponible: true, imagen: "/milo.jpg" },
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

  // --- Lógica de Arroz por Día (ESTO FALTABA) ---
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
    setCantidades({ ...cantidades, [p.id]: 1 });
  };

  const procesarPedido = async () => {
    const total = pedido.reduce((acc, i) => acc + i.subtotal, 0);
    await setDoc(doc(db, "pedidos", `ORD-${Date.now()}`), {
      nombre, ubicacion: mesa ? `MESA ${mesa}` : (direccion || "Local"), 
      productos: pedido, salsas: salsasElegidas, total, timestamp: Date.now(), 
      hora: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }), 
      estado: "pendiente"
    });
    setAgradecimiento(true); setPedido([]);
  };

  const actualizarEstado = async (id, estado) => {
    await updateDoc(doc(db, "pedidos", id), { estado });
  };

  // ==========================================
  // 🔴 VISTA ADMINISTRADOR
  // ==========================================
  if (isAdmin) {
    const ventasPagadasHoy = pedidosFB.filter(p => p.estado === "pagado").reduce((acc, p) => acc + (p.total || 0), 0);
    return (
      <div style={{padding:'20px', background:'#f8fafc', minHeight:'100vh', fontFamily:'sans-serif'}}>
        <div style={{maxWidth:'1100px', margin:'0 auto'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
            <h1 style={{color:MONO_NARANJA}}>Panel POS Mono 🐒</h1>
            <div style={{textAlign:'right', background:MONO_TEXTO, color:'white', padding:'10px 20px', borderRadius:'15px'}}>
              Ventas Pagadas: <strong>${ventasPagadasHoy.toLocaleString()}</strong>
            </div>
            <button onClick={() => setIsAdmin(false)} style={{padding:'10px', borderRadius:'10px', cursor:'pointer'}}>Cerrar</button>
          </div>

          <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
            <button onClick={() => setTabActiva("pedidos")} style={{flex:1, padding:'15px', borderRadius:'15px', border:'none', background:tabActiva==="pedidos"?MONO_NARANJA:"white", fontWeight:'bold', cursor:'pointer'}}>👨‍🍳 Cocina</button>
            <button onClick={() => setTabActiva("mesas")} style={{flex:1, padding:'15px', borderRadius:'15px', border:'none', background:tabActiva==="mesas"?MONO_NARANJA:"white", fontWeight:'bold', cursor:'pointer'}}>💰 Mesas</button>
          </div>

          {tabActiva === "pedidos" && (
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'20px'}}>
              {pedidosFB.filter(p => p.estado !== "entregado" && p.estado !== "pagado").map(p => (
                <div key={p.id} style={{background:'white', padding:'20px', borderRadius:'25px', borderLeft:`10px solid ${p.estado==='pendiente'?'#fbbf24':MONO_AZUL}`, boxShadow:'0 5px 15px rgba(0,0,0,0.05)'}}>
                  <div style={{display:'flex', justifyContent:'space-between'}}><strong>{p.ubicacion}</strong> <small>{p.hora}</small></div>
                  <div style={{margin:'10px 0'}}>
                    {p.productos.map((it, i) => <div key={i} style={{fontSize:'14px'}}>• {it.cantidad}x {it.nombre} ({it.detalle})</div>)}
                    {p.salsas?.length > 0 && <div style={{fontSize:'11px', color:MONO_VERDE}}>Salsas: {p.salsas.join(', ')}</div>}
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
                const total = mesaPed.reduce((acc, p) => acc + (p.total || 0), 0);
                const isReady = mesaPed.length > 0 && mesaPed.every(p => p.estado === 'entregado');
                
                if (mesaPed.length === 0) return <div key={n} style={{background:'white', padding:'20px', borderRadius:'30px', border:'1px dashed #ccc', textAlign:'center', color:'#999'}}>Mesa {n} (Libre)</div>;

                return (
                  <div key={n} style={{background:'white', padding:'25px', borderRadius:'30px', border:`2px solid ${isReady?MONO_ROJO:MONO_NARANJA}`, boxShadow:'0 10px 20px rgba(0,0,0,0.05)'}}>
                    <div style={{textAlign:'center', fontSize:'11px', fontWeight:'bold', color:isReady?MONO_ROJO:MONO_NARANJA}}>{isReady?'PENDIENTE PAGO':'OCUPADA'}</div>
                    <h3 style={{margin:0, textAlign:'center'}}>MESA {n}</h3>
                    <div style={{margin:'15px 0', fontSize:'13px', maxHeight:'150px', overflowY:'auto', background:'#f8fafc', padding:'10px', borderRadius:'15px'}}>
                      {mesaPed.map(p => (
                        <div key={p.id} style={{borderBottom:'1px solid #eee', marginBottom:'5px', paddingBottom:'5px'}}>
                          <div style={{fontSize:'10px', color:'#999'}}>{p.hora} - {p.estado}</div>
                          {p.productos.map((it, i) => <div key={i}>• {it.cantidad}x {it.nombre}</div>)}
                        </div>
                      ))}
                    </div>
                    <div style={{fontSize:'28px', fontWeight:'900', textAlign:'center', color:MONO_TEXTO}}>${total.toLocaleString()}</div>
                    <button onClick={() => {if(window.confirm(`¿Cobrar $${total.toLocaleString()} a Mesa ${n}?`)) mesaPed.forEach(p => actualizarEstado(p.id, 'pagado'))}} style={{marginTop:'10px', width:'100%', padding:'15px', background:isReady?MONO_ROJO:MONO_TEXTO, color:'white', border:'none', borderRadius:'15px', fontWeight:'bold', cursor:'pointer'}}>CERRAR CUENTA 💸</button>
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

      <div style={{ display:'flex', gap:'10px', overflowX:'auto', padding:'25px' }}>
        {["Fritos", "Desayunos", "Arroces", "Bebidas"].map(cat => (
          <button key={cat} onClick={() => setCategoriaActiva(cat)} style={{ padding:'12px 25px', borderRadius:'30px', border:'none', background:categoriaActiva===cat?MONO_NARANJA:'white', color:categoriaActiva===cat?'white':MONO_TEXTO, fontWeight:'bold', cursor:'pointer' }}>{cat}</button>
        ))}
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:'25px', padding:'0 20px'}}>
        {productosBase.filter(p => p.categoria === categoriaActiva).map(p => {
          const sel = selecciones[p.id] || {};
          const cant = cantidades[p.id] || 1;
          const pActual = p.tamanos ? (sel.tamano?.p || p.tamanos[0].p) : (p.precio || 0);

          return (
            <div key={p.id} style={{background:'white', padding:'25px', borderRadius:'40px', boxShadow:'0 10px 20px rgba(0,0,0,0.02)', textAlign:'center'}}>
              <h3 style={{margin:0}}>{p.nombre}</h3>
              <p style={{color:MONO_NARANJA, fontWeight:'900', fontSize:'22px'}}>${pActual > 0 ? pActual.toLocaleString() : "..."}</p>
              
              {p.opciones && (
                <div style={{display:'flex', gap:'5px', flexWrap:'wrap', justifyContent:'center', mb:'15px'}}>
                  {p.opciones.map(o => (
                    <button key={o} onClick={() => setSelecciones({...selecciones, [p.id]: {...sel, sabor: o}})} style={{padding:'8px 12px', borderRadius:'12px', border:sel.sabor===o?`2px solid ${MONO_NARANJA}`:'1px solid #eee', background:sel.sabor===o?'#fff7ed':'white', cursor:'pointer'}}>{o}</button>
                  ))}
                </div>
              )}

              {p.tamanos && (
                <div style={{display:'flex', gap:'5px', justifyContent:'center', mb:'15px'}}>
                  {p.tamanos.map(t => (
                    <button key={t.n} onClick={() => setSelecciones({...selecciones, [p.id]: {...sel, tamano: t}})} style={{padding:'8px 12px', borderRadius:'12px', border:sel.tamano?.n===t.n?`2px solid ${MONO_NARANJA}`:'1px solid #eee', background:sel.tamano?.n===t.n?'#fff7ed':'white', cursor:'pointer'}}>{t.n}</button>
                  ))}
                </div>
              )}

              <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'15px', mb:'15px'}}>
                 <button onClick={() => setCantidades({...cantidades, [p.id]: Math.max(1, cant - 1)})} style={{cursor:'pointer'}}>-</button>
                 <strong>{cant}</strong>
                 <button onClick={() => setCantidades({...cantidades, [p.id]: cant + 1})} style={{cursor:'pointer'}}>+</button>
              </div>
              <button onClick={() => agregarAlCarrito(p)} style={{width:'100%', padding:'15px', background:MONO_NARANJA, color:'white', borderRadius:'20px', border:'none', fontWeight:'bold', cursor:'pointer'}}>Añadir 🛒</button>
            </div>
          );
        })}
      </div>

      {pedido.length > 0 && (
        <div style={{ maxWidth: '600px', margin: '40px auto', background: 'white', padding: '30px', borderRadius: '40px', border: `5px solid ${MONO_NARANJA}`, boxShadow:'0 20px 40px rgba(0,0,0,0.1)' }}>
          <h2 style={{margin:0}}>🛒 Tu Pedido</h2>
          {pedido.map(it => (
            <div key={it.idUnico} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #eee' }}>
              <span><strong>{it.cantidad}x</strong> {it.nombre} <br/><small>{it.detalle}</small></span>
              <strong>${it.subtotal.toLocaleString()}</strong>
            </div>
          ))}
          <div style={{marginTop:'20px', background:'#f8fafc', padding:'15px', borderRadius:'20px'}}>
             <h4>Salsas:</h4>
             <div style={{display:'flex', gap:'5px', flexWrap:'wrap'}}>
               {salsasBase.map(s => (
                 <button key={s} onClick={() => setSalsasElegidas(salsasElegidas.includes(s) ? salsasElegidas.filter(x => x !== s) : [...salsasElegidas, s])} style={{padding:'8px 12px', borderRadius:'10px', border: salsasElegidas.includes(s) ? `2px solid ${MONO_NARANJA}` : '1px solid #ddd', background: salsasElegidas.includes(s) ? '#fff7ed' : 'white', cursor:'pointer'}}>{s}</button>
               ))}
             </div>
          </div>
          <div style={{textAlign:'right', mt:'20px', fontSize:'28px', fontWeight:'900', color:MONO_NARANJA}}>Total: ${pedido.reduce((acc,i)=>acc+i.subtotal,0).toLocaleString()}</div>
          <button onClick={procesarPedido} style={{width:'100%', padding:'20px', background:mesa?MONO_NARANJA:MONO_VERDE, color:'white', borderRadius:'25px', border:'none', fontWeight:'900', fontSize:'18px', marginTop:'20px', cursor:'pointer'}}>{mesa ? "PEDIR A COCINA 👨‍🍳" : "WHATSAPP 📲"}</button>
        </div>
      )}

      {mostrarLogin && (
        <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.9)', zIndex:20000, display:'flex', justifyContent:'center', alignItems:'center'}}>
          <div style={{background:'white', padding:'40px', borderRadius:'30px', textAlign:'center'}}>
            <h3>Acceso Mono Admin</h3>
            <input type="password" onChange={e => setPinInput(e.target.value)} style={{padding:'15px', borderRadius:'15px', textAlign:'center', fontSize:'20px', width:'100%', boxSizing:'border-box'}} />
            <button onClick={() => { if(pinInput === "mono2026") { setIsAdmin(true); setMostrarLogin(false); } else { alert("PIN Incorrecto"); } }} style={{display:'block', width:'100%', marginTop:'15px', padding:'15px', background:MONO_NARANJA, color:'white', border:'none', borderRadius:'15px', fontWeight:'bold', cursor:'pointer'}}>Entrar</button>
            <button onClick={() => setMostrarLogin(false)} style={{marginTop:'10px', background:'none', border:'none', color:'#999', cursor:'pointer'}}>Cerrar</button>
          </div>
        </div>
      )}

      {agradecimiento && (
        <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:MONO_NARANJA, zIndex:10000, display:'flex', justifyContent:'center', alignItems:'center', color:'white', textAlign:'center'}}>
          <div><h1>¡Pedido Recibido!</h1><button onClick={() => setAgradecimiento(false)} style={{marginTop:'30px', padding:'15px 40px', borderRadius:'30px', border:'none', background:'white', color:MONO_NARANJA, fontWeight:'900', cursor:'pointer'}}>Volver al Menú</button></div>
        </div>
      )}
    </div>
  );
}