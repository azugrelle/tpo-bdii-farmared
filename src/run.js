import { existsSync } from "node:fs";
import { cerrarConexiones } from "./lib/conexiones.js";

const CARPETAS = ["queries", "services"];

function leerArgumento(valor) {
  return /^[{[]/.test(valor) ? JSON.parse(valor) : valor;
}

async function cargarModulo(nombre) {
  for (const carpeta of CARPETAS) {
    const ruta = new URL(`./${carpeta}/${nombre}.js`, import.meta.url);
    if (existsSync(ruta)) return import(ruta);
  }
  throw new Error(`No existe ${nombre}`);
}

function elegirFuncion(modulo, nombre, argumentos) {
  if (modulo[nombre]) return [modulo[nombre], argumentos];

  const [subcomando, ...resto] = argumentos;
  if (!modulo[subcomando]) {
    throw new Error(`${nombre}: subcomandos válidos: ${Object.keys(modulo).join(", ")}`);
  }
  return [modulo[subcomando], resto];
}

try {
  const [numero, ...argumentos] = process.argv.slice(2);
  if (!/^\d+$/.test(numero)) throw new Error("Uso: npm run q -- <número> [argumentos]");

  const nombre = `q${numero.padStart(2, "0")}`;
  const modulo = await cargarModulo(nombre);
  const [funcion, parametros] = elegirFuncion(modulo, nombre, argumentos);
  const resultado = await funcion(...parametros.map(leerArgumento));
  console.log(JSON.stringify(resultado, null, 2));
} finally {
  await cerrarConexiones();
}
