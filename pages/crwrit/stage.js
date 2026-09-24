(function () {
    var body = document.body;
    var sceneCanvas = host(document.getElementById('stage-scene'));
    var hallCanvas = host(document.getElementById('hall-band'));
    var stageCanvas = host(document.getElementById('stage-band'));

    var DARK = rgb('#0e0906');
    var LIGHT = rgb('#ffe9c4');
    var PANELS = [rgb('#5f3b1f'), rgb('#6b4426')];
    var SEAM = rgb('#2e1c10');
    var GRAIN = rgb('#553519');
    var FLOOR_BACK = rgb('#4d311b');
    var FLOOR_FRONT = rgb('#83562e');
    var BAYER = [0.125, 0.625, 0.875, 0.375];

    var CHAIR = [
        '.BBB.',
        '.BBB.',
        'SSSSS',
        'L...L',
        'L...L'
    ];

    var STAND = [
        'DDDDD',
        '.DDD.',
        '..P..',
        '..P..',
        '..P..',
        '.P.P.'
    ];

    var SOLO_CHAIR = [
        '.HHHHH.',
        '.BBBBB.',
        '.BBBBB.',
        '.BBBBB.',
        'SSSSSSS',
        'L.....L',
        'L.....L',
        'L.....L'
    ];

    var SOLO_STAND = [
        'DDDDDDD',
        'DDDDDDD',
        '.DDDDD.',
        '...P...',
        '...P...',
        '...P...',
        '...P...',
        '...P...',
        '..P.P..',
        '.P...P.'
    ];

    var TRUMPET = [
        '.....VVV...F',
        'MGGGGGGGGGFF',
        '...GGGGGG.FF',
        '...........F'
    ];

    var COLORS = {
        B: '#2a1c12', H: '#4a3220', S: '#5a3d27', L: '#1a110b', D: '#3a2718', P: '#20160e',
        M: '#a88a45', G: '#e2bf6a', V: '#f6dea0', F: '#f0d387'
    };

    function host(element) {
        var canvas = document.createElement('canvas');
        element.insertBefore(canvas, element.firstChild);
        return canvas;
    }

    function rgb(hex) {
        return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
    }

    function mix(a, b, t) {
        return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    }

    function css(color) {
        return 'rgb(' + Math.round(color[0]) + ',' + Math.round(color[1]) + ',' + Math.round(color[2]) + ')';
    }

    function quantize(value, steps, x, y) {
        var scaled = Math.max(0, value) * steps;
        var base = Math.floor(scaled);
        return (base + (scaled - base > BAYER[(y % 2) * 2 + (x % 2)] ? 1 : 0)) / steps;
    }

    function posterize(value, steps) {
        return Math.round(Math.max(0, value) * steps) / steps;
    }

    function seeded(seed) {
        return function () {
            seed |= 0;
            seed = seed + 0x6d2b79f5 | 0;
            var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
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

    function painter(ctx) {
        function rect(x, y, w, h, color) {
            ctx.fillStyle = color;
            ctx.fillRect(x, y, w, h);
        }

        return {
            rect: rect,
            dot: function (x, y, color) {
                rect(x, y, 1, 1, color);
            },
            sprite: function (rows, left, baseline) {
                var top = baseline - rows.length + 1;
                rows.forEach(function (line, dy) {
                    for (var dx = 0; dx < line.length; dx++) {
                        var mark = line[dx];
                        if (mark !== '.') {
                            rect(left + dx, top + dy, 1, 1, COLORS[mark]);
                        }
                    }
                });
            },
            line: function (x0, y0, x1, y1, color) {
                x0 = Math.round(x0);
                x1 = Math.round(x1);
                var dx = Math.abs(x1 - x0);
                var dy = -Math.abs(y1 - y0);
                var sx = x0 < x1 ? 1 : -1;
                var sy = y0 < y1 ? 1 : -1;
                var err = dx + dy;
                while (true) {
                    rect(x0, y0, 1, 1, color);
                    if (x0 === x1 && y0 === y1) {
                        break;
                    }
                    var e2 = 2 * err;
                    if (e2 >= dy) {
                        err += dy;
                        x0 += sx;
                    }
                    if (e2 <= dx) {
                        err += dx;
                        y0 += sy;
                    }
                }
            }
        };
    }

    function drawScene(width, height, scale) {
        var ctx = prepare(sceneCanvas, width, height, scale);
        var image = ctx.createImageData(width, height);
        var data = image.data;
        var random = seeded(1998);
        var panel = 18;
        var center = width / 2;
        var spread = width < 200 ? 0.62 : 0.36;

        for (var y = 0; y < height; y++) {
            var fy = y / height;
            var vertical = fy < 0.35 ? (0.35 - fy) * 0.9 : fy > 0.7 ? (fy - 0.7) * 0.9 : 0;
            var beamHalf = width * 0.07 + width * 0.26 * fy;
            for (var x = 0; x < width; x++) {
                var color = x % panel === 0 ? SEAM : random() < 0.03 ? GRAIN : PANELS[Math.floor(x / panel) % 2];
                var across = Math.max(0, 1 - Math.abs(x - center) / (width * spread));
                var shade = Math.min(0.94, 0.42 + 0.52 * across * across * (3 - 2 * across) + vertical);
                color = mix(color, DARK, posterize(shade, 8));
                var fromBeam = Math.abs(x - center) / beamHalf;
                if (fromBeam < 1) {
                    color = mix(color, LIGHT, posterize((1 - fromBeam) * (1 - 0.55 * fy) * 0.24, 16));
                }
                var i = (y * width + x) * 4;
                data[i] = color[0];
                data[i + 1] = color[1];
                data[i + 2] = color[2];
                data[i + 3] = 255;
            }
        }
        ctx.putImageData(image, 0, 0);
    }

    function drawHall(width, scale) {
        var p = painter(prepare(hallCanvas, width, 44, scale));
        var center = Math.floor(width / 2);
        var n = 9;
        var pitch = 4;
        var bottom = 37;

        p.rect(0, 0, width, 2, '#120c08');
        for (var x = 9; x < width; x += 18) {
            p.dot(x - 1, 2, '#e8c98f');
            p.dot(x, 2, '#fff3d1');
            p.dot(x + 1, 2, '#e8c98f');
            p.dot(x, 3, '#c9a56b');
        }

        var left = center - n * pitch - 1;
        var right = center + n * pitch + 2;
        p.rect(left - 3, bottom - 31, right - left + 6, 31, '#2c1b0f');

        for (var i = -n; i <= n; i++) {
            var a = Math.abs(i);
            var height = Math.round(16 + 12 * Math.pow(1 - a / n, 1.3) + (a >= n - 1 ? 7 - (a - n + 1) * 2 : 0));
            var px = center + i * pitch - 1;
            var top = bottom - height;
            p.rect(px, top, 1, height - 2, '#8a6c32');
            p.rect(px + 1, top, 1, height - 2, '#f1dc9f');
            p.rect(px + 2, top, 1, height - 2, '#c9a456');
            p.rect(px, top, 3, 1, '#f6e3ad');
            p.dot(px, bottom - 2, '#6d5526');
            p.dot(px + 1, bottom - 2, '#c9a456');
            p.dot(px + 2, bottom - 2, '#6d5526');
            p.dot(px + 1, bottom - 1, '#8a6c32');
            p.rect(px + 1, bottom - 7, 1, 2, '#2a1c0c');
        }

        p.rect(left - 4, bottom, right - left + 8, 5, '#3b2415');
        p.rect(left - 4, bottom, right - left + 8, 1, '#8a5a32');
    }

    function drawStage(width, scale) {
        var ctx = prepare(stageCanvas, width, 64, scale);
        var p = painter(ctx);
        var cx = Math.floor(width / 2);
        var backHalf = Math.min(Math.round(width * 0.36), 100);
        var frontHalf = Math.round(width * 0.8);
        var floorTop = 24;
        var floorBottom = 60;
        var x, y;

        p.rect(cx - Math.round(backHalf * 0.9), 12, Math.round(backHalf * 1.8), 6, '#3f2816');
        p.rect(cx - Math.round(backHalf * 0.9), 12, Math.round(backHalf * 1.8), 1, '#7a5030');
        p.rect(cx - backHalf, 18, backHalf * 2, 6, '#4a2f1a');
        p.rect(cx - backHalf, 18, backHalf * 2, 1, '#8a5a32');

        for (y = floorTop; y <= floorBottom; y++) {
            var t = (y - floorTop) / (floorBottom - floorTop);
            var half = Math.round(backHalf + (frontHalf - backHalf) * t);
            for (x = cx - half; x <= cx + half; x++) {
                var color = mix(FLOOR_BACK, FLOOR_FRONT, quantize(t, 4, x, y));
                var pool = Math.pow((x - cx) / 32, 2) + Math.pow((y - 50) / 9, 2);
                if (pool < 1) {
                    color = mix(color, LIGHT, quantize((1 - pool) * 0.4, 8, x, y));
                }
                p.dot(x, y, css(color));
            }
        }

        var planks = 15;
        for (var k = 0; k <= planks; k++) {
            p.line(cx - backHalf + k * 2 * backHalf / planks, floorTop, cx - frontHalf + k * 2 * frontHalf / planks, floorBottom, '#3a2515');
        }
        p.rect(0, floorBottom + 1, width, 3, '#120b07');

        var reachA = Math.round(backHalf * 0.8);
        for (x = cx - reachA; x + 9 <= cx + reachA; x += 11) {
            p.sprite(CHAIR, x, 11);
            p.sprite(STAND, x + 5, 11);
        }
        var reachB = Math.round(backHalf * 0.9);
        for (x = cx - reachB; x + 9 <= cx + reachB; x += 12) {
            p.sprite(CHAIR, x, 17);
            p.sprite(STAND, x + 5, 17);
        }
        var reachFloor = Math.round(backHalf * 0.75);
        for (x = cx - reachFloor; x + 9 <= cx + reachFloor; x += 13) {
            var arc = Math.round(31 + 5 * Math.pow((x + 5 - cx) / reachFloor, 2));
            p.sprite(CHAIR, x, arc);
            p.sprite(STAND, x + 5, arc);
        }

        p.sprite(SOLO_CHAIR, cx - 4, 53);
        p.sprite(TRUMPET, cx - 6, 49);
        p.sprite(SOLO_STAND, cx + 5, 54);
    }

    function draw() {
        var scale = pixelSize();
        var width = Math.ceil(document.documentElement.clientWidth / scale) + 1;
        drawScene(width, Math.ceil(window.innerHeight / scale) + 1, scale);
        drawHall(width, scale);
        drawStage(width, scale);
    }

    var resizeTimer = 0;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(draw, 150);
    });
    draw();
})();
