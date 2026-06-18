// Zeppelin: solo maneja touch. El movimiento y hover son CSS puro.
(function() {
    var footer = document.querySelector('.jd-footer');
    var track = document.getElementById('zeppelinTrack');
    if (!footer || !track) return;

    footer.addEventListener('touchstart', function() {
        track.style.animationPlayState = 'paused';
    });
    footer.addEventListener('touchend', function() {
        setTimeout(function() {
            track.style.animationPlayState = 'running';
        }, 3000);
    });
})();