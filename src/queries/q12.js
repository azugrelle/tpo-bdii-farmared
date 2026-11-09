// Propósito: clientes sin ventas registradas en el último año.
// Parámetros: ninguno.
// Retorno: array de clientes ordenados por id, incluidos los dados de baja (ver activo). Cuenta ventas de cualquier estado.
// Motor: MongoDB.
import { mongo } from "../lib/conexiones.js";
import { haceUnAnio } from "../lib/fechas.js";
import { COL } from "../lib/nombres.js";

export async function q12() {
  return mongo()
    .collection(COL.CLIENTES)
    .aggregate([
      {
        $lookup: {
          from: COL.VENTAS,
          let: { cliente: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$id_cliente", "$$cliente"] } } },
            { $match: { fecha: { $gte: haceUnAnio() } } },
            { $limit: 1 },
          ],
          as: "ventas_recientes",
        },
      },
      { $match: { ventas_recientes: { $size: 0 } } },
      { $project: { ventas_recientes: 0 } },
      { $sort: { _id: 1 } },
    ])
    .toArray();
}

