// Huellitas Caninas: carga los servicios publicados en Supabase.
"use strict";

const API_URL = "https://rwzzsamwrjeinqwmfqgj.supabase.co/functions/v1/peluqueria-canina-api";
const CLAVE_PUBLICA = "sb_publishable_jq2-pGn27Sb15yyI0Zo2VA_mT3sfaZg";

const selectorServicios = document.getElementById("servicio");
const anio = document.getElementById("anio");

if (anio) {
  anio.textContent = new Date().getFullYear();
}

function nombreConTildes(texto) {
  return String(texto || "")
    .replace(/bano/gi, (m) => m[0] === m[0].toUpperCase() ? "Baño" : "baño")
    .replace(/peluqueria/gi, (m) => m[0] === m[0].toUpperCase() ? "Peluquería" : "peluquería")
    .replace(/pequeno/gi, (m) => m[0] === m[0].toUpperCase() ? "Pequeño" : "pequeño")
    .replace(/pequena/gi, (m) => m[0] === m[0].toUpperCase() ? "Pequeña" : "pequeña");
}

async function cargarServicios() {
  if (!selectorServicios) return;

  try {
    const respuesta = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: CLAVE_PUBLICA,
        Authorization: "Bearer " + CLAVE_PUBLICA
      },
      body: JSON.stringify({ action: "servicios" })
    });

    const resultado = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) throw new Error(resultado.detalle || resultado.message || "No se pudieron cargar los servicios.");

    const servicios = Array.isArray(resultado.servicios) ? resultado.servicios : [];
    selectorServicios.replaceChildren();

    const inicial = document.createElement("option");
    inicial.value = "";
    inicial.textContent = servicios.length ? "Selecciona un servicio" : "No hay servicios disponibles";
    selectorServicios.appendChild(inicial);

    servicios.forEach((servicio) => {
      const opcion = document.createElement("option");
      opcion.value = String(servicio.id);
      opcion.textContent = `${nombreConTildes(servicio.nombre)} — S/ ${Number(servicio.precio).toFixed(2)}`;
      selectorServicios.appendChild(opcion);
    });
  } catch (error) {
    console.error("Error al cargar los servicios:", error);
    selectorServicios.replaceChildren();
    const opcion = document.createElement("option");
    opcion.value = "";
    opcion.textContent = "No se pudieron cargar los precios";
    selectorServicios.appendChild(opcion);
  }
}

cargarServicios();
