import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';

// Debug UI
const gui = new GUI();

//Node Class
class Node {
    constructor(x, y, z) {
        this.position = new THREE.Vector3(x, y, z);
    }
}

//Edge Class
class Edge {
    constructor(startNode, endNode, edgeColor) {
        this.mesh = this.createEdge(startNode, endNode, edgeColor);
    }

    createEdge(startNode, endNode, edgeColor) {
        const start = startNode.position;
        const end = endNode.position;

        const direction = new THREE.Vector3().subVectors(end, start);
        const length = direction.length();

        const geometry = new THREE.CylinderGeometry(0.02, 0.02, length, 16);
        const material = new THREE.MeshStandardMaterial({ color: edgeColor, metalness: 0.7, roughness: 0.2 });
        const mesh = new THREE.Mesh(geometry, material);

        const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        mesh.position.copy(midpoint);

        const axis = new THREE.Vector3(0, 1, 0);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, direction.clone().normalize());
        mesh.setRotationFromQuaternion(quaternion);

        return mesh;
    }
}

//Cube Structure
class CubeStructure {
    constructor(edgeColor) {
        this.group = new THREE.Group();
        this.edgeColor = edgeColor;
        this.createEdges();
    }

    createNodes(length, width, height) {
        const positions = [
            [-length / 2, -height / 2, -width / 2], [length / 2, -height / 2, -width / 2],
            [length / 2, -height / 2, width / 2], [-length / 2, -height / 2, width / 2],
            [-length / 2, height / 2, -width / 2], [length / 2, height / 2, -width / 2],
            [length / 2, height / 2, width / 2], [-length / 2, height / 2, width / 2]
        ];
        return positions.map(pos => new Node(...pos));
    }

    createEdges() {
        this.group.clear();
        this.nodes = this.createNodes(settings.length, settings.width, settings.height);

        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 0],
            [4, 5], [5, 6], [6, 7], [7, 4],
            [0, 4], [1, 5], [2, 6], [3, 7]
        ];

        connections.forEach(([start, end]) => {
            const edge = new Edge(this.nodes[start], this.nodes[end], settings.edgeColor);
            this.group.add(edge.mesh);
        });
    }
}

// Scene setup
const canvas = document.querySelector('canvas.webgl');
const scene = new THREE.Scene();

const settings = {
    length: 1,
    width: 1,
    height: 1,
    edgeColor: 0x00ff00,
    backgroundColor: 0x000000,
    lightIntensity: 0.8,
    speed: 0.01
};

const cubeStructure = new CubeStructure(settings.edgeColor);
scene.add(cubeStructure.group);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, settings.lightIntensity);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(2, 2, 2);
scene.add(camera);

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// GUI Controls
const folder = gui.addFolder('Structure Settings');
folder
    .add(settings, 'length', 0.5, 2, 0.1).onChange(() => cubeStructure.createEdges());
folder
    .add(settings, 'width', 0.5, 2, 0.1).onChange(() => cubeStructure.createEdges());
folder
    .add(settings, 'height', 0.5, 2, 0.1).onChange(() => cubeStructure.createEdges());
folder
    .addColor(settings, 'edgeColor').onChange(() => cubeStructure.createEdges());
folder
    .add(settings, 'speed', 0.001, 0.05, 0.001).name('Rotation Speed');
folder
    .addColor(settings, 'backgroundColor').name('Background Color').onChange(value => renderer.setClearColor(value));
folder
    .add(settings, 'lightIntensity', 0, 2, 0.01).name('Light Intensity').onChange(value => { directionalLight.intensity = value; });

// Animation Loop
function animate() {
    controls.update();
    const quaternion = new THREE.Quaternion();
    quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), settings.speed);
    cubeStructure.group.quaternion.multiplyQuaternions(quaternion, cubeStructure.group.quaternion);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();
