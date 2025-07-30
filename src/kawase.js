import {
	BufferAttribute,
	BufferGeometry,
	HalfFloatType,
	LinearFilter,
	Mesh,
	PerspectiveCamera,
	RGBAFormat,
	Scene,
	ShaderMaterial,
	Uniform,
	Vector4,
	WebGLRenderTarget,
} from 'three'

const kernelPresets = [
	[0.0, 0.0],
	[0.0, 1.0, 1.0],
	[0.0, 1.0, 1.0, 2.0],
	[0.0, 1.0, 2.0, 2.0, 3.0],
	[0.0, 1.0, 2.0, 3.0, 4.0, 4.0, 5.0],
	[0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0],
	[],
]

export default class kawase {
	constructor(renderer, kernel = 3, width = 750, height = 300, scale = 1) {
		this.renderer = renderer
		this.scale = scale
		this.setKernel(kernel)

		this.sizes = {
			width,
			height,
		}

		this.initRT()
		this.initScene()
	}

	resize(width, height) {
		this.sizes = {
			width,
			height,
		}

		this.setTexelSize()
		this.material.uniforms.uTexelSize.value = this.texelSize

		this.rt1.setSize(this.sizes.width, this.sizes.height)
		this.rt2.setSize(this.sizes.width, this.sizes.height)
		this.inputRT.setSize(this.sizes.width, this.sizes.height)
	}

	initRT() {
		this.rt1 = this.createRT(this.sizes.width, this.sizes.height)
		this.rt2 = this.createRT(this.sizes.width, this.sizes.height)
		this.inputRT = this.createRT(this.sizes.width, this.sizes.height)
	}

	setTexelSize() {
		this.texelSize = new Vector4()
		this.texelSize.x = 1 / this.sizes.width
		this.texelSize.y = 1 / this.sizes.height
		this.texelSize.z = this.texelSize.x * 0.5
		this.texelSize.w = this.texelSize.y * 0.5
	}

	setKernel(kernel) {
		this.kernel = kernelPresets[kernel] || kernelPresets[3]
	}

	setScale(scale) {
		this.scale = scale
		this.material.uniforms.uScale.value = this.scale
	}

	initScene() {
		this.scene = new Scene()
		this.camera = new PerspectiveCamera(75, 1, 0.1, 1)

		this.geometry = new BufferGeometry()
		this.geometry.setAttribute(
			'position',
			new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3)
		)
		this.geometry.setAttribute(
			'uv',
			new BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2)
		)

		this.setTexelSize()

		this.material = new ShaderMaterial({
			vertexShader: /* glsl */ `
      uniform float uOffset;
      uniform vec4 uTexelSize;
      uniform float uScale;
      uniform sampler2D tDiffuse;

      varying vec2 vUv0; // top left
      varying vec2 vUv1; // top right
      varying vec2 vUv2; // bottom right
      varying vec2 vUv3; // bottom left
      varying vec2 vUv;

      void main() {
        vUv = uv;
        ivec2 size = textureSize(tDiffuse, 0);
        vec4 texel = vec4(1. / vec2(size.xy), 0.5 / vec2(size.xy)); 

        vec2 dUv = (texel.xy * vec2(uOffset) ) * uScale + texel.zw;
        vUv0 = uv + vec2(-dUv.x, dUv.y);
        vUv1 = uv + vec2(dUv.x, dUv.y);
        vUv2 = uv + vec2(dUv.x, -dUv.y);
        vUv3 = uv + vec2(-dUv.x, -dUv.y);

        gl_Position = vec4(position, 1.0);
      }
      `,
			fragmentShader: /* glsl */ `
      uniform sampler2D tDiffuse;
      
      varying vec2 vUv0; // top left
      varying vec2 vUv1; // top right
      varying vec2 vUv2; // bottom right
      varying vec2 vUv3; // bottom left
      varying vec2 vUv;
      
      void main() {

        vec4 color = texture(tDiffuse, vUv0);
        color += texture(tDiffuse, vUv1);
        color += texture(tDiffuse, vUv2);
        color += texture(tDiffuse, vUv3);
        color *= 0.25;

        gl_FragColor = color;

        #include <tonemapping_fragment>
	      #include <colorspace_fragment>

      }

      `,
			uniforms: {
				tDiffuse: new Uniform(this.inputRT.texture),
				uOffset: new Uniform(0.0),
				uTexelSize: new Uniform(this.texelSize),
				uScale: new Uniform(this.scale),
			},
		})

		this.triangle = new Mesh(this.geometry, this.material)
		this.scene.add(this.triangle)
	}

	swap() {
		const tmp = this.rt1
		this.rt1 = this.rt2
		this.rt2 = tmp
	}

	createRT(width, height) {
		const RT = new WebGLRenderTarget(width, height, {
			format: RGBAFormat,
			depthBuffer: true,
			stencilBuffer: false,
			minFilter: LinearFilter,
			magFilter: LinearFilter,
			type: HalfFloatType,
		})

		return RT
	}

	render() {
		this.prevBuffer = this.inputRT
		// // loop through the kernel
		for (let i = 0; i < this.kernel.length; i++) {
			const buffer = (i & 1) === 0 ? this.rt1 : this.rt2
			this.material.uniforms.uOffset.value = this.kernel[i]
			this.material.uniforms.tDiffuse.value = this.prevBuffer.texture
			this.renderer.setRenderTarget(buffer)
			this.renderer.render(this.scene, this.camera)
			this.prevBuffer = buffer
		}

		this.renderer.setRenderTarget(null)
	}

	getCurrentBuffer() {
		return this.prevBuffer
	}
}
