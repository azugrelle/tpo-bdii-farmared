const ZONA = "America/Argentina/Buenos_Aires";
const MS_POR_DIA = 24 * 60 * 60 * 1000;

export function aISO(fecha) {
  return fecha.toISOString().slice(0, 10);
}

export function aAAAAMMDD(fecha) {
  return Number(aISO(fecha).replaceAll("-", ""));
}

export function desdeISO(iso) {
  const fecha = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(fecha.getTime()) || aISO(fecha) !== iso) {
    throw new Error(`Fecha inválida: ${iso}`);
  }
  return fecha;
}

export function hoy() {
  const iso = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA }).format(new Date());
  return desdeISO(iso);
}

export function enDias(dias) {
  return new Date(hoy().getTime() + dias * MS_POR_DIA);
}

export function haceDias(dias) {
  return enDias(-dias);
}

export function haceUnAnio() {
  const fecha = hoy();
  fecha.setUTCFullYear(fecha.getUTCFullYear() - 1);
  return fecha;
}

export function inicioMes() {
  const fecha = hoy();
  return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), 1));
}

export function inicioMesSiguiente() {
  const fecha = hoy();
  return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth() + 1, 1));
}

export function resolverFecha(valor) {
  if (!valor) return null;
  if (!valor.startsWith("@")) return desdeISO(valor);

  const marca = valor.match(/^@hoy([+-]\d+)?$/);
  if (!marca) throw new Error(`Fecha inválida: ${valor}`);
  return enDias(Number(marca[1] ?? 0));
}
