uniform float uTime;
uniform vec4 uResolution;
uniform sampler2D uTexture;
varying vec2 vUv;
varying vec3 vPosition;

void main() {
	vUv = uv;
	vPosition = position;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}