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

















    // .......................................................................
    // $.toast({
    //     heading: 'Information',
    //     text: 'Loaders are enabled by default. Use `loader`, `loaderBg` to change the default behavior',
    //     icon: 'error',
    //     showHideTransition: 'fade',
    //     //hideAfter : false,
    //     hideAfter: 6000,
    //     loader: true,        // Change it to false to disable loader
    //     loaderBg: '#F6364F'  // To change the background
    // });
    ToastMessage("¡Nueva funcionalidad!", "Ya puedes plantear preguntas, comentarios o lo que quieras contarme en la sección de registro. Saludos.", '¡Nueva funcionalidad!', 10000);
    /*
    $.toast({
        text: "Don't forget to star the repository if you like it.", // Text that is to be shown in the toast
        heading: 'Note', // Optional heading to be shown on the toast
        showHideTransition: 'fade', // fade, slide or plain
        allowToastClose: true, // Boolean value true or false
        hideAfter: 3000, // false to make it sticky or number representing the miliseconds as time after which toast needs to be hidden
        stack: 5, // false if there should be only one toast at a time or a number representing the maximum number of toasts to be shown at a time
        position: 'bottom-left', // bottom-left or bottom-right or bottom-center or top-left or top-right or top-center or mid-center or an object representing the left, right, top, bottom values
        
        bgColor: '#444444',  // Background color of the toast
        textColor: '#eeeeee',  // Text color of the toast
        textAlign: 'left',  // Text alignment i.e. left, right or center
        beforeShow: function () {}, // will be triggered before the toast is shown
        afterShown: function () {}, // will be triggered after the toat has been shown
        beforeHide: function () {}, // will be triggered before the toast gets hidden
        afterHidden: function () {}  // will be triggered after the toast has been hidden
    });
    */    


    // REQUEST API - REGISTER - CONTACT    
    console.log("location >>>>>>>>>>>>>>>> ", location.host)
    var promiseContactJd = $.ajax({
        url: 'https://memodevs.jaimediaz.dev/api/blogs',
        type: 'GET',
        dataType: 'json',
        data: {},
        success: function(response){
            console.log("MEMODEVS API: ", response)
        }
    });

    // asignar el text area en blanco por defecto
    $("#message").val("")

    // SUBMIT FORM
    $("#formContact").submit(function(e){
        let URL_API_DEV = 'http://localhost:8001/api/landingPage/contact/message'
        let URL_API_PROD = 'https://memodevs.jaimediaz.dev/api/landingPage/contact/message'
        let API_LOCATION = location.host == "localhost" ? URL_API_DEV : URL_API_PROD;
        e.preventDefault();        
        $(".loader-background").removeClass("hide").addClass("show");
        var promiseContactJd = $.ajax({
            //processData:false,
            //async : false,            
            //contentType: "application/json; charset=utf-8",
            url: API_LOCATION,
            type: 'POST',
            cache: false,            
            data: $('#formContact').serialize(),            
            datatype: 'jsonp',
            success: function(response){
                console.log("MEMODEVS API REGISTER: ", response);
                $("input, textArea").removeClass("is-valid").val("");
                $(".loader-background").removeClass("show").addClass("hide");
                // TOAST success
                ToastMessage(response.success, 'success');                                
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) { 
                let errorResponse = XMLHttpRequest.responseJSON.error;
                $(".loader-background").removeClass("show").addClass("hide");
                console.log("error : >>> ", XMLHttpRequest.responseJSON.error)
                ToastMessage(XMLHttpRequest.responseJSON.error, 'error');
            }
        });
    });

    // Por defecto ocultar las fechas
    $(".fechas-cita-content").fadeOut();
    $("#checkFechaHoraContact").on("change", function(){
        console.log("checked", this.checked);
        if(this.checked) {
            $("#hiddenCheckDates").val(true)
            $(".fechas-cita-content").fadeIn();
        } else {
            $("#hiddenCheckDates").val(false)
            $(".fechas-cita-content").fadeOut();
        }        
    });


    function ToastMessage(headerMess = "", messageContent, typeMessage, timeShowMessage = 5000){
        let iconMessage = '';
        let headerMessage = 'Resultado de la operación:';
        if(typeMessage == 'error') {
            iconMessage = "error";
            headerMessage = 'Algo ocurió durante el proceso'
        } else {
            headerMessage = "Success"
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
            showHideTransition: 'plain',
            //hideAfter : false,
            hideAfter: timeShowMessage,
            loader: true,        // Change it to false to disable loader
            loaderBg: '#F6364F'  // To change the background
        });
    }

    

    if (urlParam('email') !== null && urlParam('names')) {
        let emailParam = urlParam('email').trim();
        let namesParam = urlParam('names').trim().replace(/\+/g, ' ').replace(/\./g, '').replace('/', ' ')
        $("#names").val(namesParam)
        $("#email").val(emailParam)
    } else {
        
    }

     function urlParam (name){
        var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
        if (results==null) {
           return null;
        }
        return decodeURI(results[1]) || 0;
    }    
});