 
"use strict";

const API_URL =
  "https://rwzzsamwrjeinqwmfqgj.supabase.co/functions/v1/peluqueria-canina-api";

const CLAVE_PUBLICA =
  "sb_publishable_jq2-pGn27Sb15yyI0Zo2VA_mT3sfaZg";

const $ = (id) => document.getElementById(id);

const selectPrecios = $("servicio");
const botonChat = $("boton-chat");
const ventanaChat = $("ventana-chat");
const cerrarChat = $("cerrar-chat");
const formularioChat = $("formulario-chat");
const entradaChat = $("entrada-chat");
const mensajesChat = $("mensajes-chat");

let serviciosDisponibles = [];
let pasoReserva = null;
let datosReserva = {};
let procesando = false;

async function llamarAPI(datos) {
  const respuesta = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": CLAVE_PUBLICA,
      "Authorization": "Bearer " + CLAVE_PUBLICA
    },
    body: JSON.stringify(datos)
  });

  const resultado = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error(
      resultado.error || `Error del servidor (${respuesta.status})`
    );
  }

  return resultado;
}

function agregarMensaje(texto, tipo = "asistente") {
  if (!mensajesChat) return;

  const burbuja = document.createElement("div");
  burbuja.className = `mensaje-chat ${tipo}`;
  burbuja.textContent = texto;
  mensajesChat.appendChild(burbuja);
  mensajesChat.scrollTop = mensajesChat.scrollHeight;
}

function abrirChat() {
  if (!ventanaChat) {
    console.error("No se encontró el elemento ventana-chat.");
    return;
  }

  ventanaChat.hidden = false;

  if (botonChat) {
    botonChat.setAttribute("aria-expanded", "true");
  }

  entradaChat?.focus();
}

function cerrarVentanaChat() {
  if (!ventanaChat) return;

  ventanaChat.hidden = true;

  if (botonChat) {
    botonChat.setAttribute("aria-expanded", "false");
  }
}

if (botonChat) {
  botonChat.addEventListener("click", () => {
    if (ventanaChat.hidden) {
      abrirChat();
    } else {
      cerrarVentanaChat();
    }
  });
} else {
  console.error("No se encontró el botón flotante del chat.");
}

cerrarChat?.addEventListener("click", cerrarVentanaChat);

document.querySelectorAll("[data-abrir-chat]").forEach((boton) => {
  boton.addEventListener("click", () => {
    abrirChat();
    iniciarReserva();
  });
});

async function cargarServicios() {
  try {
    const resultado = await llamarAPI({ action: "servicios" });

    serviciosDisponibles = Array.isArray(resultado.servicios)
      ? resultado.servicios
      : [];

    if (!selectPrecios) return;

    selectPrecios.replaceChildren();

    const inicial = document.createElement("option");
    inicial.value = "";
    inicial.textContent = serviciosDisponibles.length
      ? "Selecciona un servicio"
      : "No hay servicios disponibles";

    selectPrecios.appendChild(inicial);

    serviciosDisponibles.forEach((servicio) => {
      const opcion = document.createElement("option");
      opcion.value = String(servicio.id);
      opcion.textContent =
        `${servicio.nombre} — S/ ${Number(servicio.precio).toFixed(2)}`;
      selectPrecios.appendChild(opcion);
    });
  } catch (error) {
    console.error("Error cargando servicios:", error);

    if (selectPrecios) {
      selectPrecios.replaceChildren();

      const opcion = document.createElement("option");
      opcion.value = "";
      opcion.textContent = "No se pudieron cargar los servicios";
      selectPrecios.appendChild(opcion);
    }
  }
}

function iniciarReserva() {
  pasoReserva = "cliente";
  datosReserva = {};

  agregarMensaje(
    "¡Vamos a reservar una cita! 🐶 Primero, ¿cuál es tu nombre?"
  );
}

function cancelarReserva() {
  pasoReserva = null;
  datosReserva = {};

  agregarMensaje(
    "He cancelado la reserva. Puedes volver a empezar cuando quieras."
  );
}

function normalizar(texto) {
  return String(texto || "")
    .trim()
    .toLocaleLowerCase("es");
}

