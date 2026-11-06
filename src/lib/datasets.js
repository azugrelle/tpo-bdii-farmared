import { existsSync, readdirSync, readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";

const DIR_PROVISTOS = new URL("../../data/dataset_provisto/", import.meta.url);
const DIR_EXTRA = new URL("../../data/extra/", import.meta.url);

export const DATASETS = [
  "clientes",
  "sucursales",
  "farmaceuticos",
  "proveedores",
  "productos",
  "recetas",
  "ventas",
  "detalle_ventas",
  "stock_lotes",
];

function leerCsv(ruta) {
  return parse(readFileSync(ruta), { columns: true, skip_empty_lines: true, bom: true });
}

function carpetasExtra() {
  const existentes = readdirSync(DIR_EXTRA, { withFileTypes: true })
    .filter((entrada) => entrada.isDirectory())
    .map((entrada) => entrada.name)
    .sort();

  if (process.env.EXTRAS === undefined) return existentes;

  const elegidas = process.env.EXTRAS.split(",").filter(Boolean);
  for (const carpeta of elegidas) {
    if (!existentes.includes(carpeta)) {
      throw new Error(`EXTRAS: no existe la carpeta ${carpeta}`);
    }
  }
  return elegidas;
}

export function leerDataset(nombre) {
  const filas = leerCsv(new URL(`${nombre}.csv`, DIR_PROVISTOS));

  for (const carpeta of carpetasExtra()) {
    const ruta = new URL(`${carpeta}/${nombre}.csv`, DIR_EXTRA);
    if (existsSync(ruta)) filas.push(...leerCsv(ruta));
  }
  return filas;
}
