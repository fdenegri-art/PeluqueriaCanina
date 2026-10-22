 
"use strict";

// ========================================
// CONFIGURACIÓN DE SUPABASE
// ========================================

const API_URL =
  "https://rwzzsamwrjeinqwmfqgj.supabase.co/functions/v1/peluqueria-canina-api";

const CLAVE_PUBLICA =
  "sb_publishable_jq2-pGn27Sb15yyI0Zo2VA_mT3sfaZg";

// ========================================
// ELEMENTOS DE LA PÁGINA
// ========================================

const formularioReserva = document.getElementById("formulario-reserva");
const mensajeReserva = document.getElementById("mensaje");
const campoFecha = document.getElementById("fecha");
const selectPrecios = document.getElementById("servicio");
const selectServicioReserva = document.getElementById("servicio-reserva");

const botonChat = document.getElementById("boton-chat");
const ventanaChat = document.getElementById("ventana-chat");
const cerrarChat = document.getElementById("cerrar-chat");
const formularioChat = document.getElementById("formulario-chat");
const entradaChat = document.getElementById("entrada-chat");
const mensajesChat = document.getElementById("mensajes-chat");

let serviciosDisponibles = [];
let horariosDisponibles = [];

// ========================================
// COMUNICACIÓN CON LA EDGE FUNCTION
// ========================================

async function llamarAPI(datos) {
  const respuesta = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: CLAVE_PUBLICA,
      Authorization: `Bearer ${CLAVE_PUBLICA}`
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

// ========================================
// FECHA MÍNIMA PARA RESERVAS
// ========================================

if (campoFecha) {
  const hoy = new Date();

  campoFecha.min = new Date(
    hoy.getTime() - hoy.getTimezoneOffset() * 60000
  )
    .toISOString()
    .split("T")[0];
}

// ========================================
// CARGAR SERVICIOS Y PRECIOS
// ========================================

async function cargarServicios() {
  try {
    const resultado = await llamarAPI({ action: "servicios" });

    if (!Array.isArray(resultado.servicios)) {
      throw new Error("La respuesta no contiene una lista de servicios.");
    }

    serviciosDisponibles = resultado.servicios;

    [selectPrecios, selectServicioReserva].forEach((select) => {
      if (!select) return;

      const valorAnterior = select.value;

      select.innerHTML = "";

      const opcionInicial = document.createElement("option");
      opcionInicial.value = "";
      opcionInicial.textContent = "Selecciona un servicio";
      select.appendChild(opcionInicial);

      serviciosDisponibles.forEach((servicio) => {
        const opcion = document.createElement("option");

        opcion.value = String(servicio.id);
        opcion.textContent =
          `${servicio.nombre} — S/ ${Number(servicio.precio).toFixed(2)}`;

        select.appendChild(opcion);
      });

      if (
        valorAnterior &&
        [...select.options].some((opcion) => opcion.value === valorAnterior)
      ) {
        select.value = valorAnterior;
      }
    });

    if (serviciosDisponibles.length === 0 && mensajeReserva) {
      mensajeReserva.textContent =
        "Por el momento no hay servicios disponibles.";
    }
  } catch (error) {
    console.error("Error al cargar servicios:", error);

    if (mensajeReserva) {
      mensajeReserva.textContent =
        "No se pudieron cargar los servicios. Recarga la página e inténtalo de nuevo.";
      mensajeReserva.style.color = "#b42318";
    }

    [selectPrecios, selectServicioReserva].forEach((select) => {
      if (!select) return;

      select.innerHTML = "";

      const opcion = document.createElement("option");
      opcion.value = "";
      opcion.textContent = "No se pudieron cargar los servicios";
      select.appendChild(opcion);
    });
  }
}

// ========================================
// CARGAR HORARIOS
// ========================================

async function cargarHorarios() {
  try {
    const resultado = await llamarAPI({ action: "horarios" });
    horariosDisponibles = Array.isArray(resultado.horarios)
      ? resultado.horarios
      : [];
  } catch (error) {
    console.error("Error al cargar horarios:", error);
    horariosDisponibles = [];
  }
}

cargarServicios();
cargarHorarios();

// ========================================
// REGISTRAR UNA RESERVA
// ========================================

if (formularioReserva) {
  formularioReserva.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const datos = new FormData(formularioReserva);

    const dueno = String(datos.get("dueno") || "").trim();
    const mascota = String(datos.get("mascota") || "").trim();
    const fecha = String(datos.get("fecha") || "").trim();
    const servicioId = String(datos.get("servicio") || "").trim();

    if (!dueno || !mascota || !fecha || !servicioId) {
      if (mensajeReserva) {
        mensajeReserva.textContent =
          "Completa todos los campos antes de solicitar tu cita.";
        mensajeReserva.style.color = "#b42318";
      }
      return;
    }

    const fechaElegida = new Date(`${fecha}T12:00:00`);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (Number.isNaN(fechaElegida.getTime()) || fechaElegida < hoy) {
      if (mensajeReserva) {
        mensajeReserva.textContent =
          "Selecciona una fecha válida, que no haya pasado.";
        mensajeReserva.style.color = "#b42318";
      }
      return;
    }

    const botonEnviar = formularioReserva.querySelector(
      'button[type="submit"]'
    );

    if (botonEnviar) {
      botonEnviar.disabled = true;
      botonEnviar.textContent = "Enviando...";
    }

    if (mensajeReserva) {
      mensajeReserva.textContent = "Registrando tu solicitud...";
      mensajeReserva.style.color = "#654b76";
    }

    try {
      const resultado = await llamarAPI({
        action: "reservar",
        dueno,
        mascota,
        fecha,
        servicio_id: servicioId
      });

      if (mensajeReserva) {
        mensajeReserva.textContent =
          resultado.mensaje ||
          "Tu solicitud de cita fue registrada correctamente.";
        mensajeReserva.style.color = "#287a46";
      }

      formularioReserva.reset();

      if (campoFecha) {
        const hoyActual = new Date();

        campoFecha.min = new Date(
          hoyActual.getTime() - hoyActual.getTimezoneOffset() * 60000
        )
          .toISOString()
          .split("T")[0];
      }
    } catch (error) {
      console.error("Error al registrar la cita:", error);

      if (mensajeReserva) {
        mensajeReserva.textContent =
          error.message ||
          "No se pudo registrar tu solicitud. Inténtalo nuevamente.";
        mensajeReserva.style.color = "#b42318";
      }
    } finally {
      if (botonEnviar) {
        botonEnviar.disabled = false;
        botonEnviar.textContent = "Solicitar cita";
      }
    }
  });
}

