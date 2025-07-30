import { EffectComposer, RenderPass, ShaderPass } from 'postprocessing'
import './style.css'
import * as THREE from 'three'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Pane } from 'tweakpane'

import blurVertex from './shaders/gaussian-blur/vertex.glsl'
import blurFragment from './shaders/gaussian-blur/fragment.glsl'
import Kawase from './kawase'
import MipmapBlur from './mipmap-blur'

/**
 * Debug
 */
// __gui__
const config = {
	radius: 1,
	sigma: 10,
	kawaseScale: 1,
	levels: 4,
}
const pane = new Pane()

pane
	.addBinding(config, 'levels', {
		min: 1,
		max: 12,
		step: 1,
	})
	.on('change', (ev) => {
		// Update the mipmap levels in the MipmapBlur instance
		mipmapBlur.levels = ev.value
	})

pane
	.addBinding(config, 'radius', {
		min: 0,
		max: 1,
		step: 0.01,
	})
	.on('change', (ev) => {
		// Update the mipmap levels in the MipmapBlur instance
		mipmapBlur.upsamplingMaterial.uniforms.radius.value = ev.value
	})

/**
 * Scene
 */
const scene = new THREE.Scene()
// scene.background = new THREE.Color(0xdedede)

// __box__
/**
 * BOX
 */
// const material = new THREE.MeshNormalMaterial()
const material = new THREE.MeshStandardMaterial({ color: 'coral' })
const geometry = new THREE.SphereGeometry(1, 32, 32)
const mesh = new THREE.Mesh(geometry, material)

for (let i = 0; i < 30; i++) {
	const m = mesh.clone()
	m.position.x = Math.random() * 5 - 2.5
	m.position.y = Math.random() * 5 - 2.5
	m.position.z = Math.random() * 5 - 2.5
	m.scale.setScalar(Math.random() * 0.3)

	scene.add(m)
}
scene.add(mesh)
// mesh.position.y += 0.5

// __floor__
/**
 * Plane
 */
const groundMaterial = new THREE.MeshStandardMaterial({ color: 'lightgray' })
const groundGeometry = new THREE.PlaneGeometry(10, 10)
groundGeometry.rotateX(-Math.PI * 0.5)
const ground = new THREE.Mesh(groundGeometry, groundMaterial)
// scene.add(ground)

/**
 * render sizes
 */
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
}

/**
 * Camera
 */
const fov = 60
const camera = new THREE.PerspectiveCamera(fov, sizes.width / sizes.height, 0.1)
camera.position.set(2.5, 2.5, 2.5)
camera.lookAt(new THREE.Vector3(0, 2.5, 0))

/**
 * Show the axes of coordinates system
 */
// __helper_axes__
const axesHelper = new THREE.AxesHelper(3)
scene.add(axesHelper)

/**
 * renderer
 */
const renderer = new THREE.WebGLRenderer({
	antialias: window.devicePixelRatio < 2,
})
document.body.appendChild(renderer.domElement)

const mipmapBlur = new MipmapBlur(
	renderer,
	config.levels,
	sizes.width,
	sizes.height,
	config.radius
)

const sceneRT = new THREE.WebGLRenderTarget(sizes.width, sizes.height, {
	format: THREE.RGBAFormat,
	depthBuffer: true,
	stencilBuffer: false,
	minFilter: THREE.LinearFilter,
	magFilter: THREE.LinearFilter,
	type: THREE.HalfFloatType,
})

const sceneOutputRT = new THREE.WebGLRenderTarget(sizes.width, sizes.height, {
	format: THREE.RGBAFormat,
	depthBuffer: true,
	stencilBuffer: false,
	minFilter: THREE.LinearFilter,
	magFilter: THREE.LinearFilter,
	type: THREE.HalfFloatType,
})

const finalScene = new THREE.Scene()
const triangle = new THREE.Mesh(
	mipmapBlur.geometry,
	new THREE.ShaderMaterial({
		vertexShader: /* glsl */ `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = vec4(position, 1.0);
		}`,
		fragmentShader: /* glsl */ `
		uniform sampler2D tDiffuse;
		varying vec2 vUv;
		void main() {
			gl_FragColor = texture(tDiffuse, vUv);
			#include <tonemapping_fragment>
			#include <colorspace_fragment>
		}`,
		uniforms: {
			tDiffuse: new THREE.Uniform(null),
		},
	})
)
finalScene.add(triangle)

console.log(triangle)

console.log(mipmapBlur)

handleResize()

/**
 * OrbitControls
 */
// __controls__
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5)
const directionalLight = new THREE.DirectionalLight(0xffffff, 4.5)
directionalLight.position.set(3, 10, 7)
scene.add(ambientLight, directionalLight)
// scene.background = new THREE.Color()

/**
 * Three js Clock
 */
// __clock__
const clock = new THREE.Clock()

/**
 * frame loop
 */
function tic() {
	/**
	 * tempo trascorso dal frame precedente
	 */
	const dt = clock.getDelta()
	/**
	 * tempo totale trascorso dall'inizio
	 */
	// const time = clock.getElapsedTime()

	// __controls_update__
	controls.update(dt)

	renderer.setRenderTarget(sceneRT)
	renderer.clear()

	renderer.render(scene, camera)

	// kawase.render()
	mipmapBlur.render(sceneRT, sceneOutputRT)
	triangle.material.uniforms.tDiffuse.value = sceneOutputRT.texture

	renderer.setRenderTarget(null)
	renderer.render(finalScene, camera)
	// composer.render()

	requestAnimationFrame(tic)
}

requestAnimationFrame(tic)

window.addEventListener('resize', handleResize)

function handleResize() {
	sizes.width = window.innerWidth
	sizes.height = window.innerHeight

	camera.aspect = sizes.width / sizes.height

	// camera.aspect = sizes.width / sizes.height;
	camera.updateProjectionMatrix()

	renderer.setSize(sizes.width, sizes.height)

	const pixelRatio = Math.min(window.devicePixelRatio, 2)
	renderer.setPixelRatio(pixelRatio)

	const res = new THREE.Vector2()
	renderer.getDrawingBufferSize(res)
	sceneRT.setSize(res.x, res.y)
	sceneOutputRT.setSize(res.x, res.y)
	mipmapBlur.setSize(res.x, res.y)
	// composer.setSize(res.x, res.y)
}
