/*
Función de actualización de lista QR
HU-029: Sistema de Códigos QR para Artículos del Blog
*/

window._refreshQrList = function() {
    // Recargar la página para actualizar la lista de QR
    location.reload();
};

window._showQrAddedToast = function(name) {
    // Mostrar toast de éxito temporal
    var toast = document.createElement('div');
    toast.className = 'alert alert-success';
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.right = '20px';
    toast.style.zIndex = '9999';
    toast.innerHTML = '<i class="fas fa-check-circle"></i> QR "' + name + '" generado exitosamente. <a href="#" onclick="location.reload();return false;">Actualizar lista</a>';
    document.body.appendChild(toast);
    setTimeout(function() {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 5000);
};