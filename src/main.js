import {
	BoxBlurMaterial,
	DepthCopyMaterial,
	DepthEffect,
	EffectComposer,
	EffectPass,
	GaussianBlurMaterial,
	RenderPass,
	ShaderPass,
} from 'postprocessing'
import './style.css'
import * as THREE from 'three'
import { Vector2 } from 'three'
// __controls_import__
// __gui_import__

import blurBoxVertex from './shaders/box-blur-pass/vertex.glsl'
import blurBoxFragment from './shaders/box-blur-pass/fragment.glsl'

import blurKawaseVertex from './shaders/kawase/vertex.glsl'
import blurKawaseFragment from './shaders/kawase/fragment.glsl'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Pane } from 'tweakpane'

/**
 * Debug
 */
// __gui__
const config = {
	radius: 20,
	sigma: 1,
}
const pane = new Pane()

pane
	.addBinding(config, 'radius', {
		min: 0,
		max: 30,
		step: 1,
	})
	.on('change', (ev) => {
		blurHMaterial.uniforms.uRadius.value = ev.value
		blurVMaterial.uniforms.uRadius.value = ev.value
	})

pane
	.addBinding(config, 'sigma', {
		min: 0.01,
		max: 50,
		step: 0.01,
	})
	.on('change', (ev) => {
		blurHMaterial.uniforms.uSigma.value = ev.value
		blurVMaterial.uniforms.uSigma.value = ev.value
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
mesh.position.y += 0.5
scene.add(mesh)

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
camera.position.set(4, 4, 4)
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

const composer = new EffectComposer(renderer)
const renderPass = new RenderPass(scene, camera)
composer.addPass(renderPass)

const blurHMaterial = new THREE.ShaderMaterial({
	vertexShader: blurBoxVertex,
	fragmentShader: blurBoxFragment,
	defines: { LABEL: 'boxblur' },
	uniforms: {
		tDiffuse: new THREE.Uniform(null),
		uRadius: new THREE.Uniform(config.radius),
		uDirection: new THREE.Uniform(new Vector2(1, 0)), // Horizontal blur
		uSigma: new THREE.Uniform(config.sigma),
	},
})
const blurVMaterial = new THREE.ShaderMaterial({
	vertexShader: blurBoxVertex,
	fragmentShader: blurBoxFragment,
	defines: { LABEL: 'boxblur' },
	uniforms: {
		tDiffuse: new THREE.Uniform(null),
		uRadius: new THREE.Uniform(config.radius),
		uDirection: new THREE.Uniform(new Vector2(0, 1)), // Vertical blur
		uSigma: new THREE.Uniform(config.sigma),
	},
})

// const depthEffect = new DepthEffect(camera)
// const effectPass = new EffectPass(camera, depthEffect)
// composer.addPass(effectPass)

// composer.addPass(renderPass)

// const blurHPass = new ShaderPass(blurHMaterial, 'tDiffuse')
// composer.addPass(blurHPass)

// const blurVPass = new ShaderPass(blurVMaterial, 'tDiffuse')
// composer.addPass(blurVPass)
const kernelPresets = [
	[0.0, 1.0], // VERY_SMALL
	[0.0, 1.0, 1.0], // SMALL
	[0.0, 1.0, 1.0, 2.0], // MEDIUM
	[0.0, 1.0, 2.0, 2.0, 3.0], // LARGE
	[0.0, 1.0, 2.0, 3.0, 4.0, 4.0, 5.0], // VERY_LARGE
	[0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 7.0, 8.0, 9.0, 10.0], // HUGE
]

const kawaseKernel = kernelPresets[5]

kawaseKernel.forEach((weight) => {
	const material = new THREE.ShaderMaterial({
		vertexShader: blurKawaseVertex,
		fragmentShader: blurKawaseFragment,
		defines: { LABEL: 'kawase' },
		uniforms: {
			tDiffuse: new THREE.Uniform(null),
			uOffset: new THREE.Uniform(weight),
		},
	})

	composer.addPass(new ShaderPass(material, 'tDiffuse'))
})

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

	composer.render()

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
	const res = new Vector2()
	renderer.getDrawingBufferSize(res)
	composer.setSize(res.x, res.y)
}
