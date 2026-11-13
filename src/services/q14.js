// Propósito: registrar una venta completada con sus validaciones, descontar el stock y actualizar la receta.
// Parámetros: objeto con id_cliente, id_farmaceutico, id_receta, medio_pago e items ({ id_producto, cantidad }).
// Retorno: { ok: true, ... } o { ok: false, motivo }.
// Motor: MongoDB para la venta y la receta, y Redis para el stock y el id.
import { mongo } from "../lib/conexiones.js";
import { enDias, hoy } from "../lib/fechas.js";
import { siguienteId } from "../lib/ids.js";
import {
  COL,
  CONDICION_VENTA,
  ESTADO_RECETA,
  ESTADO_VENTA,
  MEDIO_PAGO,
  TIPO_RECETA,
  TIPO_SUCURSAL,
  TIPO_VENTA,
} from "../lib/nombres.js";
import { descontarStock, revertirStock } from "../stock/stock.js";

function calcularActualizacionReceta(receta) {
  const dispensas_realizadas = receta.dispensas_realizadas + 1;
  const sigueVigente =
    receta.tipo === TIPO_RECETA.PROLONGADO && dispensas_realizadas < receta.dispensas_autorizadas;

  return {
    dispensas_realizadas,
    proxima_dispensa: sigueVigente ? enDias(30) : null,
    estado: sigueVigente ? ESTADO_RECETA.VIGENTE : ESTADO_RECETA.COMPLETADA,
  };
}

export async function q14({ id_cliente, id_farmaceutico, id_receta, medio_pago, items }) {
  const db = mongo();

  const cliente = await db.collection(COL.CLIENTES).findOne({ _id: id_cliente });
  if (!cliente) return { ok: false, motivo: "cliente_inexistente" };
  if (!cliente.activo) return { ok: false, motivo: "cliente_inactivo" };

  const farmaceutico = await db.collection(COL.FARMACEUTICOS).findOne({ _id: id_farmaceutico });
  if (!farmaceutico) return { ok: false, motivo: "farmaceutico_inexistente" };
  if (!farmaceutico.activo) return { ok: false, motivo: "farmaceutico_inactivo" };

  const sucursal = await db.collection(COL.SUCURSALES).findOne({ _id: farmaceutico.id_sucursal });
  if (sucursal.tipo !== TIPO_SUCURSAL.FARMACIA) return { ok: false, motivo: "sucursal_no_farmacia" };

  if (!Object.values(MEDIO_PAGO).includes(medio_pago)) {
    return { ok: false, motivo: "medio_pago_invalido" };
  }

  if (!items || items.length === 0) return { ok: false, motivo: "items_vacio" };
  if (items.some(({ cantidad }) => !Number.isInteger(cantidad) || cantidad <= 0)) {
    return { ok: false, motivo: "cantidad_invalida" };
  }

  const idsProducto = [...new Set(items.map((item) => item.id_producto))];
  const productosEncontrados = await db
    .collection(COL.PRODUCTOS)
    .find({ _id: { $in: idsProducto } })
    .toArray();
  if (productosEncontrados.length !== idsProducto.length) {
    return { ok: false, motivo: "producto_inexistente" };
  }
  if (productosEncontrados.some((producto) => !producto.activo)) {
    return { ok: false, motivo: "producto_inactivo" };
  }
  const productos = new Map(productosEncontrados.map((producto) => [producto._id, producto]));

  const requiereReceta = productosEncontrados.some(
    (producto) => producto.condicion_venta !== CONDICION_VENTA.LIBRE,
  );
  if (requiereReceta && !id_receta) return { ok: false, motivo: "receta_requerida" };

  let receta = null;
  if (id_receta) {
    receta = await db.collection(COL.RECETAS).findOne({ _id: id_receta });
    if (!receta) return { ok: false, motivo: "receta_inexistente" };
    if (receta.estado !== ESTADO_RECETA.VIGENTE) return { ok: false, motivo: "receta_no_vigente" };
    if (receta.id_cliente !== id_cliente) return { ok: false, motivo: "receta_de_otro_cliente" };
  }

  const total = items.reduce(
    (acumulado, item) => acumulado + item.cantidad * productos.get(item.id_producto).precio_unit,
    0,
  );
  const tipo = requiereReceta ? TIPO_VENTA.CON_RECETA : TIPO_VENTA.LIBRE;

  const descuento = await descontarStock(farmaceutico.id_sucursal, items);
  if (!descuento.ok) return descuento;

  if (receta) {
    const cambios = calcularActualizacionReceta(receta);
    const { matchedCount } = await db.collection(COL.RECETAS).updateOne(
      { _id: receta._id, estado: receta.estado, dispensas_realizadas: receta.dispensas_realizadas },
      { $set: cambios },
    );
    if (!matchedCount) {
      await revertirStock(descuento.movimientos);
      return { ok: false, motivo: "receta_modificada" };
    }
  }

  const venta = {
    _id: await siguienteId("venta"),
    id_cliente,
    id_farmaceutico,
    id_receta: requiereReceta ? id_receta : null,
    fecha: hoy(),
    tipo,
    medio_pago,
    total,
    estado: ESTADO_VENTA.COMPLETADA,
    stock_descontado: true,
    items: await Promise.all(
      items.map(async (item) => ({
        id_detalle: await siguienteId("detalle"),
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio_unit: productos.get(item.id_producto).precio_unit,
      })),
    ),
  };

  try {
    await db.collection(COL.VENTAS).insertOne(venta);
  } catch (error) {
    if (receta) {
      await db.collection(COL.RECETAS).updateOne(
        { _id: receta._id },
        {
          $set: {
            dispensas_realizadas: receta.dispensas_realizadas,
            proxima_dispensa: receta.proxima_dispensa,
            estado: receta.estado,
          },
        },
      );
    }
    await revertirStock(descuento.movimientos);
    throw error;
  }

  return { ok: true, venta };
}
