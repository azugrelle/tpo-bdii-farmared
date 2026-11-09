// Propósito: historial completo de un cliente.
// Parámetros: idCliente, el id del cliente.
// Retorno: array con las ventas y recetas del cliente, de la más vieja a la más nueva. Cada una indica en registro si es venta o receta; las recetas usan fecha_emision como fecha.
// Motor: MongoDB.
import { mongo } from "../lib/conexiones.js";
import { COL } from "../lib/nombres.js";

export async function q03(idCliente) {
  const db = mongo();
  const [recetas, ventas] = await Promise.all([
    db.collection(COL.RECETAS).find({ id_cliente: idCliente }).toArray(),
    db.collection(COL.VENTAS).find({ id_cliente: idCliente }).toArray(),
  ]);

  return [
    ...recetas.map((receta) => ({ registro: "receta", fecha: receta.fecha_emision, ...receta })),
    ...ventas.map((venta) => ({ registro: "venta", ...venta })),
  ].sort((a, b) => a.fecha - b.fecha);
}

