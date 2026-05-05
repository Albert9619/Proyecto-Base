import React, { useState } from "react";
import { C } from "../../constants/colores";
import { getWorkload, getArrozDelDia } from "../../utils/helpers";
import { crearPedido, crearAlerta } from "../../utils/firebaseActions";
import { safeText } from "../../utils/helpers";

import Header                 from "./Header";
import GridMenu               from "./GridMenu";
import Carrito                from "./Carrito";
import ResumenMesa            from "./ResumenMesa";
import PantallaAgradecimiento from "./PantallaAgradecimiento";
import BotonesMesa            from "../../components/shared/BotonesMesa";

export default function VistaCliente({
  menu,
  carrito, agregar, eliminar, vaciar, totalCarrito,
  mesa,
  pedidosDeMesa,
  numPendientes,
  firebaseOK,
  onAdminClick,
  mostrarToast,
}) {
  const [categoriaActiva,  setCategoriaActiva]  = useState("Fritos");
  const [selecciones,      setSelecciones]      = useState({});
  const [cantidades,       setCantidades]       = useState({});
  const [nombre,           setNombre]           = useState(mesa ? `Cliente Mesa ${mesa}` : "");
  const [telefono,         setTelefono]         = useState("");
  const [direccion,        setDireccion]        = useState("");
  const [notaPedido,       setNotaPedido]       = useState("");
  const [errorCampos,      setErrorCampos]      = useState(false);
  const [enviando,         setEnviando]         = useState(false);
  const [agradecimiento,   setAgradecimiento]   = useState(false);
  const [alertaEnviada,    setAlertaEnviada]    = useState(null);

  const workload    = getWorkload(numPendientes);
  const arrozDelDia = getArrozDelDia();
  const pedidosMesa = mesa ? pedidosDeMesa(mesa) : [];

  // ── Agregar al carrito ──────────────────────────────────────
  const handleAgregar = (producto) => {
    agregar(producto, {
      selecciones,
      cantidad: cantidades[producto.id] || 1,
    });
    mostrarToast(`${cantidades[producto.id] || 1}x ${safeText(producto.nombre)} añadido al carrito 🛒`);
  };

  // ── Confirmar pedido ────────────────────────────────────────
  const handleConfirmar = async () => {
    if (!mesa && (!nombre.trim() || !telefono.trim() || !direccion.trim())) {
      setErrorCampos(true);
      return;
    }
    if (carrito.length === 0) return;

    setEnviando(true);
    setErrorCampos(false);

    try {
      await crearPedido({
        nombre:      safeText(nombre),
        telefono:    safeText(telefono),
        ubicacion:   mesa ? `MESA ${mesa}` : direccion.trim(),
        productos:   carrito,
        notaGeneral: notaPedido,
        total:       totalCarrito,
        tipo:        mesa ? "mesa" : "domicilio",
      });

      mostrarToast("🚀 ¡Pedido enviado!");
      setTimeout(() => {
        vaciar();
        setNotaPedido("");
        setEnviando(false);
        setAgradecimiento(true);
      }, 1200);
    } catch (err) {
      console.error(err);
      alert("Error al enviar el pedido. Revisa tu conexión.");
      setEnviando(false);
    }
  };

  // ── Alertas de mesa ─────────────────────────────────────────
  const handleAlerta = async (tipo) => {
    if (!mesa) return;
    try {
      await crearAlerta(mesa, tipo);
      setAlertaEnviada(tipo);
      setTimeout(() => setAlertaEnviada(null), 4000);
    } catch {
      mostrarToast("Sin conexión. Llama al mesero.");
    }
  };

  return (
    <div style={{
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      background: C.fondo,
      minHeight: "100vh",
      paddingBottom: "160px",
    }}>
      <Header
        workload={workload}
        arrozDelDia={arrozDelDia}
        onAdminClick={onAdminClick}
      />

      <GridMenu
        menu={menu}
        categoriaActiva={categoriaActiva}
        onCategoria={setCategoriaActiva}
        cantidades={cantidades}
        selecciones={selecciones}
        onCantidad={(id, val) => setCantidades(prev => ({ ...prev, [id]: val }))}
        onSeleccion={(id, sel) => setSelecciones(prev => ({ ...prev, [id]: sel }))}
        onAgregar={handleAgregar}
      />

      <ResumenMesa mesa={mesa} pedidos={pedidosMesa} />

      <Carrito
        carrito={carrito}
        mesa={mesa}
        totalCarrito={totalCarrito}
        notaPedido={notaPedido}
        onNota={setNotaPedido}
        nombre={nombre}       onNombre={setNombre}
        telefono={telefono}   onTelefono={setTelefono}
        direccion={direccion} onDireccion={setDireccion}
        errorCampos={errorCampos}
        enviando={enviando}
        onEliminar={eliminar}
        onVaciar={() => { if (window.confirm("¿Quitar todos los productos?")) vaciar(); }}
        onConfirmar={handleConfirmar}
      />

      <BotonesMesa
        mesa={mesa}
        alertaEnviada={alertaEnviada}
        onLlamarMesero={() => handleAlerta("mesero")}
        onPedirCuenta={() => handleAlerta("cuenta")}
      />

      <PantallaAgradecimiento
        visible={agradecimiento}
        onVolver={() => setAgradecimiento(false)}
      />
    </div>
  );
}