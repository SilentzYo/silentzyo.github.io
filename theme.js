(function () {
    var root = document.documentElement;

    var SUN = '<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
        '<circle cx="12" cy="12" r="4"/>' +
        '<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>' +
        '</svg>';
    var MOON = '<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>' +
        '</svg>';

    function isLight() {
        return root.getAttribute('data-theme') === 'light';
    }

    function apply(theme) {
        if (theme === 'light') {
            root.setAttribute('data-theme', 'light');
        } else {
            root.removeAttribute('data-theme');
        }
    }

    try {
        apply(localStorage.getItem('theme'));
    } catch (e) {}

    document.addEventListener('DOMContentLoaded', function () {
        var nav = document.querySelector('.header .nav');
        if (!nav) {
            return;
        }

        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'theme-toggle';
        button.innerHTML = SUN + MOON;

        function updateLabel() {
            button.setAttribute('aria-label', isLight() ? 'Switch to dark mode' : 'Switch to light mode');
        }

        button.addEventListener('click', function () {
            var next = isLight() ? 'dark' : 'light';
            apply(next);
            try {
                localStorage.setItem('theme', next);
            } catch (e) {}
            updateLabel();
        });

        updateLabel();
        nav.appendChild(button);
    });
})();
