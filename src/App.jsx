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

const beep = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ9vT19vT19vT19vT19vT19v");

// ==========================================
// 🔴 DATOS MAESTROS COMPLETOS
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
  { id: "b7", nombre: "Aromáticas", precio: 1000, categoria: "Bebidas", disponible: true, imagen: "/aromática.jpg" , sabores: [{ nombre: "Manzanilla", disponible: true},{nombre: "Hierbabuena", disponible: true}]},
  { id: "milo1", nombre: "Milo Refrescante", precio: 4000, categoria: "Bebidas", disponible: true, imagen: "/milo.jpg" }, 
  { id: "lzEcQicq9WUrxw7FEaq7", nombre: "Arroz Especial del Día", precio: 6000, categoria: "Arroces", disponible: true, imagen: "/arroz-pollo.jpg" }
];

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [tabActiva, setTabActiva] = useState("pedidos"); 
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState("Fritos");
  const [pedidosFB, setPedidosFB] = useState([]); 
  const [pedido, setPedido] = useState([]);
  const [selecciones, setSelecciones] = useState({});
  const [cantidades, setCantidades] = useState({});
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [metodoPago, setMetodoPago] = useState("");
  const [agradecimiento, setAgradecimiento] = useState(false);
  const [mesa, setMesa] = useState(null);

  const hoy = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"][new Date().getDay()];
  const tipoArrozHoy = ["lunes", "miércoles", "viernes"].includes(hoy) ? "Pollo" : "Cerdo";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mesaURL = params.get('mesa');
    if (mesaURL) { setMesa(mesaURL); setDireccion(`Mesa ${mesaURL}`); setNombre("Cliente Local"); setMetodoPago("Caja"); }
  }, []);

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

  const agregarAlCarrito = (p) => {
    const sel = selecciones[p.id] || {};
    const cant = cantidades[p.id] || 1;
    if (p.disponible === false) return alert("Agotado");
    if (p.opciones && !sel.sabor && p.categoria === "Fritos") return alert("Elige un sabor");
    
    let precioB = p.precio || 0;
    if (sel.tamano) precioB = sel.tamano.precio || 0;
    
    setPedido([...pedido, { idUnico: Date.now(), nombre: p.nombre, cantidad: cant, subtotal: precioB * cant, detalle: sel.sabor || sel.tamano?.nombre || '' }]);
  };

  const procesarPedido = async () => {
    if (!mesa && (!nombre || !direccion || !metodoPago)) return alert("Faltan datos");
    const total = pedido.reduce((acc, i) => acc + i.subtotal, 0);
    const id = `ORD-${Date.now()}`;
    await setDoc(doc(db, "pedidos", id), {
      nombre, ubicacion: mesa ? `MESA ${mesa}` : direccion, productos: pedido,
      total, pago: metodoPago, timestamp: Date.now(), hora: new Date().toLocaleTimeString([], { hour:'numeric', minute:'2-digit' }), 
      estado: "pendiente"
    });
    setAgradecimiento(true); setPedido([]);
  };

  const actualizarEstado = async (id, nuevoEstado) => {
    await updateDoc(doc(db, "pedidos", id), { estado: nuevoEstado });
  };

  if (isAdmin) {
    // Calculamos ventas solo de pedidos PAGADOS
    const ventasPagadasHoy = pedidosFB.filter(p => p.estado === "pagado").reduce((acc, p) => acc + p.total, 0);

    return (
      <div style={{padding: '20px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif'}}>
        <div style={{maxWidth:'1100px', margin:'0 auto'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', mb:'20px'}}>
             <h1 style={{color: MONO_NARANJA}}>Monitor Mono 🐒</h1>
             <div style={{background: MONO_TEXTO, color:'white', padding:'10px 20px', borderRadius:'15px', textAlign:'right'}}>
                Ventas Pagadas: <strong style={{fontSize:'20px'}}>${ventasPagadasHoy.toLocaleString()}</strong>
             </div>
             <button onClick={() => setIsAdmin(false)} style={{padding:'10px 20px', borderRadius:'10px', background:'#eee', border:'none'}}>Salir</button>
          </div>

          <div style={{display:'flex', gap:'10px', mb:'25px'}}>
             <button onClick={() => setTabActiva("pedidos")} style={{flex:1, padding:'15px', borderRadius:'15px', border:'none', background: tabActiva === "pedidos" ? MONO_NARANJA : 'white', color: tabActiva === "pedidos" ? 'white' : MONO_TEXTO, fontWeight:'bold', cursor:'pointer'}}>👨‍🍳 Cocina</button>
             <button onClick={() => setTabActiva("mesas")} style={{flex:1, padding:'15px', borderRadius:'15px', border:'none', background: tabActiva === "mesas" ? MONO_NARANJA : 'white', color: tabActiva === "mesas" ? 'white' : MONO_TEXTO, fontWeight:'bold', cursor:'pointer'}}>💰 Cobro Mesas</button>
          </div>

          {tabActiva === "pedidos" && (
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px, 1fr))', gap:'20px'}}>
              {pedidosFB.filter(p => p.estado !== "entregado" && p.estado !== "pagado").map(p => (
                <div key={p.id} style={{background:'white', padding:'20px', borderRadius:'30px', borderLeft:`10px solid ${p.estado === 'pendiente' ? '#fbbf24' : MONO_AZUL}`, boxShadow:'0 5px 15px rgba(0,0,0,0.05)'}}>
                  <div style={{display:'flex', justifyContent:'space-between'}}><strong>{p.ubicacion}</strong><small>{p.hora}</small></div>
                  <div style={{margin:'10px 0'}}>
                    {p.productos.map((item, i) => ( <div key={i} style={{fontSize:'14px'}}>• {item.cantidad}x {item.nombre} <small>({item.detalle})</small></div> ))}
                  </div>
                  <div style={{display:'flex', gap:'5px'}}>
                     {p.estado === 'pendiente' && <button onClick={() => actualizarEstado(p.id, 'preparando')} style={{flex:1, background:MONO_AZUL, color:'white', border:'none', padding:'10px', borderRadius:'10px', fontWeight:'bold'}}>Preparar</button>}
                     {p.estado === 'preparando' && <button onClick={() => actualizarEstado(p.id, 'entregado')} style={{flex:1, background:MONO_VERDE, color:'white', border:'none', padding:'10px', borderRadius:'10px', fontWeight:'bold'}}>Entregado ✅</button>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tabActiva === "mesas" && (
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'20px'}}>
              {[1,2,3,4,5,6,7,8,9,10].map(n => {
                const mesaPed = pedidosFB.filter(p => p.ubicacion === `MESA ${n}` && p.estado !== "pagado");
                const total = mesaPed.reduce((acc, p) => acc + p.total, 0);
                if (mesaPed.length === 0) return null;
                return (
                  <div key={n} style={{background:'white', padding:'25px', borderRadius:'30px', border:`2px solid ${MONO_NARANJA}`, boxShadow:'0 10px 20px rgba(0,0,0,0.05)'}}>
                    <h3 style={{margin:0}}>MESA {n}</h3>
                    <div style={{margin:'15px 0', fontSize:'14px', maxHeight:'150px', overflowY:'auto', background:'#f8fafc', padding:'10px', borderRadius:'15px'}}>
                      {mesaPed.map(p => (
                        <div key={p.id} style={{borderBottom:'1px solid #eee', mb:'5px', pb:'5px'}}>
                          {p.productos.map((item, i) => ( <div key={i}>• {item.cantidad}x {item.nombre} <small>({item.detalle})</small></div> ))}
                        </div>
                      ))}
                    </div>
                    <div style={{fontSize:'32px', fontWeight:'900', textAlign:'center', color:MONO_NARANJA}}>${total.toLocaleString()}</div>
                    <button onClick={() => {if(window.confirm("¿Cobrar cuenta?")) mesaPed.forEach(p => actualizarEstado(p.id, 'pagado'))}} style={{marginTop:'15px', width:'100%', padding:'15px', background:MONO_TEXTO, color:'white', border:'none', borderRadius:'15px', fontWeight:'bold', cursor:'pointer'}}>PAGAR TODO 💸</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#fffcf5', minHeight: '100vh', paddingBottom: '120px' }}>
      <header style={{textAlign:'center', padding:'40px', background:'white', borderRadius:'0 0 50px 50px'}}>
        <h1 onClick={() => setMostrarLogin(true)} style={{color: MONO_NARANJA, fontSize:'2.5rem', fontWeight:'900', cursor:'pointer'}}>Fritos El Mono 🐒</h1>
        <div style={{marginTop:'10px', background:'#fff7ed', padding:'8px 20px', borderRadius:'20px', fontWeight:'bold', display:'inline-block'}}>Arroz de hoy: {tipoArrozHoy}</div>
      </header>

      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '25px' }}>
        {["Fritos", "Desayunos", "Arroces", "Bebidas"].map(cat => (
          <button key={cat} onClick={() => setCategoriaActiva(cat)} style={{ padding: '12px 25px', borderRadius: '30px', border: 'none', background: categoriaActiva === cat ? MONO_NARANJA : 'white', fontWeight:'bold' }}>{cat}</button>
        ))}
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px', padding: '0 20px'}}>
        {productosBase.filter(p => p.categoria === categoriaActiva).map(p => {
          const sel = selecciones[p.id] || {};
          const cant = cantidades[p.id] || 1;
          const pActual = p.tamanos ? (sel.tamano?.precio || p.tamanos[0].precio) : (p.precio || 0);
          return (
            <div key={p.id} style={{background:'white', padding:'20px', borderRadius:'40px', boxShadow:'0 10px 20px rgba(0,0,0,0.02)', textAlign:'center'}}>
              <img src={p.imagen} style={{width:'100%', height:'180px', borderRadius:'25px', objectFit:'cover'}} alt={p.nombre} />
              <h3 style={{margin:'15px 0 5px'}}>{p.nombre}</h3>
              <p style={{color:MONO_NARANJA, fontWeight:'900', fontSize:'22px'}}>${pActual.toLocaleString()}</p>
              
              {p.opciones && (
                <div style={{display:'flex', gap:'5px', flexWrap:'wrap', justifyContent:'center', mb:'10px'}}>
                  {p.opciones.map(o => (
                    <button key={o.nombre} onClick={() => setSelecciones({...selecciones, [p.id]: {...sel, sabor: o.nombre}})} style={{padding:'6px 12px', borderRadius:'10px', border: sel.sabor === o.nombre ? `2px solid ${MONO_NARANJA}` : '1px solid #eee', background: sel.sabor === o.nombre ? '#fff7ed' : 'white'}}>{o.nombre}</button>
                  ))}
                </div>
              )}

              {p.tamanos && (
                <div style={{display:'flex', gap:'5px', justifyContent:'center', mb:'10px'}}>
                  {p.tamanos.map(t => (
                    <button key={t.nombre} onClick={() => setSelecciones({...selecciones, [p.id]: {...sel, tamano: t}})} style={{padding:'6px 12px', borderRadius:'10px', border: sel.tamano?.nombre === t.nombre ? `2px solid ${MONO_NARANJA}` : '1px solid #eee', background: sel.tamano?.nombre === t.nombre ? '#fff7ed' : 'white'}}>{t.nombre}</button>
                  ))}
                </div>
              )}

              <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'15px', mb:'15px'}}>
                 <button onClick={() => setCantidades({...cantidades, [p.id]: Math.max(1, cant - 1)})}>-</button>
                 <strong>{cant}</strong>
                 <button onClick={() => setCantidades({...cantidades, [p.id]: cant + 1})}>+</button>
              </div>
              <button onClick={() => agregarAlCarrito(p)} disabled={!p.disponible} style={{width:'100%', padding:'15px', background:MONO_NARANJA, color:'white', borderRadius:'20px', border:'none', fontWeight:'bold'}}>Añadir 🛒</button>
            </div>
          );
        })}
      </div>

      {pedido.length > 0 && (
        <div style={{ maxWidth: '600px', margin: '20px auto', background: 'white', padding: '30px', borderRadius: '40px', border: `5px solid ${MONO_NARANJA}` }}>
          <h2>🛒 Tu Pedido</h2>
          {pedido.map(item => (
            <div key={item.idUnico} style={{ display: 'flex', justifyContent: 'space-between', mb:'10px' }}>
              <span>{item.cantidad}x {item.nombre} <small>({item.detalle})</small></span>
              <strong>${item.subtotal.toLocaleString()}</strong>
            </div>
          ))}
          <div style={{textAlign:'right', mt:'20px', fontSize:'32px', fontWeight:'900', color:MONO_NARANJA}}>Total: ${pedido.reduce((acc,i)=>acc+i.subtotal,0).toLocaleString()}</div>
          <button onClick={procesarPedido} style={{width:'100%', mt:'20px', padding:'25px', background: mesa ? MONO_NARANJA : MONO_VERDE, color:'white', borderRadius:'25px', border:'none', fontWeight:'900', fontSize:'18px'}}>
            {mesa ? "PEDIR A COCINA 👨‍🍳" : "WHATSAPP 📲"}
          </button>
        </div>
      )}

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