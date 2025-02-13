let score = 0;
const keys = {};
let yaw = Math.PI / 4;
let pitch = Math.PI / 8;
const cameraDistance = 8;

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Score Display
const scoreDisplay = document.createElement('div');
scoreDisplay.style.position = 'absolute';
scoreDisplay.style.top = '10px';
scoreDisplay.style.left = '10px';
scoreDisplay.style.fontSize = '20px';
scoreDisplay.style.color = 'white';
scoreDisplay.style.fontFamily = 'Arial, sans-serif';
scoreDisplay.innerHTML = `Score: ${score}`;
document.body.appendChild(scoreDisplay);

// Lighting
const ambientLight = new THREE.AmbientLight(0x606060);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Maze Configuration
const mazeSize = 21;
const wallSize = 2;
let maze;

// Floor
//commented out for now, will add flor later
// const floorGeometry = new THREE.PlaneGeometry(mazeSize * wallSize, mazeSize * wallSize);
// const floorMaterial = new THREE.MeshPhongMaterial({ color: 0xaaaaaa });
// const floor = new THREE.Mesh(floorGeometry, floorMaterial);
// floor.rotation.x = -Math.PI / 2;
// floor.receiveShadow = true;
// scene.add(floor);

// Player
const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
const playerMaterial = new THREE.MeshPhongMaterial({ color: 0x51cf0e });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.castShadow = true;
scene.add(player);
player.position.y = 0.5;

// Camera Controls
function updateCamera() {
    camera.position.x = player.position.x + cameraDistance * Math.cos(yaw) * Math.cos(pitch);
    camera.position.y = player.position.y + cameraDistance * Math.sin(pitch);
    camera.position.z = player.position.z + cameraDistance * Math.sin(yaw) * Math.cos(pitch);
    camera.lookAt(player.position);
}

// Mouse Look
let isMouseDown = false;
let mouseX = 0, mouseY = 0;
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
        yaw += deltaX * 0.005;
        pitch -= deltaY * 0.005;
        pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
        mouseX = e.clientX;
        mouseY = e.clientY;
        updateCamera();
    }
});

// Maze Generation
function generateMaze(rows, cols) {
    let maze = Array(rows).fill().map(() => Array(cols).fill(1));

    function carve(x, y) {
        maze[y][x] = 0;
        let directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        directions = directions.sort(() => Math.random() - 0.5);

        for (let [dx, dy] of directions) {
            let nx = x + dx * 2, ny = y + dy * 2;
            if (nx > 0 && ny > 0 && nx < cols - 1 && ny < rows - 1 && maze[ny][nx] === 1) {
                maze[y + dy][x + dx] = 0;
                carve(nx, ny);
            }
        }
    }

    carve(1, 1);
    return maze;
}

// Build Maze
function createMaze(scene, maze, wallSize) {
    const wallGeometry = new THREE.BoxGeometry(wallSize, 2, wallSize);
    const wallMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });

    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            if (maze[y][x] === 1) {
                const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                wall.position.set(x * wallSize, 1, y * wallSize);
                wall.castShadow = true;
                wall.receiveShadow = true;
                scene.add(wall);
            }
        }
    }
}

// Find Empty Spot
function findEmptySpot(maze) {
    let x, y;
    do {
        x = Math.floor(Math.random() * (maze[0].length - 2)) + 1;
        y = Math.floor(Math.random() * (maze.length - 2)) + 1;
    } while (maze[y][x] !== 0);
    return { x, y };
}

// Generate Maze
maze = generateMaze(mazeSize, mazeSize);
createMaze(scene, maze, wallSize);

// Place Player
const playerSpawn = findEmptySpot(maze);
player.position.set(playerSpawn.x * wallSize, 0.5, playerSpawn.y * wallSize);

// Collectibles
const collectibles = [];
function spawnCollectible() {
    const spawn = findEmptySpot(maze);
    const collectible = new THREE.Mesh(
        new THREE.SphereGeometry(0.5),
        new THREE.MeshPhongMaterial({ color: 0xffd700 })
    );
    collectible.position.set(spawn.x * wallSize, 0.5, spawn.y * wallSize);
    collectible.castShadow = true;
    scene.add(collectible);
    collectibles.push(collectible);
}

// Spawn Collectibles
for (let i = 0; i < 5; i++) spawnCollectible();

// Input Handling
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => delete keys[e.key]);

// Check for Orb Collision
function checkCollectibles() {
    for (let i = collectibles.length - 1; i >= 0; i--) {
        if (player.position.distanceTo(collectibles[i].position) < 1) {
            scene.remove(collectibles[i]); // Remove from scene
            collectibles.splice(i, 1); // Remove from array
            score += 1; // Increase score
            scoreDisplay.innerHTML = `Score: ${score}`;
            spawnCollectible(); // Spawn a new collectible
        }
    }
}

// Game Loop
let delta = 0, lastTime = 0;
function animate(time) {
    delta = (time - lastTime) / 1000;
    lastTime = time;

    // Camera movement logic
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0;
    cameraDirection.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0)).normalize();

    let moveX = 0, moveZ = 0;
    if (keys['w'] || keys['ArrowUp']) { moveX += cameraDirection.x; moveZ += cameraDirection.z; }
    if (keys['s'] || keys['ArrowDown']) { moveX -= cameraDirection.x; moveZ -= cameraDirection.z; }
    if (keys['a'] || keys['ArrowLeft']) { moveX -= right.x; moveZ -= right.z; }
    if (keys['d'] || keys['ArrowRight']) { moveX += right.x; moveZ += right.z; }

    let newX = player.position.x + moveX * 5 * delta;
    let newZ = player.position.z + moveZ * 5 * delta;

    if (maze[Math.round(newZ / wallSize)][Math.round(newX / wallSize)] === 0) {
        player.position.x = newX;
        player.position.z = newZ;
    }

    player.position.y = 0.5;

    checkCollectibles(); // Check for orb collection
    updateCamera();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

// Start Game
updateCamera();
animate(0);
