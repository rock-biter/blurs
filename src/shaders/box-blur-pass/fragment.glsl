uniform sampler2D tDiffuse;
uniform int uRadius;
uniform vec2 uDirection;
uniform float uSigma;

varying vec2 vUv;

void main() {

  ivec2 res = textureSize(tDiffuse, 0);

  vec2 texel = 1. / vec2(res); 
  vec3 diffuse = vec3(0); //texture(tDiffuse, vUv).rgb;
  float normalization = 0.0;

  float sigma = uSigma;
  float size = float(uRadius) * 2. + 1.;
  float halfSize = float(uRadius);

  float kernel[60];
  float sum = 0.0;
  for(int i = 0; i < int(size); i++) {
    float x = float(i) - halfSize;
    float w = exp(-(x * x) / (2. * sigma * sigma));
    kernel[i] = w;
    sum += w;
  }

  for(int i = 0; i < int(size); i++) {
    kernel[i] /= sum;
  }

  for(int x = -uRadius; x <= uRadius; x++) {
    // for(int y = -uRadius; y <= uRadius; y++) {
      vec2 uv = vUv + texel * float(x) * uDirection;
      vec3 tColor = texture(tDiffuse, uv).rgb;
      // tColor = pow(tColor, vec3(2.2)); // gamma correction
      int i = x + int(halfSize);

      // float w = 1.0 - abs(float(x)) / float(uRadius);
      float w = kernel[i];
      // diffuse += tColor;
      diffuse += tColor * w;
      // normalization +=  1.;
      normalization += w;
    // }
  }

  diffuse /= normalization;
  // diffuse = pow(diffuse, vec3(1.0 / 2.2)); // gamma correction
  // diffuse.rg = vUv;

  gl_FragColor = vec4(diffuse, 1.0);

  #include <tonemapping_fragment>
	#include <colorspace_fragment>

}