function mostrarServicios() {
  if (!serviciosDisponibles.length) {
    agregarMensaje(
      "No encontré servicios disponibles. Comprueba la conexión e inténtalo más tarde."
    );
    return;
  }

  const lista = serviciosDisponibles.map((servicio, indice) => {
    const precio = Number(servicio.precio).toFixed(2);
    const duracion = servicio.duracion_minutos
      ? ` · ${servicio.duracion_minutos} min`
      : "";

    return `${indice + 1}. ${servicio.nombre} — S/ ${precio}${duracion}`;
  });

  agregarMensaje("Estos son nuestros servicios:\n" + lista.join("\n"));
}

function seleccionarServicio(texto) {
  const entrada = normalizar(texto);

  const numero = Number(entrada);

  if (
    entrada !== "" &&
    Number.isInteger(numero) &&
    numero >= 1 &&
    numero <= serviciosDisponibles.length
  ) {
    return serviciosDisponibles[numero - 1];
  }

  return serviciosDisponibles.find(
    (servicio) => normalizar(servicio.nombre) === entrada
  ) || serviciosDisponibles.find(
    (servicio) =>
      normalizar(servicio.nombre).includes(entrada) ||
      entrada.includes(normalizar(servicio.nombre))
  );
}

function fechaValida(fecha) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;

  const [anio, mes, dia] = fecha.split("-").map(Number);
  const seleccionada = new Date(anio, mes - 1, dia);
  const hoy = new Date();

  hoy.setHours(0, 0, 0, 0);

  return (
    seleccionada.getFullYear() === anio &&
    seleccionada.getMonth() === mes - 1 &&
    seleccionada.getDate() === dia &&
    seleccionada >= hoy
  );
}

function horaValida(hora) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(hora);
}

async function procesarPaso(texto) {
  const valor = texto.trim();

  if (/^(cancelar|salir|detener)$/i.test(valor)) {
    cancelarReserva();
    return;
  }

  switch (pasoReserva) {
    case "cliente":
      if (valor.length < 2) {
        agregarMensaje("Escribe tu nombre para continuar.");
        return;
      }

      datosReserva.dueno = valor;
      pasoReserva = "mascota";

      agregarMensaje("¡Gracias! ¿Cómo se llama tu mascota?");
      return;

    case "mascota":
      if (!valor) {
        agregarMensaje("Escribe el nombre de tu mascota.");
        return;
      }

      datosReserva.mascota = valor;
      pasoReserva = "tamano";

      agregarMensaje(
        "¿Qué tamaño tiene tu mascota? Escribe pequeño, mediano o grande."
      );
      return;

    case "tamano": {
      const tamano = normalizar(valor)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      const equivalencias = {
        pequeno: "pequeño",
        pequena: "pequeño",
        mediano: "mediano",
        mediana: "mediano",
        grande: "grande"
      };

      const elegido = equivalencias[tamano];

      if (!elegido) {
        agregarMensaje("Indica pequeño, mediano o grande.");
        return;
      }

      datosReserva.tamano = elegido;
      pasoReserva = "servicio";

      mostrarServicios();

      agregarMensaje(
        "¿Qué servicio deseas? Escribe el número de la lista o su nombre."
      );
      return;
    }

    case "servicio": {
      const servicio = seleccionarServicio(valor);

      if (!servicio) {
        agregarMensaje(
          "No encontré ese servicio. Escribe el número o el nombre."
        );
        mostrarServicios();
        return;
      }

      datosReserva.servicio = servicio;
      pasoReserva = "fecha";

      agregarMensaje(
        "¿Para qué fecha quieres la cita? Usa AAAA-MM-DD, por ejemplo 2026-12-15."
      );
      return;
    }

    case "fecha":
      if (!fechaValida(valor)) {
        agregarMensaje(
          "La fecha no es válida o ya pasó. Escríbela como AAAA-MM-DD."
        );
        return;
      }

      datosReserva.fecha = valor;
      pasoReserva = "hora";

      agregarMensaje(
        "¿A qué hora deseas la cita? Usa HH:MM, por ejemplo 10:30."
      );
      return;

    case "hora":
      if (!horaValida(valor)) {
        agregarMensaje(
          "Escribe una hora válida, por ejemplo 09:30 o 14:00."
        );
        return;
      }

      datosReserva.hora = valor;
      pasoReserva = "confirmar";

      agregarMensaje(
        "Revisa tu solicitud:\n" +
        `Cliente: ${datosReserva.dueno}\n` +
        `Mascota: ${datosReserva.mascota}\n` +
        `Tamaño: ${datosReserva.tamano}\n` +
        `Servicio: ${datosReserva.servicio.nombre}\n` +
        `Precio: S/ ${Number(datosReserva.servicio.precio).toFixed(2)}\n` +
        `Fecha: ${datosReserva.fecha}\n` +
        `Hora: ${datosReserva.hora}\n\n` +
        "Escribe SÍ para confirmar o NO para cancelar."
      );
      return;

    case "confirmar":
      if (/^(no|n|cancelar)$/i.test(valor)) {
        cancelarReserva();
        return;
      }

      if (!/^(si|sí|s)$/i.test(valor)) {
        agregarMensaje("Escribe SÍ para confirmar o NO para cancelar.");
        return;
      }

      await registrarReserva();
      return;

    case "enviando":
      agregarMensaje("Tu solicitud se está procesando. Espera un momento.");
      return;
  }
}

