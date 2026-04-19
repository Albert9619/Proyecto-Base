import React, { useState, useEffect } from 'react';
import { db } from './firebaseConfig';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy } from "firebase/firestore";

// ==========================================
// 🔴 UI COMPONENTS
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
// 🔴 DATOS MAESTROS (Simplificados para rendimiento)
// ==========================================
const productosBase = [
  { id: "1", nombre: "Empanada Crujiente", precio: 1500, categoria: "Fritos", disponible: true, imagen: "/empanada.jpg", opciones: [{ nombre: "Carne", disponible: true }, { nombre: "Pollo", disponible: true }, { nombre: "Arroz", disponible: true }] },
  { id: "2", nombre: "Papa Rellena de la Casa", precio: 2500, categoria: "Fritos", disponible: true, imagen: "/papa-rellena.jpg", opciones: [{ nombre: "Carne", disponible: true }, { nombre: "Huevo", disponible: true }] },
  { id: "3", nombre: "Pastel de Pollo Hojaldrado", precio: 2500, categoria: "Fritos", disponible: true, imagen: "/pastel-pollo.jpg" },
  { id: "4", nombre: "Arepa con Huevo y Carne", precio: 3500, categoria: "Fritos", disponible: true, imagen: "/api-logo.jpg" },
  { id: "7", nombre: "Palitos de Queso Costeño", precio: 2000, categoria: "Fritos", disponible: true, imagen: "/palito-queso.jpg" },
  { id: "d1", nombre: "Desayuno Tradicional", precio: 8000, categoria: "Desayunos", disponible: true, imagen: "/desayuno-carne.jpg" },
  { id: "MMuffStcgfJe5ow5X4qV", nombre: "Jugo Natural Helado", precio: 0, categoria: "Bebidas", disponible: true, imagen: "/jugo-natural.jpg", sabores: [{ nombre: "Avena", disponible: true }, { nombre: "Maracuyá", disponible: true }], tamanos: [{ nombre: "Pequeño", precio: 1000, disponible: true }, { nombre: "Mediano", precio: 1500, disponible: true }, { nombre: "Grande", precio: 2000, disponible: true }] },
  { id: "b1", nombre: "Coca-Cola", precio: 0, categoria: "Bebidas", disponible: true, imagen: "/cocacola.jpg", tamanos: [{ nombre: "Mini", precio: 2500, disponible: true }, { nombre: "Personal", precio: 3500, disponible: true }, { nombre: "Familiar", precio: 6500, disponible: true }] },
  { id: "lzEcQicq9WUrxw7FEaq7", nombre: "Arroz Especial del Día", precio: 6000, categoria: "Arroces", disponible: true, imagen: "/arroz-pollo.jpg" }
];

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mesaURL = params.get('mesa');
    if (mesaURL) { setMesa(mesaURL); setDireccion(`Mesa ${mesaURL}`); setNombre("Cliente Local"); setMetodoPago("Caja"); }
  }, []);

  useEffect(() => {
    const unsubProd = onSnapshot(collection(db, "productos"), (s) => setProductosFB(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubTienda = onSnapshot(doc(db, "ajuste", "tienda"), (s) => { if (s.exists()) setManualOverride(s.data().abierta); });
    const qPedidos = query(collection(db, "pedidos"), orderBy("timestamp", "asc"));
    const unsubPedidos = onSnapshot(qPedidos, (s) => setPedidosFB(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubProd(); unsubTienda(); unsubPedidos(); };
  }, []);

  useEffect(() => {
    const p = localStorage.getItem("mono_p");
    if (p) setPedido(JSON.parse(p));
  }, []);

  useEffect(() => { localStorage.setItem("mono_p", JSON.stringify(pedido)); }, [pedido]);

  const productosMostrar = productosBase.map(p => {
    const pFB = productosFB.find(f => f.id === p.id);
    return pFB ? { ...p, ...pFB } : p;
  });

  const agregarAlCarrito = (p) => {
    const sel = selecciones[p.id] || {};
    const cant = cantidades[p.id] || 1;
    if (p.disponible === false) return alert("Agotado");
    let precioB = sel.tamano ? sel.tamano.precio : p.precio;
    setPedido([...pedido, { idUnico: Date.now(), nombre: p.nombre, cantidad: cant, subtotal: precioB * cant, detalle: sel.sabor || "" }]);
    setNotificacion("¡Añadido! 🥟");
    setTimeout(() => setNotificacion(""), 2000);
  };

  const procesarPedido = async () => {
    if (!mesa && (!nombre || !direccion || !metodoPago)) return alert("Faltan datos");
    const tComida = pedido.reduce((acc, i) => acc + i.subtotal, 0);
    const horaActual = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

    const datos = {
      nombre, ubicacion: mesa ? `MESA ${mesa}` : direccion, productos: pedido,
      salsas: salsasElegidas, total: tComida, pago: metodoPago, timestamp: Date.now(), hora: horaActual, notas
    };

    await setDoc(doc(db, "pedidos", `ORD-${Date.now()}`), datos);

    if (!mesa) {
      const lista = pedido.map(i => `• ${i.cantidad}x ${i.nombre}`).join('\n');
      window.open(`https://wa.me/573148686455?text=${encodeURIComponent(`*🛵 DOMICILIO*\n👤: ${nombre}\n🧾:\n${lista}\n💰: $${tComida.toLocaleString()}`)}`);
    }
    setAgradecimiento(true); setPedido([]);
  };

  if (isAdmin) {
    return (
      <div style={{padding: '20px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif'}}>
        <div style={{maxWidth:'900px', margin:'0 auto'}}>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
            <h1 style={{color: MONO_NARANJA}}>Monitor POS 🐒</h1>
            <button onClick={() => setIsAdmin(false)} style={{padding:'10px 20px', borderRadius:'10px', border:'none', background:MONO_TEXTO, color:'white', cursor:'pointer'}}>Cerrar</button>
          </div>

          <div style={{display:'flex', gap:'10px', marginBottom:'20px', background:'#e2e8f0', padding:'5px', borderRadius:'15px'}}>
             <button onClick={() => setTabActiva("pedidos")} style={{flex:1, padding:'12px', borderRadius:'10px', border:'none', fontWeight:'bold', cursor:'pointer', background: tabActiva === "pedidos" ? 'white' : 'transparent'}}>🧾 Cuentas</button>
             <button onClick={() => setTabActiva("productos")} style={{flex:1, padding:'12px', borderRadius:'10px', border:'none', fontWeight:'bold', cursor:'pointer', background: tabActiva === "productos" ? 'white' : 'transparent'}}>📦 Stock</button>
             <button onClick={() => setTabActiva("mesas")} style={{flex:1, padding:'12px', borderRadius:'10px', border:'none', fontWeight:'bold', cursor:'pointer', background: tabActiva === "mesas" ? 'white' : 'transparent'}}>🪑 QRs</button>
          </div>

          {tabActiva === "pedidos" && (
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'20px'}}>
              {[1,2,3,4,5,6,7,8,9,10].map(n => {
                const mesaPedidos = pedidosFB.filter(p => p.ubicacion === `MESA ${n}`);
                if (mesaPedidos.length === 0) return null;
                const totalMesa = mesaPedidos.reduce((acc, p) => acc + p.total, 0);
                return (
                  <div key={n} style={{background:'white', padding:'20px', borderRadius:'25px', border:`3px solid ${MONO_NARANJA}`, boxShadow:'0 10px 20px rgba(0,0,0,0.05)'}}>
                    <h2 style={{margin:0}}>MESA {n}</h2>
                    <div style={{margin:'15px 0', background:'#f8fafc', padding:'10px', borderRadius:'15px', maxHeight:'200px', overflowY:'auto'}}>
                      {mesaPedidos.map(p => (
                        <div key={p.id} style={{borderBottom:'1px solid #eee', padding:'5px 0'}}>
                          {p.productos.map((item, i) => ( <div key={i} style={{fontSize:'14px'}}>• {item.cantidad}x {item.nombre}</div> ))}
                        </div>
                      ))}
                    </div>
                    <div style={{fontSize:'28px', fontWeight:'900', textAlign:'center', color:MONO_NARANJA}}>${totalMesa.toLocaleString()}</div>
                    <button onClick={async () => { if(window.confirm("¿Cobrar y limpiar mesa?")) mesaPedidos.forEach(p => deleteDoc(doc(db, "pedidos", p.id))) }} style={{width:'100%', padding:'15px', background:MONO_TEXTO, color:'white', borderRadius:'15px', border:'none', cursor:'pointer', marginTop:'10px', fontWeight:'bold'}}>CERRAR CUENTA 💸</button>
                  </div>
                );
              })}
              {/* Domicilios */}
              {pedidosFB.filter(p => !p.ubicacion.includes("MESA")).map(p => (
                <div key={p.id} style={{background:'white', padding:'20px', borderRadius:'25px', borderLeft:`10px solid ${MONO_VERDE}`, boxShadow:'0 5px 10px rgba(0,0,0,0.05)'}}>
                  <h4 style={{margin:0}}>{p.nombre}</h4>
                  <small>{p.ubicacion}</small>
                  <div style={{fontWeight:'bold', fontSize:'20px', margin:'10px 0'}}>${p.total.toLocaleString()}</div>
                  <button onClick={() => deleteDoc(doc(db, "pedidos", p.id))} style={{width:'100%', background:MONO_VERDE, color:'white', border:'none', padding:'10px', borderRadius:'10px', fontWeight:'bold'}}>ENTREGADO ✅</button>
                </div>
              ))}
            </div>
          )}

          {tabActiva === "mesas" && (
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:'20px'}}>
              {[1,2,3,4,5,6,7,8].map(n => {
                const url = `${window.location.origin}/?mesa=${n}`;
                const qr = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}`;
                return (
                  <div key={n} style={{textAlign:'center', background:'white', padding:'15px', borderRadius:'20px', border:'1px solid #eee'}}>
                    <div style={{fontWeight:'bold', color:MONO_NARANJA, marginBottom:'10px'}}>MESA {n}</div>
                    <img src={qr} style={{width:'100%', borderRadius:'10px'}} alt="QR" />
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
      <header style={{textAlign:'center', padding:'30px', background:'white', borderRadius:'0 0 50px 50px', boxShadow:'0 5px 20px rgba(0,0,0,0.05)'}}>
        <h1 onClick={() => setMostrarLogin(true)} style={{color: MONO_NARANJA, margin:0, cursor:'pointer'}}>Fritos El Mono 🐒</h1>
      </header>

      {/* Grid de Productos Cliente */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', padding: '20px'}}>
        {productosMostrar.filter(p => p.categoria === categoriaActiva).map(p => (
          <div key={p.id} style={{background:'white', padding:'20px', borderRadius:'30px', textAlign:'center', opacity: p.disponible ? 1 : 0.6}}>
            <h3 style={{margin:0}}>{p.nombre}</h3>
            <p style={{fontSize:'22px', fontWeight:'900', color:MONO_NARANJA}}>${p.precio.toLocaleString()}</p>
            <div style={{display:'flex', gap:'10px', justifyContent:'center', marginBottom:'15px'}}>
               <button onClick={() => setCantidades({...cantidades, [p.id]: Math.max(1, (cantidades[p.id] || 1) - 1)})} style={{width:'35px', height:'35px', borderRadius:'50%'}}>-</button>
               <span style={{fontSize:'20px', fontWeight:'bold'}}>{cantidades[p.id] || 1}</span>
               <button onClick={() => setCantidades({...cantidades, [p.id]: (cantidades[p.id] || 1) + 1})} style={{width:'35px', height:'35px', borderRadius:'50%', background:MONO_NARANJA, color:'white', border:'none'}}>+</button>
            </div>
            <button onClick={() => agregarAlCarrito(p)} disabled={!p.disponible} style={{width:'100%', padding:'15px', borderRadius:'15px', background: p.disponible ? MONO_NARANJA : '#ccc', color:'white', border:'none', fontWeight:'bold'}}>Añadir 🛒</button>
          </div>
        ))}
      </div>

      {pedido.length > 0 && (
        <div style={{ maxWidth: '650px', margin: '20px auto', background: 'white', padding: '30px', borderRadius: '40px', border: `4px solid ${MONO_NARANJA}` }}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
            <h2 style={{margin:0}}>🛒 Tu Ticket</h2>
            <button onClick={() => { if(window.confirm("¿Borrar todo?")) setPedido([]) }} style={{color:'red', border:'none', background:'none', cursor:'pointer'}}>Vaciar Todo</button>
          </div>
          {pedido.map(item => (
            <div key={item.idUnico} style={{ display: 'flex', justifyContent: 'space-between', padding:'10px 0', borderBottom:'1px solid #eee' }}>
              <span><strong>{item.cantidad}x</strong> {item.nombre}</span>
              <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                <strong>${item.subtotal.toLocaleString()}</strong>
                <button onClick={() => setPedido(pedido.filter(i => i.idUnico !== item.idUnico))} style={{background:'none', border:'none', cursor:'pointer'}}>❌</button>
              </div>
            </div>
          ))}

          <div style={{marginTop:'25px'}}>
            {!mesa ? (
              <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                <input type="text" placeholder="Tu nombre" onChange={e => setNombre(e.target.value)} style={{padding:'15px', borderRadius:'12px', border:'1px solid #ddd'}} />
                <input type="text" placeholder="Dirección exacta" onChange={e => setDireccion(e.target.value)} style={{padding:'15px', borderRadius:'12px', border:'1px solid #ddd'}} />
                <select onChange={e => setMetodoPago(e.target.value)} style={{padding:'15px', borderRadius:'12px', border:'1px solid #ddd'}}>
                   <option value="">-- Pago --</option><option value="Efectivo">Efectivo</option><option value="Nequi">Nequi</option>
                </select>
              </div>
            ) : (
              <div style={{padding:'15px', background:'#ecfdf5', borderRadius:'15px', textAlign:'center', color:'#065f46', fontWeight:'bold'}}>📍 ESTÁS EN LA MESA {mesa}</div>
            )}
            <textarea placeholder="¿Notas adicionales?" onChange={e => setNotas(e.target.value)} style={{width:'100%', padding:'15px', borderRadius:'12px', border:'1px solid #ddd', marginTop:'10px', boxSizing:'border-box'}} />
            <button onClick={procesarPedido} style={{width:'100%', padding:'22px', background: mesa ? MONO_NARANJA : MONO_VERDE, color:'white', borderRadius:'20px', border:'none', fontWeight:'900', fontSize:'18px', marginTop:'15px', cursor:'pointer'}}>
              {mesa ? "PEDIR A COCINA 👨‍🍳" : "WHATSAPP 📲"}
            </button>
          </div>
        </div>
      )}

      {/* Modals Login y Agradecimiento */}
      {mostrarLogin && (
        <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.8)', zIndex:1000, display:'flex', justifyContent:'center', alignItems:'center'}}>
          <div style={{background:'white', padding:'30px', borderRadius:'25px', textAlign:'center'}}>
            <h3>Acceso Admin</h3>
            <input type="password" onChange={e => setPinInput(e.target.value)} style={{padding:'10px', borderRadius:'10px', textAlign:'center'}} />
            <button onClick={() => { if(pinInput === "mono2026") setIsAdmin(true); setMostrarLogin(false); }} style={{display:'block', width:'100%', marginTop:'10px', padding:'10px', background:MONO_NARANJA, color:'white', border:'none', borderRadius:'10px'}}>Entrar</button>
          </div>
        </div>
      )}

      {agradecimiento && (
        <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:MONO_NARANJA, zIndex:2000, display:'flex', justifyContent:'center', alignItems:'center', color:'white', textAlign:'center'}}>
          <div><h1>¡Pedido Recibido!</h1><p>El Mono ya está en la cocina.</p><button onClick={() => setAgradecimiento(false)} style={{padding:'10px 40px', borderRadius:'20px', border:'none', background:'white', color:MONO_NARANJA, fontWeight:'bold', cursor:'pointer'}}>Volver</button></div>
        </div>
      )}
    </div>
  );
}