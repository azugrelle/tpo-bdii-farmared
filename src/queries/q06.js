// Propósito: recetas de tratamiento prolongado vigentes con la próxima dispensa anterior a hoy.
// Parámetros: ninguno.
// Retorno: array de recetas ordenadas por id, cada una con los datos de su cliente en el campo cliente.
// Motor: MongoDB.
import { mongo } from "../lib/conexiones.js";
import { hoy } from "../lib/fechas.js";
import { COL, ESTADO_RECETA, TIPO_RECETA } from "../lib/nombres.js";

export async function q06() {
  return mongo()
    .collection(COL.RECETAS)
    .aggregate([
      {
        $match: {
          tipo: TIPO_RECETA.PROLONGADO,
          estado: ESTADO_RECETA.VIGENTE,
          proxima_dispensa: { $lt: hoy() },
        },
      },
      {
        $lookup: {
          from: COL.CLIENTES,
          localField: "id_cliente",
          foreignField: "_id",
          as: "cliente",
        },
      },
      { $unwind: "$cliente" },
      { $sort: { _id: 1 } },
    ])
    .toArray();
}
