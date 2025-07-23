uniform sampler2D tDiffuse;
uniform int uRadius;
uniform float uSigma;
uniform vec2 uDirection;

varying vec2 vUv;

void main() {

  float sigma = uSigma;
  float size = float(uRadius) * 2. + 1.0;
  float kernel[61];
  float normalization = 0.0;
  for(int i = 0; i < int(size); i++) {
    float x = float(i - uRadius);
    float w = exp(-(x * x) / (2. * sigma * sigma));
    kernel[i] = w;
    normalization += w;
  }


  ivec2 iRes = textureSize(tDiffuse, 0);
  vec2 texel = 1.0 / vec2(iRes);
  vec3 diffuse = vec3(0.0);
  vec2 direction = uDirection;

  // add box blur 5x5
  // complextity O(n^2). Let's imrpove this!
  for(int x = 0; x < int(size); x++) {
    // for(int y = -uRadius; y <= uRadius; y++) {
      vec2 uv = vUv + float(x - uRadius) * texel * direction;
      vec3 c = texture(tDiffuse, uv).rgb;
      float w = kernel[x];
      w /= normalization;
      diffuse += c * w;
    // }
  }

  // diffuse /= normalization;

  gl_FragColor = vec4(diffuse, 1.0);

  #include <tonemapping_fragment>
	#include <colorspace_fragment>

}