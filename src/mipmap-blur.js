import {
	BufferAttribute,
	BufferGeometry,
	HalfFloatType,
	LinearFilter,
	Mesh,
	NearestFilter,
	RGBAFormat,
	Uniform,
	WebGLRenderTarget,
} from 'three'
import { ShaderMaterial } from 'three'
import { PerspectiveCamera } from 'three'
import { Scene } from 'three'

export default class MipmapBlur {
	downsamplingMipmaps = []
	upsamplingMipmaps = []

	constructor(renderer, levels = 8, width = 1, height = 1, radius = 0.0) {
		this.renderer = renderer
		this.radius = radius

		this.resolution = { width, height }

		this.upsamplingMaterial = UpsamplingMatearial(this.radius)
		this.downsamplingMaterial = DownsamplingMatearial()

		this.renderTarget = new WebGLRenderTarget(1, 1, {
			format: RGBAFormat,
			depthBuffer: false,
			stencilBuffer: false,
			minFilter: LinearFilter,
			magFilter: LinearFilter,
			type: HalfFloatType,
		})
		this.renderTarget.texture.name = 'Upsampling.Mipmap0'

		this.levels = levels

		this.initScene()
	}

	/**
	 * @type {number}
	 * @param {number} value
	 */
	set levels(value) {
		if (this.levels !== value) {
			const rt = this.renderTarget

			// dispose
			this.dispose()
			this.downsamplingMipmaps = []
			this.upsamplingMipmaps = []

			for (let i = 0; i < value; i++) {
				const mipmap = rt.clone()
				mipmap.texture.name = 'Downsampling.Mipmap' + i
				this.downsamplingMipmaps.push(mipmap)
			}

			this.upsamplingMipmaps.push(this.renderTarget)

			for (let i = 1; i < value - 1; i++) {
				const mipmap = rt.clone()
				mipmap.texture.name = 'Upsampling.Mipmap' + i
				this.upsamplingMipmaps.push(mipmap)
			}

			this.setSize(this.resolution.width, this.resolution.height)
		}
	}

	setSize(width, height) {
		const res = this.resolution
		res.width = width
		res.height = height

		let w = width,
			h = height
		for (let i = 0; i < this.downsamplingMipmaps.length; i++) {
			w = Math.floor(w * 0.5)
			h = Math.floor(h * 0.5)

			this.downsamplingMipmaps[i].setSize(w, h)
			if (i < this.upsamplingMipmaps.length) {
				this.upsamplingMipmaps[i].setSize(w, h)
			}
		}
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

		this.triangle = new Mesh(this.geometry, this.downsamplingMaterial)
		this.scene.add(this.triangle)
	}

	dispose() {
		this.upsamplingMipmaps.forEach((mipmap) => mipmap.dispose())
		this.downsamplingMipmaps.forEach((mipmap) => mipmap.dispose())
	}

	render(inputBuffer, outputBuffer) {
		let prevBuffer = inputBuffer
		this.triangle.material = this.downsamplingMaterial

		for (let i = 0; i < this.downsamplingMipmaps.length; i++) {
			const mipmap = this.downsamplingMipmaps[i]
			this.downsamplingMaterial.uniforms.inputBuffer.value = prevBuffer.texture
			this.renderer.setRenderTarget(mipmap)
			this.renderer.render(this.scene, this.camera)
			prevBuffer = mipmap
		}

		this.triangle.material = this.upsamplingMaterial

		for (let i = this.upsamplingMipmaps.length - 1; i >= 0; i--) {
			const mipmap = this.upsamplingMipmaps[i]
			this.upsamplingMaterial.uniforms.inputBuffer.value = prevBuffer.texture
			this.upsamplingMaterial.uniforms.supportBuffer.value =
				this.downsamplingMipmaps[i].texture
			this.renderer.setRenderTarget(mipmap)
			this.renderer.render(this.scene, this.camera)
			prevBuffer = mipmap
		}

		const mipmap = outputBuffer
		this.upsamplingMaterial.uniforms.inputBuffer.value = prevBuffer.texture
		this.upsamplingMaterial.uniforms.supportBuffer.value = inputBuffer.texture

		this.renderer.setRenderTarget(mipmap)
		this.renderer.render(this.scene, this.camera)
	}
}

