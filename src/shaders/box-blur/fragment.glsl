uniform sampler2D tDiffuse;
uniform int uRadius;
uniform vec2 uDirection;

varying vec2 vUv;
varying float VNormalization;
varying vec4 vUv0;
varying vec4 vUv1;
varying vec4 vUv2;
varying vec4 vUv3;
varying vec4 vUv4;
varying vec4 vUv5;
varying vec4 vUv6;
varying vec4 vUv7;
varying vec4 vUv8;
varying vec4 vUv9;
varying vec4 vUv10;

void main() {

  // ivec2 iRes = textureSize(tDiffuse, 0);
  // vec2 texel = 1.0 / vec2(iRes);
  vec3 diffuse = vec3(0.0);
  // float normalization = 0.0;
  // vec2 direction = uDirection;

  // // add box blur 5x5
  // // complextity O(n^2). Let's imrpove this!
  // for(int x = -uRadius; x <= uRadius; x++) {
  //   // for(int y = -uRadius; y <= uRadius; y++) {
  //     vec2 uv = vUv + float(x) * texel * direction;
  //     vec3 c = texture(tDiffuse, uv).rgb;
  //     diffuse += c;
  //     normalization += 1.0;
  //   // }
  // }
  diffuse += texture(tDiffuse, vUv0.xy).rgb;
  diffuse += texture(tDiffuse, vUv1.xy).rgb;
  diffuse += texture(tDiffuse, vUv2.xy).rgb;
  diffuse += texture(tDiffuse, vUv3.xy).rgb;
  diffuse += texture(tDiffuse, vUv4.xy).rgb;
  diffuse += texture(tDiffuse, vUv5.xy).rgb;
  diffuse += texture(tDiffuse, vUv6.xy).rgb;
  diffuse += texture(tDiffuse, vUv7.xy).rgb;
  diffuse += texture(tDiffuse, vUv8.xy).rgb;
  diffuse += texture(tDiffuse, vUv9.xy).rgb;
  diffuse += texture(tDiffuse, vUv10.xy).rgb;

  diffuse += texture(tDiffuse, vUv1.zw).rgb;
  diffuse += texture(tDiffuse, vUv2.zw).rgb;
  diffuse += texture(tDiffuse, vUv3.zw).rgb;
  diffuse += texture(tDiffuse, vUv4.zw).rgb;
  diffuse += texture(tDiffuse, vUv5.zw).rgb;
  diffuse += texture(tDiffuse, vUv6.zw).rgb;
  diffuse += texture(tDiffuse, vUv7.zw).rgb;
  diffuse += texture(tDiffuse, vUv8.zw).rgb;
  diffuse += texture(tDiffuse, vUv9.zw).rgb;
  diffuse += texture(tDiffuse, vUv10.zw).rgb;
  diffuse /= 21.;

  gl_FragColor = vec4(diffuse, 1.0);

  #include <tonemapping_fragment>
	#include <colorspace_fragment>

}