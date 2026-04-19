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

// Audio de notificación (BEEP corto)
const sonidoNotificacion = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ9vT19vT19vT19vT19vT19v");

// ==========================================
// 🔴 DATOS MAESTROS (RESTAURADOS AL 100%)
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [tabActiva, setTabActiva] = useState("pedidos");
  const [productosFB, setProductosFB] = useState([]);
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
  const [notas, setNotas] = useState("");
  const [agradecimiento, setAgradecimiento] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mesaURL = params.get('mesa');
    if (mesaURL) { setMesa(mesaURL); setNombre("Cliente Local"); setMetodoPago("Caja"); }
  }, []);

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

  const productosMostrar = productosBase.map(p => {
    const pFB = productosFB.find(f => f.id === p.id);
    return pFB ? { ...p, ...pFB } : p;
  });

  const agregarAlCarrito = (p) => {
    const sel = selecciones[p.id] || {};
    const cant = cantidades[p.id] || 1;
    if (!p.disponible) return alert("Agotado");
    if (p.opciones && !sel.sabor && p.categoria === "Fritos") return alert("Elige un sabor");

    let precioB = p.precio || 0;
    if (sel.tamano) precioB = sel.tamano.precio || 0;
    
    let det = `${sel.sabor || ''} ${sel.tamano?.nombre || ''}`;
    if (p.categoria === "Desayunos") det += `(${sel.acompanamiento || 'Arepa'}, ${sel.huevos || 'Revueltos'})`;

    setPedido([...pedido, { idUnico: Date.now(), nombre: p.nombre, cantidad: cant, subtotal: precioB * cant, detalle: det.trim() }]);
  };

  const procesarPedido = async () => {
    if (!mesa && (!nombre || !direccion || !metodoPago)) return alert("Faltan datos");
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
  // 🔴 VISTA ADMINISTRADOR (POS OPERATIVO)
  // ==========================================
  if (isAdmin) {
    return (
      <div style={{padding: '20px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif'}}>
        <div style={{maxWidth:'950px', margin:'0 auto'}}>
          <header style={{display:'flex', justifyContent:'space-between', alignItems:'center', mb:'20px'}}>
            <h1 style={{color: MONO_NARANJA}}>Monitor Mono 🐒</h1>
            <div style={{background:'white', p:'10px 20px', borderRadius:'15px', fontWeight:'bold'}}>
              Ventas Activas: ${pedidosFB.reduce((acc, p) => acc + p.total, 0).toLocaleString()}
            </div>
            <button onClick={() => setIsAdmin(false)}>Cerrar</button>
          </header>

          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'20px'}}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => {
              const mesaPedidos = pedidosFB.filter(p => p.ubicacion === `MESA ${n}`);
              if (mesaPedidos.length === 0) return null;
              const totalMesa = mesaPedidos.reduce((acc, p) => acc + p.total, 0);

              return (
                <div key={n} style={{background:'white', padding:'20px', borderRadius:'30px', border:`3px solid ${MONO_NARANJA}`}}>
                  <h2>MESA {n}</h2>
                  <div style={{margin:'15px 0'}}>
                    {mesaPedidos.map(p => (
                      <div key={p.id} style={{padding:'10px', borderRadius:'15px', background: p.estado === 'pendiente' ? '#fffbeb' : p.estado === 'cocinando' ? '#eff6ff' : '#f0fdf4', mb:'10px', border:'1px solid #ddd'}}>
                        <div style={{fontSize:'12px', display:'flex', justifyContent:'space-between'}}>
                           <strong>{p.hora}</strong> <span>{p.estado.toUpperCase()}</span>
                        </div>
                        {p.productos.map((prod, i) => ( <div key={i} style={{fontSize:'14px'}}>• {prod.cantidad}x {prod.nombre} ({prod.detalle})</div> ))}
                        <div style={{mt:'10px', display:'flex', gap:'5px'}}>
                           {p.estado === 'pendiente' && <button onClick={() => setDoc(doc(db, "pedidos", p.id), { estado: "cocinando" }, { merge: true })} style={{flex:1, background:MONO_AZUL, color:'white', border:'none', borderRadius:'5px', p:'5px'}}>Cocinando</button>}
                           {p.estado === 'cocinando' && <button onClick={() => setDoc(doc(db, "pedidos", p.id), { estado: "listo" }, { merge: true })} style={{flex:1, background:MONO_VERDE, color:'white', border:'none', borderRadius:'5px', p:'5px'}}>¡Listo!</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{fontSize:'28px', fontWeight:'900', textAlign:'center', py:'10px', background:'#fff7ed', borderRadius:'15px'}}>
                    ${totalMesa.toLocaleString()}
                  </div>
                  <button onClick={async () => {
                    if(window.confirm("¿Cobrar y cerrar mesa?")) {
                      mesaPedidos.forEach(async (p) => {
                        await addDoc(collection(db, "ventas_historial"), { ...p, finalizado: Date.now() });
                        await deleteDoc(doc(db, "pedidos", p.id));
                      });
                    }
                  }} style={{width:'100%', mt:'10px', p:'15px', background:MONO_TEXTO, color:'white', borderRadius:'15px', fontWeight:'bold', border:'none'}}>CERRAR CUENTA 💸</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 🟡 VISTA CLIENTE (COMPLETA)
  // ==========================================
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#fffcf5', minHeight: '100vh', pb:'100px' }}>
      <header style={{textAlign:'center', p:'30px', background:'white', borderRadius:'0 0 50px 50px'}}>
        <h1 onClick={() => setMostrarLogin(true)} style={{color: MONO_NARANJA, cursor:'pointer'}}>Fritos El Mono 🐒</h1>
      </header>

      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', p: '20px' }}>
        {["Fritos", "Desayunos", "Arroces", "Bebidas"].map(cat => (
          <button key={cat} onClick={() => setCategoriaActiva(cat)} style={{ padding: '10px 20px', borderRadius: '20px', border: 'none', background: categoriaActiva === cat ? MONO_NARANJA : 'white' }}>{cat}</button>
        ))}
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', p: '20px'}}>
        {productosMostrar.filter(p => p.categoria === categoriaActiva).map(p => {
            const sel = selecciones[p.id] || {};
            const cant = cantidades[p.id] || 1;
            return (
              <div key={p.id} style={{background: 'white', p: '20px', borderRadius: '30px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', opacity: p.disponible ? 1 : 0.6}}>
                <img src={p.imagen} style={{ width: '100%', height: '150px', borderRadius: '20px', objectFit: 'cover' }} alt={p.nombre} />
                <h3>{p.nombre}</h3>
                <p style={{color: MONO_NARANJA, fontWeight: '900'}}>${(sel.tamano ? sel.tamano.precio : p.precio).toLocaleString()}</p>
                
                {p.opciones && (
                  <div style={{display:'flex', gap:'5px', flexWrap:'wrap', mb:'10px'}}>
                    {p.opciones.map(o => (
                      <button key={o.nombre} onClick={() => setSelecciones({...selecciones, [p.id]: {...sel, sabor: o.nombre}})} style={{p:'5px 10px', borderRadius:'8px', border: sel.sabor === o.nombre ? `2px solid ${MONO_NARANJA}` : '1px solid #eee'}}>{o.nombre}</button>
                    ))}
                  </div>
                )}

                <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'15px', mb:'15px'}}>
                   <button onClick={() => setCantidades({...cantidades, [p.id]: Math.max(1, cant - 1)})}>-</button>
                   <strong>{cant}</strong>
                   <button onClick={() => setCantidades({...cantidades, [p.id]: cant + 1})}>+</button>
                </div>
                <button onClick={() => agregarAlCarrito(p)} disabled={!p.disponible} style={{width:'100%', p:'12px', background:MONO_NARANJA, color:'white', borderRadius:'15px', border:'none', fontWeight:'bold'}}>Añadir 🛒</button>
              </div>
            );
        })}
      </div>

      {pedido.length > 0 && (
        <div style={{ maxWidth: '600px', margin: '20px auto', background: 'white', p: '30px', borderRadius: '40px', border: `4px solid ${MONO_NARANJA}` }}>
          <h2>🛒 Tu Ticket</h2>
          {pedido.map(item => (
            <div key={item.idUnico} style={{ display: 'flex', justifyContent: 'space-between', py:'10px', borderBottom:'1px solid #eee' }}>
              <span>{item.cantidad}x {item.nombre} <br /><small>{item.detalle}</small></span>
              <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                <strong>${item.subtotal.toLocaleString()}</strong>
                <button onClick={() => setPedido(pedido.filter(i => i.idUnico !== item.idUnico))}>❌</button>
              </div>
            </div>
          ))}

          <div style={{marginTop:'20px'}}>
            {!mesa && (
              <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                <input type="text" placeholder="Tu nombre" onChange={e => setNombre(e.target.value)} style={{p:'12px', borderRadius:'10px', border:'1px solid #ddd'}} />
                <input type="text" placeholder="Dirección" onChange={e => setDireccion(e.target.value)} style={{p:'12px', borderRadius:'10px', border:'1px solid #ddd'}} />
                <select onChange={e => setMetodoPago(e.target.value)} style={{p:'12px', borderRadius:'10px', border:'1px solid #ddd'}}>
                  <option value="">-- Pago --</option><option value="Efectivo">Efectivo</option><option value="Nequi">Nequi</option>
                </select>
              </div>
            )}
            {mesa && <div style={{p:'15px', background:'#ecfdf5', borderRadius:'15px', textAlign:'center', color:'#065f46', fontWeight:'bold'}}>📍 MESA {mesa}</div>}
            <button onClick={procesarPedido} style={{width:'100%', p:'20px', background: mesa ? MONO_NARANJA : MONO_VERDE, color:'white', borderRadius:'20px', fontWeight:'900', mt:'15px', border:'none'}}>
              {mesa ? "PEDIR A COCINA 👨‍🍳" : "WHATSAPP 📲"}
            </button>
          </div>
        </div>
      )}

      {agradecimiento && (
        <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:MONO_NARANJA, zIndex:2000, display:'flex', justifyContent:'center', alignItems:'center', color:'white', textAlign:'center'}}>
          <div><h1>¡Pedido Recibido!</h1><button onClick={() => setAgradecimiento(false)} style={{p:'10px 40px', borderRadius:'20px', border:'none', background:'white', color:MONO_NARANJA, fontWeight:'bold'}}>Volver</button></div>
        </div>
      )}

      {/* Login Modal */}
      {mostrarLogin && (
        <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.8)', zIndex:1000, display:'flex', justifyContent:'center', alignItems:'center'}}>
          <div style={{background:'white', p:'30px', borderRadius:'20px'}}>
            <h3>Admin</h3>
            <input type="password" onChange={e => setPinInput(e.target.value)} placeholder="PIN" style={{p:'10px'}} />
            <button onClick={() => { if(pinInput === "mono2026") setIsAdmin(true); setMostrarLogin(false); }}>Entrar</button>
          </div>
        </div>
      )}
    </div>
  );
}