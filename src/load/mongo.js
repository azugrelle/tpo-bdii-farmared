import { mongo } from "../lib/conexiones.js";
import { leerDataset } from "../lib/datasets.js";
import { resolverFecha } from "../lib/fechas.js";
import { COL, ESTADO_VENTA } from "../lib/nombres.js";

const SIMPLES = [
  { nombre: COL.CLIENTES, id: "id_cliente", booleanos: ["activo"] },
  { nombre: COL.SUCURSALES, id: "id_sucursal", booleanos: ["activo"] },
  { nombre: COL.FARMACEUTICOS, id: "id_farmaceutico", booleanos: ["activo"] },
  { nombre: COL.PROVEEDORES, id: "id_proveedor", booleanos: ["activo"] },
  { nombre: COL.PRODUCTOS, id: "id_producto", enteros: ["precio_unit"], booleanos: ["activo"] },
  {
    nombre: COL.RECETAS,
    id: "id_receta",
    enteros: ["dispensas_autorizadas", "dispensas_realizadas"],
    fechas: ["fecha_emision", "proxima_dispensa"],
  },
];
const VENTAS = { nombre: COL.VENTAS, id: "id_venta", enteros: ["total"], fechas: ["fecha"] };
const DETALLE = { nombre: "detalle_ventas", id: "id_detalle", enteros: ["cantidad", "precio_unit"] };

function aEntero(campo, valor) {
  if (!/^\d+$/.test(valor)) throw new Error(`${campo} no es un entero: "${valor}"`);
  return Number(valor);
}

function aBooleano(campo, valor) {
  if (valor === "True") return true;
  if (valor === "False") return false;
  throw new Error(`${campo} no es True ni False: "${valor}"`);
}

function convertirValor(campo, valor, { enteros = [], booleanos = [], fechas = [] }) {
  if (enteros.includes(campo)) return aEntero(campo, valor);
  if (booleanos.includes(campo)) return aBooleano(campo, valor);
  if (fechas.includes(campo)) return resolverFecha(valor);
  return valor === "" ? null : valor;
}

function convertirCampos(fila, esquema) {
  const campos = Object.entries(fila).map(([campo, valor]) => [
    campo,
    convertirValor(campo, valor, esquema),
  ]);
  return Object.fromEntries(campos);
}

function aDocumento(fila, esquema) {
  const { [esquema.id]: _id, ...campos } = convertirCampos(fila, esquema);
  return { _id, ...campos };
}

function convertirFilas(esquema, convertir) {
  return leerDataset(esquema.nombre).map((fila) => {
    try {
      return convertir(fila);
    } catch (error) {
      throw new Error(`${esquema.nombre} ${fila[esquema.id]}: ${error.message}`);
    }
  });
}

function stockDescontado({ stock_descontado: valor, estado }) {
  if (!valor) return estado === ESTADO_VENTA.COMPLETADA;
  return aBooleano("stock_descontado", valor);
}

function armarVentas() {
  const detalle = convertirFilas(DETALLE, (fila) => convertirCampos(fila, DETALLE));
  const itemsPorVenta = Map.groupBy(detalle, (item) => item.id_venta);

  const ventas = convertirFilas(VENTAS, (fila) => ({
    ...aDocumento(fila, VENTAS),
    stock_descontado: stockDescontado(fila),
    items: (itemsPorVenta.get(fila.id_venta) ?? []).map(({ id_venta, ...item }) => item),
  }));

  const idsVentas = new Set(ventas.map((venta) => venta._id));
  const huerfano = detalle.find((item) => !idsVentas.has(item.id_venta));
  if (huerfano) {
    throw new Error(`${DETALLE.nombre} ${huerfano.id_detalle}: no existe la venta ${huerfano.id_venta}`);
  }
  return ventas;
}

export async function cargarMongo() {
  const colecciones = [
    ...SIMPLES.map((esquema) => [
      esquema.nombre,
      convertirFilas(esquema, (fila) => aDocumento(fila, esquema)),
    ]),
    [VENTAS.nombre, armarVentas()],
  ];

  const db = mongo();
  for (const [nombre, documentos] of colecciones) {
    await db.collection(nombre).drop();
    await db.collection(nombre).insertMany(documentos);
    console.log(`${nombre}: ${documentos.length}`);
  }
}
