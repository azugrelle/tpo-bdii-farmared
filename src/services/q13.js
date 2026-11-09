// Propósito: ABM de clientes: alta con DNI único, modificación de contacto y cobertura, y baja lógica.
// Parámetros: datos, el cliente nuevo; idCliente, el id del cliente; cambios, los campos a modificar (email, telefono, obra_social, nro_afiliado).
// Retorno: { ok: true, cliente } en el alta y { ok: true, antes, despues } en la modificación y la baja; { ok: false, motivo } si se rechaza.
// Motor: MongoDB, y Redis para generar el id del alta.
import { mongo } from "../lib/conexiones.js";
import { siguienteId } from "../lib/ids.js";
import { COL, OBRA_SOCIAL } from "../lib/nombres.js";

const CAMPOS_ALTA = ["nombre", "apellido", "dni", "email", "telefono", "ciudad", "provincia", "obra_social", "nro_afiliado"];
const OBLIGATORIOS = ["nombre", "apellido", "dni", "obra_social"];
const MODIFICABLES = ["email", "telefono", "obra_social", "nro_afiliado"];

function clientes() {
  return mongo().collection(COL.CLIENTES);
}

function camposInvalidos(datos, permitidos) {
  return Object.keys(datos).filter((campo) => !permitidos.includes(campo));
}

function camposNoTexto(datos) {
  return Object.keys(datos).filter((campo) => datos[campo] != null && typeof datos[campo] !== "string");
}

function validarCobertura(obraSocial, nroAfiliado) {
  if (!Object.values(OBRA_SOCIAL).includes(obraSocial)) return "obra_social_invalida";
  const sinCobertura = obraSocial === OBRA_SOCIAL.SIN_COBERTURA;
  if (sinCobertura && nroAfiliado) return "afiliado_sin_cobertura";
  if (!sinCobertura && !nroAfiliado) return "falta_nro_afiliado";
  return null;
}

export async function alta(datos) {
  const desconocidos = camposInvalidos(datos, CAMPOS_ALTA);
  if (desconocidos.length) return { ok: false, motivo: "campo_desconocido", campos: desconocidos };

  const noTexto = camposNoTexto(datos);
  if (noTexto.length) return { ok: false, motivo: "tipo_invalido", campos: noTexto };

  const faltan = OBLIGATORIOS.filter((campo) => !datos[campo]);
  if (faltan.length) return { ok: false, motivo: "faltan_datos", campos: faltan };

  if (!/^\d{7,8}$/.test(datos.dni)) return { ok: false, motivo: "dni_invalido" };

  const motivo = validarCobertura(datos.obra_social, datos.nro_afiliado);
  if (motivo) return { ok: false, motivo };

  if (await clientes().findOne({ dni: datos.dni })) return { ok: false, motivo: "dni_repetido" };

  const cliente = { _id: await siguienteId("cliente") };
  for (const campo of CAMPOS_ALTA) cliente[campo] = datos[campo] || null;
  cliente.activo = true;

  try {
    await clientes().insertOne(cliente);
  } catch (error) {
    if (error.code === 11000) return { ok: false, motivo: "dni_repetido" };
    throw error;
  }
  return { ok: true, cliente };
}

export async function modificar(idCliente, cambios) {
  if (!Object.keys(cambios).length) return { ok: false, motivo: "sin_cambios" };

  const prohibidos = camposInvalidos(cambios, MODIFICABLES);
  if (prohibidos.length) return { ok: false, motivo: "campo_no_modificable", campos: prohibidos };

  const noTexto = camposNoTexto(cambios);
  if (noTexto.length) return { ok: false, motivo: "tipo_invalido", campos: noTexto };

  const antes = await clientes().findOne({ _id: idCliente });
  if (!antes) return { ok: false, motivo: "cliente_inexistente" };
  if (!antes.activo) return { ok: false, motivo: "cliente_inactivo" };

  const nuevos = {};
  for (const campo in cambios) nuevos[campo] = cambios[campo] || null;

  const final = { ...antes, ...nuevos };
  const motivo = validarCobertura(final.obra_social, final.nro_afiliado);
  if (motivo) return { ok: false, motivo };

  const { matchedCount } = await clientes().updateOne({ _id: idCliente, activo: true }, { $set: nuevos });
  if (!matchedCount) return { ok: false, motivo: "cliente_inactivo" };

  return { ok: true, antes, despues: await clientes().findOne({ _id: idCliente }) };
}

export async function baja(idCliente) {
  const antes = await clientes().findOne({ _id: idCliente });
  if (!antes) return { ok: false, motivo: "cliente_inexistente" };

  const { matchedCount } = await clientes().updateOne({ _id: idCliente, activo: true }, { $set: { activo: false } });
  if (!matchedCount) return { ok: false, motivo: "cliente_inactivo" };

  return { ok: true, antes, despues: await clientes().findOne({ _id: idCliente }) };
}
