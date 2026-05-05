import React, { useState, useEffect } from "react";

// Hooks
import { usePedidos }  from "./hooks/usePedidos";
import { useAlertas }  from "./hooks/useAlertas";
import { useMenu }     from "./hooks/useMenu";
import { useCarrito }  from "./hooks/useCarrito";

// Vistas (a crear en la siguiente fase)
// import VistaCliente from "./views/cliente/VistaCliente";
// import VistaAdmin   from "./views/admin/VistaAdmin";

// Componentes compartidos (a crear en la siguiente fase)
// import Toast           from "./components/shared/Toast";
// import BannerConexion  from "./components/shared/BannerConexion";
// import LoginModal      from "./components/shared/LoginModal";

export default function App() {
  const [isAdmin,  setIsAdmin]  = useState(false);
  const [mesa,     setMesa]     = useState(null);

  // Leer mesa desde URL
  useEffect(() => {
    const m = new URLSearchParams(window.location.search).get("mesa");
    if (m) setMesa(m);
  }, []);

  // Datos globales
  const { pedidos, pendientes, pagados, firebaseOK,
          pedidosDeMesa, numPendientes } = usePedidos({ isAdmin });
  const { alertas }                     = useAlertas({ isAdmin });
  const { menu }                        = useMenu();
  const { carrito, agregar, eliminar, vaciar, total } = useCarrito();

  // TODO: reemplazar por <VistaAdmin> y <VistaCliente>
  // cuando los componentes de vistas estén listos.
  return (
    <div>
      <p>App refactorizada — hooks listos ✅</p>
      <p>Pedidos: {pedidos.length} | Carrito: {carrito.length} items</p>
    </div>
  );
}