// Propósito: ingresos totales por farmacéutico en el mes actual, solo ventas completadas.
// Parámetros: ninguno.
// Retorno: array de farmacéuticos con sus ingresos del mes.
// Motor: MongoDB, con la vista de ventas completadas.
import { mongo } from "../lib/conexiones.js";
import { inicioMes, inicioMesSiguiente } from "../lib/fechas.js";
import { COL, VISTA_VENTAS_COMPLETADAS } from "../lib/nombres.js";

export async function q11() {
  return mongo()
    .collection(VISTA_VENTAS_COMPLETADAS)
    .aggregate([
      { $match: { fecha: { $gte: inicioMes(), $lt: inicioMesSiguiente() } } },
      { $group: { _id: "$id_farmaceutico", ingresos: { $sum: "$total" } } },
      {
        $lookup: {
          from: COL.FARMACEUTICOS,
          localField: "_id",
          foreignField: "_id",
          as: "farmaceutico",
        },
      },
      { $unwind: "$farmaceutico" },
      {
        $project: {
          _id: "$farmaceutico._id",
          nombre: "$farmaceutico.nombre",
          apellido: "$farmaceutico.apellido",
          matricula: "$farmaceutico.matricula",
          ingresos: 1,
        },
      },
      { $sort: { _id: 1 } },
    ])
    .toArray();
}
