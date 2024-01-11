uniform float uTime;
uniform vec4 uResolution;
uniform sampler2D uTexture;
uniform sampler2D uDataTexture;
varying vec2 vUv;
varying vec3 vPosition;

void main() {
    vec2 newUv = (vUv - vec2(0.5)) * uResolution.zw + vec2(0.5);
    vec4 map = texture2D(uTexture, newUv);
    vec4 offset = texture2D(uDataTexture, vUv);
    gl_FragColor = offset;
    gl_FragColor = texture2D(uTexture, newUv - 0.02 * offset.rg);
}