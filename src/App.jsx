import React, { useState, useEffect } from 'react';

// 1. Hooks (La inteligencia)
import { usePedidos } from './hooks/usePedidos';
import { useMenu } from './hooks/useMenu';
import { useCarrito } from './hooks/useCarrito';
import { useAlertas } from './hooks/useAlertas';

// 2. Vistas Principales
import VistaCliente from './components/Cliente/VistaCliente';
import VistaAdmin from './components/Admin/VistaAdmin';

// 3. Componentes Compartidos (Shared)
import Toast from './components/shared/Toast';
import LoginModal from './components/shared/LoginModal';
import BannerConexion from './components/shared/BannerConexion';

// 4. Constantes
import { C } from './constants/colores';

export default function App() {
  // --- ESTADOS GLOBALES ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [mesa, setMesa] = useState(null);
  const [toast, setToast] = useState(null);

  // --- LLAMADO A HOOKS ---
  // Extraemos la lógica de cada módulo
  const { pedidos, firebaseOK, actualizarEstado } = usePedidos(isAdmin);
  const { menu } = useMenu();
  const { alertas, eliminarAlerta } = useAlertas(isAdmin);
  const { 
    carrito, 
    agregarAlCarrito, 
    eliminarDelCarrito, 
    vaciarCarrito, 
    totalCarrito 
  } = useCarrito();

  // --- EFECTOS ---
  // Detectar mesa desde la URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get("mesa");
    if (m) setMesa(m);
  }, []);

  // Función para mostrar mensajes rápidos
  const mostrarToast = (msg, duracion = 2500) => {
    setToast(msg);
    setTimeout(() => setToast(null), duracion);
  };

  return (
    <div style={{ backgroundColor: C.fondo, minHeight: '100vh' }}>
      
      {/* Banner de salud de Firebase */}
      <BannerConexion conectado={firebaseOK} />

      {/* Notificaciones flotantes */}
      {toast && <Toast mensaje={toast} />}

      {/* Lógica de enrutamiento simple */}
      {isAdmin ? (
        <VistaAdmin 
          pedidos={pedidos} 
          menu={menu}
          alertas={alertas}
          actualizarEstado={actualizarEstado}
          eliminarAlerta={eliminarAlerta}
          setIsAdmin={setIsAdmin}
          mostrarToast={mostrarToast}
        />
      ) : (
        <VistaCliente 
          mesa={mesa}
          menu={menu}
          carrito={carrito}
          pedidosMesa={pedidos.filter(p => p.ubicacion === `MESA ${mesa}`)}
          accionesCarrito={{ agregarAlCarrito, eliminarDelCarrito, vaciarCarrito }}
          total={totalCarrito}
          setMostrarLogin={setMostrarLogin}
          mostrarToast={mostrarToast}
          numPendientes={pedidos.filter(p => p.estado === 'pendiente').length}
        />
      )}

      {/* Modal de acceso para el dueño del local */}
      {mostrarLogin && (
        <LoginModal 
          setMostrarLogin={setMostrarLogin} 
          setIsAdmin={setIsAdmin} 
          mostrarToast={mostrarToast}
        />
      )}

    </div>
  );
}