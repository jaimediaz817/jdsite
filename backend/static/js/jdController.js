import { initJdTooltips } from "./components/tooltip/jdTooltip.js";
import { initJdAccordions } from "./components/acordion/jdAccordion.js";
import { initLibIntroJS } from "./lib/intro/introJS.js";

// Cuando cargue la vista
document.addEventListener("DOMContentLoaded", () => {
    initJdTooltips();
    initScrollAnimations();
    initJdAccordions();
    initLibIntroJS();
});

function initScrollAnimations() {
    const animatedElements = document.querySelectorAll(".tech-icons-grid");

    if (!animatedElements.length) {
        return;
    }

    const observer = new IntersectionObserver(
        (entries, observerInstance) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const gridItems =
                        entry.target.querySelectorAll(".tech-icon-item");
                    gridItems.forEach((item) => {
                        item.classList.add("is-visible");
                    });
                    // Una vez animado, dejamos de observar para no repetir
                    observerInstance.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.1, // La animación se dispara cuando el 10% del elemento es visible
        }
    );

    animatedElements.forEach((el) => {
        observer.observe(el);
    });
}

$(function () {
    // TODO: evaluar para quitart
    function getCookie(name) {
        const v = `; ${document.cookie}`.split(`; ${name}=`);
        if (v.length === 2)
            return decodeURIComponent(v.pop().split(";").shift());
    }

    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (
                !/^GET|HEAD|OPTIONS|TRACE$/i.test(settings.type) &&
                !this.crossDomain
            ) {
                xhr.setRequestHeader("X-CSRFToken", getCookie("csrftoken"));
            }
        },
    });

    // Menu
    $("#navigation-menu .navbar-toggler").on("click", function () {
        console.log("click");
        $(this).children().toggleClass("icon-close");
        $(".section-menu-cta-buttons").toggleClass("show-menu-responsive");
    });

    // VIDEO
    $(function () {
        $(".btn-play[data-fancybox]").on("error", function () {
            window.open(
                "https://www.youtube.com/watch?v=VtXjvHf-gG0",
                "_blank"
            );
        });
    });

    // items menu
    $("#navigation-menu .navbar-nav .nav-item .nav-link").on(
        "click",
        function () {
            console.log("click");
            $("#navigation-menu .navbar-toggler span").removeClass(
                "icon-close"
            );
            $("#navigation-menu .navbar-collapse").collapse("hide");
        }
    );

    // SWIPERS
    var swiper = new Swiper("#headerSlider", {
        // params
        speed: 800,
        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
        },
        pagination: {
            el: ".swiper-pagination",
            type: "bullets",
            clickable: true,
        },
        loop: true,
        autoplay: {
            delay: 15000,
        },
        effect: "fade",
        keyboard: {
            enabled: true,
            onlyInViewport: true,
        },
    });

    // Carrusel de proyectos (4 tarjetas por slide)
    var projectsSlider = new Swiper("#projectsSlider", {
        slidesPerView: 1,
        spaceBetween: 24,
        loop: false,
        autoHeight: true,
        pagination: {
            el: ".swiper-pagination",
            type: "bullets",
            clickable: true,
        },
        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
        },
        breakpoints: {
            768: {
                spaceBetween: 32,
            },
        },
    });

    // ---------------------------------------------------------------

    // COUNTER
    $(".counter").counterUp();

    // PICKERS - DATE
    $(".datepicker").pickadate({
        monthsFull: [
            "Enero",
            "Febrero",
            "Marzo",
            "Abril",
            "Mayo",
            "Junio",
            "Julio",
            "Agosto",
            "Septiembre",
            "Octubre",
            "Noviembre",
            "Diciembre",
        ],
        monthsShort: [
            "ene",
            "feb",
            "mar",
            "abr",
            "may",
            "jun",
            "jul",
            "ago",
            "sep",
            "oct",
            "nov",
            "dic",
        ],
        weekdaysFull: [
            "Domingo",
            "Lunes",
            "Martes",
            "Miércoles",
            "Jueves",
            "Viernes",
            "Sábado",
        ],
        weekdaysShort: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
        today: "Hoy",
        clear: "Borrar",
        close: "Cerrar",

        labelMonthNext: "Siguiente mes",
        labelMonthPrev: "Mes anterior",
        labelMonthSelect: "Seleccione un mes",
        labelYearSelect: "Seleccione un año",

        firstDay: 1,
        format: "dddd, d !de mmmm !de yyyy",
        formatSubmit: "yyyy-mm-dd",
        selectYears: true,
        selectMonths: true,
        min: true,
        max: 30,
        onStart: function () {
            var date = new Date();
            //this.setDate( date.getFullYear(), date.getMonth() + 1, date.getDate())
            this.set("select", [
                date.getFullYear(),
                date.getMonth(),
                date.getDate(),
            ]);
        },
    });

    // Limits
    $(".timepicker").pickatime({
        clear: "Borrar",
        format: "hh:i a", // Esto es lo que ve el usuario (ej: 05:00 p.m.)
        // --- ¡AÑADE ESTA LÍNEA! ---
        formatSubmit: "HH:i", // Esto es lo que se envía (ej: 17:00)
        // -------------------------
        interval: 60,
        min: [9, 0],
        max: [20, 0],
    });

    $.trim($("#message").text());

    // VALIDATE
    $("#formContact").parsley({
        errorClass: "is-invalid text-danger",
        successClass: "is-valid",
        errorsWrapper:
            "<ul class='list-unstyled text-danger mb-0 pt-2 small'></ul>",
        errorsTemplate: "<li class='custom'></li>",
        trigger: "change",
        triggerAfterFailure: "change",
    });

    // STICKY
    $("#navigation-menu").stickit({
        className: "stick-menu",
    });

    // SCROLL
    $("#navigation-menu .navbar-nav .nav-item .nav-link").mPageScroll2id({
        offset: 55,
        highlightClass: "active",
    });

    // ANIMATIONS
    $(".skills-surface").css("opacity", 0).animate({ opacity: 1 }, 600);

    // Prefill mensaje desde proyectos
    $(".project-card .btn-addtext-to-form-opc1").on("click", function () {
        const project = $(this).data("project");
        const stack = $(this).data("stack");
        const baseMsg = `Hola Jaime, me interesa un proyecto similar a "${project}" basado en: ${stack}. ¿Podemos conversar?`;
        $("#message").val(baseMsg);
        $("html, body").animate(
            { scrollTop: $("#contact").offset().top - 70 },
            600
        );
        $("#message").focus();
    });
    // asignar el text area en blanco por defecto
    $("#message").val("");

    function toggleFechas(on) {
        const $blocks = $(".fechas-cita-content");
        const $date = $("#date");
        const $time = $("#time");
        if (on) {
            $blocks.show();
            $date.attr("data-parsley-required", "true");
            $time.attr("data-parsley-required", "true");
            $("#hiddenCheckDates").val("true");
        } else {
            $blocks.hide();
            $date.removeAttr("data-parsley-required").val("");
            $time.removeAttr("data-parsley-required").val("");
            $("#hiddenCheckDates").val("false");
        }
    }

    // ENVÍO FORMULARIO *****************************************************
    function bindForm() {
        const $form = $("#formContact");
        if (!$form.length) return; // si no está en la página, no hace nada

        const $loader = $("#formLoader");

        // Estado inicial del switch (oculto)
        toggleFechas(false);

        // Switch de reunión
        $("#checkFechaHoraContact")
            .off("change.jd")
            .on("change.jd", function () {
                toggleFechas(this.checked);
            });

        // Envío
        $form.off("submit.jd").on("submit.jd", function (e) {
            e.preventDefault();

            // Parsley (si está cargado)
            if ($form.parsley && typeof $form.parsley === "function") {
                const ok = $form.parsley().validate();
                if (!ok) return;
            }

            // --- ¡AQUÍ EMPIEZA LA MAGIA DE LA CONFIRMACIÓN! ---
            Swal.fire({
                title: "¿Confirmar envío?",
                text: "Se enviará tu mensaje para que pueda revisarlo.",
                icon: "question",
                showCancelButton: true,
                confirmButtonColor: "#F6364F", // Tu color primario
                cancelButtonColor: "#6c757d",
                confirmButtonText: "¡Sí, enviar!",
                cancelButtonText: "No, cancelar",
            }).then((result) => {
                // Si el usuario hace clic en "¡Sí, enviar!"
                if (result.isConfirmed) {
                    // --- TODA LA LÓGICA DE ENVÍO VA AQUÍ DENTRO ---
                    const $btn = $form.find("button[type=submit]");
                    const $help = $("#formHelp");

                    $btn.prop("disabled", true);
                    $loader.addClass("show");

                    const payload = {
                        name: $("#names").val().trim(),
                        email: $("#email").val().trim(),
                        phone: $("#number").val().trim(),
                        message: $("#message").val().trim(),
                        hiddenCheckDates: $("#hiddenCheckDates").val(),
                        meeting_date: $("input[name='date_submit']").val(),
                        meeting_time: $("input[name='time_submit']").val(),
                    };

                    console.log(">>>>>>>>>>>>>>>> ", payload);

                    $.post("/inq/api/submit/", payload)
                        .done(function (r) {
                            ToastMessage(
                                "¡Enviado!",
                                "Tu mensaje ha sido recibido correctamente.",
                                "success"
                            );
                            $help.html(
                                '¡Gracias! Te envié un correo con el enlace. También puedes <a target="_blank" href="' +
                                    r.status_url +
                                    '">abrir el seguimiento aquí</a>.'
                            );
                            $form[0].reset();
                            toggleFechas(false);
                        })
                        .fail(function (xhr) {
                            const errorData = xhr.responseJSON;
                            let msg = "No se pudo enviar. Intenta de nuevo.";
                            if (errorData && errorData.errors) {
                                // Construir un mensaje de error más detallado
                                const errors = Object.values(errorData.errors)
                                    .map((e) => e[0])
                                    .join("<br>");
                                Swal.fire(
                                    "Error de Validación",
                                    errors,
                                    "error"
                                );
                                msg =
                                    "Por favor, corrige los errores indicados.";
                            }
                            $help.text(msg);
                        })
                        .always(function () {
                            $btn.prop("disabled", false);
                            $loader.removeClass("show");
                        });
                    // --- FIN DE LA LÓGICA DE ENVÍO ---
                } else {
                    // Si el usuario cancela, no hacer nada
                    // Si el usuario cancela, reiniciamos el formulario para una experiencia limpia.
                    $form[0].reset();
                    toggleFechas(false);
                    // Opcional: Notificar al usuario que la acción fue cancelada.
                    ToastMessage(
                        "Cancelado",
                        "El envío del mensaje ha sido cancelado.",
                        "info",
                        3000
                    );
                }
            });
        });
    }

    // Espera DOM listo
    $(function () {
        bindForm();
    });

    // Por defecto ocultar las fechas
    $(".fechas-cita-content").fadeOut();
    $("#checkFechaHoraContact").on("change", function () {
        console.log("checked", this.checked);
        if (this.checked) {
            $("#hiddenCheckDates").val(true);
            $(".fechas-cita-content").fadeIn();
        } else {
            $("#hiddenCheckDates").val(false);
            $(".fechas-cita-content").fadeOut();
        }
    });

    function ToastMessage(
        headerMess = "",
        messageContent,
        typeMessage,
        timeShowMessage = 5000
    ) {
        let iconMessage = "";
        let headerMessage = "Resultado de la operación:";
        if (typeMessage == "error") {
            iconMessage = "error";
            headerMessage = "Algo ocurió durante el proceso";
        } else {
            headerMessage = "Success";
            iconMessage = "success";
        }

        if (headerMess !== "") {
            headerMessage = headerMess;
        }

        $.toast({
            heading: headerMessage,
            text: messageContent,
            icon: iconMessage,
            //showHideTransition: 'fade',
            showHideTransition: "plain",
            bgColor: "#444444",
            //hideAfter : false,
            hideAfter: timeShowMessage,
            loader: true, // Change it to false to disable loader
            loaderBg: "#F6364F", // To change the background
        });
    }

    // TODO: VUELA >>>
    if (urlParam("email") !== null && urlParam("names")) {
        let emailParam = urlParam("email").trim();
        let namesParam = urlParam("names")
            .trim()
            .replace(/\+/g, " ")
            .replace(/\./g, "")
            .replace("/", " ");
        $("#names").val(namesParam);
        $("#email").val(emailParam);
    } else {
    }

    function urlParam(name) {
        var results = new RegExp("[?&]" + name + "=([^&#]*)").exec(
            window.location.href
        );
        if (results == null) {
            return null;
        }
        return decodeURI(results[1]) || 0;
    }
    // <<<<<<<<<<<

    // FOOTER
    $('[data-toggle="tooltip"]').tooltip();
    // avatares actions ::
    $("footer .card-avatares").hover(function () {
        $(this).toggleClass("flipped");
    });

    /**
     * TEMPORAL
     */
    function getSearchParams(k) {
        var p = {};
        location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (s, k, v) {
            p[k] = v;
        });
        return k ? p[k] : p;
    }

    // Botón flotante "Ir arriba"
    var $btnTop = $("#btnTop");
    $(window).on("scroll", function () {
        if ($(this).scrollTop() > 260) {
            $btnTop.addClass("show");
        } else {
            $btnTop.removeClass("show");
        }
    });
    $btnTop.on("click", function () {
        $("html, body").animate({ scrollTop: 0 }, 600);
    });

    // Accesibilidad rápida botón certificaciones
    $(".btn-cert-pdf").on("keyup", function (e) {
        if (e.key === "Enter" || e.key === " ") {
            this.click();
        }
    });

    $(function () {
        // Flip en hover (desktop)
        $(".flip-logo-jd")
            .on("mouseenter focus", function () {
                $(this).addClass("flipped");
            })
            .on("mouseleave blur", function () {
                $(this).removeClass("flipped");
            });

        // Flip en tap/click (mobile)
        $(".flip-logo-jd").on("click touchend", function (e) {
            e.preventDefault();
            $(this).toggleClass("flipped");
        });
    });

    // =================================================================
    //  INICIO: LÓGICA DE LA GALERÍA DE PROYECTOS
    //  (Pega todo este bloque en tu archivo)
    // =================================================================

    // 1. DATOS DE LOS PROYECTOS
    // Aquí centralizamos toda la información.
    // NOTA: Las rutas a las imágenes deben ser estáticas, sin etiquetas de Django.
    const projectsData = {
        "app-storybook-ficohsa-seguros": {
            title: "StoryBooks (catálogo de componentes UI) para Ficohsa Seguros",
            media: [
                {
                    type: "video",
                    src: "/static/videos/proyectos/app-storybooks-ficosha-seguros.mp4", // <-- ¡AÑADE LA RUTA A TU VIDEO AQUÍ!
                    alt: "Demo en video del flujo documental",
                    description:
                        "Video demostrativo del flujo documental y la interfaz de usuario desarrollada para el proyecto Ficohsa Seguros., el requerimiento consistió en crear un catálogo de componentes en 2.5 semanas donde tenía que contemplar todos los componentes necesarios para incorporar a la aplicación móvil luego, incluyendo componentes de todo tipo para cumplir luego con las etapas siguientes, se usó un dispositivo virtual de Android Studio para poder grabar esta demostración",
                },
            ],
        },
        "app-crq-gestion": {
            title: "CRQ – Gestión de Documentación por Ciclos (Módulos indicadores y PAI)",
            media: [
                {
                    type: "image",
                    src: "/static/images/proyectos/app-crq-login.png",
                    alt: "Captura de pantalla del login de la aplicación",
                    description:
                        "Captura de pantalla dellogin de la aplicación, responsive y con una apariencia agradable para el usuario garantizando desde la entrada una buena experiencia. UX",
                },
                {
                    type: "image",
                    src: "/static/images/proyectos/app-crq-dashboard-contraido.png",
                    alt: "Captura de pantalla de la dashboard con menú contraído",
                    description:
                        "Se aprecian las opciones principales en el menú lateral izquierdo, el módulo PAI e INDICADORES se encuentran con sus opciones de menú contraídas",
                },
                {
                    type: "image",
                    src: "/static/images/proyectos/app-crq-roles-permisos-1.png",
                    alt: "Captura de pantalla del módulo para la gestión completa de roles y permisos adaptados para cada usuario, gestionable",
                    description:
                        "Captura de pantalla del módulo para la gestión completa de roles y permisos adaptados para cada usuario, gestionable",
                },
                {
                    type: "image",
                    src: "/static/images/proyectos/app-crq-perfil-editar-1.png",
                    alt: "Captura de pantalla del módulo de usuarios donde se ilustra la edición de los datos de un perfil de usuario",
                    description:
                        "Captura de pantalla del módulo de usuarios donde se ilustra la edición de los datos de un perfil de usuario",
                },
                {
                    type: "image",
                    src: "/static/images/proyectos/app-crq-pai-actividades.png",
                    alt: "Captura de pantalla del módulo de PAI - Actividades",
                    description:
                        "Captura de pantalla del módulo de PAI - Actividades del proyecto CRQ – Gestión de Documentación por Ciclos.",
                },
                {
                    type: "image",
                    src: "/static/images/proyectos/app-crq-pai-actividad-consultas-sql.png",
                    alt: "Captura de pantalla del módulo de PAI - Actividades - se aprecian las consultas SQL implementadas y usadas en este llamado",
                    description:
                        "Captura de pantalla del módulo de PAI - Actividades - se aprecian las consultas SQL implementadas y usadas en este llamado",
                },
                {
                    type: "image",
                    src: "/static/images/proyectos/app-crq-reporte-actividades-por-grupo.png",
                    alt: "Captura de pantalla del módulo de PAI - reporte de actividades por grupo, permitiendo exportar a DOCX, PDF",
                    description:
                        "Captura de pantalla del módulo de PAI - reporte de actividades por grupo, permitiendo exportar a DOCX, PDF",
                },
            ],
        },
        "app-football-center": {
            title: "Football Center Academy – Reservas Canchas",
            media: [],
        },
        "app-automation-zoho-woztell": {
            title: "Integración Zoho CRM + WOZTELL + SQL Server (SAG)",
            media: [], // Array vacío, el botón se deshabilitará
        },
        "app-huellitas-felices": {
            title: "Huellitas Felices – Rifas (3 y 4 cifras)",
            media: [], // Array vacío, el botón se deshabilitará
        },
    };

    // 2. FUNCIÓN PARA ACTUALIZAR EL ESTADO DE LOS BOTONES
    function _updateGalleryButtonsState() {
        $(".project-gallery-trigger").each(function () {
            const button = $(this);
            const projectId = button.data("project-id");
            const project = projectsData[projectId];

            // Deshabilita el botón si el proyecto no existe o no tiene medios
            if (project && project.media && project.media.length > 0) {
                button.prop("disabled", false);
            } else {
                button.prop("disabled", true);
            }
        });
    }

    // 3. FUNCIÓN PARA RELLENAR EL MODAL (ACTUALIZADA PARA VIDEO)
    function _populateProjectModal(projectId) {
        const projectData = projectsData[projectId];
        if (
            !projectData ||
            !projectData.media ||
            projectData.media.length === 0
        ) {
            return;
        }

        const modal = $("#projectGalleryModal");
        const carouselInner = modal.find(".carousel-inner");
        const carouselIndicators = modal.find(".carousel-indicators");

        modal.find("#projectGalleryTitle").text(projectData.title);
        carouselInner.empty();
        carouselIndicators.empty();

        projectData.media.forEach((item, index) => {
            const indicator = $("<li></li>")
                .attr("data-target", "#projectGalleryCarousel")
                .attr("data-slide-to", index);

            let mediaElement;
            // Genera <video> o <img> según el tipo
            if (item.type === "video") {
                mediaElement = `
                    <video controls preload="metadata" class="d-block w-100 project-gallery-video">
                        <source src="${item.src}"  autoplay muted controls type="video/mp4">
                        Tu navegador no soporta el elemento de video.
                    </video>
                `;
            } else {
                mediaElement = `<img src="${
                    item.src
                }" class="d-block w-100 project-gallery-img" alt="${
                    item.alt || projectData.title
                }">`;
            }

            const carouselItem = $(`
                <div class="carousel-item">
                    <div class="project-image-wrapper">
                        ${mediaElement}
                        ${
                            item.description
                                ? `
                            <button class="btn-image-info" aria-label="Ver descripción">
                                <div class="icon-container">
                                    <i class="fa fa-info-circle"></i>
                                    <i class="fa fa-times"></i>
                                </div>
                            </button>
                            <div class="image-description-panel">
                                <p class="mb-0">${item.description}</p>
                            </div>
                        `
                                : ""
                        }
                    </div>
                </div>
            `);

            if (index === 0) {
                indicator.addClass("active");
                carouselItem.addClass("active");
            }

            carouselIndicators.append(indicator);
            carouselInner.append(carouselItem);
        });

        modal.find(".carousel").carousel(0);
    }

    // 4. ASIGNACIÓN DE EVENTOS (CON LÓGICA PARA PAUSAR VIDEO)
    // $(".project-gallery-trigger").on("click", function (e) {
    //     e.preventDefault();
    //     if ($(this).is(":disabled")) return;

    //     const projectId = $(this).data("project-id");
    //     _populateProjectModal(projectId);
    //     $("#projectGalleryModal").modal("show");
    // });

    // $("#projectGalleryCarousel").on("click", ".btn-image-info", function (e) {
    //     e.stopPropagation();
    //     const button = $(this);
    //     const panel = button.siblings(".image-description-panel");
    //     button.toggleClass("active");
    //     panel.toggleClass("is-visible");
    // });

    // $("#projectGalleryModal").on("hidden.bs.modal", function () {
    //     // Pausa todos los videos al cerrar el modal
    //     $(this)
    //         .find("video")
    //         .each(function () {
    //             this.pause();
    //         });
    //     // Resetea los paneles de info
    //     $(this).find(".btn-image-info").removeClass("active");
    //     $(this).find(".image-description-panel").removeClass("is-visible");
    // });

    // $("#projectGalleryCarousel").on("slide.bs.carousel", function (e) {
    //     // Pausa el video del slide que se está abandonando
    //     const previousSlide = $(this).find(".carousel-item").eq(e.from);
    //     let video = previousSlide.find("video");
    //     if (video.length > 0) {
    //         video[0].play();
    //     }

    //     // Resetea el panel de info
    //     $(this).find(".btn-image-info").removeClass("active");
    //     $(this).find(".image-description-panel").removeClass("is-visible");
    // });

    $(".project-gallery-trigger").on("click", function (e) {
        e.preventDefault();
        if ($(this).is(":disabled")) return;

        const projectId = $(this).data("project-id");
        _populateProjectModal(projectId);
        $("#projectGalleryModal").modal("show");
    });

    $("#projectGalleryCarousel").on("click", ".btn-image-info", function (e) {
        e.stopPropagation();
        const button = $(this);
        const panel = button.siblings(".image-description-panel");
        button.toggleClass("active");
        panel.toggleClass("is-visible");
    });

    // CORRECCIÓN: Evita que el clic en el video se propague al carrusel
    $("#projectGalleryCarousel").on("click", "video", function (e) {
        e.stopPropagation();
    });

    // --- INICIO: LÓGICA DE REPRODUCCIÓN AUTOMÁTICA MEJORADA ---

    // Evento que se dispara CUANDO EL MODAL SE HA MOSTRADO COMPLETAMENTE
    $("#projectGalleryModal").on("shown.bs.modal", function () {
        // Busca si el PRIMER slide (el activo) tiene un video y lo reproduce.
        const firstVideo = $(this).find(".carousel-item.active video");
        if (firstVideo.length > 0) {
            firstVideo[0]
                .play()
                .catch((error) =>
                    console.log(
                        "Autoplay fue bloqueado por el navegador. Se requiere interacción del usuario."
                    )
                );
        }

        // =================================================================
        //  INICIO: FORZAR SILENCIO PERMANENTE EN VIDEOS
        // =================================================================
        $(this)
            .find("video")
            .each(function () {
                const video = this;
                video.muted = true; // Asegura el estado inicial al mostrar el modal.

                // Elimina cualquier listener previo para evitar duplicados al reabrir el modal
                $(video).off("volumechange.enforceMute");

                // Añade un listener que fuerza el silencio si se intenta cambiar el volumen
                $(video).on("volumechange.enforceMute", function () {
                    if (!video.muted) {
                        video.muted = true;
                    }
                });
            });
        // =================================================================
        //  FIN: FORZAR SILENCIO PERMANENTE EN VIDEOS
        // =================================================================
    });

    // Evento que se dispara CUANDO EL MODAL SE CIERRA
    $("#projectGalleryModal").on("hidden.bs.modal", function () {
        // Pausa TODOS los videos al cerrar para limpiar el estado.
        $(this)
            .find("video")
            .each(function () {
                this.pause();
            });
        // Resetea los paneles de info
        $(this).find(".btn-image-info").removeClass("active");
        $(this).find(".image-description-panel").removeClass("is-visible");
    });

    // Evento que se dispara ANTES de que un slide cambie
    $("#projectGalleryCarousel").on("slide.bs.carousel", function (e) {
        // Pausa el video del slide que se está abandonando
        const previousSlide = $(this).find(".carousel-item").eq(e.from);
        const video = previousSlide.find("video");
        if (video.length > 0) {
            video[0].pause();
        }
    });

    // Evento que se dispara DESPUÉS de que un slide ha cambiado
    $("#projectGalleryCarousel").on("slid.bs.carousel", function (e) {
        // Reproduce el video del nuevo slide activo
        const currentSlide = $(this).find(".carousel-item").eq(e.to);
        const video = currentSlide.find("video");
        if (video.length > 0) {
            video[0]
                .play()
                .catch((error) =>
                    console.log("Autoplay fue bloqueado por el navegador.")
                );
        }
        // Resetea el panel de info del slide anterior
        $(this).find(".btn-image-info").removeClass("active");
        $(this).find(".image-description-panel").removeClass("is-visible");
    });

    // 5. EJECUCIÓN INICIAL
    _updateGalleryButtonsState();

    // Desactiva el autoplay del carrusel
    $("#projectGalleryCarousel").carousel({
        interval: false,
    });

    // =================================================================
    //  FIN: LÓGICA DE LA GALERÍA DE PROYECTOS
    // =================================================================

    // =====================================================================================
    // LIBRERÍA TERMINAL DE BIENVENIDA
    // =====================================================================================

    // Definimos un fallback de repositorios por si la API falla completamente
    const FALLBACK_REPOS = [
        {
            name: "jdsite",
            label: "jdsite                   · Python · [PRO] · Portafolio personal",
            url: "#",
        },
        {
            name: "rpa-zoho-api",
            label: "rpa-zoho-api             · Python · [PRO] · Integraciones con Zoho",
            url: "#",
        },
        {
            name: "tipsterbyte_fx",
            label: "tipsterbyte_fx           · Python · [P] · Stats futbol",
            url: "#",
        },
    ];

    if (window.loadGitHubData && window.JDWelcomeTerminal) {
        console.log("🔄 Cargando API de GitHub para la terminal...");
        // 1. Llama a la API de forma asíncrona
        window
            .loadGitHubData()
            .then((data) => {
                // 💡 Recibe el objeto { groups, counts }
                // Éxito: Inicializa con el objeto de datos
                JDWelcomeTerminal.init("#welcome-terminal", {
                    user: "jaimediaz",
                    host: "jd-vps-digitalocean",
                    path: "~/portfolio",
                    repos: data.groups, // <-- Pasamos el objeto agrupado
                    counts: data.counts, // <-- Pasamos el conteo
                });
            })
            .catch((error) => {
                // 3. Fallo: Inicializa con los repositorios de FALLBACK
                console.error(
                    "🔴 No se pudo cargar la API de GitHub para la terminal:",
                    error
                );
                JDWelcomeTerminal.init("#welcome-terminal", {
                    user: "jaimediaz",
                    host: "jd-vps-digitalocean",
                    path: "~/portfolio",
                    repos: FALLBACK_REPOS, // <-- DATOS DE FALLBACK
                });
            });
    } else if (window.JDWelcomeTerminal) {
        console.log(
            "⚠️ loadGitHubData no está disponible. Usando repositorios de FALLBACK para la terminal."
        );
        // Fallback si por alguna razón loadGitHubData no se cargó
        JDWelcomeTerminal.init("#welcome-terminal", {
            user: "jaimediaz",
            host: "jd-vps-digitalocean",
            path: "~/portfolio",
            repos: FALLBACK_REPOS,
        });
    }

    const dialog = document.getElementById("projectGalleryDialog");
    const bodyGrid = document.getElementById("projectDialogBody");
    const titleEl = document.getElementById("projectDialogTitle");
    const closeBtn = dialog?.querySelector(".jd-project-dialog__close");

    if (!dialog || !bodyGrid || !titleEl) return;

    // Abrir desde botones
    document.querySelectorAll(".project-gallery-trigger").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const title =
                btn.getAttribute("data-title") || "Capturas del proyecto";
            const imagesRaw = btn.getAttribute("data-images") || "";
            // Admite separador por pipes, comas o espacios
            const images = imagesRaw.split(/[|,]\s*|[\s]+/).filter(Boolean);

            // Limpia y renderiza
            bodyGrid.innerHTML = "";
            titleEl.textContent = title;
            if (!images.length) {
                bodyGrid.innerHTML =
                    "<p class='text-white-50'>Sin imágenes para mostrar.</p>";
            } else {
                images.forEach((src) => {
                    const img = document.createElement("img");
                    img.src = src;
                    img.alt = title;
                    bodyGrid.appendChild(img);
                });
            }

            // Muestra sin mover scroll del contenido principal
            dialog.showModal();
        });
    });

    // Cerrar
    closeBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        dialog.close();
    });

    // Cerrar con backdrop click (opcional)
    dialog.addEventListener("click", (e) => {
        const rect = dialog.getBoundingClientRect();
        const inDialog =
            e.clientX >= rect.left &&
            e.clientX <= rect.right &&
            e.clientY >= rect.top &&
            e.clientY <= rect.bottom;
        if (!inDialog) dialog.close();
    });
});
