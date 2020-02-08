$(function(){
    
    // Menu    
    $("#navigation-menu .navbar-toggler").on("click", function(){
        console.log("click")
        $(this).children().toggleClass("icon-close");
    });

    // items menu
    $("#navigation-menu .navbar-nav .nav-item .nav-link").on("click", function(){
        console.log("click")
        $("#navigation-menu .navbar-toggler span").removeClass("icon-close");
        $("#navigation-menu .navbar-collapse").collapse("hide");

    });

    // SWIPER
    var swiper = new Swiper('#headerSlider', {
        // params
        speed: 800,
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        },
        pagination: {
            el: '.swiper-pagination',
            type: 'bullets',
            clickable: true
        },
        loop: true,
        autoplay: {
            delay: 4000,
        },
        effect: 'fade',
        keyboard: {
            enabled: true,
            onlyInViewport: true
        }
    });

    // VENOBOX
    $(".btn-play").venobox({
        border: '5px',
        bgcolor: '#00adb5',
        autoplay: true,
        overlayClose: false,
        closeBackground: '#F6364F',
        closeColor: '#FFFFFF',
        titleColor: 'rgba(255,255,255,0.7)',
        titleattr: 'data-title'
    });

    // COUNTER
    $(".counter").counterUp();

    // PICKERS - DATE
    $('.datepicker').pickadate({
        monthsFull: [ 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre' ],
        monthsShort: [ 'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic' ],
        weekdaysFull: [ 'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado' ],
        weekdaysShort: [ 'dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb' ],
        today: 'Hoy',
        clear: 'Borrar',
        close: 'Cerrar',

        labelMonthNext: 'Siguiente mes',
        labelMonthPrev: 'Mes anterior',
        labelMonthSelect: 'Seleccione un mes',
        labelYearSelect: 'Seleccione un año',

        firstDay: 1,
        format: 'dddd, d !de mmmm !de yyyy',
        formatSubmit: 'yyyy/mm/dd',
        selectYears: true,
        selectMonths: true,
        min: true,
        max: 30,
        onStart: function(){
            var date = new Date();
            //this.setDate( date.getFullYear(), date.getMonth() + 1, date.getDate())
            this.set('select', [date.getFullYear(), date.getMonth(), date.getDate()])
        },
    });
    // Limits
    /*
    selectYears: 60
    */

   $('.timepicker').pickatime({
       clear: 'Borrar',
       format: 'hh:i a',
       interval: 60,
       min: [6,00],
   })

   /* 
   Time conf.
   inverval: 150 <= invervalo en minutos
   min: [8,00]
   max: [10,00]
   */
	
   $.trim($("#message").text());
   
   // VALIDATE
   $("#formContact").parsley({
       errorClass: "is-invalid text-danger",
       successClass: "is-valid",
       errorsWrapper: "<ul class='list-unstyled text-danger mb-0 pt-2 small'></ul>",
       errorsTemplate: "<li class='custom'></li>",
       trigger: "change",
       triggerAfterFailure: "change"
   });

   // STICKY
   $('#navigation-menu').stickit({
       className: 'stick-menu'
   });
   
   // SCROLL
   $("#navigation-menu .navbar-nav .nav-item .nav-link").mPageScroll2id({
       offset: 55,
       highlightClass: 'active',
   });




    // REQUEST API - REGISTER - CONTACT    
    var checkedHoraFechaJD = false;
    var promiseContactJd = $.ajax({
        url: 'https://memodevs.jaimediaz.dev/api/blogs',
        type: 'GET',
        dataType: 'json',
        data: {},
        success: function(response){
            console.log("MEMODEVS API: ", response)
        }
    });

    // SUBMIT FORM
    $("#formContact").submit(function(e){
        let URL_API = 'https://memodevs.jaimediaz.dev/api/landingPage/contact/message'
        e.preventDefault();        
        // Hacer petición ajax
        var formDataJD = new FormData($("#formContact")[0]);
        FormData.set('flagFechaHora', checkedHoraFechaJD);

        var promiseContactJd = $.ajax({
            url: URL_API,
            type: 'PSOT',
            cache: false,
            data: $('#formContact').serialize(),
            datatype: 'json',
            data: {},
            success: function(response){
                console.log("MEMODEVS API REGISTER: ", response);
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) { 
                alert("Status: " + textStatus); alert("Error: " + errorThrown); 
            }
        });        
    });

    $(".fechas-cita-content").fadeOut();

    $("#checkFechaHoraContact").on("change", function(){
        console.log("checked", this.checked);
        if(this.checked) {
            checkedHoraFechaJD = true;
            $(".fechas-cita-content").fadeIn();
        } else {
            checkedHoraFechaJD = false;
            $(".fechas-cita-content").fadeOut();
        }        
    });
    
});