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

  vUv = uv;

  ivec2 iRes = textureSize(tDiffuse, 0);
  vec2 texel = 1.0 / vec2(iRes);
  vec3 diffuse = vec3(0.0);
  float normalization = 0.0;
  vec2 direction = uDirection;

  vUv0.xy = uv + texel * uDirection * 0.0;
  vUv1.xy = uv + texel * uDirection * 1.0;
  vUv1.zw = uv + texel * uDirection * -1.0;
  vUv2.xy = uv + texel * uDirection * 2.0;
  vUv2.zw = uv + texel * uDirection * -2.0;
  vUv3.xy = uv + texel * uDirection * 3.0;
  vUv3.zw = uv + texel * uDirection * -3.0;
  vUv4.xy = uv + texel * uDirection * 4.0;
  vUv4.zw = uv + texel * uDirection * -4.0;
  vUv5.xy = uv + texel * uDirection * 5.0;
  vUv5.zw = uv + texel * uDirection * -5.0;
  vUv6.xy = uv + texel * uDirection * 6.0;
  vUv6.zw = uv + texel * uDirection * -6.0;
   vUv7.xy = uv + texel * uDirection * 7.0;
  vUv7.zw = uv + texel * uDirection * -7.0;

   vUv8.xy = uv + texel * uDirection * 8.0;
  vUv8.zw = uv + texel * uDirection * -8.0;

   vUv9.xy = uv + texel * uDirection * 9.0;
  vUv9.zw = uv + texel * uDirection * -9.0;

   vUv10.xy = uv + texel * uDirection * 10.0;
  vUv10.zw = uv + texel * uDirection * -10.0;
  gl_Position = vec4(position, 1.0);
}