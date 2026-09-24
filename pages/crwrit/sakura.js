(function () {
    var body = document.body;
    var scene = document.getElementById('sakura-scene');
    var backLayer = document.getElementById('petals-back');
    var frontLayer = document.getElementById('petals-front');
    var header = document.querySelector('.header');
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var PETALS = [1, 2, 3, 4, 5].map(function (n) {
        return '../../media/sakurapetal(' + n + ').png';
    });

    var LANTERN = [
        '..KKK..',
        '.PPPPP.',
        'PHPPPPP',
        'PHPGPPP',
        'DDDDDDD',
        'PHPGPPP',
        'PHPPPPP',
        '.PPPPP.',
        '..KKK..',
        '...R...'
    ];

    var LANTERN_COLORS = [
        { P: '#f4a0b9', H: '#fbd3de', D: '#e0829f', G: '#ffd9a8', K: '#4a3530', R: '#c9443e' },
        { P: '#fff0e0', H: '#ffffff', D: '#efd6c2', G: '#ffe3b3', K: '#4a3530', R: '#c9443e' }
    ];

    var lanterns = document.createElement('canvas');
    var river = document.createElement('canvas');
    lanterns.className = 'pixel-band lanterns';
    river.className = 'pixel-band river';
    scene.insertBefore(lanterns, scene.firstChild);
    scene.insertBefore(river, scene.firstChild);

    function seeded(seed) {
        return function () {
            seed |= 0;
            seed = seed + 0x6d2b79f5 | 0;
            var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    function between(random, min, max) {
        return min + random() * (max - min);
    }

    function pixelSize() {
        return parseFloat(getComputedStyle(body).getPropertyValue('--pixel')) || 5;
    }

    function prepare(canvas, width, height, scale) {
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = width * scale + 'px';
        canvas.style.height = height * scale + 'px';
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, width, height);
        return ctx;
    }

    function dot(ctx, x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
    }

    function drawLanterns(width, scale) {
        var ctx = prepare(lanterns, width, 16, scale);
        var span = 22;
        var sag = 3;

        function stringY(x) {
            var t = ((x % span) + span) % span / (span / 2) - 1;
            return Math.round(1 + sag * (1 - t * t));
        }

        for (var x = 0; x < width; x++) {
            dot(ctx, x, stringY(x), '#6b4f45');
        }

        var index = 0;
        for (var start = 0; start < width + span; start += span) {
            var cx = start + span / 2;
            var top = stringY(cx) + 1;
            var colors = LANTERN_COLORS[index++ % LANTERN_COLORS.length];
            dot(ctx, cx, top, '#6b4f45');
            LANTERN.forEach(function (row, dy) {
                for (var dx = 0; dx < row.length; dx++) {
                    if (row[dx] !== '.') {
                        dot(ctx, cx - 3 + dx, top + 1 + dy, colors[row[dx]]);
                    }
                }
            });
        }
    }

    function canopy(ctx, random, cx, cy, r, palette) {
        for (var dy = -r; dy <= r; dy++) {
            for (var dx = -r; dx <= r; dx++) {
                var d = Math.sqrt(dx * dx + dy * dy);
                if (d > r || (d > r - 1.2 && random() < 0.35)) {
                    continue;
                }
                var shade = dy / r + 0.15 * dx / r;
                var color = shade < -0.45 ? palette[0] : shade < 0.2 ? palette[1] : shade < 0.6 ? palette[2] : palette[3];
                var roll = random();
                if (roll < 0.04) {
                    color = '#ffffff';
                } else if (roll < 0.07) {
                    color = palette[3];
                }
                dot(ctx, cx + dx, cy + dy, color);
            }
        }
    }

    function drawRiver(width, scale) {
        var height = 34;
        var ctx = prepare(river, width, height, scale);
        var random = seeded(20250401);
        var x, y;

        for (x = -4; x < width + 4; x += Math.round(between(random, 6, 10))) {
            canopy(ctx, random, x, Math.round(between(random, 9, 12)), Math.round(between(random, 3, 5)), ['#fbe7ee', '#f6d5e0', '#f0c4d3', '#e9b3c6']);
        }

        ['#d7ccc4', '#c4b8b0', '#9f938c'].forEach(function (color, row) {
            ctx.fillStyle = color;
            ctx.fillRect(0, 16 + row, width, 1);
        });

        var trees = [];
        for (x = -6; x < width + 8; x += Math.round(between(random, 13, 21))) {
            trees.push({ x: x, y: Math.round(between(random, 7, 10)), r: Math.round(between(random, 5, 8)) });
        }
        trees.forEach(function (tree) {
            ctx.fillStyle = '#6d4b40';
            ctx.fillRect(tree.x, tree.y + tree.r - 2, 1, 19 - (tree.y + tree.r - 2));
        });
        trees.forEach(function (tree) {
            canopy(ctx, random, tree.x, tree.y, tree.r, ['#fde3ea', '#f7c1d1', '#eea4bb', '#e48aa6']);
        });

        for (y = 19; y < height; y++) {
            ctx.fillStyle = y < 23 ? '#a9d3ea' : y < 28 ? '#93c5e2' : '#7fb6da';
            ctx.fillRect(0, y, width, 1);
        }

        trees.forEach(function (tree) {
            for (var rx = tree.x - tree.r; rx <= tree.x + tree.r; rx++) {
                for (var ry = 19; ry < 22; ry++) {
                    if (random() < 0.5) {
                        dot(ctx, rx, ry, '#d6c4df');
                    }
                }
            }
        });

        for (var i = 0; i < width / 6; i++) {
            var length = Math.round(between(random, 2, 5));
            ctx.fillStyle = '#d3ebf7';
            ctx.fillRect(Math.round(between(random, 0, width)), Math.round(between(random, 21, height)), length, 1);
        }

        for (i = 0; i < width / 9; i++) {
            var raftX = Math.round(between(random, 0, width));
            var raftY = Math.round(between(random, 19, 22));
            var size = Math.round(between(random, 3, 8));
            for (var p = 0; p < size; p++) {
                dot(ctx, raftX + Math.round(between(random, -3, 3)), raftY + Math.round(between(random, 0, 2)), random() < 0.6 ? '#f9cdda' : '#fde6ee');
            }
        }

        for (i = 0; i < width / 5; i++) {
            dot(ctx, Math.round(between(random, 0, width)), Math.round(between(random, 22, height)), '#f7c3d3');
        }
    }

    function draw() {
        if (header) {
            body.style.setProperty('--scene-top', header.offsetHeight + 'px');
        }
        var scale = pixelSize();
        var width = Math.ceil(document.documentElement.clientWidth / scale) + 1;
        drawLanterns(width, scale);
        drawRiver(width, scale);
    }

    function addPetals(layer, count, options) {
        for (var i = 0; i < count; i++) {
            var fall = between(Math.random, options.fall[0], options.fall[1]);
            var petal = document.createElement('span');
            petal.className = 'petal';
            petal.style.setProperty('--x', between(Math.random, 0, 120).toFixed(1) + 'vw');
            petal.style.setProperty('--drift', -between(Math.random, 8, 30).toFixed(1) + 'vw');
            petal.style.setProperty('--fall', fall.toFixed(1) + 's');
            petal.style.setProperty('--delay', -between(Math.random, 0, fall).toFixed(1) + 's');
            petal.style.setProperty('--sway', between(Math.random, 1.6, 3.2).toFixed(1) + 's');
            petal.style.setProperty('--size', 5 * Math.round(between(Math.random, options.scale[0], options.scale[1])) + 'px');

            var image = document.createElement('img');
            image.src = PETALS[i % PETALS.length];
            image.alt = '';
            petal.appendChild(image);
            layer.appendChild(petal);
        }
    }

    var resizeTimer = 0;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(draw, 150);
    });
    draw();

    if (!reduceMotion) {
        var narrow = window.innerWidth < 700;
        addPetals(backLayer, narrow ? 12 : 22, { fall: [11, 19], scale: [2, 4] });
        addPetals(frontLayer, narrow ? 3 : 5, { fall: [7, 10], scale: [5, 7] });
    }
})();
