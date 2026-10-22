 
const API_URL =
  "https://rwzzsamwrjeinqwmfqgj.supabase.co/functions/v1/peluqueria-canina-api";

const CLAVE_PUBLICA =
  "sb_publishable_jq2-pGn27Sb15yyI0Zo2VA_mT3sfaZg";

// Elementos de la página
const formulario = document.getElementById("formulario-reserva");
const mensaje = document.getElementById("mensaje");
const campoFecha = document.getElementById("fecha");
const campoServicio = document.getElementById("servicio");
const campoServicioReserva = document.getElementById("servicio-reserva");

// Establecer la fecha mínima
if (campoFecha) {
  const hoy = new Date();
  campoFecha.min = new Date(
    hoy.getTime() - hoy.getTimezoneOffset() * 60000
  ).toISOString().split("T")[0];
}

// Cargar servicios desde Supabase
async function cargarServicios() {
  try {
    const respuesta = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: CLAVE_PUBLICA,
        Authorization: `Bearer ${CLAVE_PUBLICA}`
      },
      body: JSON.stringify({ action: "servicios" })
    });

    if (!respuesta.ok) {
      throw new Error(`Error HTTP ${respuesta.status}`);
    }

    const resultado = await respuesta.json();

    if (!Array.isArray(resultado.servicios)) {
      throw new Error("No se recibió la lista de servicios.");
    }

    [campoServicio, campoServicioReserva].forEach((select) => {
      if (!select) return;

      select.innerHTML = '<option value="">Selecciona un servicio</option>';

      resultado.servicios.forEach((servicio) => {
        const opcion = document.createElement("option");
        opcion.value = servicio.nombre;
        opcion.textContent =
          `${servicio.nombre} — S/ ${Number(servicio.precio).toFixed(2)}`;
        select.appendChild(opcion);
      });
    });
  } catch (error) {
    console.error("Error al cargar servicios:", error);

    if (mensaje) {
      mensaje.textContent =
        "No se pudieron cargar los servicios. Inténtalo más tarde.";
      mensaje.style.color = "#b42318";
    }
  }
}

cargarServicios();

// Formulario de reservas
if (formulario) {
  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const datos = new FormData(formulario);
    const dueno = String(datos.get("dueno") || "").trim();
    const mascota = String(datos.get("mascota") || "").trim();
    const servicio = datos.get("servicio");
    const fecha = datos.get("fecha");

    if (mensaje) {
      mensaje.textContent =
        `¡Gracias, ${dueno}! La solicitud de cita para ${mascota} ` +
        `(${servicio}) para el ${fecha} está lista para demostración. ` +
        "Aún falta conectar el sistema para registrar la reserva.";
      mensaje.style.color = "#654b76";
    }
  });
}

// CHAT DE HUELLITAS
const botonChat = document.getElementById("boton-chat");
const ventanaChat = document.getElementById("ventana-chat");
const cerrarChat = document.getElementById("cerrar-chat");
const formularioChat = document.getElementById("formulario-chat");
const entradaChat = document.getElementById("entrada-chat");
const mensajesChat = document.getElementById("mensajes-chat");

function abrirChat() {
  if (!ventanaChat || !botonChat) return;

  ventanaChat.hidden = false;
  botonChat.setAttribute("aria-expanded", "true");

  if (entradaChat) entradaChat.focus();
}

function cerrarVentanaChat() {
  if (!ventanaChat || !botonChat) return;

  ventanaChat.hidden = true;
  botonChat.setAttribute("aria-expanded", "false");
}

if (botonChat) {
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

function agregarMensaje(texto, tipo) {
  if (!mensajesChat) return;

  const burbuja = document.createElement("div");
  burbuja.classList.add("mensaje-chat", tipo);
  burbuja.textContent = texto;
  mensajesChat.appendChild(burbuja);
  mensajesChat.scrollTop = mensajesChat.scrollHeight;
}

function responderPregunta(pregunta) {
  const texto = pregunta.toLowerCase();

  if (/servicio|baño|corte|peluquería/.test(texto)) {
    return "🐶 En Huellitas ofrecemos servicios de peluquería y cuidado para tu mascota. Revisa la sección Servicios para conocer las opciones disponibles.";
  }

  if (/precio|cuánto|costo|cuesta/.test(texto)) {
    return "💗 Puedes consultar los precios en la sección Precios de nuestra página. Selecciona un servicio para ver el importe disponible.";
  }

  if (/reserva|cita|fecha|horario/.test(texto)) {
    return "📅 Para solicitar una cita, ve a Reservar cita, completa tus datos, elige el servicio y selecciona la fecha.";
  }

  if (/hola|buenas|saludos/.test(texto)) {
    return "¡Hola! 🐾💕 Bienvenido a Huellitas. Puedo orientarte sobre servicios, precios y reservas. ¿Qué deseas saber?";
  }

  if (/dirección|ubicación|dónde/.test(texto)) {
    return "📍 Consulta la información de contacto disponible en la página de Huellitas para conocer nuestra ubicación.";
  }

  return "🐾 Gracias por escribir a Huellitas. Por ahora puedo orientarte sobre servicios, precios y reservas. ¿Sobre cuál tema deseas información?";
}

function enviarPregunta(pregunta) {
  const texto = pregunta.trim();
  if (!texto) return;

  abrirChat();
  agregarMensaje(texto, "usuario");
  agregarMensaje(responderPregunta(texto), "asistente");
}

if (formularioChat && entradaChat) {
  formularioChat.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const pregunta = entradaChat.value;
    entradaChat.value = "";
    enviarPregunta(pregunta);
    entradaChat.focus();
  });
}

document.querySelectorAll(".sugerencia-chat").forEach((boton) => {
  boton.addEventListener("click", () => {
    const pregunta = boton.dataset.pregunta;
    if (pregunta) enviarPregunta(pregunta);
  });
});
