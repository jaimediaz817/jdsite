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
            el: ".projects-pagination",
            clickable: true,
        },
        navigation: {
            nextEl: ".projects-next",
            prevEl: ".projects-prev",
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
    $(".project-card .btn").on("click", function () {
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

    function setupProjectGallery() {
        $(".project-gallery-trigger").each(function () {
            var $btn = $(this);
            var imagesStr = $btn.data("images");

            if (!imagesStr) {
                $btn.addClass("disabled project-gallery-disabled")
                    .attr("disabled", true)
                    .attr("title", "Sin capturas disponibles");
                return;
            }

            $btn.on("click", function (e) {
                // 👉 Esto evita que el anchor salte al id del modal
                e.preventDefault();

                var title = $btn.data("title") || "Capturas del proyecto";
                var images = String(imagesStr).split("|").filter(Boolean);

                if (!images.length) return;

                var $modal = $("#projectGalleryModal");
                var $carousel = $("#projectGalleryCarousel");
                var $indicators = $carousel
                    .find(".carousel-indicators")
                    .empty();
                var $inner = $carousel.find(".carousel-inner").empty();

                images.forEach(function (src, index) {
                    var activeClass = index === 0 ? "active" : "";

                    $indicators.append(
                        '<li data-target="#projectGalleryCarousel" data-slide-to="' +
                            index +
                            '" class="' +
                            activeClass +
                            '"></li>'
                    );

                    $inner.append(
                        '<div class="carousel-item ' +
                            activeClass +
                            '">' +
                            '<img src="' +
                            src +
                            '" class="d-block w-100 project-gallery-img" alt="' +
                            title +
                            " – captura " +
                            (index + 1) +
                            '">' +
                            "</div>"
                    );
                });

                $("#projectGalleryTitle").text(title);
                $modal.modal("show");
            });
        });
    }

    $(setupProjectGallery);

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
});