// ========================================
// ABRIR Y CERRAR EL CHAT
// ========================================

function abrirChat() {
  if (!ventanaChat || !botonChat) return;

  ventanaChat.hidden = false;
  botonChat.setAttribute("aria-expanded", "true");

  if (entradaChat) {
    entradaChat.focus();
  }
}

function cerrarVentanaChat() {
  if (!ventanaChat || !botonChat) return;

  ventanaChat.hidden = true;
  botonChat.setAttribute("aria-expanded", "false");
}

if (botonChat && ventanaChat) {
  botonChat.addEventListener("click", () => {
    if (ventanaChat.hidden) {
      abrirChat();
    } else {
      cerrarVentanaChat();
    }
  });
}

if (cerrarChat) {
  cerrarChat.addEventListener("click", cerrarVentanaChat);
}

// ========================================
// MOSTRAR MENSAJES
// ========================================

function agregarMensaje(texto, tipo) {
  if (!mensajesChat) return;

  const burbuja = document.createElement("div");
  burbuja.classList.add("mensaje-chat", tipo);
  burbuja.textContent = texto;

  mensajesChat.appendChild(burbuja);
  mensajesChat.scrollTop = mensajesChat.scrollHeight;
}

// ========================================
// ENVIAR PREGUNTAS A SUPABASE
// ========================================

async function enviarPregunta(pregunta) {
  const texto = String(pregunta || "").trim();

  if (!texto) return;

  abrirChat();
  agregarMensaje(texto, "usuario");

  if (entradaChat) {
    entradaChat.disabled = true;
  }

  const botonEnviarChat = formularioChat
    ? formularioChat.querySelector('button[type="submit"]')
    : null;

  if (botonEnviarChat) {
    botonEnviarChat.disabled = true;
  }

  const indicador = document.createElement("div");
  indicador.className = "mensaje-chat asistente";
  indicador.textContent = "Huellitas está escribiendo...";

  if (mensajesChat) {
    mensajesChat.appendChild(indicador);
    mensajesChat.scrollTop = mensajesChat.scrollHeight;
  }

  try {
    const resultado = await llamarAPI({
      action: "chat",
      pregunta: texto
    });

    indicador.remove();

    agregarMensaje(
      resultado.respuesta ||
        "No recibí una respuesta. Inténtalo nuevamente.",
      "asistente"
    );
  } catch (error) {
    console.error("Error en el chat:", error);

    indicador.remove();

    agregarMensaje(
      "🐾 No pude conectarme con el servidor. Verifica tu conexión e inténtalo otra vez.",
      "asistente"
    );
  } finally {
    if (entradaChat) {
      entradaChat.disabled = false;
      entradaChat.focus();
    }

    if (botonEnviarChat) {
      botonEnviarChat.disabled = false;
    }
  }
}

if (formularioChat && entradaChat) {
  formularioChat.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const pregunta = entradaChat.value.trim();

    if (!pregunta) return;

    entradaChat.value = "";
    enviarPregunta(pregunta);
  });
}

// ========================================
// PREGUNTAS SUGERIDAS
// ========================================

document.querySelectorAll(".sugerencia-chat").forEach((boton) => {
  boton.addEventListener("click", () => {
    const pregunta = boton.dataset.pregunta;

    if (pregunta) {
      enviarPregunta(pregunta);
    }
  });
});

// ========================================
// COMPROBACIÓN INICIAL
// ========================================

console.info("Huellitas: script.js cargado correctamente.");

if (!botonChat || !ventanaChat) {
  console.error(
    "No se encontraron el botón o la ventana del chat. Revisa index.html."
  );
}
