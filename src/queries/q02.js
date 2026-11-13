// Propósito: ventas pendientes con el farmacéutico asignado y el total.
// Parámetros: ninguno.
// Retorno: array de ventas con nombre, matrícula y sucursal del farmacéutico, y total.
// Motor: MongoDB.
import { mongo } from "../lib/conexiones.js";
import { COL, ESTADO_VENTA } from "../lib/nombres.js";

export async function q02() {
  return mongo()
    .collection(COL.VENTAS)
    .aggregate([
      { $match: { estado: ESTADO_VENTA.PENDIENTE } },
      {
        $lookup: {
          from: COL.FARMACEUTICOS,
          localField: "id_farmaceutico",
          foreignField: "_id",
          as: "farmaceutico",
        },
      },
      { $unwind: "$farmaceutico" },
      {
        $lookup: {
          from: COL.SUCURSALES,
          localField: "farmaceutico.id_sucursal",
          foreignField: "_id",
          as: "sucursal",
        },
      },
      { $unwind: "$sucursal" },
      {
        $project: {
          total: 1,
          farmaceutico: {
            nombre: "$farmaceutico.nombre",
            apellido: "$farmaceutico.apellido",
            matricula: "$farmaceutico.matricula",
          },
          sucursal: { nombre: "$sucursal.nombre" },
        },
      },
      { $sort: { _id: 1 } },
    ])
    .toArray();
}