async function registrarReserva() {
  pasoReserva = "enviando";

  agregarMensaje("Estoy comprobando el horario y registrando tu solicitud…");

  try {
    const resultado = await llamarAPI({
      action: "reservar",
      dueno: datosReserva.dueno,
      mascota: datosReserva.mascota,
      tamano_mascota: datosReserva.tamano,
      servicio_id: String(datosReserva.servicio.id),
      fecha: datosReserva.fecha,
      hora_inicio: datosReserva.hora
    });

    agregarMensaje(
      resultado.mensaje ||
      "Tu solicitud se registró correctamente. ¡Gracias por elegir Huellitas!"
    );

    pasoReserva = null;
    datosReserva = {};
  } catch (error) {
    console.error("Error al reservar:", error);

    pasoReserva = "hora";

    agregarMensaje(
      `No pude registrar la cita: ${error.message}\n` +
      "Puedes indicar otra hora o escribir CANCELAR para salir."
    );
  }
}

async function enviarPregunta(pregunta) {
  const texto = String(pregunta || "").trim();

  if (!texto || procesando) return;

  abrirChat();
  agregarMensaje(texto, "usuario");

  procesando = true;

  if (entradaChat) entradaChat.disabled = true;

  const botonEnviar = formularioChat?.querySelector(
    'button[type="submit"]'
  );

  if (botonEnviar) botonEnviar.disabled = true;

  try {
    if (pasoReserva) {
      await procesarPaso(texto);
      return;
    }

    const normalizada = normalizar(texto);

    if (
      /^(reservar|quiero reservar|reservar cita|agendar|quiero una cita)$/.test(
        normalizada
      ) ||
      normalizada.includes("reservar una cita")
    ) {
      iniciarReserva();
      return;
    }

    const resultado = await llamarAPI({
      action: "chat",
      pregunta: texto
    });

    agregarMensaje(
      resultado.respuesta ||
      "No recibí una respuesta. Inténtalo nuevamente."
    );
  } catch (error) {
    console.error("Error en el chat:", error);

    agregarMensaje(
      `No pude completar la operación: ${error.message}. Revisa la conexión con Supabase.`
    );
  } finally {
    procesando = false;

    if (entradaChat) {
      entradaChat.disabled = false;
      entradaChat.focus();
    }

    if (botonEnviar) botonEnviar.disabled = false;
  }
}

if (formularioChat && entradaChat) {
  formularioChat.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const texto = entradaChat.value.trim();
    if (!texto) return;

    entradaChat.value = "";
    enviarPregunta(texto);
  });
}

document.querySelectorAll(".sugerencia-chat").forEach((boton) => {
  boton.addEventListener("click", () => {
    const pregunta = boton.dataset.pregunta;
    if (pregunta) enviarPregunta(pregunta);
  });
});

cargarServicios();

console.info("Huellitas IA: script.js cargado correctamente.");
