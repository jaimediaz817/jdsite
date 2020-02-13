<!DOCTYPE html>
<html lang="es" class="html-jd">
    <head>
        <title>Jaime Díaz | Página personal</title>

        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, maximum-scale=1, minimum-scale=1">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">

        <!-- ICO  -->
        <!--<link rel="shortcut icon" type="image/png" href="images/favicon.png"/>-->
        <link rel="shortcut icon" type="image/png" href="images/jd_ico.png"/>

        <!-- BOOTSTRAP   LIB -->
        <link rel="stylesheet" href="css/bs/bootstrap.min.css">

        <!-- SWIPER      LIB -->
        <link rel="stylesheet" href="css/lib/swiper.min.css">

        <!-- FONTAWESOME CDN -->
        <!--<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.4.1/css/all.css" integrity="sha384-5sAR7xN1Nv6T6+dT2mhtzEpVJvfS3NScPQTrOxhwjIuvcA67KV2R5Jz6kr4abQsz" crossorigin="anonymous">-->

        <!-- FONTAWESOME LIB -->
        <link rel="stylesheet" href="css/fawesome/all.min.css">

        <!-- VENOBOX     LIB -->
        <link rel="stylesheet" href="css/lib/venobox.css" type="text/css" media="screen">

        <!-- JARALLAX    LIB -->
        <link rel="stylesheet" href="css/lib/jarallax.css" type="text/css" media="screen">

        <!-- PICKADATE   LIB -->
        <link rel="stylesheet" href="js/lib/pickadate/themes/default.css" type="text/css" media="screen">

        <!-- PICKADATE   LIB -->
        <!-- Date -->
        <link rel="stylesheet" href="js/lib/pickadate/themes/default.date.css" type="text/css" media="screen">
        <!-- Time -->
        <link rel="stylesheet" href="js/lib/pickadate/themes/default.time.css" type="text/css" media="screen">

        <!-- TOAST   LIB -->
        <link rel="stylesheet" href="css/lib/toast.css" type="text/css" media="screen">        

        <!-- CUSTOM  STYLES -->
        <link rel="stylesheet" href="css/styles.css">

        <style>
            .loader-background.hide {
                opacity: 0;
                transform: scale(0);
                z-index: -1; 
            }
            .loader-background.show {
                opacity: 1;
                transform: scale(1);     
                z-index: 998; 
            }            
            .loader-background {
                position: fixed;
                width: 100%;
                height: 100%;
                top: 0;
                left: 0;
                /* border: 4px solid red; */
                background: rgba(255,255,255,0.5);                            
                transform: 0.5s all ease-in;
            }
            .loader-component {
                position: absolute;
                left: 50%;
                top: 50%;           

            }

        </style>

    </head>

    <body class="home-p">

        <!-- CONTACT BAR-->
        <section id="contact-info" class="bg-primary text-white text-center py-3 py-lg-1">
            <div class="container">
                <div class="row justify-content-sm-between align-items-sm-center">

                    <div class="col-12 col-sm-auto">
                        <i class="fas fa-map-marker-alt mr-1"></i><span>Armenia, Quindío.</span>
                    </div>

                    <div class="col-12 col-sm-auto">
                        <ul class="social-network list-unstyled d-inline-flex mb-0">
                            <!-- Facebook -->
                            <li>
                                <a href="https://facebook.com/jdiaz.817" target="_blank">
                                    <i class="fab fa-facebook-f"></i>
                                </a>
                            </li>
                            <!-- Twitter -->
                            <li>
                                <a href="https://twitter.com/JDiaz0017" target="_blank">
                                    <i class="fab fa-twitter"></i>
                                </a>
                            </li>
                            <!-- Skype -->
                            <li>
                                <a href="skype:jdiaz.817?chat" target="_blank">
                                    <i class="fab fa-skype"></i>
                                </a>
                            </li>
                            <!-- CodePen -->
                            <li>
                                <a href="https://codepen.io/jdiaz0017" target="_blank">
                                    <i class="fab fa-codepen"></i>
                                </a>
                            </li>
                            <!-- PLunker -->
                            <li>
                                <a href="https://plnkr.co/users/jaimediaz817" target="_blank">
                                    <i class="fa fa-arrow-down"></i>
                                </a>
                            </li>
                            <!-- WhatsApp -->
                            <li>
                                <a href="https://wa.me/573207945514?text=Hola,%20quiero%20comunicarme%20contigo..." target="_blank">
                                    <i class="fab fa-whatsapp"></i>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>

        <!-- DETAILS HEADER CONTACT -->
        <section id="details-contact" class="bg-white d-none d-md-block py-3">
            <div class="container">
                <div class="row justify-content-md-between align-items-md-center">
                    <div class="col-auto">
                        <a href="javascript:;">
                            <img src="images/jd.svg" alt="Logo" width="80" class="img-fluid">
                        </a>
                    </div>

                    <div class="col-auto ml-md-auto">
                        <!-- Contac -->
                        <i class="fas fa-phone fa-flip-horizontal fa-2x align-middle text-primary"></i>
                        <span class="font-weight-bold h5 ml-1">+ 57 742 34 01</span>                        
                    </div>
                    <div class="col-auto">
                        <!-- Contac -->
                        <i class="fas fa-envelope fa-2x align-middle text-primary"></i>
                        <span class="font-weight-bold h5 ml-1">jaimeivan0017<span class="text-primary">@</span>gmail.com</span>
                    </div>
                </div>
            </div>
        </section>

        <!-- MENU NAV -->
        <nav id="navigation-menu" class="navbar navbar-dark bg-secundary-light-1 navbar-expand-md">
            <div class="container">

                <!-- Logo dark -->
                <a href="javascript:;" class="d-none d-md-block jd-white pr-4">
                    <img src="images/jd_white.svg" alt="Logo" width="40" class="img-fluid">
                </a>

                <button type="button" class="navbar-toggler" data-toggle="collapse" data-target="#main-menu" aria-expanded="false" aria-label="Menú principal">
                    <span class="icon-menu-custom"></span>
                </button>
                
                <!-- Link CTA -->
                <a href="#contact" class="btn lp btn-tertiary order-md-1">Contáctame o realiza una pregunta</a>

                <!-- Content -->
                <div class="collapse navbar-collapse" id="main-menu">
                    <ul class="navbar-nav mt-3 mt-md-0">
                        <li class="mb-1 mb-md-0 mr-md-1 nav-item"><a href="#contact-info" class="nav-link active">Inicio</a></li>
                        <li class="mb-1 mb-md-0 mr-md-1 nav-item"><a href="#welcome" class="nav-link">Bienvenido</a></li>
                        <li class="mb-1 mb-md-0 mr-md-1 nav-item"><a href="#numeric" class="nav-link">Mis números</a></li>
                        <li class="mb-1 mb-md-0 mr-md-1 nav-item"><a href="#costs" class="nav-link">Costos</a></li>
                        <li class="mb-1 mb-md-0 mr-md-0 nav-item"><a href="#contact" class="nav-link">Contacto</a></li>
                        <li class="mb-1 mb-md-0 mr-md-0 nav-item"><a href="#footer" class="nav-link">Soporte</a></li>
                    </ul>
                </div>
            </div>
        </nav>

        <!-- SLIDER #1 -->
        <div class="swiper-container" id="headerSlider">
            <div class="swiper-wrapper">

                <div class="swiper-slide d-flex justify-content-center align-items-center img image1">
                    <div class="container">
                        <div class="row justify-content-center">
                            <div class="col-9 col-sm-11 col-md-12">
                                <h2 class="display-4 display-md-4 font-weight-bold text-white">
                                    La calidad y transparencia como mejores aliados en cada proyecto.                                    
                                </h2>
                                <a href="javascript:;" class="btn lp btn-primary mt-4 mt-md-3">Cotíza ahora mismo</a>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="swiper-slide d-flex justify-content-center align-items-center img image2">
                    <div class="container">
                        <div class="row justify-content-center">
                            <div class="col-9 col-sm-11 col-md-12">
                                <h2 class="display-4 display-md-4 font-weight-bold text-white">
                                    Un entorno de trabajo óptimo para tener el mejor desempeño y los mejores resultados.
                                </h2>
                                <a href="javascript:;" class="btn lp btn-primary mt-4 mt-md-3">Ver tips</a>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- last images -->                
            </div>

            <!-- Pagination -->
            <div class="swiper-pagination"></div>

            <!-- Navigation-->
            <div class="swiper-button-prev"></div>
            <div class="swiper-button-next"></div>
        </div>

        <!-- WELCOME -->
        <section id="welcome" class="py-5 mb-md-5">
            <div class="container">
                <div class="row">

                    <div class="col-12 col-lg-6">
                        <div class="video-container position-relative">
                            <img src="images/slides/slide_code.jpg" alt="Imágen de bienvenida a mi Home page." class="img-fluid">

                            <a href="https://youtu.be/d6KleH5mLms" data-title="Vídeo sobre la Disciplina por Yokoy Kenjy" data-vbtype="video" data-autoplay="true" class="btn-play venobox venobox-action">
                                <i class="fas fa-play"></i>
                            </a>
                            
                        </div>
                    </div>

                    <div class="col-12 col-lg-6 pt-4 pt-lg-0 text-center text-lg-left">
                        <h2 class="txt-title display-4 font-weight-bold text-secundary mt-lg-n2">
                            Bienvenidos a mi <span class="text-primary">Home page.</span>
                        </h2>
                        <h6 class="text-black-50 mb-lg-3">"La disciplina vencerá la inteligencia"</h6>
                        <p>
                            El objetivo principal de mi web, es dar a conocer mis habilidades en el desarrollo web Frontend principalmente, mostrar de una manera resumida y organizada información relativa a mis habilidades, conocimientos, trabajos realizados y experiencia laboral.
                            En un entorno laboral, mi filosofía se rige bajo 3 conceptos trascendentales: "Planear, ejecutar y buscar los resultados", esto llevado de manera reiterativa.
                        </p>
                        <a href="javascript:;" class="btn lp btn-primary">Más información</a>
                    </div>

                </div>
            </div>
        </section>

        <!-- HOW CAN WE HELP YOU -->
        <section class="help-you d-flex align-items-center bg-secundary text-white jarallax" data-jarallax data-speed="0.7" id="howToHelp">

            <!-- PICTURE -->
            <picture class="jarallax-img">
                <source media="(min-width: 1200px)" srcset="images/sections/help_lg.jpg">
                <source media="(min-width: 768px)" srcset="images/sections/help_lg.jpg">
                <source media="(min-width: 480px)" srcset="images/sections/help_lg.jpg">
                <img src="images/sections/help_resp_sm.jpg" alt="Background mobile" class="w-100 img-fluid">
            </picture>

            <div class="container">
                <div class="row">
                    <div class="col-12 col-lg-6 py-5">
                        <h2 class="display-4 font-weight-bold txt-title">¿Cómo podemos ayudarte?</h2>
                        <p>
                            Saber exactamente qué quieres, es el primer paso para iniciar de la mejor manera un proyecto, el éxito se basa principalmente en el análisis y seguimiento del <span class="market">dominio del problema</span> en las etapas iniciales
                        </p>
                        <a href="javascript:;" class="btn lp btn-primary">Quiero comenzar un proyecto ahora mismo</a>
                    </div>
                </div>
            </div>
        </section>

        <!-- NUMERIC SECTION -->
        <section class="numeric py-5 text-center" id="numeric">
            <div class="container-fluid py-5">
                <h2 class="display-4 font-weight-bold text-secondary">UN POCO SOBRE MIS NÚMEROS</h2>
                <h6 class="text-black-50">TENGO ALGUNOS NÚMEROS QUE MOSTRARTE.</h6>

                <div class="row numbers_bg">
                    <div class="col-6 col-md-3 py-4 counter-container">
                        <i class="far fa-calendar-alt text-primary display-4 mb-2"></i>
                        <div class="font-weight-bold text-secondary display-4 h2">
                            <span class="counter" data-counterup-beginat="0" data-counterup-time="500">7</span>
                        </div>
                        <h6>Años de experiencia</h6>
                        <div class="counter-line"></div>
                    </div>
                    <div class="col-6 col-md-3 py-4 counter-container">
                        <i class="fas fa-briefcase text-primary display-4 mb-2"></i>
                        <div class="font-weight-bold text-secondary display-4 h2">
                            <span class="counter" data-counterup-beginat="0" data-counterup-time="1000">15120</span>
                        </div>
                        <h6>Horas de trabajo acumuladas</h6>
                        <div class="counter-line"></div>
                    </div>
                    <div class="col-6 col-md-3 py-4 counter-container">
                        <i class="fas fa-award text-primary display-4 mb-2"></i>
                        <div class="font-weight-bold text-secondary display-4 h2">
                            <span class="counter" data-counterup-beginat="0" data-counterup-time="1500">100</span><i class="symbol text-tertiary">%</i>
                        </div>
                        <h6>Nivel de calidad en los desarrollos</h6>
                        <div class="counter-line"></div>
                    </div>
                    <div class="col-6 col-md-3 py-4 counter-container">
                        <i class="fab fa-angellist text-primary display-4 mb-2"></i>
                        <div class="font-weight-bold text-secondary display-4 h2">
                        <span class="counter" data-counterup-beginat="0" data-counterup-time="2000">100</span><i class="symbol text-tertiary">%</i>
                        </div>
                        <h6>Nivel de satisfacción de los clientes</h6>
                        <div class="counter-line"></div>
                    </div>
                </div>

            </div>
        </section>

        <!-- COSTS -->
        <section id="costs" class="costs bg-secondary text-center text-md-left text-white jarallax" data-jarallax data-jarallax data-speed="0.95">

            <!-- PICTURE -->
            <picture class="jarallax-img">
                <source media="(min-width: 768px)" srcset="images/sections/costs_lg.jpg">
                <img srcset="images/sections/costs_xs.jpg" alt="Background mobile" class="w-100 img-fluid">
            </picture>

            <div class="container">
                <div class="row justify-content-md-end">
                    <div class="col-12 col-md-8 py-5 font-weight-bold">
                        <h2 class="">PRÓXIMAMENTE PODRÁS DISPONER DE UNA CALCULADORA PARA DETERMINAR LOS COSTOS DE TU PROYECTO</h2>
                        <h6 class="text-white-50 my-2">QUEREMOS SER PARTE DE TÍ</h6>
                        <p>Estamos trabajando arduamente para facilitarte las herramientas necesarias con el fin de acercarnos a tus requerimientos, de manera transparente podrás saber cuánto tiempo llevará un desarrollo en semanas, días o meses, y calcular el coste.</p>
                        <a href="javascript:;" class="btn lp btn-primary my-3">Conóce más sobre la metodología</a>
                    </div>
                </div>
            </div>
        </section>


        <!-- CONTACT SECTION -->
        <section id="contact" class="contact">
            <header class="py-5 bg-primary text-white text-center position-relative">
                <h2 class="display-4 font-weight-bold">CONTÁCTANOS</h2>
                <h6 class="text-white-50">ESTAMOS LISTOS PARA ATENDERTE</h6>
                <div class="addon"></div>
            </header>

            <div class="container">
                <div class="row pt-4">

                    <!-- CONTACT -->
                    <div class="col-12 col-lg-6 contact-container">
                        <!-- text-md-left -->
                        <h2 class="font-weight-bold text-center mb-4">Detalles de contacto:</h2>
                        <ul class="list-unstyled">

                            <li class="d-flex py-3">
                                <i class="fas fa-globe fa-3x text-primary mr-4 fa-fw social-icon"></i>
                                <div>
                                    <h5 class="font-weight-bold">Dirección</h5>
                                    <p class="mb-0 text-light">Mercedes del Norte, Mzn 17 - Armenia / Quindío</p>
                                </div>
                            </li>
                            <li class="d-flex py-3">
                                <i class="fas fa-mobile-alt fa-3x text-primary mr-4 fa-fw social-icon"></i>
                                <div>
                                    <h5 class="font-weight-bold">Teléfonos</h5>
                                    <p class="mb-0">
                                        <span class="indicativo">(+57) </span><span class="number">320 794 55 14</span>,
                                        <span class="indicativo"> (+57) </span><span class="number">7 42 34 01</span>
                                    </p>
                                </div>
                            </li>
                            <li class="d-flex py-3">
                                <i class="fas fa-envelope-open fa-3x text-primary mr-4 fa-fw social-icon"></i>
                                <div>
                                    <h5 class="font-weight-bold">Emails:</h5>
                                    <p class="mb-1">
                                        <span class="mail">jaimeivan0017<span class="text-primary">@</span>gmail.com</span>
                                    </p>
                                    <p class="mb-0">
                                        <span class="mail">jdsolutions817<span class="text-primary">@</span>gmail.com</span>
                                    </p>
                                </div>
                            </li>

                            <li class="d-inline-flex py-3 w-45">
                                <i class="fab fa-skype fa-3x text-primary mr-4 fa-fw social-icon"></i>
                                <div>
                                    <h5 class="font-weight-bold">Skype</h5>
                                    <p class="mb-0">jdiaz.817</p>
                                </div>
                            </li>

                            <li class="d-inline-flex py-3 w-45 sec">
                                <i class="fab fa-linkedin fa-3x text-primary mr-4 fa-fw social-icon"></i>
                                <div>
                                    <h5 class="font-weight-bold">LinkedIn</h5>
                                    <p class="mb-0">
                                        <a href="https://www.linkedin.com/in/jdiaz817" target="_blank">Ver perfil</a>
                                    </p>
                                </div>
                            </li>

                            <li class="d-flex py-3 repo-container">
                                <i class="fas fa-code-branch fa-3x text-primary mr-4 fa-fw social-icon"></i>
                                <div>
                                    <h5 class="font-weight-bold">Repositorios:</h5>
                                    <div class="mb-0 row align-items-center">
                                        <div class="col-12 d-flex justify-content-between mb-3 repos">
                                            <a href="https://github.com/jivan0017" target="_blank" class="d-inline-flex">
                                                <i class="fab mr-2 text-tertiary fa-fw fa-github repo-ico"></i> <span class="text-repo">jivan0017</span>
                                            </a>
                                            <a href="https://github.com/jaimediaz817" target="_blank" class="d-inline-flex">
                                                <i class="fab mr-2 text-tertiary fa-fw fa-github repo-ico"></i> <span class="text-repo">jaimediaz.817</span>
                                            </a>
                                        </div>
                                        <div class="col-12 d-flex justify-content-between repos">
                                            <a href="https://gitlab.com/jdiaz.817" target="_blank" class="d-inline-flex">
                                                <i class="fab mr-2 text-tertiary fa-fw fa-gitlab repo-ico"></i> <span class="text-repo">@jdiaz.817</span>
                                            </a>
                                            <a href="https://bitbucket.org/jdiaz0017/" target="_blank" class="d-inline-flex">
                                                <i class="fab mr-2 text-tertiary fa-fw fa-bitbucket repo-ico"></i> <span class="text-repo">jdiaz0017</span>
                                            </a>
                                        </div>
                                    </div>                                    
                                </div>
                            </li>
                            
                        </ul>
                    </div>

                    <!-- FORM -->
                    <div class="col-12 col-lg-6 form-container">
                        <h2 class="display-4 font-weight-bold"></h2>
                        <!-- text-md-left -->
                        <h2 class="font-weight-bold text-center mb-4 text-secondary mb-4">Separa una cita y pongámonos en contacto o plantea una pregunta:</h2>
                        
                        <!--data-parsley-validate-->
                        <form id="formContact">

                            <!-- Nombres -->
                            <div class="form-group form-row">
                                <label for="names" class="col-12 col-md-3 text-primary">Nombres:</label>
                                <div class="col-12 col-md-9">
                                    <input type="text" class="form-control" name="names" id="names" placeholder="Ingrese sus nombres o su nombre..."
                                        data-parsley-required
                                        data-parsley-error-message="Este campo no pasó el proceso de validación"
                                    >
                                </div>
                            </div>


                            <!-- Email -->
                            <div class="form-group form-row">
                                <label for="email" class="col-12 col-md-3 text-primary">Email:</label>
                                <div class="col-12 col-md-9">
                                    <input type="email" class="form-control" name="email" id="email" placeholder="Ingrese correo electrónico..."
                                        data-parsley-required
                                        data-parsley-type="email"
                                        data-parsley-required-message="Este campo no puede estar vacío"
                                        data-parsley-type-message="Ingrese un email con un formato válido"
                                    >
                                </div>
                            </div>

                            <!-- Número -->
                            <div class="form-group form-row">
                                <label for="number" class="col-12 col-md-3 lbl-number text-primary">Número de celular (opcional):</label>
                                <div class="col-12 col-md-9">
                                    <input type="text" class="form-control" name="number" id="number" placeholder="Ingrese su número de celular..."                                        
                                        data-parsley-length="[5, 20]"
                                        data-parsley-required-message="Este campo no puede estar vacío"
                                        data-parsley-length-message="El número telefónico debe tener entre 5 y 20 números regularmente"
                                    >
                                </div>
                            </div>

                            <!-- Mensaje -->
                            <div class="form-group form-row">
                                <label for="message" class="col-12 col-md-3 text-primary">Mensaje: <span class="text-muted">(cuéntame lo que piensas o plantea una pregunta)</span></label>
                                <div class="col-12 col-md-9">
                                    <textarea rows="4" class="text-left form-control" name="message" id="message" placeholder="Escriba su mensaje..."
                                        value=""
                                        data-parsley-required
                                        data-parsley-required-message="Este campo no puede estar vacío">
                                    </textarea>
                                </div>
                            </div>
                            <span class="addon-form"></span>

                            <!-- CONTROL NUEVO - habilitar deshabilitar selección de fecha y hora -->
                            <div class="form-group d-flex justify-content-between mb-2">
                                <p class="card-text text-left text-muted mb-0">No deseo/ Deseo especificar fecha y hora de la cita/reunión</p>
                                <label class="switch mb-0">
                                    <input type="hidden" id="hiddenCheckDates" name="hiddenCheckDates" class="hiddenCheckDates" value="false"/>
                                    <input type="checkbox" id="checkFechaHoraContact">
                                    <span class="slider round"></span>
                                </label>                                
                            </div>

                            <!-- Fecha cita -->
                            <div class="form-group form-row fechas-cita-content">
                                <label for="date" class="col-12 col-md-3 text-primary">Fecha de la cita:</label>
                                <div class="col-12 col-md-9">
                                    <div class="input-group">
                                        <input type="date" name="date" id="date" class="form-control datepicker"
                                            data-parsley-required-message="Este campo no puede estar vacío"                                        
                                        >
                                        <label for="date" class="input-group-append input-group-cita">
                                            <span class="input-group-text">
                                                <i class="far fa-calendar-alt"></i>
                                            </span>
                                        </label>
                                    </div>
                                </div>                                
                            </div>

                            <!-- Hora cita -->
                            <div class="form-group form-row fechas-cita-content">
                                <label for="time" class="col-12 col-md-3 text-primary">Hora de la cita:</label>
                                <div class="col-12 col-md-9">
                                    <div class="input-group">
                                        <input type="text" name="time" id="time" class="form-control timepicker"                                             
                                            data-parsley-required-message="Este campo no puede estar vacío"
                                            data-parsley-errors-container=".error-dia-cita"
                                            >
                                        <label for="time" class="input-group-append input-group-cita">
                                            <span class="input-group-text">
                                                <i class="far fa-clock"></i>
                                            </span>
                                        </label>
                                    </div>
                                    <div class="error-dia-cita"></div>
                                </div>
                            </div>

                            <div class="form-group form-row">
                                <div class="col-12 col-md-9 offset-md-3">
                                    <button type="submit" class="btn btn-tertiary lp btn-block mt-2">Registrar cita / plantear pregunta</button>
                                </div>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </section>

        <!-- FOOTER -->
        <footer id="footer" class="bg-dark text-white-light text-truncate">
            <div class="container">
                <div class="row align-items-center">

                    <div class="col-12 col-md-6 col-xl-5 py-2 diagonal">
                        <div class="row">
                            <div class="col-12">
                                <h2 class="text-white font-weight-bold">Soporte</h2>
                            </div>
                            <div class="col-auto text-black-50">
                                <i class="fas fa-laptop fa-4x"></i>
                            </div>
                            <div class="col-auto text-black-50 mt-3">
                                <h3>(+ 57) 320 794 55 14</h3>
                                <p>El servicio de contacto está disponible 24h/7</p>
                            </div>
                        </div>
                    </div>

                    <div class="col-12 col-md-6 col-xl-7 py-2 text-center text-md-right info">
                        <ul class="list-unstyled d-inline-flex text-uppercase small">
                            <li>
                                <a href="javascript:;">Inicio</a>
                            </li>
                            <li>
                                <a href="javascript:;">Nosotros</a>
                            </li>
                            <li>
                                <a href="javascript:;">Politicas de privacidad</a>
                            </li>
                        </ul>
                        <p class="small">©<?php echo(date("Y")); ?>. Todos los derechos reservados. Trilogic</p>
                    </div>
                </div>
            </div>
        </footer>


        <!-- Loader -->
        <div class="loader-background hide">
            <div class="spinner-border text-danger loader-component" role="status">
                <span class="sr-only">Loading...</span>
            </div>
        </div>


        <!-- *********************************************************************** -->
        <!-- JQUERY    LIB -->
        <script src="js/jquery-plugins/jquery-3.2.1.min.js"></script>

        <!-- POPPER    CDN -->
        <!--https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js-->

        <!-- POPPER    LIB -->
        <script src="js/jquery-plugins/popper.min.js"></script>

        <!-- BOOTSTRAP LIB -->
        <script src="js/bs/bootstrap.min.js"></script>

        <!-- SWIPER    LIB -->
        <script src="js/lib/swiper.min.js"></script>

        <!-- VENOBOX   LIB -->
        <script src="js/lib/venobox.min.js"></script>

        <!-- JARALLAX  LIB -->
        <script src="js/lib/jarallax.min.js"></script>

        <!-- WAY POINTS LIB -->
        <script src="js/jquery-plugins/jquery.waypoints.min.js"></script>

        <!-- COUNTERUP  LIB -->
        <script src="js/jquery-plugins/jquery.counterup.min.js"></script>

        <!-- PICKADATE   LIB | Crea selector de fecha y hora -->
        <script src="js/lib/pickadate/picker.js"></script>
        <!-- Fecha -->
        <script src="js/lib/pickadate/picker.date.js"></script>
        <!-- hora -->
        <script src="js/lib/pickadate/picker.time.js"></script>

        <!-- Validaciónes -->
        <script src="js/lib/parsley.min.js"></script>
        <script src="js/lib/parsley.es.js"></script>

        <!-- Slider sticky -->
        <script src="js/jquery-plugins/jquery.stickit.min.js"></script>
        
        <!-- Slider scroll -->
        <script src="js/jquery-plugins/jquery.malihu.PageScroll2id.min.js"></script>
        
        <!-- Crea clases para identificar dispositivos -->
        <script src="js/lib/css_browser_selector.js"></script>

        <!-- TOAST -->
        <script src="js/lib/toast.js"></script>        

        <!-- CUSTOM   PATH ******************* -->
        <script src="js/jdController.js"></script>
    </body>
</html>