 
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

// CORREGIR TILDES SOLO PARA MOSTRAR LOS TEXTOS
function nombreConTildes(texto) {
  return String(texto || "")
    .replace(/\bBano\b/gi, "Baño")
    .replace(/\bPeluqueria\b/gi, "Peluquería")
    .replace(/\bPequeno\b/gi, "Pequeño")
    .replace(/\bPequena\b/gi, "Pequeña");
}

function llamarAPI(datos) {
  return fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: CLAVE_PUBLICA,
      Authorization: "Bearer " + CLAVE_PUBLICA
    },
    body: JSON.stringify(datos)
  }).then(async (respuesta) => {
    const resultado = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
      console.error("Error detallado de Supabase:", {
        estado: respuesta.status,
        resultado
      });

      const detalle =
        resultado.detalle ||
        resultado.message ||
        resultado.error ||
        `Error del servidor (${respuesta.status})`;

      throw new Error(
        typeof detalle === "string"
          ? detalle
          : JSON.stringify(detalle)
      );
    }

    return resultado;
  });
}

function agregarMensaje(texto, tipo = "asistente") {
  if (!mensajesChat) return;

  const burbuja = document.createElement("div");
  burbuja.className = `mensaje-chat ${tipo}`;
  burbuja.textContent = nombreConTildes(texto);

  mensajesChat.appendChild(burbuja);
  mensajesChat.scrollTop = mensajesChat.scrollHeight;
}

function abrirChat() {
  if (!ventanaChat) {
    console.error("No se encontró el elemento ventana-chat.");
    return;
  }

  ventanaChat.hidden = false;
  botonChat?.setAttribute("aria-expanded", "true");
  entradaChat?.focus();
}

function cerrarVentanaChat() {
  if (!ventanaChat) return;

  ventanaChat.hidden = true;
  botonChat?.setAttribute("aria-expanded", "false");
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

// CARGAR SERVICIOS Y PRECIOS
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

      const nombre = nombreConTildes(servicio.nombre);

      opcion.textContent =
        `${nombre} — S/ ${Number(servicio.precio).toFixed(2)}`;

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

// CONVERTIR FECHAS
function convertirFecha(textoFecha) {
  const texto = String(textoFecha || "").trim();

  let coincidencia;
  let anio;
  let mes;
  let dia;

  coincidencia = texto.match(
    /^(\d{4})[-/. ](\d{1,2})[-/. ](\d{1,2})$/
  );

  if (coincidencia) {
    anio = Number(coincidencia[1]);
    mes = Number(coincidencia[2]);
    dia = Number(coincidencia[3]);
  } else {
    coincidencia = texto.match(
      /^(\d{1,2})[-/. ](\d{1,2})[-/. ](\d{4})$/
    );

    if (!coincidencia) return null;

    dia = Number(coincidencia[1]);
    mes = Number(coincidencia[2]);
    anio = Number(coincidencia[3]);
  }

  if (
    !Number.isInteger(anio) ||
    !Number.isInteger(mes) ||
    !Number.isInteger(dia) ||
    anio < 1000 ||
    mes < 1 ||
    mes > 12 ||
    dia < 1 ||
    dia > 31
  ) {
    return null;
  }

  const fechaObjeto = new Date(0);
  fechaObjeto.setHours(0, 0, 0, 0);
  fechaObjeto.setFullYear(anio, mes - 1, dia);

  if (
    fechaObjeto.getFullYear() !== anio ||
    fechaObjeto.getMonth() !== mes - 1 ||
    fechaObjeto.getDate() !== dia
  ) {
    return null;
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  if (fechaObjeto.getTime() < hoy.getTime()) {
    return null;
  }

  return (
    String(anio).padStart(4, "0") +
    "-" +
    String(mes).padStart(2, "0") +
    "-" +
    String(dia).padStart(2, "0")
  );
}

function horaValida(hora) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(
    String(hora || "").trim()
  );
}

// MOSTRAR SERVICIOS EN EL CHAT
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

    const nombre = nombreConTildes(servicio.nombre);

    const descripcion = servicio.descripcion
      ? ` — ${nombreConTildes(servicio.descripcion)}`
      : "";

    return `${indice + 1}. ${nombre}${descripcion} — S/ ${precio}${duracion}`;
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

// PROCESAR CADA PASO DE LA RESERVA
async function procesarPaso(texto) {
  const valor = String(texto || "").trim();

  if (/^(cancelar|salir|detener)$/i.test(valor)) {
    cancelarReserva();
    return;
  }

  switch (pasoReserva) {
    case "cliente": {
      if (valor.length < 2) {
        agregarMensaje("Escribe tu nombre para continuar.");
        return;
      }

      datosReserva.dueno = valor;
      pasoReserva = "mascota";

      agregarMensaje("¡Gracias! ¿Cómo se llama tu mascota?");
      return;
    }

    case "mascota": {
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
    }

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
        "¿Para qué fecha quieres la cita? Puedes escribir 25/12/2026 o 2026-12-25."
      );
      return;
    }

    case "fecha": {
      const fechaConvertida = convertirFecha(valor);

      if (!fechaConvertida) {
        agregarMensaje(
          "La fecha no es válida o ya pasó. Escribe una fecha real y futura, por ejemplo 25/12/2026 o 2026-12-25."
        );
        return;
      }

      datosReserva.fecha = fechaConvertida;
      pasoReserva = "hora";

      agregarMensaje(
        `Fecha seleccionada: ${fechaConvertida}.\n` +
        "¿A qué hora deseas la cita? Usa HH:MM, por ejemplo 10:30."
      );
      return;
    }

    case "hora": {
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
        `Servicio: ${nombreConTildes(datosReserva.servicio.nombre)}\n` +
        `Precio: S/ ${Number(datosReserva.servicio.precio).toFixed(2)}\n` +
        `Fecha: ${datosReserva.fecha}\n` +
        `Hora: ${datosReserva.hora}\n\n` +
        "Escribe SÍ para confirmar o NO para cancelar."
      );
      return;
    }

    case "confirmar": {
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
    }

    case "enviando": {
      agregarMensaje(
        "Tu solicitud se está procesando. Espera un momento."
      );
      return;
    }
  }
}

// REGISTRAR LA RESERVA
async function registrarReserva() {
  pasoReserva = "enviando";

  agregarMensaje("Estoy enviando tu solicitud de cita…");

  try {
    const tamanoBaseDatos = {
      "pequeño": "pequeno",
      "mediano": "mediano",
      "grande": "grande"
    }[datosReserva.tamano];

    const resultado = await llamarAPI({
      action: "reservar",
      dueno: datosReserva.dueno,
      mascota: datosReserva.mascota,
      tamano_mascota: tamanoBaseDatos,
      servicio_id: String(datosReserva.servicio.id),
      fecha: datosReserva.fecha,
      hora_inicio: datosReserva.hora
    });

    agregarMensaje(
      resultado.mensaje || "Tu solicitud fue enviada correctamente."
    );

    pasoReserva = null;
    datosReserva = {};
  } catch (error) {
    console.error("Error al reservar:", error);

    pasoReserva = "confirmar";

    agregarMensaje(
      `No pude registrar la cita: ${error.message}\n` +
      "Tus datos siguen guardados en esta conversación. " +
      "Escribe SÍ para volver a intentarlo o CANCELAR para salir."
    );
  }
}

// ENVIAR MENSAJES
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
      mensaje: texto
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
