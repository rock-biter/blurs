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
	radius: 0.8,
	sigma: 10,
	kawaseScale: 1,
	levels: 5,
	threshold: 0.25,
	smoothing: 0.35,
	intensity: 2,
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

pane
	.addBinding(config, 'threshold', {
		min: 0,
		max: 2,
		step: 0.01,
	})
	.on('change', (ev) => {
		// Update the mipmap levels in the MipmapBlur instance
		luminanceMaterial.uniforms.threshold.value = ev.value
	})

pane
	.addBinding(config, 'smoothing', {
		min: 0,
		max: 1,
		step: 0.01,
	})
	.on('change', (ev) => {
		// Update the mipmap levels in the MipmapBlur instance
		luminanceMaterial.uniforms.smoothing.value = ev.value
	})

pane
	.addBinding(config, 'intensity', {
		min: 0,
		max: 3,
		step: 0.01,
	})
	.on('change', (ev) => {
		// Update the mipmap levels in the MipmapBlur instance
		outputMaterial.uniforms.intensity.value = ev.value
	})

/**
 * Scene
 */
const scene = new THREE.Scene()

// __box__
/**
 * BOX
 */
// const material = new THREE.MeshNormalMaterial()
const coral = new THREE.MeshStandardMaterial({ color: 'coral' })
const white = new THREE.MeshStandardMaterial({ color: 'lime' })
const blue = new THREE.MeshStandardMaterial({ color: 'blue' })
const red = new THREE.MeshStandardMaterial({ color: 'red' })
const yellow = new THREE.MeshStandardMaterial({ color: 'yellow' })
const black = new THREE.MeshStandardMaterial({ color: 'black' })
const colors = [coral, white, blue, red, black, yellow]
const geometry = new THREE.SphereGeometry(1, 32, 32)
const mesh = new THREE.Mesh(geometry, white)

for (let i = 0; i < 40; i++) {
	const m = mesh.clone()
	m.material = colors[i % colors.length]
	m.position.x = Math.random() * 6 - 3
	m.position.y = Math.random() * 6 - 3
	m.position.z = Math.random() * 6 - 3
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
	type: THREE.HalfFloatType,
})

const luminanceSceneRT = new THREE.WebGLRenderTarget(
	sizes.width,
	sizes.height,
	{
		format: THREE.RGBAFormat,
		depthBuffer: true,
		stencilBuffer: false,
		type: THREE.HalfFloatType,
	}
)

const sceneOutputRT = new THREE.WebGLRenderTarget(sizes.width, sizes.height, {
	format: THREE.RGBAFormat,
	depthBuffer: true,
	stencilBuffer: false,
	type: THREE.HalfFloatType,
})

const luminanceMaterial = new THREE.ShaderMaterial({
	vertexShader: /* glsl */ `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = vec4(position, 1.0);
		}`,
	fragmentShader: /* glsl */ `
		uniform sampler2D tDiffuse;
		uniform float threshold;
		uniform float smoothing;
		varying vec2 vUv;
		void main() {

			vec4 texel = texture(tDiffuse, vUv);

			float l = 0.299 * texel.r + 0.587 * texel.g + 0.114 * texel.b;

			l = smoothstep(threshold, threshold + smoothing, l);

			gl_FragColor = vec4(texel.rgb * clamp(l,0.0,1.0), l);
			#include <tonemapping_fragment>
			#include <colorspace_fragment>
		}`,
	uniforms: {
		tDiffuse: new THREE.Uniform(null),
		threshold: new THREE.Uniform(config.threshold),
		smoothing: new THREE.Uniform(config.smoothing),
	},
})

const outputMaterial = new THREE.ShaderMaterial({
	vertexShader: /* glsl */ `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = vec4(position, 1.0);
		}`,
	fragmentShader: /* glsl */ `
		uniform sampler2D tDiffuse;
		uniform sampler2D tBloom;
		uniform float intensity;
		varying vec2 vUv;
		void main() {
			vec4 color = texture(tDiffuse, vUv);
			vec4 colorBloom = texture(tBloom, vUv);
			vec4 c = color + colorBloom * intensity;
			

			gl_FragColor = vec4(c.rgb,1.0);
			#include <tonemapping_fragment>
			#include <colorspace_fragment>
		}`,
	uniforms: {
		tDiffuse: new THREE.Uniform(null),
		tBloom: new THREE.Uniform(null),
		intensity: new THREE.Uniform(0.5),
	},
})

const finalScene = new THREE.Scene()
const triangle = new THREE.Mesh(mipmapBlur.geometry, outputMaterial)
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
const ambientLight = new THREE.AmbientLight(0xffffff, 0.05)
const directionalLight = new THREE.DirectionalLight(0xffffff, 8.5)
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

	renderer.setRenderTarget(luminanceSceneRT)
	triangle.material = luminanceMaterial
	luminanceMaterial.uniforms.tDiffuse.value = sceneRT.texture

	renderer.render(finalScene, camera)

	// kawase.render()
	mipmapBlur.render(luminanceSceneRT, sceneOutputRT)

	triangle.material = outputMaterial
	triangle.material.uniforms.tDiffuse.value = sceneRT.texture
	triangle.material.uniforms.tBloom.value = sceneOutputRT.texture

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
	luminanceSceneRT.setSize(res.x, res.y)
	mipmapBlur.setSize(res.x, res.y)
	// composer.setSize(res.x, res.y)
}
