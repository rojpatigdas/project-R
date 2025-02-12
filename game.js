let score = 0;
const keys = {};
let yaw = Math.PI / 4;  // Initial horizontal angle
let pitch = Math.PI / 8; // Initial vertical angle
const cameraDistance = 8; // Distance from player

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// Player (Red Cube)
const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
const playerMaterial = new THREE.MeshPhongMaterial({ color: 0x51cf0e });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
scene.add(player);
player.position.y = 0.5;

// Floor
const floorGeometry = new THREE.PlaneGeometry(20, 20);
const floorMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// Mouse control variables
let isMouseDown = false;
let mouseX = 0;
let mouseY = 0;

// Update camera position based on mouse
function updateCamera() {
    camera.position.x = player.position.x + cameraDistance * Math.cos(yaw) * Math.cos(pitch);
    camera.position.y = player.position.y + cameraDistance * Math.sin(pitch);
    camera.position.z = player.position.z + cameraDistance * Math.sin(yaw) * Math.cos(pitch);
    camera.lookAt(player.position);
}

// Mouse event handlers
document.addEventListener('mousedown', (e) => {
    isMouseDown = true;
    mouseX = e.clientX;
    mouseY = e.clientY;
});

document.addEventListener('mouseup', () => isMouseDown = false);

document.addEventListener('mousemove', (e) => {
    if (isMouseDown) {
        const deltaX = e.clientX - mouseX;
        const deltaY = e.clientY - mouseY;
        
        // Adjust camera angles
        yaw += deltaX * 0.005;
        pitch -= deltaY * 0.005;
        
        // Constrain vertical rotation
        pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch));
        
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        updateCamera();
    }
});

// Collectibles array
const collectibles = [];

function spawnCollectible() {
    const geometry = new THREE.SphereGeometry(0.5);
    const material = new THREE.MeshPhongMaterial({ color: 0x454546 });
    const collectible = new THREE.Mesh(geometry, material);
    collectible.position.x = (Math.random() - 0.5) * 10;
    collectible.position.z = (Math.random() - 0.5) * 10;
    collectible.position.y = 0.5;
    scene.add(collectible);
    collectibles.push(collectible);
}

// Input Handling
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => delete keys[e.key]);

// Game Loop
let delta = 0;
let lastTime = 0;
function animate(time) {
    delta = (time - lastTime) / 1000;
    lastTime = time;

    // Player movement relative to camera
    const speed = 5;
    const forward = new THREE.Vector3(
        Math.sin(yaw),
        0,
        Math.cos(yaw)
    ).normalize();
    
    const right = new THREE.Vector3(
        Math.cos(yaw),
        0,
        -Math.sin(yaw)
    ).normalize();

    if (keys['s'] || keys['ArrowUp']) {
        player.position.add(forward.multiplyScalar(speed * delta));
    }
    if (keys['w'] || keys['ArrowDown']) {
        player.position.add(forward.multiplyScalar(-speed * delta));
    }
    if (keys['a'] || keys['ArrowLeft']) {
        player.position.add(right.multiplyScalar(-speed * delta));
    }
    if (keys['d'] || keys['ArrowRight']) {
        player.position.add(right.multiplyScalar(speed * delta));
    }

    // Keep player on floor
    player.position.y = 0.5;

    // Update camera position
    updateCamera();

    // Collision detection
    collectibles.forEach((collectible, index) => {
        if (player.position.distanceTo(collectible.position) < 1) {
            scene.remove(collectible);
            collectibles.splice(index, 1);
            score++;
            document.getElementById('score').textContent = `Score: ${score}`;
            spawnCollectible();
        }
    });

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

// Initialize game
for (let i = 0; i < 5; i++) spawnCollectible();
updateCamera(); // Set initial camera position
animate(0);

// Window resize handling
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});