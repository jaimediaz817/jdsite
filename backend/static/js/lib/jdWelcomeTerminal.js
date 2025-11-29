// jdWelcomeTerminal.js
// Componente de terminal animada para la sección Welcome

(function (global) {
    "use strict";

    function escapeHtml(str) {
        return (
            String(str)
                // .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;")
        );
    }

    function getElement(selOrEl) {
        if (!selOrEl) return null;
        if (selOrEl instanceof Element) return selOrEl;
        return document.querySelector(selOrEl);
    }

    // Construye el “guion” de líneas que se van a escribir
    function buildScriptLines(options) {
        const user = options.user || "jaimediaz";
        const host = options.host || "ubuntu-server";
        const path = options.path || "~/welcome/terminal";
        // const repos = options.repos || []; // <--- Esta variable ya no se usa directamente
        const reposGroups = options.repos || {}; // 💡 Ahora es un diccionario (grupos)
        const counts = options.counts || {}; // 💡 Nuevo: conteos

        const lines = [
            { text: `${user}@${host}:~$ whoami`, prompt: true },
            { text: "Jaime Iván Díaz Gaona", prompt: false },

            { text: `${user}@${host}:~$ cat about_me.txt`, prompt: true },
            {
                text: "Full-Stack JS/Python · Integraciones de negocio · Zoho CRM/Deluge",
                prompt: false,
            },
            {
                text: "Angular · React · FastAPI · Django · Nginx · Docker · AWS · DigitalOcean",
                prompt: false,
            },

            { text: `${user}@${host}:~$ cd ${path}`, prompt: true },
            { text: `${user}@${host}:${path}$ ls skills`, prompt: true },
            {
                text: "frontend/ backend/ data/ devops/ integraciones/",
                prompt: false,
            },
            {
                text: `${user}@${host}:~$ ls -F --all github_projects/`,
                prompt: true,
            },
            { text: "Listando Proyectos por Propietario...", prompt: false },
            { text: "", prompt: false },
            { text: "Conectando con api.github.com ✓", prompt: false },
        ];

        // ----------------------------------------------------
        // LÓGICA DE AGRUPACIÓN POR CUENTA DE GITHUB (CORREGIDA Y OPTIMIZADA)
        // ----------------------------------------------------
        const githubUsernames = Object.keys(reposGroups);

        if (githubUsernames.length > 0) {
            githubUsernames.forEach((username, userIdx) => {
                const repoList = reposGroups[username] || [];
                const totalRepos = counts[username] || 0;
                const isLastUser = userIdx === githubUsernames.length - 1;

                // Prefijo del título de usuario (nivel 1)
                const userPrefix = isLastUser ? "└── " : "├── ";

                lines.push({
                    text: `[USUARIO: ${username} | REPOS: ${repoList.length} de ${totalRepos}]`,
                    visual_prefix: userPrefix,
                    prompt: false,
                });

                if (repoList.length > 0) {
                    repoList.forEach((repo, repoIdx) => {
                        const isLastRepo = repoIdx === repoList.length - 1;

                        let visualPrefix = "";

                        if (isLastUser) {
                            // Último Usuario/Grupo
                            if (isLastRepo) {
                                // 🔑 Último Repo del ÚLTIMO Usuario
                                visualPrefix = "  └── "; // 2 espacios, └──, 1 espacio
                            } else {
                                // 🔑 Repo Intermedio del ÚLTIMO Usuario
                                visualPrefix = "  ├── "; // 2 espacios, ├──, 1 espacio
                            }
                        } else {
                            // Usuario/Grupo Intermedio
                            if (isLastRepo) {
                                // 🔑 Último Repo del Usuario Intermedio
                                visualPrefix = "│ └── "; // Pipe, 1 espacio, └──, 1 espacio
                            } else {
                                // 🔑 Repo Intermedio del Usuario Intermedio (CASO QUE FALLABA VISUALMENTE)
                                visualPrefix = "│ ├── "; // Pipe, 1 espacio, ├──, 1 espacio
                            }
                        }

                        lines.push({
                            text: repo.label,
                            visual_prefix: visualPrefix,
                            prompt: false,
                            url: repo.html_url,
                        });
                    });

                    // Solo añadir el separador vertical '│' si NO es el último usuario/grupo
                    if (!isLastUser) {
                        // Añade un separador vertical alineado con la rama
                        lines.push({
                            text: "│",
                            prompt: false,
                            visual_prefix: "   ",
                        });
                    }
                } else {
                    // Lógica para cuando no hay repositorios
                    const noReposText =
                        "No hay repositorios destacados o públicos.";
                    if (!isLastUser) {
                        lines.push({
                            text: "│   └── " + noReposText,
                            prompt: false,
                        });
                        lines.push({
                            text: "│",
                            prompt: false,
                            visual_prefix: "   ",
                        });
                    } else {
                        lines.push({
                            text: "└── " + noReposText,
                            prompt: false,
                        });
                    }
                }
            });
        } else {
            lines.push({
                text: "└── No se encontraron proyectos de GitHub.",
                prompt: false,
            });
        }

        // 🚨 ELIMINADO: Bloque de código comentado antiguo que usaba 'link'

        lines.push({
            text: `${user}@${host}:${path}$ echo "Listo para el siguiente reto 🚀"`,
            prompt: true,
        });

        lines.push({
            text: `${user}@${host}:${path}$ # la terminal se reiniciará...`,
            prompt: false,
            pauseAfter: 2200,
        });

        return lines;
    }

    function init(selectorOrElement, options) {
        const wrapper = getElement(selectorOrElement || "#welcome-terminal");
        if (!wrapper) return;

        const body = wrapper.querySelector(".jd-terminal-body");
        if (!body) return;

        const btnClose = wrapper.querySelector(".jd-term-btn-close");
        const btnMin = wrapper.querySelector(".jd-term-btn-min");
        const btnMax = wrapper.querySelector(".jd-term-btn-max");

        const cfg = Object.assign(
            {
                typingSpeed: 22, // ms por carácter
                linePause: 650, // pausa entre líneas
                loopPause: 1600, // pausa antes de repetir
            },
            options || {}
        );

        const scriptLines = buildScriptLines(cfg);
        let isStopped = false;

        // 🔑 CORRECCIÓN CLAVE: DECLARACIÓN DE VARIABLES DE ESTADO EN EL ALCANCE DE INIT
        let isPaused = false;
        let typingTimeout = null;
        let currentDoneFunction = null;
        let currentTickFunction = null;
        let isWaitingForDelay = false;

        // 💡 FUNCIÓN PARA PAUSAR/REANUDAR
        function togglePause() {
            isPaused = !isPaused;
            wrapper.classList.toggle("jd-terminal-paused", isPaused);

            if (!isPaused) {
                // REANUDAR
                if (currentTickFunction) {
                    currentTickFunction(); // Reanuda el tipeo
                } else if (isWaitingForDelay) {
                    // Reanudar pausa entre líneas
                    clearTimeout(typingTimeout);
                    isWaitingForDelay = false;
                    if (currentDoneFunction) {
                        currentDoneFunction();
                    }
                } else {
                    // Si estaba en la pausa del loop final, reinicia el script.
                    runScript();
                }
            }
        }

        function typeLine(line, done) {
            if (isStopped) return;
            const lineEl = document.createElement("div");
            lineEl.className = "jd-terminal-line";

            let prefixHtml = "";
            if (line.prompt) {
                prefixHtml = '<span class="jd-term-prompt">❯</span> ';
            }

            // Inicializar variables de estado de línea
            currentDoneFunction = done;
            currentTickFunction = null;
            isWaitingForDelay = false;

            body.appendChild(lineEl);

            const txt = line.text;
            let i = 0;

            function tick() {
                if (isStopped) return;

                if (isPaused) {
                    currentTickFunction = tick;

                    // 🔑 PAUSA: Usamos el cursor BLOCK (▌) pero con la clase BLINKING
                    const visibleText = escapeHtml(txt.slice(0, i));
                    const currentPrefix =
                        prefixHtml + (line.visual_prefix || "");

                    lineEl.innerHTML =
                        currentPrefix +
                        visibleText +
                        '<span class="jd-term-caret jd-term-caret-blinking">▌</span>'; // Usamos ▌ con blinking

                    return;
                }

                currentTickFunction = tick; // Guarda la referencia para reanudar

                const visibleText = escapeHtml(txt.slice(0, i));
                const currentPrefix = prefixHtml + (line.visual_prefix || "");

                // TIEMPO NORMAL: Usamos el cursor BLOCK (▌) sin blinking
                lineEl.innerHTML =
                    currentPrefix +
                    visibleText +
                    '<span class="jd-term-caret">▌</span>';

                body.scrollTop = body.scrollHeight;

                if (i < txt.length) {
                    i++;
                    typingTimeout = setTimeout(tick, cfg.typingSpeed);
                } else {
                    // línea completada: ESTE BLOQUE DEBE ELIMINAR EL CURSOR
                    currentTickFunction = null;

                    // 🔑 CAMBIO CLAVE: Usamos 'txt' directamente (permite el HTML del <span>)
                    let content = txt; // <-- Asegúrate de que NO tenga escapeHtml
                    let prefix = line.visual_prefix || "";

                    // Lógica de Link
                    if (line.url) {
                        content =
                            '<a href="' +
                            escapeHtml(line.url) +
                            '" target="_blank" rel="noopener noreferrer" class="jd-terminal-link">' +
                            content +
                            "</a>";
                    }

                    // 🔑 FINALIZACIÓN DE LÍNEA: lineEl.innerHTML = finalHtml
                    const finalHtml = prefixHtml + prefix + content;
                    lineEl.innerHTML = finalHtml; // <-- ESTO ELIMINA EL CURSOR DE LA LÍNEA
                    body.scrollTop = body.scrollHeight;

                    // AÑADIR CURSOR DE PAUSA ENTRE LÍNEAS (si aplica)
                    isWaitingForDelay = true;

                    if (line.pauseAfter || cfg.linePause) {
                        const cursorDiv = document.createElement("div");
                        cursorDiv.className =
                            "jd-terminal-line jd-term-pause-cursor";
                        // Usamos ▌ con blinking para el cursor de PAUSA
                        cursorDiv.innerHTML =
                            '<span class="jd-term-caret jd-term-caret-blinking">▌</span>';
                        body.appendChild(cursorDiv);
                        body.scrollTop = body.scrollHeight;
                    }

                    function pauseableDelay() {
                        if (isStopped) return;

                        if (isPaused) {
                            // Si está pausado, chequea de nuevo en 100ms (y el cursor titilante ya está visible)
                            typingTimeout = setTimeout(pauseableDelay, 100);
                            return;
                        }

                        // Flujo normal / Reanudado
                        isWaitingForDelay = false;
                        currentDoneFunction = null;

                        // Eliminar el cursor temporal antes de avanzar
                        const lastChild = body.lastElementChild;
                        if (
                            lastChild &&
                            lastChild.classList.contains("jd-term-pause-cursor")
                        ) {
                            body.removeChild(lastChild);
                        }

                        done(); // Llama a la siguiente línea
                    }

                    typingTimeout = setTimeout(
                        pauseableDelay,
                        line.pauseAfter || cfg.linePause
                    );
                }
            }

            tick();
        }

        function runScript() {
            if (isStopped) return;
            body.innerHTML = "";
            body.scrollTop = 0;

            let index = 0;

            function next() {
                if (isStopped) return;

                if (index >= scriptLines.length) {
                    setTimeout(function () {
                        if (!isStopped) {
                            runScript();
                        }
                    }, cfg.loopPause);
                    return;
                }

                const line = scriptLines[index++];
                typeLine(line, next);
            }

            next();
        }

        // Botones
        if (btnClose) {
            btnClose.addEventListener("click", function () {
                // reset suave: limpiamos y reiniciamos
                isStopped = true;
                body.innerHTML = "";
                body.scrollTop = 0;
                // pequeño delay para evitar solapamiento con timeouts previos
                setTimeout(function () {
                    isStopped = false;
                    runScript();
                }, 80);
            });
        }

        if (btnMin) {
            btnMin.addEventListener("click", function () {
                wrapper.classList.remove("jd-terminal-max");
                wrapper.classList.toggle("jd-terminal-minimized");
            });
        }

        if (btnMax) {
            btnMax.addEventListener("click", function () {
                wrapper.classList.remove("jd-terminal-minimized");
                wrapper.classList.toggle("jd-terminal-max");
            });
        }

        // Primera ejecución
        isStopped = false;
        runScript();
    }

    global.JDWelcomeTerminal = {
        init: init,
    };
})(window);
