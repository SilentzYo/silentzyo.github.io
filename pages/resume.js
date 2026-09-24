import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as pdfjs from 'pdfjs-dist';

var PDFJS_CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.3.289';
var PDF_URL = '../media/resume.pdf';

var FOV = 10;
var FILL = 0.86;
var THICKNESS = 0.004;
var MAX_ZOOM = 5;
var TEXTURE_SIDE = 3072;

pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_CDN + '/build/pdf.worker.min.mjs';

var stage = document.getElementById('resume-stage');
var hint = document.getElementById('resume-hint');
var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

async function renderPage(maxSide) {
    var pdf = await pdfjs.getDocument({
        url: PDF_URL,
        standardFontDataUrl: PDFJS_CDN + '/standard_fonts/'
    }).promise;
    var page = await pdf.getPage(1);
    var base = page.getViewport({ scale: 1 });
    var viewport = page.getViewport({ scale: maxSide / Math.max(base.width, base.height) });

    var canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    await page.render({ canvas: canvas, viewport: viewport }).promise;
    return canvas;
}

function showThrough(front) {
    var canvas = document.createElement('canvas');
    canvas.width = Math.floor(front.width / 2);
    canvas.height = Math.floor(front.height / 2);
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 0.06;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(front, 0, 0, canvas.width, canvas.height);
    return canvas;
}

function createViewer() {
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));
    renderer.domElement.setAttribute('role', 'img');
    renderer.domElement.setAttribute('aria-label', "Hayden Leung's resume");
    stage.appendChild(renderer.domElement);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(FOV, 1, 0.01, 100);

    var edge = new THREE.MeshBasicMaterial({ color: 0xdedede });
    var front = new THREE.MeshBasicMaterial({ color: 0xffffff });
    var back = new THREE.MeshBasicMaterial({ color: 0xffffff });
    var paper = new THREE.Mesh(new THREE.BoxGeometry(1, 1, THICKNESS), [edge, edge, edge, edge, front, back]);
    paper.scale.set(8.5 / 11, 1, 1);
    paper.visible = false;
    scene.add(paper);

    var controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.zoomToCursor = true;
    controls.cursorStyle = 'grab';
    controls.minPolarAngle = Math.PI / 2 - 0.4;
    controls.maxPolarAngle = Math.PI / 2 + 0.4;

    var touched = false;
    var intro = null;
    var frame = 0;

    function requestRender() {
        if (!frame) {
            frame = requestAnimationFrame(render);
        }
    }

    function render(now) {
        frame = 0;
        if (intro) {
            var t = Math.min(1, (now - intro.start) / intro.duration);
            var ease = 1 - Math.pow(1 - t, 3);
            paper.rotation.set(intro.x * (1 - ease), intro.y * (1 - ease), 0);
            if (t < 1) {
                requestRender();
            } else {
                intro = null;
            }
        }
        controls.update();
        renderer.render(scene, camera);
    }

    function restDistance() {
        var span = FILL * 2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
        return Math.max(paper.scale.y / span, paper.scale.x / (span * camera.aspect));
    }

    function resize() {
        var width = stage.clientWidth;
        var height = stage.clientHeight;
        if (!width || !height) {
            return;
        }
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        var rest = restDistance();
        controls.minDistance = rest / MAX_ZOOM;
        controls.maxDistance = rest * 1.6;
        if (!touched) {
            camera.position.set(0, 0, rest);
            controls.target.set(0, 0, 0);
        }
        requestRender();
    }

    function onStart() {
        touched = true;
        hint.classList.add('is-faded');
        controls.removeEventListener('start', onStart);
    }

    controls.addEventListener('change', requestRender);
    controls.addEventListener('start', onStart);
    new ResizeObserver(resize).observe(stage);

    return {
        maxTextureSide: renderer.capabilities.maxTextureSize,

        show: function (page) {
            var texture = new THREE.CanvasTexture(page);
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
            front.map = texture;
            front.needsUpdate = true;

            var reverse = new THREE.CanvasTexture(showThrough(page));
            reverse.colorSpace = THREE.SRGBColorSpace;
            back.map = reverse;
            back.needsUpdate = true;

            paper.scale.set(page.width / page.height, 1, 1);
            paper.visible = true;
            if (!reduceMotion) {
                intro = { start: performance.now(), duration: 1200, x: 0.12, y: -0.6 };
            }
            resize();
        }
    };
}

function showFlat(page) {
    page.className = 'resume-flat';
    stage.classList.add('is-flat');
    stage.replaceChildren(page);
    hint.hidden = true;
}

function showError() {
    var message = document.createElement('p');
    message.className = 'resume-error';
    message.textContent = "Couldn't load the resume. Try refreshing the page.";
    stage.classList.add('is-flat');
    stage.replaceChildren(message);
    hint.hidden = true;
}

var viewer = null;
try {
    viewer = createViewer();
} catch (err) {
    console.error(err);
    stage.replaceChildren();
}

try {
    var side = viewer ? Math.min(viewer.maxTextureSide, TEXTURE_SIDE) : 2048;
    var page = await renderPage(side);
    if (viewer) {
        viewer.show(page);
    } else {
        showFlat(page);
    }
} catch (err) {
    console.error(err);
    showError();
}
