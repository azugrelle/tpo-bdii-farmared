import { redis } from "./conexiones.js";
import { clave } from "./nombres.js";

const PREFIJOS = { cliente: "C", venta: "V", detalle: "D" };

export async function siguienteId(tipo) {
  const prefijo = PREFIJOS[tipo];
  if (!prefijo) throw new Error(`Tipo de id inválido: ${tipo}`);

  const numero = await redis().incr(clave.seq(tipo));
  return `${prefijo}${numero}`;
}