const DownsamplingMatearial = () =>
	new ShaderMaterial({
		vertexShader: /* glsl */ `
			uniform sampler2D inputBuffer;
      varying vec2 vUv;

      varying vec2 vUv00;
      varying vec2 vUv01;
      varying vec2 vUv02;
      varying vec2 vUv03;

      varying vec2 vUv04;
      varying vec2 vUv05;
      varying vec2 vUv06;
      varying vec2 vUv07;
      varying vec2 vUv08;
      varying vec2 vUv09;
      varying vec2 vUv10;
      varying vec2 vUv11;

      void main() {
        vUv = uv;
				ivec2 size = textureSize(inputBuffer, 0);
				vec2 texel = vec2(1.0 / vec2(size));

				vUv00 = vUv + texel * vec2(-1., 1.);
				vUv01 = vUv + texel * vec2(1., 1.);
				vUv02 = vUv + texel * vec2(-1., -1.);
				vUv03 = vUv + texel * vec2(1., -1.);

				vUv04 = vUv + texel * vec2(-2., 2.);
				vUv05 = vUv + texel * vec2(0., 2.);
				vUv06 = vUv + texel * vec2(2., 2.);
				vUv07 = vUv + texel * vec2(-2., 0.);
				vUv08 = vUv + texel * vec2(2., 0.);
				vUv09 = vUv + texel * vec2(-2., -2.);
				vUv10 = vUv + texel * vec2(0., -2.);
				vUv11 = vUv + texel * vec2(2., -2.);

        gl_Position = vec4(position, 1.0);
      }
    `,
		fragmentShader: /* glsl */ `
			// (1 / 4) * 0.5 = 0.125
			#define WEIGHT_INNER 0.125
			// (1 / 9) * 0.5 = 0.0555555
			#define WEIGHT_OUTER 0.0555555

      uniform sampler2D inputBuffer;
      varying vec2 vUv;

			varying vec2 vUv00;
      varying vec2 vUv01;
      varying vec2 vUv02;
      varying vec2 vUv03;

      varying vec2 vUv04;
      varying vec2 vUv05;
      varying vec2 vUv06;
      varying vec2 vUv07;
      varying vec2 vUv08;
      varying vec2 vUv09;
      varying vec2 vUv10;
      varying vec2 vUv11;

      void main() {
        vec4 c = vec4(0.0);

				c += texture(inputBuffer, vUv) * WEIGHT_OUTER;
				c += texture(inputBuffer, vUv00) * WEIGHT_INNER;
				c += texture(inputBuffer, vUv01) * WEIGHT_INNER;
				c += texture(inputBuffer, vUv02) * WEIGHT_INNER;
				c += texture(inputBuffer, vUv03) * WEIGHT_INNER;

				c += texture(inputBuffer, vUv04) * WEIGHT_OUTER;
				c += texture(inputBuffer, vUv05) * WEIGHT_OUTER;
				c += texture(inputBuffer, vUv06) * WEIGHT_OUTER;
				c += texture(inputBuffer, vUv07) * WEIGHT_OUTER;
				c += texture(inputBuffer, vUv08) * WEIGHT_OUTER;
				c += texture(inputBuffer, vUv09) * WEIGHT_OUTER;
				c += texture(inputBuffer, vUv10) * WEIGHT_OUTER;
				c += texture(inputBuffer, vUv11) * WEIGHT_OUTER;

        gl_FragColor = c;

        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
		uniforms: {
			inputBuffer: new Uniform(null), // to be set later
		},
	})

const UpsamplingMatearial = (radius) =>
	new ShaderMaterial({
		vertexShader: /* glsl */ `
			uniform sampler2D inputBuffer;
      varying vec2 vUv;

			varying vec2 vUv00;
      varying vec2 vUv01;
      varying vec2 vUv02;
      varying vec2 vUv03;

      varying vec2 vUv04;
      varying vec2 vUv05;
      varying vec2 vUv06;
      varying vec2 vUv07;

      void main() {
        vUv = uv;
				ivec2 size = textureSize(inputBuffer, 0);
				vec2 texel = vec2(1.0 / vec2(size));

				vUv00 = vUv + texel * vec2(-1., 0.);
				vUv01 = vUv + texel * vec2(1., 0.);
				vUv02 = vUv + texel * vec2(0., 1.);
				vUv03 = vUv + texel * vec2(0., -1.);

				vUv04 = vUv + texel * vec2(-1., 1.);
				vUv05 = vUv + texel * vec2(1., 1.);
				vUv06 = vUv + texel * vec2(-1., -1.);
				vUv07 = vUv + texel * vec2(1., -1.);

        gl_Position = vec4(position, 1.0);
      }
    `,
		fragmentShader: /* glsl */ `
      uniform sampler2D inputBuffer;
      uniform sampler2D supportBuffer;
			uniform float radius;
      varying vec2 vUv;

			varying vec2 vUv00;
      varying vec2 vUv01;
      varying vec2 vUv02;
      varying vec2 vUv03;

      varying vec2 vUv04;
      varying vec2 vUv05;
      varying vec2 vUv06;
      varying vec2 vUv07;

      void main() {
        vec4 c = texture(inputBuffer, vUv) * 0.25;
				c += texture(inputBuffer, vUv00) * 0.125;
				c += texture(inputBuffer, vUv01) * 0.125;
				c += texture(inputBuffer, vUv02) * 0.125;
				c += texture(inputBuffer, vUv03) * 0.125;
				c += texture(inputBuffer, vUv04) * 0.0625;
				c += texture(inputBuffer, vUv05) * 0.0625;
				c += texture(inputBuffer, vUv06) * 0.0625;
				c += texture(inputBuffer, vUv07) * 0.0625;

				vec4 baseColor = texture(supportBuffer, vUv);

        gl_FragColor = mix(baseColor, c, radius);

        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
		uniforms: {
			inputBuffer: new Uniform(null), // to be set later
			supportBuffer: new Uniform(null), // to be set later
			radius: new Uniform(radius),
		},
	})
