import React, { useState, useEffect } from 'react';
import { db } from './firebaseConfig';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy, addDoc } from "firebase/firestore";

// ==========================================
// 🔴 CONSTANTES Y ESTADOS
// ==========================================
const MONO_NARANJA = "#f97316";
const MONO_VERDE = "#16a34a";
const MONO_AZUL = "#3b82f6"; // Para "Cocinando"
const MONO_TEXTO = "#333333";

// Audio de notificación (BEEP base64 corto)
const sonidoNotificacion = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ9vT19vT19vT19vT19vT19v");

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [tabActiva, setTabActiva] = useState("pedidos");
  const [pedidosFB, setPedidosFB] = useState([]);
  const [pedido, setPedido] = useState([]);
  const [mesa, setMesa] = useState(null);
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [metodoPago, setMetodoPago] = useState("");
  const [agradecimiento, setAgradecimiento] = useState(false);

  // 1. Detector de Mesa
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mesaURL = params.get('mesa');
    if (mesaURL) { setMesa(mesaURL); setNombre("Cliente Local"); setMetodoPago("Efectivo"); }
  }, []);

  // 2. Conexión Real-Time con Alerta Sonora
  useEffect(() => {
    const q = query(collection(db, "pedidos"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const nuevosPedidos = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // 🔔 LÓGICA DE NOTIFICACIÓN: Si hay más pedidos que antes, suena el BIP
      if (nuevosPedidos.length > pedidosFB.length && pedidosFB.length > 0) {
        sonidoNotificacion.play().catch(e => console.log("Audio bloqueado por navegador"));
      }
      setPedidosFB(nuevosPedidos);
    });
    return () => unsub();
  }, [pedidosFB.length]);

  // 3. Procesar Pedido con Estado Inicial "pendiente"
  const procesarPedido = async () => {
    const total = pedido.reduce((acc, i) => acc + i.subtotal, 0);
    const idOrden = `ORD-${Date.now()}`;
    
    await setDoc(doc(db, "pedidos", idOrden), {
      nombre, 
      ubicacion: mesa ? `MESA ${mesa}` : direccion,
      productos: pedido,
      total,
      pago: metodoPago,
      timestamp: Date.now(),
      hora: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      estado: "pendiente" // 🟡 ESTADO INICIAL
    });

    setAgradecimiento(true);
    setPedido([]);
  };

  // 4. Cambiar Estado del Pedido
  const cambiarEstado = async (id, nuevoEstado) => {
    await setDoc(doc(db, "pedidos", id), { estado: nuevoEstado }, { merge: true });
  };

  // 5. Finalizar Venta (Cierre de Caja y Limpieza)
  const finalizarVenta = async (mesaNum) => {
    const mesaPedidos = pedidosFB.filter(p => p.ubicacion === `MESA ${mesaNum}`);
    const totalVenta = mesaPedidos.reduce((acc, p) => acc + p.total, 0);

    // Guardamos en Historial antes de borrar
    await addDoc(collection(db, "ventas_historial"), {
      ubicacion: `MESA ${mesaNum}`,
      total: totalVenta,
      fecha: new Date().toLocaleDateString(),
      timestamp: Date.now()
    });

    // Borramos los pedidos activos
    mesaPedidos.forEach(async (p) => await deleteDoc(doc(db, "pedidos", p.id)));
    alert(`Mesa ${mesaNum} cerrada por $${totalVenta.toLocaleString()}`);
  };

  if (isAdmin) {
    return (
      <div style={{padding: '20px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif'}}>
        <div style={{maxWidth:'950px', margin:'0 auto'}}>
          <header style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px'}}>
            <h1 style={{color: MONO_NARANJA}}>Panel Operativo 🐒</h1>
            <div style={{background: 'white', padding: '10px 20px', borderRadius: '15px', fontWeight: 'bold'}}>
               Ventas hoy: ${pedidosFB.reduce((acc, p) => acc + (p.total || 0), 0).toLocaleString()}
            </div>
          </header>

          {/* MONITOR DE MESAS CON ESTADOS */}
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'20px'}}>
            {[1, 2, 3, 4, 5].map(n => {
              const mesaPedidos = pedidosFB.filter(p => p.ubicacion === `MESA ${n}`);
              if (mesaPedidos.length === 0) return null;
              const totalMesa = mesaPedidos.reduce((acc, p) => acc + p.total, 0);

              return (
                <div key={n} style={{background:'white', padding:'20px', borderRadius:'30px', border:`3px solid ${MONO_NARANJA}`, position:'relative'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <h2>MESA {n}</h2>
                    <span style={{fontSize:'12px', background:'#eee', padding:'4px 10px', borderRadius:'10px'}}>Acumulado: ${totalMesa.toLocaleString()}</span>
                  </div>

                  <div style={{margin:'15px 0'}}>
                    {mesaPedidos.map(p => (
                      <div key={p.id} style={{padding:'10px', borderRadius:'15px', background: p.estado === 'pendiente' ? '#fffbeb' : p.estado === 'cocinando' ? '#eff6ff' : '#f0fdf4', marginBottom:'10px', border:'1px solid #ddd'}}>
                        <div style={{fontSize:'12px', display:'flex', justifyContent:'space-between'}}>
                           <strong>{p.hora}</strong>
                           <span>{p.estado.toUpperCase()}</span>
                        </div>
                        {p.productos.map((prod, i) => ( <div key={i} style={{fontSize:'14px'}}>• {prod.cantidad}x {prod.nombre}</div> ))}
                        
                        {/* CONTROLES DE ESTADO */}
                        <div style={{marginTop:'10px', display:'flex', gap:'5px'}}>
                           {p.estado === 'pendiente' && <button onClick={() => cambiarEstado(p.id, 'cocinando')} style={{flex:1, background:MONO_AZUL, color:'white', border:'none', borderRadius:'5px', padding:'5px', cursor:'pointer'}}>Cocinando 👨‍🍳</button>}
                           {p.estado === 'cocinando' && <button onClick={() => cambiarEstado(p.id, 'listo')} style={{flex:1, background:MONO_VERDE, color:'white', border:'none', borderRadius:'5px', padding:'5px', cursor:'pointer'}}>¡LISTO! ✅</button>}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => finalizarVenta(n)}
                    style={{width:'100%', padding:'15px', background:MONO_TEXTO, color:'white', border:'none', borderRadius:'15px', fontWeight:'bold', cursor:'pointer'}}
                  >
                    PAGAR Y CERRAR MESA 💸
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Render Cliente simplificado...
  return (
     <div style={{textAlign:'center', padding:'50px'}}>
        <h1>Vista Cliente para Mesa {mesa}</h1>
        {pedido.length > 0 && <button onClick={procesarPedido} style={{padding:'20px', background:MONO_NARANJA, color:'white', border:'none', borderRadius:'20px'}}>ENVIAR PEDIDO</button>}
        {agradecimiento && <h2>¡Tu pedido está siendo procesado! 🐒</h2>}
        <button onClick={() => setIsAdmin(true)} style={{marginTop:'100px', opacity:0.1}}>Admin</button>
     </div>
  );
}