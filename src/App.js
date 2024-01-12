import {
	Color,
	PerspectiveCamera,
	Scene,
	WebGLRenderer,
	PlaneGeometry,
	DirectionalLight,
	ShaderMaterial,
	Mesh,
	DoubleSide,
	SRGBColorSpace,
	TextureLoader,
	OrthographicCamera,
	Vector4,
	DataTexture,
	NearestFilter,
	RGBAFormat,
	FloatType,
	ACESFilmicToneMapping,
} from "three";
import { OrbitControls } from "three/examples/jsm/Addons";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";
import GUI from "lil-gui";
import { isTouchEnabledDevice } from "./helpers";

export default class App {
	constructor() {
		this.init();
	}

	init() {
		console.log("App initialised");
		this.isMobile = isTouchEnabledDevice();
		// viewport
		this.width = window.innerWidth;
		this.height = window.innerHeight;
		this.time = 0;
		this.mouse = {
			x: 0,
			y: 0,
			prevX: 0,
			prevY: 0,
			vX: 0,
			vY: 0,
		};
		this.images = [
			{ name: "/image.jpg", width: 1920, height: 2400 },
			{ name: "/image2.jpg", width: 1920, height: 1280 },
			{ name: "/image3.jpg", width: 1920, height: 2880 },
			{ name: "/image4.jpg", width: 1920, height: 1300 },
			{ name: "/image5.jpg", width: 1920, height: 2880 },
			{ name: "/image6.jpg", width: 1920, height: 2400 },
		];
		this.imageUrls = {
			"Image 1": "/image.jpg",
			"Image 2": "/image2.jpg",
			"Image 3": "/image3.jpg",
			"Image 4": "/image4.jpg",
			"Image 5": "/image5.jpg",
			"Image 6": "/image6.jpg",
		};
		this.image = { image: this.imageUrls["Image 1"] };

		this.createMouseEventListeners();
		this.createComponents();
		this.resize();
		window.addEventListener("resize", () => this.resize());
		this.render();
	}

	onMouseMove = (e) => {
		const clientX = !this.isMobile ? e.clientX : e.touches[0].clientX;
		const clientY = !this.isMobile ? e.clientY : e.touches[0].clientY;

		this.mouse.x = clientX / this.width;
		this.mouse.y = clientY / this.height;

		this.mouse.vX = this.mouse.x - this.mouse.prevX;
		this.mouse.vY = this.mouse.y - this.mouse.prevY;

		this.mouse.prevX = this.mouse.x;
		this.mouse.prevY = this.mouse.y;
	};

	createMouseEventListeners() {
		if (this.isMobile) {
			window.addEventListener("touchmove", this.onMouseMove);
		} else {
			window.addEventListener("mousemove", this.onMouseMove);
		}
	}

	createComponents() {
		this.createRenderer();
		this.createCamera();
		// this.createControls();
		this.createScene();
		this.createObjects();
		this.createGUI();
	}

	createRenderer() {
		// renderer
		this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
		this.canvas = this.renderer.domElement;
		document.getElementById("app").appendChild(this.canvas);
		this.renderer.setClearColor(0x242424, 1);
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.renderer.setSize(this.width, this.height);
		this.renderer.physicallyCorrectlights = true;
		this.renderer.outputColorSpace = SRGBColorSpace;
	}

	createCamera() {
		this.frustrumSize = 1;
		this.camera = new OrthographicCamera(
			this.frustrumSize / -2,
			this.frustrumSize / 2,
			this.frustrumSize / 2,
			this.frustrumSize / -2,
			-1000,
			1000
		);
		this.camera.position.set(0, 0, 2);
	}

	createControls() {
		// controls
		this.controls = new OrbitControls(this.camera, this.canvas);
		this.controls.enableDamping = true;
		this.controls.update();
	}

	createScene() {
		// scene
		this.scene = new Scene();
		this.scene.background = new Color(0x242424);
	}

	createLights() {
		// lights
		this.lights = [];
		this.lights[0] = new DirectionalLight(0xffffff, 5);
		this.lights[1] = new DirectionalLight(0xffffff, 5);
		this.lights[2] = new DirectionalLight(0xffffff, 5);
		this.lights[0].position.set(0, 20, 0);
		this.lights[1].position.set(10, 20, 10);
		this.lights[2].position.set(-10, -20, -10);

		this.scene.add(this.lights[0]);
		this.scene.add(this.lights[1]);
		this.scene.add(this.lights[2]);
	}

