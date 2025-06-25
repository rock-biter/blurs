uniform sampler2D tDiffuse;
uniform int uRadius;
uniform vec2 uDirection;

varying vec2 vUv;

void main() {

  ivec2 iRes = textureSize(tDiffuse, 0);
  vec2 texel = 1.0 / vec2(iRes);
  vec3 diffuse = vec3(0.0);
  float normalization = 0.0;
  vec2 direction = uDirection;

  // add box blur 5x5
  // complextity O(n^2). Let's imrpove this!
  for(int x = -uRadius; x <= uRadius; x++) {
    // for(int y = -uRadius; y <= uRadius; y++) {
      vec2 uv = vUv + float(x) * texel * direction;
      vec3 c = texture(tDiffuse, uv).rgb;
      diffuse += c;
      normalization += 1.0;
    // }
  }

  diffuse /= normalization;

  if(vUv.x < 0.5) {
    diffuse = texture(tDiffuse, vUv).rgb;
  }

  gl_FragColor = vec4(diffuse, 1.0);

  #include <tonemapping_fragment>
	#include <colorspace_fragment>

}