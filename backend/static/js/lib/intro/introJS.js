// introJS.js - SOLUCIÓN COMPLETA

let tourInstance = null; // Variable global para mantener la instancia del tour

export function initLibIntroJS() {
    // Crear la instancia del tour
    function createTour() {
        const tour = introJs();

        tour.setOptions({
            steps: [
                {
                    element: "#welcome-terminal",
                    title: "Terminal interactiva",
                    intro: `
                        Esta es mi terminal interactiva.<br>
                        Aquí muestro automáticamente los repositorios de mis
                        cuentas de GitHub y proporciono enlaces para abrirlos
                        en una pestaña nueva.
                    `,
                    position: "auto",
                },
                {
                    element: "#acordion-section-skills",
                    title: "Acordeones minimalistas personalizados",
                    intro: `
                        He integrado estos acordeones minimalistas personalizados para mejorar la experiencia de usuario dado la cantidad de contenido y elementos en mi web personal.
                    `,
                    position: "auto",
                },
                {
                    element: "#formContact",
                    title: "Formulario de contacto",
                    intro: `
                        Aquí puedes enviarme un mensaje directamente desde la web.<br>
                        Utilizo AWS SES (por ahora modo SANDBOX) para gestionar el envío de correos usando templates personalizados (DJANGO).
                    `,
                    position: "auto",
                },
            ],
            nextLabel: "Siguiente ›",
            prevLabel: "‹ Anterior",
            doneLabel: "Entendido",
            skipLabel: "Saltar",
            showStepNumbers: false,
            showBullets: false,
            overlayOpacity: 0.75,
        });

        return tour;
    }

    // Función para iniciar el tour (reiniciándolo si es necesario)
    window.startTour = function () {
        // Siempre crear una nueva instancia para garantizar que funcione
        tourInstance = createTour();
        tourInstance.start();
    };

    // Botón para lanzar el tour manualmente
    const helpBtn = document.getElementById("btn-terminal-help");
    if (helpBtn) {
        helpBtn.addEventListener("click", () => {
            window.startTour();
        });
    }
}
