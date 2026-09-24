(function () {
    var body = document.body;
    var scene = document.getElementById('meadow-scene');
    var canvas = document.createElement('canvas');
    canvas.className = 'meadow-canvas';
    scene.appendChild(canvas);

    var SKY = ['#5ea6e6', '#72b2eb', '#88c0f0', '#a0cef3', '#badcf6', '#d4eaf7'];
    var MEADOW = ['#7cc262', '#6db556', '#60a84b', '#549c41'];

    var CARRIAGE = [
        'TTTTTTTTTTTTTTTTT',
        'CCCCCCCCCCCCCCCCC',
        'CWWCWWCWWCWWCWWCC',
        'CWWCWWCWWCWWCWWCC',
        'CCCCCCCCCCCCCCCCC',
        'GGGGGGGGGGGGGGGGG',
        'CCCCCCCCCCCCCCCCC',
        '.KK.........KK...'
    ];

    var TENDER = [
        'SSSSSSSS',
        'EEEEEEEE',
        'EEEEEEEE',
        'EEEEEEEE',
        'EEEEEEEE',
        'SSSSSSSS',
        '.KK..KK.'
    ];

    var ENGINE = [
        '..............SSS...',
        'TTTTTT.........S....',
        'EEEEE..........S....',
        'EYYEE.....EE...S....',
        'EYYEEBBBBBBBBBBBBB..',
        'EEEEEBBGBBBBBGBBBBL.',
        'EEEEEBBBBBBBBBBBBBB.',
        'SSSSSSSSSSSSSSSSSSSS',
        '.KKK.KKK.KKK......S.'
    ];

    var TRAIN_COLORS = {
        T: '#3b2a24', C: '#8a3027', W: '#ffb54d', G: '#c9a14a', K: '#2a2522',
        S: '#1d2b22', E: '#2f4a37', B: '#3d5e46', Y: '#ffcf7a', L: '#ffe6a3'
    };

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

    function draw() {
        var scale = pixelSize();
        var width = Math.ceil(document.documentElement.clientWidth / scale) + 1;
        var height = Math.ceil(window.innerHeight / scale) + 1;
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = width * scale + 'px';
        canvas.style.height = height * scale + 'px';

        var ctx = canvas.getContext('2d');
        var random = seeded(1914);
        var ground = Math.max(40, Math.round(height * 0.3));
        var track = height - ground;
        var x, y;

        function dot(px, py, color) {
            ctx.fillStyle = color;
            ctx.fillRect(px, py, 1, 1);
        }

        function row(py, from, to, color) {
            ctx.fillStyle = color;
            ctx.fillRect(from, py, to - from, 1);
        }

        function disc(cx, cy, r, color, bottom) {
            for (var dy = -r; dy <= r; dy++) {
                if (bottom !== undefined && cy + dy > bottom) {
                    continue;
                }
                for (var dx = -r; dx <= r; dx++) {
                    if (dx * dx + dy * dy <= r * r + r * 0.6) {
                        dot(cx + dx, cy + dy, color);
                    }
                }
            }
        }

        function sprite(rows, left, baseline) {
            var top = baseline - rows.length + 1;
            rows.forEach(function (line, dy) {
                for (var dx = 0; dx < line.length; dx++) {
                    if (line[dx] !== '.') {
                        dot(left + dx, top + dy, TRAIN_COLORS[line[dx]]);
                    }
                }
            });
        }

        function bands(colors, from, to, px) {
            var size = (to - from) / colors.length;
            var index = Math.min(colors.length - 1, Math.floor((px - from) / size));
            var within = px - from - index * size;
            return { color: colors[index], next: colors[Math.min(colors.length - 1, index + 1)], dither: within > size - 2 };
        }

        for (y = 0; y < track; y++) {
            var sky = bands(SKY, 0, track, y);
            row(y, 0, width, sky.color);
            if (sky.dither) {
                for (x = y % 2; x < width; x += 2) {
                    dot(x, y, sky.next);
                }
            }
        }

        var sunX = width - Math.round(width * 0.12) - 6;
        var sunY = Math.max(8, Math.round(track * 0.2));
        disc(sunX, sunY, 6, '#fff1bd');
        disc(sunX, sunY, 4, '#fffbe6');

        var clouds = Math.max(3, Math.round(width / 55));
        for (var c = 0; c < clouds; c++) {
            var cloudX = Math.round(between(random, 0, width));
            var cloudY = Math.round(between(random, 6, Math.max(8, track * 0.5)));
            if (Math.abs(cloudX - sunX) < 14 && Math.abs(cloudY - sunY) < 10) {
                continue;
            }
            var puffs = Math.round(between(random, 3, 5));
            var reach = Math.round(puffs * 2.5);
            for (var p = 0; p < puffs; p++) {
                disc(cloudX + Math.round((p - puffs / 2) * 5 + between(random, -1, 1)), cloudY - Math.round(between(random, 0, 3)), Math.round(between(random, 3, 5)), '#ffffff', cloudY + 1);
            }
            row(cloudY + 1, cloudX - reach - 2, cloudX + reach + 1, '#dce9f4');
        }

        for (x = 0; x < width; x++) {
            var farTop = track - Math.round(ground * 0.18 + ground * 0.1 * Math.sin(x / 23 + 0.5) + ground * 0.05 * Math.sin(x / 9 + 2));
            ctx.fillStyle = '#b5dba7';
            ctx.fillRect(x, farTop, 1, track - farTop);
            dot(x, farTop, '#cbe7bf');
        }

        row(track, 0, width, '#6a5a4a');
        row(track + 1, 0, width, '#a39480');
        for (x = 0; x < width; x += 3) {
            dot(x, track + 1, '#7d6b58');
        }

        var nearTops = [];
        var streamRows = [];
        for (x = 0; x < width; x++) {
            var midTop = track + 2 + Math.round(1.5 * Math.sin(x / 17 + 1));
            ctx.fillStyle = '#93cc7e';
            ctx.fillRect(x, midTop, 1, height - midTop);
            dot(x, midTop, '#a9d894');
            streamRows.push(track + Math.round(ground * 0.3) + Math.round(2 * Math.sin(x / 11)));
            nearTops.push(track + Math.round(ground * 0.42) + Math.round(2 * Math.sin(x / 27 + 2) + 1.5 * Math.sin(x / 7)));
        }

        for (var s = 0; s < width * ground / 90; s++) {
            x = Math.round(between(random, 0, width - 1));
            y = Math.round(between(random, track + 5, streamRows[x] - 3));
            dot(x, y, random() < 0.6 ? '#f7b3c8' : '#ffffff');
        }

        streamRows.forEach(function (center, px) {
            dot(px, center - 1, '#7cc3ea');
            dot(px, center, '#9ad6f2');
            dot(px, center + 1, '#8ccdef');
            if (random() < 0.08) {
                dot(px, center, '#d2f0fb');
            }
        });
        for (var f = 0; f < width / 30; f++) {
            x = Math.round(between(random, 2, width - 3));
            var fish = random() < 0.5 ? '#ff8a3d' : '#e2472f';
            dot(x, streamRows[x], fish);
            dot(x + 1, streamRows[x + 1], fish);
        }

        nearTops.forEach(function (top, px) {
            for (var py = top; py < height; py++) {
                var meadow = bands(MEADOW, top, height, py);
                dot(px, py, meadow.dither && (px + py) % 2 === 0 ? meadow.next : meadow.color);
            }
            dot(px, top, '#8fd070');
        });

        var taken = {};
        var attempts = width * (height - track) / 6;
        for (var a = 0; a < attempts; a++) {
            x = Math.round(between(random, 2, width - 3));
            var top = nearTops[x];
            y = Math.round(between(random, top + 2, height - 3));
            var depth = (y - top) / (height - top);
            var size = depth < 0.3 ? 0 : depth < 0.65 ? 1 : 2;
            var key = Math.floor(x / (size + 3)) + ',' + Math.floor(y / (size + 3));
            if (taken[key] || random() > (size === 0 ? 0.15 : 0.35)) {
                continue;
            }
            taken[key] = true;

            var pink = random() < 0.62;
            var petal = pink ? '#f48fb1' : '#ffffff';
            var light = pink ? '#fbc3d5' : '#f1ecee';
            if (size === 0) {
                dot(x, y, petal);
                continue;
            }
            for (var stem = 1; stem <= size + 1; stem++) {
                dot(x, y + size + stem, '#3f8434');
            }
            if (size === 1) {
                dot(x, y - 1, petal);
                dot(x - 1, y, petal);
                dot(x + 1, y, light);
                dot(x, y + 1, petal);
                dot(x, y, '#5b3a26');
            } else {
                ['.PPP.', 'PPHPP', 'PHCPP', 'PPPPP', '.PPP.'].forEach(function (line, dy) {
                    for (var dx = 0; dx < 5; dx++) {
                        var mark = line[dx];
                        if (mark !== '.') {
                            dot(x - 2 + dx, y - 2 + dy, mark === 'C' ? '#5b3a26' : mark === 'H' ? light : petal);
                        }
                    }
                });
            }
        }

        for (x = 0; x < width; x++) {
            if (random() < 0.55) {
                var blade = Math.round(between(random, 2, 5));
                var green = ['#3b8230', '#4a9a3b', '#43903a'][Math.floor(random() * 3)];
                var lean = random() < 0.3 ? (random() < 0.5 ? -1 : 1) : 0;
                for (var b = 0; b < blade; b++) {
                    dot(b === blade - 1 ? x + lean : x, height - 1 - b, green);
                }
            }
        }

        var trainLeft = width - 47 - Math.max(3, Math.round(width * 0.04));
        sprite(CARRIAGE, trainLeft, track - 1);
        dot(trainLeft + 17, track - 2, TRAIN_COLORS.K);
        sprite(TENDER, trainLeft + 18, track - 1);
        dot(trainLeft + 26, track - 2, TRAIN_COLORS.K);
        sprite(ENGINE, trainLeft + 27, track - 1);

        var chimneyX = trainLeft + 27 + 15;
        var chimneyY = track - 1 - ENGINE.length;
        [[-1, -2, 1, '#ffffff'], [-4, -4, 2, '#ffffff'], [-9, -6, 2, '#f6f9fb'], [-15, -7, 3, '#eef4f8'], [-22, -8, 3, '#e6eff5']].forEach(function (puff) {
            disc(chimneyX + puff[0], chimneyY + puff[1], puff[2], puff[3]);
        });
    }

    var resizeTimer = 0;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(draw, 150);
    });
    draw();
})();
