uniform sampler2D tDiffuse;
uniform float uOffset;

varying vec2 vUv;

void main() {

  ivec2 res = textureSize(tDiffuse, 0);

  vec2 texel = 1. / vec2(res); 
  vec3 diffuse = vec3(0);
  diffuse += texture(tDiffuse, vUv + texel * uOffset * vec2(1,1)).rgb;
  diffuse += texture(tDiffuse, vUv + texel * uOffset * vec2(-1,-1)).rgb;
  diffuse += texture(tDiffuse, vUv + texel * uOffset * vec2(-1,1)).rgb;
  diffuse += texture(tDiffuse, vUv + texel * uOffset * vec2(1,-1)).rgb;
  diffuse /= 4.0;

  gl_FragColor = vec4(diffuse, 1.0);

  #include <tonemapping_fragment>
	#include <colorspace_fragment>

}