	createObjects() {
		// create a buffer with color data
		this.cellSize = this.isMobile ? 24 : 64;
		this.dataTextureWidth = this.cellSize;
		this.dataTextureHeight = this.isMobile ? this.cellSize * 2 : this.cellSize / 2;

		const size = this.dataTextureWidth * this.dataTextureHeight;
		const data = new Float32Array(4 * size);

		for (let i = 0; i < size; i++) {
			const r = Math.random();
			const stride = i * 4;
			data[stride] = r;
			data[stride + 1] = r;
			data[stride + 2] = r;
			data[stride + 3] = 255;
		}

		// used the buffer to create a DataTexture
		this.dataTexture = new DataTexture(
			data,
			this.dataTextureWidth,
			this.dataTextureHeight,
			RGBAFormat,
			FloatType,
			ACESFilmicToneMapping
		);
		this.dataTexture.minFilter = this.dataTexture.magFilter = NearestFilter;
		this.dataTexture.needsUpdate = true;

		this.planeProps = {
			width: 1,
			height: 1,
			widthSegments: 1,
			heightSegments: 1,
		};
		this.uniforms = {
			uTime: { value: 0 },
			uResolution: { value: new Vector4() },
			uTexture: { value: new TextureLoader().load(this.image.image) },
			uDataTexture: { value: this.dataTexture },
		};
		this.geometry = new PlaneGeometry(
			this.planeProps.width,
			this.planeProps.height,
			this.planeProps.widthSegments,
			this.planeProps.heightSegments
		);
		this.material = new ShaderMaterial({
			side: DoubleSide,
			uniforms: this.uniforms,
			vertexShader: vertexShader,
			fragmentShader: fragmentShader,
		});
		this.plane = new Mesh(this.geometry, this.material);
		this.scene.add(this.plane);
	}

	updateDataTexture() {
		let data = this.dataTexture.image.data;
		for (let i = 0; i < data.length; i += 4) {
			data[i] *= 0.92;
			data[i + 1] *= 0.92;
			data[i + 2] *= 0.92;
			data[i + 3] *= 0.92;
		}

		let gridMouseX = this.dataTextureWidth * this.mouse.x;
		let gridMouseY = this.dataTextureHeight * (1 - this.mouse.y);
		let maxDistance = this.isMobile ? this.dataTextureWidth / 4 : this.dataTextureWidth / 8;

		for (let i = 0; i < this.dataTextureWidth; i++) {
			for (let j = 0; j < this.dataTextureHeight; j++) {
				let distance = (gridMouseX - i) ** 2 + (gridMouseY - j) ** 2;
				let maxSq = maxDistance ** 2;

				if (distance < maxSq) {
					let index = 4 * (i + this.dataTextureWidth * j);
					let power = maxDistance / Math.sqrt(distance);
					if (distance < 1) power = 1;

					data[index] += this.mouse.vX * power * 24;
					data[index + 1] -= this.mouse.vY * power * 24;
					data[index + 2] += this.mouse.vX * power * 24;
					data[index + 3] -= this.mouse.vY * power * 24;
				}
			}
		}

		this.mouse.vX *= 0.9;
		this.mouse.vY *= 0.9;

		this.dataTexture.needsUpdate = true;
	}

	createGUI() {
		this.gui = new GUI();

		this.gui
			.add(this.image, "image", this.imageUrls)
			.listen()
			.onChange(async (e) => {
				this.material.uniforms.uTexture.value = new TextureLoader().load(this.image.image);
				this.resizeImage();
			});
	}

	resizeImage() {
		const currentImage = this.images.find((image) => image.name === this.image.image);
		this.imageAspect = currentImage.width / currentImage.height;
		let a1, a2;
		if (this.width / this.height < this.imageAspect) {
			a1 = this.width / this.height / this.imageAspect;
			a2 = 1;
		} else {
			a1 = 1;
			a2 = (this.height / this.width) * this.imageAspect;
		}

		this.material.uniforms.uResolution.value.x = this.width;
		this.material.uniforms.uResolution.value.y = this.height;
		this.material.uniforms.uResolution.value.z = a1;
		this.material.uniforms.uResolution.value.w = a2;
	}

	resize() {
		this.width = window.innerWidth;
		this.height = window.innerHeight;
		this.resizeImage();
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.renderer.setSize(this.width, this.height);
		this.camera.updateProjectionMatrix();
	}

	render() {
		requestAnimationFrame(() => this.render());
		this.time += 0.05;
		this.material.uniforms.uTime.value = this.time;
		this.renderer.render(this.scene, this.camera);
		// this.controls.update();
		this.updateDataTexture();
	}
}
