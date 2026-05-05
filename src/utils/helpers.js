/**
 * Convierte cualquier valor a string de forma segura.
 * Objetos con propiedad `nombre` devuelven ese valor.
 */
export const safeText = (v) => {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") return v.nombre || "";
  return String(v);
};

/**
 * Formatea un número como moneda COP sin decimales.
 * Ej: 1500 → "1.500"
 */
export const safeMoney = (v) => {
  const n = Number(v);
  return isNaN(n) ? "0" : n.toLocaleString("es-CO");
};

/**
 * Devuelve el estado de carga de la cocina según pedidos pendientes.
 */
export const getWorkload = (numPendientes) => {
  if (numPendientes <= 3) return { texto: "Cocina despejada", tiempo: "5-10 min",  nivel: "ok"     };
  if (numPendientes <= 8) return { texto: "Cocina con flujo", tiempo: "15-20 min", nivel: "medio"  };
  return                         { texto: "Cocina a tope",    tiempo: "25-30 min", nivel: "lleno"  };
};

/**
 * Devuelve el sabor de arroz según el día de la semana.
 */
export const getArrozDelDia = () => {
  const dias = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
  const hoy  = dias[new Date().getDay()];
  return ["lunes","miércoles","viernes"].includes(hoy) ? "Pollo" : "Cerdo";
};

/**
 * Genera un ID de pedido único.
 */
export const generarIdPedido = () => `ORD-${Date.now()}`;

/**
 * Genera un ID de alerta único para una mesa.
 */
export const generarIdAlerta = (mesa) => `ALERTA-${mesa}-${Date.now()}`;

/**
 * Genera el mensaje de WhatsApp para el reporte de caja.
 */
export const generarMensajeCierre = ({ tVendido, pedidosTotal, vLocal, vDomi }) =>
  `*CIERRE DE CAJA - LA NAVE NARANJA* 🍊%0A` +
  `📅 ${new Date().toLocaleDateString("es-CO")}%0A` +
  `💰 *Total: $${safeMoney(tVendido)}*%0A` +
  `📦 Pedidos: ${pedidosTotal}%0A` +
  `🏠 Local: $${safeMoney(vLocal)}%0A` +
  `🛵 Domicilios: $${safeMoney(vDomi)}`;
  let _beepAudio = null;
export const playBeep = () => {
  try {
    if (!_beepAudio) {
      _beepAudio = new Audio(
        "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ9vT19vT19vT19vT19vT19v"
      );
    }
    _beepAudio.play().catch(() => {});
  } catch (_) {}
};