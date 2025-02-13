let score = 0;
const keys = {};
let yaw = Math.PI / 4;
let pitch = Math.PI / 8;
const cameraDistance = 0.01;
let velocityY = 0;
let isJumping = false;
const gravity = -120;
const jumpStrength = 30;

// Pointer lock for mouse control
document.body.requestPointerLock = document.body.requestPointerLock || document.body.mozRequestPointerLock;
document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
document.body.addEventListener('click', () => document.body.requestPointerLock());

document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement) {
        document.addEventListener('mousemove', handleMouseMove, false);
    } else {
        document.removeEventListener('mousemove', handleMouseMove, false);
    }
});

function handleMouseMove(event) {
    const sensitivity = 0.002;
    yaw += event.movementX * sensitivity; // Moving mouse right looks right
    pitch += event.movementY * sensitivity; // Moving mouse up looks up
    pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
    updateCamera();
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0x606060);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

const floorGeometry = new THREE.PlaneGeometry(100, 100);
const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x8B7355 });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const playerGeometry = new THREE.BoxGeometry(1, 2.02, 1);
const playerMaterial = new THREE.MeshPhongMaterial({ color: 0x51cf0e });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.castShadow = true;
scene.add(player);
player.position.set(0, 1, 0);

// Buildings and obstacles
const buildings = [];
function createBuilding(x, z, width, height, depth) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshPhongMaterial({ color: 0xAAAAAA });
    const building = new THREE.Mesh(geometry, material);
    building.position.set(x, height / 2, z);
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);
    buildings.push(building);
}

// Creating buildings similar to de_dust2
createBuilding(-10, -10, 10, 5, 10);
createBuilding(15, 5, 15, 8, 10);
createBuilding(-20, 20, 20, 6, 15);
createBuilding(5, -15, 10, 5, 10);

// Border walls to prevent player from going out of bounds
const borderWalls = [];
function createBorderWall(x, z, width, height, depth) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshPhongMaterial({ color: 0x555555 });
    const wall = new THREE.Mesh(geometry, material);
    wall.position.set(x, height / 2, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
    borderWalls.push(wall);
}

const mapSize = 50;
createBorderWall(-mapSize, 0, 2, 10, 100);
createBorderWall(mapSize, 0, 2, 10, 100);
createBorderWall(0, -mapSize, 100, 10, 2);
createBorderWall(0, mapSize, 100, 10, 2);

function updateCamera() {
    camera.position.x = player.position.x + cameraDistance * Math.cos(yaw) * Math.cos(pitch);
    camera.position.y = player.position.y + cameraDistance * Math.sin(pitch) + 1;
    camera.position.z = player.position.z + cameraDistance * Math.sin(yaw) * Math.cos(pitch);
    camera.lookAt(player.position.x, player.position.y + 1, player.position.z);
}

window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === ' ' && !isJumping) {
        velocityY = jumpStrength;
        isJumping = true;
    }
});

window.addEventListener('keyup', (e) => {
    delete keys[e.key.toLowerCase()];
});

function movePlayer(delta) {
    const speed = 7 * delta;
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();

    const right = new THREE.Vector3().crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();
    let moveX = 0, moveZ = 0;

    if (keys['w']) {
        moveX += direction.x * speed;
        moveZ += direction.z * speed;
    }
    if (keys['s']) {
        moveX -= direction.x * speed;
        moveZ -= direction.z * speed;
    }
    if (keys['a']) {
        moveX -= right.x * speed;
        moveZ -= right.z * speed;
    }
    if (keys['d']) {
        moveX += right.x * speed;
        moveZ += right.z * speed;
    }

    let newX = player.position.x + moveX;
    let newZ = player.position.z + moveZ;
    let canMove = true;

    for (let obstacle of [...buildings, ...borderWalls]) {
        const bx = obstacle.position.x;
        const bz = obstacle.position.z;
        const bw = obstacle.geometry.parameters.width / 2;
        const bd = obstacle.geometry.parameters.depth / 2;

        if (newX > bx - bw && newX < bx + bw && newZ > bz - bd && newZ < bz + bd) {
            canMove = false;
            break;
        }
    }

    if (canMove) {
        player.position.x = newX;
        player.position.z = newZ;
    }

    player.position.y += velocityY * delta;
    velocityY += gravity * delta;
    if (player.position.y <= 1) {
        player.position.y = 1;
        isJumping = false;
    }
}

let lastTime = 0;
function animate(time) {
    let delta = (time - lastTime) / 1000;
    lastTime = time;
    
    movePlayer(delta);
    updateCamera();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

updateCamera();
animate(0);
