// Propósito: farmacéuticos activos y sus ventas de los últimos 60 días, sin anuladas.
// Parámetros: ninguno.
// Retorno: array de farmacéuticos con su cantidad de ventas, incluidos los que tienen cero.
// Motor: MongoDB.
import { mongo } from "../lib/conexiones.js";
import { haceDias } from "../lib/fechas.js";
import { COL, ESTADO_VENTA } from "../lib/nombres.js";

export async function q05() {
  return mongo()
    .collection(COL.FARMACEUTICOS)
    .aggregate([
      { $match: { activo: true } },
      {
        $lookup: {
          from: COL.VENTAS,
          localField: "_id",
          foreignField: "id_farmaceutico",
          as: "ventas",
        },
      },
      {
        $project: {
          nombre: 1,
          apellido: 1,
          matricula: 1,
          cantidad_ventas: {
            $size: {
              $filter: {
                input: "$ventas",
                as: "v",
                cond: {
                  $and: [
                    { $ne: ["$$v.estado", ESTADO_VENTA.ANULADA] },
                    { $gte: ["$$v.fecha", haceDias(60)] },
                  ],
                },
              },
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ])
    .toArray();
}
