import React, { useState, useEffect } from 'react';

// 1. Hooks
import { usePedidos }  from './hooks/usePedidos';
import { useMenu }     from './hooks/useMenu';
import { useCarrito }  from './hooks/useCarrito';
import { useAlertas }  from './hooks/useAlertas';

// 2. Vistas principales
import VistaCliente from './views/Cliente/VistaCliente';
import VistaAdmin   from './views/admin/VistaAdmin';

// 3. Componentes compartidos
import Toast           from './components/shared/Toast';
import LoginModal      from './components/shared/LoginModal';
import BannerConexion  from './components/shared/BannerConexion';

// 4. Constantes
import { C } from './constants/colores';

// 5. Acciones Firebase
import { actualizarEstadoPedido, eliminarAlerta } from './utils/firebaseActions';

export default function App() {

  // ── Estados globales ───────────────────────
  const [isAdmin,       setIsAdmin]       = useState(false);
  const [mostrarLogin,  setMostrarLogin]  = useState(false);
  const [mesa,          setMesa]          = useState(null);
  const [toast,         setToast]         = useState(null);

  // ── Hooks ──────────────────────────────────
  const { pedidos, firebaseOK, numPendientes, pedidosDeMesa } = usePedidos({ isAdmin });
  const { menu }                                               = useMenu();
  const { alertas }                                            = useAlertas({ isAdmin });
  const { carrito, agregar, eliminar, vaciar, total }          = useCarrito();

  // ── Detectar mesa desde URL ────────────────
  useEffect(() => {
    const m = new URLSearchParams(window.location.search).get("mesa");
    if (m) setMesa(m);
  }, []);

  // ── Toast ──────────────────────────────────
  const mostrarToast = (msg, duracion = 2500) => {
    setToast(msg);
    setTimeout(() => setToast(null), duracion);
  };

  return (
    <div style={{ backgroundColor: C.fondo, minHeight: '100vh' }}>

      <BannerConexion firebaseOK={firebaseOK} />

      {toast && <Toast mensaje={toast} />}

      {isAdmin ? (
        <VistaAdmin
          pedidos={pedidos}
          menu={menu}
          alertas={alertas}
          onActualizarEstado={actualizarEstadoPedido}
          onEliminarAlerta={eliminarAlerta}
          onSalir={() => setIsAdmin(false)}
          mostrarToast={mostrarToast}
        />
      ) : (
        <VistaCliente
          mesa={mesa}
          menu={menu}
          carrito={carrito}
          agregar={agregar}
          eliminar={eliminar}
          vaciar={vaciar}
          totalCarrito={total}
          numPendientes={numPendientes}
          pedidosDeMesa={pedidosDeMesa}
          onAdminClick={() => setMostrarLogin(true)}
          mostrarToast={mostrarToast}
        />
      )}

      {mostrarLogin && (
        <LoginModal
          onLogin={() => { setIsAdmin(true); setMostrarLogin(false); }}
          onCerrar={() => setMostrarLogin(false)}
        />
      )}

    </div>
  );
}