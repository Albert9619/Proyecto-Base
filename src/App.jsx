import React, { useState, useEffect } from 'react';
import { db } from './firebaseConfig';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy } from "firebase/firestore";

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
const MONO_TEXTO = "#333333";

// ==========================================
// 🔴 DATOS MAESTROS (RESTURADOS)
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
  { id: "lzEcQicq9WUrxw7FEaq7", nombre: "Arroz Especial del Día", precio: 6000, categoria: "Arroces", disponible: true, imagen: "/arroz-pollo.jpg" }
];

const extrasArrozBase = [
  { id: 'huevo', nombre: "Huevo Cocido", disponible: true, precio: 1000 },
  { id: 'queso', nombre: "Tajada de Queso", disponible: true, precio: 1000 }
];

const salsasIniciales = [
  { id: "roja", nombre: "🔴 Roja", disponible: true },
  { id: "pique", nombre: "🔥 Pique", disponible: true },
  { id: "suero", nombre: "🥛 Suero", disponible: true }
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

  const hoy = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"][new Date().getDay()];
  const tipoArrozHoy = ["lunes", "miércoles", "viernes"].includes(hoy) ? "Pollo" : "Cerdo";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mesaURL = params.get('mesa');
    if (mesaURL) { setMesa(mesaURL); setDireccion(`Mesa ${mesaURL}`); setNombre("Cliente Local"); setMetodoPago("Caja"); }
  }, []);

  useEffect(() => {
    const unsubProd = onSnapshot(collection(db, "productos"), (s) => setProductosFB(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const qPedidos = query(collection(db, "pedidos"), orderBy("timestamp", "asc"));
    const unsubPedidos = onSnapshot(qPedidos, (s) => setPedidosFB(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubProd(); unsubPedidos(); };
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
    
    // Validación de sabores para fritos
    if (p.opciones && !sel.sabor && p.categoria === "Fritos") return alert("Elige un sabor");

    let precioB = p.precio || 0;
    if (sel.tamano) precioB = sel.tamano.precio || 0;
    
    // Cálculo de extras
    const extrasP = (sel.extras || []).reduce((acc, n) => acc + (extrasArrozBase.find(e => e.nombre === n)?.precio || 0), 0);
    const subtotal = (precioB + extrasP) * cant;

    // Detalle dinámico para cocina
    let det = `${sel.sabor || ''} ${sel.tamano?.nombre || ''} ${sel.extras?.length > 0 ? 'Ex: '+sel.extras.join(', ') : ''}`;
    if (p.categoria === "Desayunos") det += `(${sel.acompanamiento || 'Arepa'}, ${sel.huevos || sel.proteina || 'Revueltos'}, ${sel.jugo || 'Avena'})`;

    setPedido([...pedido, { idUnico: Date.now(), nombre: p.nombre, cantidad: cant, subtotal, detalle: det.trim() }]);
    setNotificacion("¡Añadido! 🥟");
    setTimeout(() => setNotificacion(""), 2000);
  };

  const procesarPedido = async () => {
    if (!mesa && (!nombre || !direccion || !metodoPago)) return alert("Faltan datos");
    const tComida = pedido.reduce((acc, i) => acc + i.subtotal, 0);
    const tFinal = tComida + (mesa ? 0 : (tComida < 8000 ? 2000 : 0));
    const horaActual = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

    const idPedido = `ORD-${Date.now()}`;
    await setDoc(doc(db, "pedidos", idPedido), {
      nombre, ubicacion: mesa ? `MESA ${mesa}` : direccion, productos: pedido,
      salsas: salsasElegidas, total: tFinal, pago: metodoPago, timestamp: Date.now(), hora: horaActual, notas
    });

    if (!mesa) {
      const lista = pedido.map(i => `• ${i.cantidad}x ${i.nombre} (${i.detalle})`).join('\n');
      const msg = `*🛵 DOMICILIO*\n👤: ${nombre}\n🧾:\n${lista}\n💰: $${tFinal.toLocaleString()}\n💳: ${metodoPago}\n📝: ${notas}`;
      window.open(`https://wa.me/573148686455?text=${encodeURIComponent(msg)}`);
    }
    setAgradecimiento(true); setPedido([]);
  };

  // ==========================================
  // 🔴 VISTA ADMINISTRADOR (POS DE MESAS)
  // ==========================================
  if (isAdmin) {
    return (
      <div style={{padding: '20px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif'}}>
        <div style={{maxWidth:'950px', margin:'0 auto'}}>
          <div style={{display:'flex', justifyContent:'space-between', mb:'20px', alignItems:'center'}}>
            <h1 style={{color: MONO_NARANJA}}>Monitor Mono 🐒</h1>
            <button onClick={() => setIsAdmin(false)} style={{padding:'10px 20px', borderRadius:'10px', background:MONO_TEXTO, color:'white', border:'none'}}>Cerrar</button>
          </div>

          <div style={{display:'flex', gap:'10px', marginBottom:'25px', background:'#e2e8f0', padding:'5px', borderRadius:'15px'}}>
             <button onClick={() => setTabActiva("pedidos")} style={{flex:1, padding:'12px', borderRadius:'10px', border:'none', fontWeight:'bold', cursor:'pointer', background: tabActiva === "pedidos" ? 'white' : 'transparent'}}>🧾 Cuentas Mesas</button>
             <button onClick={() => setTabActiva("productos")} style={{flex:1, padding:'12px', borderRadius:'10px', border:'none', fontWeight:'bold', cursor:'pointer', background: tabActiva === "productos" ? 'white' : 'transparent'}}>📦 Stock</button>
             <button onClick={() => setTabActiva("mesas")} style={{flex:1, padding:'12px', borderRadius:'10px', border:'none', fontWeight:'bold', cursor:'pointer', background: tabActiva === "mesas" ? 'white' : 'transparent'}}>🪑 QRs</button>
          </div>

          {tabActiva === "pedidos" && (
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'20px'}}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => {
                const mesaPedidos = pedidosFB.filter(p => p.ubicacion === `MESA ${n}`);
                if (mesaPedidos.length === 0) return null;
                const totalMesa = mesaPedidos.reduce((acc, p) => acc + p.total, 0);
                return (
                  <div key={n} style={{background:'white', padding:'25px', borderRadius:'30px', border:`3px solid ${MONO_NARANJA}`, boxShadow:'0 10px 25px rgba(0,0,0,0.05)'}}>
                    <h2 style={{margin:'0 0 10px 0'}}>MESA {n}</h2>
                    <div style={{maxHeight:'250px', overflowY:'auto', background:'#f8fafc', borderRadius:'15px', padding:'10px', mb:'15px'}}>
                      {mesaPedidos.map(p => (
                        <div key={p.id} style={{borderBottom:'1px solid #eee', py:'8px'}}>
                          {p.productos.map((item, i) => ( <div key={i} style={{fontSize:'14px'}}>• <strong>{item.cantidad}x</strong> {item.nombre} <small>({item.detalle})</small></div> ))}
                          {p.salsas?.length > 0 && <div style={{fontSize:'11px', color:MONO_VERDE}}>🍯 {p.salsas.join(', ')}</div>}
                        </div>
                      ))}
                    </div>
                    <div style={{fontSize:'32px', fontWeight:'900', textAlign:'center', color:MONO_TEXTO, background:'#fff7ed', borderRadius:'20px', py:'10px'}}>
                      ${totalMesa.toLocaleString()}
                    </div>
                    <button onClick={async () => { if(window.confirm(`¿Cerrar Mesa ${n}?`)) mesaPedidos.forEach(p => deleteDoc(doc(db, "pedidos", p.id))) }} style={{width:'100%', mt:'15px', p:'15px', borderRadius:'15px', background:MONO_TEXTO, color:'white', fontWeight:'bold', border:'none', cursor:'pointer'}}>CERRAR CUENTA 💸</button>
                  </div>
                );
              })}
            </div>
          )}

          {tabActiva === "mesas" && (
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:'20px'}}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(n => {
                const url = `${window.location.origin}/?mesa=${n}`;
                return (
                  <div key={n} style={{textAlign:'center', background:'white', padding:'20px', borderRadius:'20px', border:'1px solid #eee'}}>
                    <div style={{fontWeight:'bold', color:MONO_NARANJA, mb:'10px'}}>MESA {n}</div>
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`} style={{width:'100%', borderRadius:'10px'}} alt="QR" />
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
  // 🟡 VISTA CLIENTE (CON TODOS LOS DETALLES)
  // ==========================================
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#fffcf5', minHeight: '100vh', paddingBottom: '120px' }}>
      <header style={{textAlign:'center', padding:'40px', background:'white', borderRadius:'0 0 50px 50px', boxShadow:'0 5px 30px rgba(0,0,0,0.05)'}}>
        <h1 onClick={() => setMostrarLogin(true)} style={{color: MONO_NARANJA, fontSize:'2.5rem', fontWeight:'900', cursor:'pointer'}}>Fritos El Mono 🐒</h1>
        <div style={{marginTop:'10px', background:'#fff7ed', padding:'8px 20px', borderRadius:'20px', fontWeight:'bold', display:'inline-block'}}>Arroz de hoy: {tipoArrozHoy}</div>
      </header>

      <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', padding: '25px', scrollbarWidth:'none' }}>
        {["Fritos", "Desayunos", "Arroces", "Bebidas"].map(cat => (
          <button key={cat} onClick={() => setCategoriaActiva(cat)} style={{ padding: '12px 25px', borderRadius: '30px', border: 'none', background: categoriaActiva === cat ? MONO_NARANJA : 'white', color: categoriaActiva === cat ? 'white' : MONO_TEXTO, fontWeight:'bold', flexShrink:0, boxShadow:'0 4px 10px rgba(0,0,0,0.05)' }}>{cat}</button>
        ))}
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px', padding: '0 20px'}}>
        {productosMostrar.filter(p => p.categoria === categoriaActiva).map(p => {
            const sel = selecciones[p.id] || {};
            const cant = cantidades[p.id] || 1;
            const precioActual = p.tamanos ? (sel.tamano?.precio || p.tamanos[0]?.precio || 0) : (p.precio || 0);

            return (
              <div key={p.id} style={{background: 'white', borderRadius: '40px', padding: '20px', boxShadow: '0 10px 20px rgba(0,0,0,0.02)', opacity: p.disponible ? 1 : 0.6}}>
                <img src={p.imagen} style={{ width: '100%', height: '180px', borderRadius: '25px', objectFit: 'cover' }} alt={p.nombre} />
                <h3 style={{margin: '15px 0 5px 0', fontWeight: '800'}}>{p.nombre}</h3>
                <p style={{color: MONO_NARANJA, fontWeight: '900', fontSize: '24px', mb:'15px'}}>${precioActual.toLocaleString()}</p>
                
                {/* SELECTORES DE SABOR / OPCIONES */}
                {(p.opciones || p.sabores) && (
                  <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap', mb: '15px'}}>
                    {(p.opciones || p.sabores).map(o => (
                      <button key={o.nombre} onClick={() => setSelecciones({...selecciones, [p.id]: {...sel, sabor: o.nombre}})} style={{padding:'8px 15px', borderRadius:'12px', border: sel.sabor === o.nombre ? `2px solid ${MONO_NARANJA}` : '1px solid #eee', background: sel.sabor === o.nombre ? '#fff7ed' : 'white', fontWeight:'bold'}}>{o.nombre}</button>
                    ))}
                  </div>
                )}

                {/* SELECTORES DE TAMAÑO */}
                {p.tamanos && (
                  <div style={{display: 'flex', gap: '8px', mb: '15px'}}>
                    {p.tamanos.map(t => (
                      <button key={t.nombre} onClick={() => setSelecciones({...selecciones, [p.id]: {...sel, tamano: t}})} style={{padding:'8px 15px', borderRadius:'12px', border: sel.tamano?.nombre === t.nombre ? `2px solid ${MONO_NARANJA}` : '1px solid #eee', background: sel.tamano?.nombre === t.nombre ? '#fff7ed' : 'white', fontWeight:'bold'}}>{t.nombre}</button>
                    ))}
                  </div>
                )}

                {/* CONTROL DE CANTIDAD */}
                <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'20px', mb:'20px'}}>
                   <button onClick={() => setCantidades({...cantidades, [p.id]: Math.max(1, cant - 1)})} style={{width:'40px', height:'40px', borderRadius:'50%', border:'1px solid #eee'}}>-</button>
                   <span style={{fontWeight:'900', fontSize:'22px'}}>{cant}</span>
                   <button onClick={() => setCantidades({...cantidades, [p.id]: cant + 1})} style={{width:'40px', height:'40px', borderRadius:'50%', background:MONO_NARANJA, color:'white', border:'none'}}>+</button>
                </div>
                <button onClick={() => agregarAlCarrito(p)} disabled={!p.disponible} style={{width:'100%', padding:'20px', borderRadius:'20px', background: p.disponible ? MONO_NARANJA : '#ccc', color:'white', border:'none', fontWeight:'900', fontSize:'18px'}}>Añadir 🛒</button>
              </div>
            );
        })}
      </div>

      {/* TICKET DE PEDIDO DETALLADO */}
      {pedido.length > 0 && (
        <div style={{ maxWidth: '700px', margin: '40px auto', background: 'white', padding: '35px', borderRadius: '40px', border: `5px solid ${MONO_NARANJA}`, boxShadow:'0 20px 40px rgba(0,0,0,0.1)' }}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', mb:'25px'}}>
             <h2 style={{margin:0, fontSize:'32px', fontWeight:'900'}}>🛒 Tu Pedido</h2>
             <button onClick={() => { if(window.confirm("¿Vaciar ticket?")) setPedido([]) }} style={{color:'red', border:'none', background:'none', fontWeight:'bold'}}>Vaciar Todo</button>
          </div>
          {pedido.map(item => (
            <div key={item.idUnico} style={{ display: 'flex', justifyContent: 'space-between', padding:'15px 0', borderBottom:'1px solid #eee', alignItems:'center' }}>
              <span style={{flex:1}}><strong>{item.cantidad}x</strong> {item.nombre} <br /><small style={{color:'#666'}}>{item.detalle}</small></span>
              <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                <strong style={{fontSize:'18px'}}>${item.subtotal.toLocaleString()}</strong>
                <button onClick={() => setPedido(pedido.filter(i => i.idUnico !== item.idUnico))} style={{background:'none', border:'none', fontSize:'18px'}}>❌</button>
              </div>
            </div>
          ))}

          {/* SELECTOR DE SALSAS */}
          <div style={{marginTop:'30px', background:'#f8fafc', padding:'20px', borderRadius:'20px'}}>
            <h4 style={{margin:'0 0 10px 0'}}>¿Salsas?</h4>
            <div style={{display:'flex', gap:'10px', flexWrap:'wrap'}}>
              {salsasIniciales.map(s => (
                <button key={s.id} onClick={() => setSalsasElegidas(salsasElegidas.includes(s.nombre) ? salsasElegidas.filter(x => x !== s.nombre) : [...salsasElegidas, s.nombre])} style={{padding:'10px 15px', borderRadius:'10px', border: salsasElegidas.includes(s.nombre) ? `2px solid ${MONO_NARANJA}` : '1px solid #ddd', background: salsasElegidas.includes(s.nombre) ? '#fff7ed' : 'white', fontWeight:'bold'}}>{s.nombre}</button>
              ))}
            </div>
          </div>

          {/* TOTAL Y FORMULARIO */}
          <div style={{marginTop:'25px', textAlign:'right'}}>
            <h2 style={{color:MONO_NARANJA, fontSize:'36px', fontWeight:'900'}}>Total: ${ (pedido.reduce((acc, i) => acc + i.subtotal, 0) + (mesa ? 0 : (pedido.reduce((acc, i) => acc + i.subtotal, 0) < 8000 ? 2000 : 0))).toLocaleString() }</h2>
          </div>

          {!mesa ? (
            <div style={{display:'flex', flexDirection:'column', gap:'12px', mt:'20px'}}>
               <input type="text" placeholder="Tu nombre" onChange={e => setNombre(e.target.value)} style={{padding:'18px', borderRadius:'15px', border:'1px solid #ddd', fontSize:'16px'}} />
               <input type="text" placeholder="Dirección en Carepa" onChange={e => setDireccion(e.target.value)} style={{padding:'18px', borderRadius:'15px', border:'1px solid #ddd', fontSize:'16px'}} />
               <select onChange={e => setMetodoPago(e.target.value)} style={{padding:'18px', borderRadius:'15px', border:'1px solid #ddd', fontSize:'16px', fontWeight:'bold'}}>
                  <option value="">-- ¿Cómo pagas? --</option><option value="Efectivo">Efectivo</option><option value="Nequi">Nequi</option>
               </select>
            </div>
          ) : (
            <div style={{padding:'20px', background:'#ecfdf5', borderRadius:'20px', textAlign:'center', color:'#065f46', fontWeight:'bold', mt:'20px', border:'2px solid #10b981'}}>
               📍 Pidiendo desde la MESA {mesa}
            </div>
          )}
          <textarea placeholder="¿Notas adicionales? (ej: sin cebolla)" onChange={e => setNotas(e.target.value)} style={{width:'100%', padding:'18px', borderRadius:'15px', border:'1px solid #ddd', marginTop:'10px', height:'80px', boxSizing:'border-box'}} />
          
          <button onClick={procesarPedido} style={{width:'100%', padding:'25px', background: mesa ? MONO_NARANJA : MONO_VERDE, color:'white', borderRadius:'25px', border:'none', fontWeight:'900', fontSize:'20px', marginTop:'20px', cursor:'pointer', boxShadow:'0 10px 20px rgba(0,0,0,0.1)'}}>
            {mesa ? "PEDIR A COCINA 👨‍🍳" : "ENVIAR POR WHATSAPP 📲"}
          </button>
        </div>
      )}

      {/* LOGIN Y AGRADECIMIENTO IGUAL QUE ANTES... */}
      {agradecimiento && (
        <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:MONO_NARANJA, zIndex:10000, display:'flex', justifyContent:'center', alignItems:'center', color:'white', textAlign:'center', padding:'20px'}}>
          <div><span style={{fontSize:'80px'}}>🐒</span><h1>¡Pedido Recibido!</h1><p style={{fontSize:'20px'}}>El Mono ya lo tiene en su monitor.</p><button onClick={() => setAgradecimiento(false)} style={{marginTop:'30px', padding:'15px 40px', borderRadius:'30px', border:'none', background:'white', color:MONO_NARANJA, fontWeight:'900', cursor:'pointer'}}>Volver al Menú</button></div>
        </div>
      )}

      {mostrarLogin && (
        <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.9)', zIndex:20000, display:'flex', justifyContent:'center', alignItems:'center'}}>
          <div style={{background:'white', padding:'40px', borderRadius:'30px', textAlign:'center'}}>
            <h3>Acceso Mono Admin</h3>
            <input type="password" onChange={e => setPinInput(e.target.value)} style={{padding:'15px', borderRadius:'15px', textAlign:'center', fontSize:'20px', border:'1px solid #ddd'}} />
            <button onClick={() => { if(pinInput === "mono2026") setIsAdmin(true); setMostrarLogin(false); }} style={{display:'block', width:'100%', marginTop:'15px', padding:'15px', background:MONO_NARANJA, color:'white', border:'none', borderRadius:'15px', fontWeight:'bold'}}>Entrar</button>
            <button onClick={() => setMostrarLogin(false)} style={{marginTop:'10px', background:'none', border:'none', color:'#999'}}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}