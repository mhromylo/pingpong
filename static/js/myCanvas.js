// Import the Player class (make sure your module system supports this)
import Player from "./Player.js";

// ==============================
// GLOBAL VARIABLES & SETUP
// ==============================

// 2D canvas & context
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

// Scale the 2D canvas
canvas.width *= 1.5;
canvas.height *= 1.5;
const WIDTH = canvas.width;
const HEIGHT = canvas.height;
let speedUpTimer=0;

// Ball state (2D) and base speeds
let x = WIDTH / 2;
let y = HEIGHT / 2;
const baseDx = 7;
const baseDy = 3;
let dx = baseDx;
let dy = baseDy;
const ballRadius = 10;

// Global arrays for 3D objects
let rails = [];
let powerUps = [];
let trailParticles = [];

// 3D scene references
let scene3D, camera3D, renderer3D;
let paddleLeftMesh3D, paddleRightMesh3D, ballMesh3D; // ballMesh3D will be a THREE.Group
let scoreboard3D, scoreboardTexture, scoreboardContext;

// Scores (also kept in the Player objects)
let pl_1_score = 0;
let pl_2_score = 0;

// Paddle dimensions (2D & 3D) and initial positions
const paddleHeight = 100;
const paddleWidth = 10;
let paddleY_1 = (HEIGHT - paddleHeight) / 2;
let paddleY_2 = (HEIGHT - paddleHeight) / 2;

// Global game state flags
let paused = false;

// AI timing variables
const AI_INTERVAL = 1000; // milliseconds between AI recalculations
let executeAIlogicInterval_player_1 = performance.now();
let executeAIlogicInterval_player_2 = performance.now();

// Player objects (will be instantiated in startGame)
let player1, player2;

// ==============================
// KEYBOARD EVENT LISTENERS
// ==============================
// For human players, delegate key events to the Player objects.
document.addEventListener("keydown", (e) => {
  if (player1 && !player1.isAI) player1.keyDownHandler(e);
  if (player2 && !player2.isAI) player2.keyDownHandler(e);
});
document.addEventListener("keyup", (e) => {
  if (player1 && !player1.isAI) player1.keyUpHandler(e);
  if (player2 && !player2.isAI) player2.keyUpHandler(e);
});

// Also allow toggling pause with "P"
document.addEventListener("keydown", (e) => {
  if (e.key === "p" || e.key === "P") {
    paused = !paused;
  }
});

// ==============================
// 2. 2D DRAWING & GAME LOGIC
// ==============================
function drawBall() {
  ctx.beginPath();
  ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#0095DD";
  ctx.fill();
  ctx.closePath();
}

function drawPaddle1() {
  ctx.beginPath();
  ctx.rect(0, paddleY_1, paddleWidth, paddleHeight);
  ctx.fillStyle = "green";
  ctx.fill();
  ctx.closePath();
}

function drawPaddle2() {
  ctx.beginPath();
  ctx.rect(WIDTH - paddleWidth, paddleY_2, paddleWidth, paddleHeight);
  ctx.fillStyle = "red";
  ctx.fill();
  ctx.closePath();
}

function drawScores() {
  ctx.font = "40px Lato";
  ctx.fillStyle = "green";
  ctx.fillText(pl_1_score.toString(), WIDTH / 4, 50);
  ctx.fillStyle = "red";
  ctx.fillText(pl_2_score.toString(), (WIDTH * 3) / 4, 50);
}

function hitBall() {
  // Bounce off left paddle (2D)
  if (x - ballRadius < paddleWidth && y > paddleY_1 && y < paddleY_1 + paddleHeight) {
    dx = -dx;
    dy += (Math.random() - 0.5) * 2;
  }
  // Bounce off right paddle (2D)
  else if (x + ballRadius > WIDTH - paddleWidth && y > paddleY_2 && y < paddleY_2 + paddleHeight) {
    dx = -dx;
    dy += (Math.random() - 0.5) * 2;
  }
  // Left edge: score for player 2
  else if (x - ballRadius < 0) {
    pl_2_score++;
    resetBall();
  }
  // Right edge: score for player 1
  else if (x + ballRadius > WIDTH) {
    pl_1_score++;
    resetBall();
  }
  // Bounce off top/bottom
  if (y + dy > HEIGHT - ballRadius || y + dy < ballRadius) {
    dy = -dy;
  }
}

function resetBall() {
  x = WIDTH / 2;
  y = HEIGHT / 2;
  dx = -dx;
}

function updateBall() {
  hitBall();
  x += dx;
  y += dy;
}

// ==============================
// 3. UPDATE PADDLES (Using AI or Human Control)
// ==============================
function updatePaddles() {
  // For player1:
  if (player1) {
    if (player1.isAI) {
      if (performance.now() - executeAIlogicInterval_player_1 >= AI_INTERVAL) {
        player1.calculateWhereAIshouldMove(dx, dy, x, y, canvas, ballRadius);
        executeAIlogicInterval_player_1 = performance.now();
      }
      // Pass ctx to the AI paddle movement function.
      player1.moveAIpaddle(ctx);
    } else {
      player1.movePaddlePlayer(canvas);
    }
    paddleY_1 = player1.paddleY;
  }
  // For player2:
  if (player2) {
    if (player2.isAI) {
      if (performance.now() - executeAIlogicInterval_player_2 >= AI_INTERVAL) {
        player2.calculateWhereAIshouldMove(dx, dy, x, y, canvas, ballRadius);
        executeAIlogicInterval_player_2 = performance.now();
      }
      // Pass ctx to the AI paddle movement function.
      player2.moveAIpaddle(ctx);
    } else {
      player2.movePaddlePlayer(canvas);
    }
    paddleY_2 = player2.paddleY;
  }
}

function draw2D() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawScores();
  drawBall();
  drawPaddle1();
  drawPaddle2();

  if (paused) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.font = "50px Lato";
    ctx.fillStyle = "#fff";
    ctx.fillText("PAUSED", WIDTH / 2 - 80, HEIGHT / 2);
  }
}

// ==============================
// 4. (Optional) POWER-UPS & SPEED-UP (Disabled by default)
// ==============================
// For now these functions are empty or commented out.
// function spawnPowerUp() {}
// function maybeSpawnPowerUp() {}
// function updatePowerUps() {}

// ==============================
// 5. BALL TRAIL EFFECT (3D)
// ==============================
function spawnTrailParticle() {
  const geom = new THREE.SphereGeometry(3, 8, 8);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffdd00,
    transparent: true,
    opacity: 0.5,
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.set(ballMesh3D.position.x, ballMesh3D.position.y, ballMesh3D.position.z);
  mesh.userData.life = 60;
  scene3D.add(mesh);
  trailParticles.push(mesh);
}

function updateTrailParticles() {
  for (let i = trailParticles.length - 1; i >= 0; i--) {
    const p = trailParticles[i];
    p.userData.life--;
    const ratio = p.userData.life / 60;
    p.material.opacity = 0.5 * ratio;
    if (p.userData.life <= 0) {
      scene3D.remove(p);
      trailParticles.splice(i, 1);
    }
  }
}

// ==============================
// 6. 3D OVERLAY SETUP (THREE.JS)
//     Includes floor and walls (with textures) and the scoreboard
// ==============================
function init3DGame() {
  // Create renderer
  renderer3D = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer3D.setSize(WIDTH, HEIGHT);
  renderer3D.domElement.style.position = "absolute";
  renderer3D.domElement.style.top = canvas.offsetTop + "px";
  renderer3D.domElement.style.left = canvas.offsetLeft + "px";
  renderer3D.domElement.style.zIndex = 10;
  document.querySelector(".game-canvas").appendChild(renderer3D.domElement);
  renderer3D.shadowMap.enabled = true;
  renderer3D.shadowMap.type = THREE.PCFSoftShadowMap;

  // Create scene and camera
  scene3D = new THREE.Scene();
  camera3D = new THREE.PerspectiveCamera(60, WIDTH / HEIGHT, 0.1, 2000);
  camera3D.position.set(WIDTH / 2, 300, 1300);
  camera3D.lookAt(new THREE.Vector3(WIDTH / 2, 0, HEIGHT / 2));

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene3D.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(WIDTH / 2, 600, HEIGHT / 2 - 200);
  dirLight.target.position.set(WIDTH / 2, 0, HEIGHT / 2);
  dirLight.castShadow = true;
  dirLight.shadow.camera.near = 0.1;
  dirLight.shadow.camera.far = 2000;
  dirLight.shadow.camera.left = -WIDTH;
  dirLight.shadow.camera.right = WIDTH;
  dirLight.shadow.camera.top = HEIGHT;
  dirLight.shadow.camera.bottom = -HEIGHT;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  scene3D.add(dirLight);
  scene3D.add(dirLight.target);

  // ----- Floor with textures -----
  const floorGeom = new THREE.PlaneGeometry(WIDTH, HEIGHT, 50, 50);
  const loader = new THREE.TextureLoader();
  const baseColorMap = loader.load("https://threejs.org/examples/textures/brick_diffuse.jpg");
  baseColorMap.wrapS = THREE.RepeatWrapping;
  baseColorMap.wrapT = THREE.RepeatWrapping;
  baseColorMap.repeat.set(4, 4);
  const floorMat = new THREE.MeshStandardMaterial({
    map: baseColorMap,
    metalness: 0.3,
    roughness: 0.7,
  });
  const floorMesh = new THREE.Mesh(floorGeom, floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.set(WIDTH / 2, 0, HEIGHT / 2);
  floorMesh.receiveShadow = true;
  scene3D.add(floorMesh);

  // ----- Walls (positions unchanged, textures added via wallMat) -----
  const wallMat = new THREE.MeshPhongMaterial({ map: baseColorMap, bumpMap: baseColorMap, bumpScale: 0.4 });
  let wallThickness = 10;
  let wallHeight = 30; // Use a wall height that suits your scene
  rails = []; // reset rails array

  // North wall
  {
    const geom = new THREE.BoxGeometry(WIDTH + 20, wallHeight, wallThickness);
    const mesh = new THREE.Mesh(geom, wallMat);
    mesh.position.set(WIDTH / 2, wallHeight / 2 - 6, HEIGHT + wallThickness / 2 - 10);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene3D.add(mesh);
    rails.push(mesh);
  }
  // South wall
  {
    const geom = new THREE.BoxGeometry(WIDTH, 18 * wallHeight / 30, wallThickness);
    const mesh = new THREE.Mesh(geom, wallMat);
    mesh.position.set(WIDTH / 2, wallHeight / 2, -wallThickness / 2);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene3D.add(mesh);
    rails.push(mesh);
  }
  // West wall
  {
    const geom = new THREE.BoxGeometry(wallThickness, wallHeight, HEIGHT);
    const mesh = new THREE.Mesh(geom, wallMat);
    mesh.position.set(-wallThickness / 2, wallHeight / 2, HEIGHT / 2);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene3D.add(mesh);
    rails.push(mesh);
  }
  // East wall
  {
    const geom = new THREE.BoxGeometry(wallThickness, wallHeight, HEIGHT);
    const mesh = new THREE.Mesh(geom, wallMat);
    mesh.position.set(WIDTH + wallThickness / 2, wallHeight / 2, HEIGHT / 2);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene3D.add(mesh);
    rails.push(mesh);
  }
  // Middle wall (vertical divider)
  {
    const geom = new THREE.BoxGeometry(wallThickness, wallHeight, HEIGHT);
    const mesh = new THREE.Mesh(geom, wallMat);
    mesh.position.set(WIDTH / 2, wallHeight / 2, HEIGHT / 2);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene3D.add(mesh);
    rails.push(mesh);
  }

  // ----- 3D Paddles & Ball -----
  const paddleGeometry = new THREE.BoxGeometry(paddleWidth, 20, paddleHeight);
  const leftMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
  paddleLeftMesh3D = new THREE.Mesh(paddleGeometry, leftMaterial);
  paddleLeftMesh3D.position.set(paddleWidth / 2, 10, paddleY_1 + paddleHeight / 2);
  paddleLeftMesh3D.castShadow = true;
  paddleLeftMesh3D.receiveShadow = true;
  scene3D.add(paddleLeftMesh3D);

  const rightMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
  paddleRightMesh3D = new THREE.Mesh(paddleGeometry, rightMaterial);
  paddleRightMesh3D.position.set(WIDTH - paddleWidth / 2, 10, paddleY_2 + paddleHeight / 2);
  paddleRightMesh3D.castShadow = true;
  paddleRightMesh3D.receiveShadow = true;
  scene3D.add(paddleRightMesh3D);

  // ----- Enhanced Ball (group with outer and inner spheres) -----
  const ballGroup = new THREE.Group();
  const outerGeometry = new THREE.SphereGeometry(ballRadius, 64, 64);
  const outerMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 100 });
  const outerBall = new THREE.Mesh(outerGeometry, outerMaterial);
  outerBall.castShadow = true;
  outerBall.receiveShadow = true;
  ballGroup.add(outerBall);
  const innerGeometry = new THREE.SphereGeometry(ballRadius * 0.5, 32, 32);
  const innerMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000, shininess: 100 });
  const innerBall = new THREE.Mesh(innerGeometry, innerMaterial);
  innerBall.castShadow = true;
  innerBall.receiveShadow = true;
  ballGroup.add(innerBall);
  ballGroup.position.set(x, ballRadius, y);
  ballMesh3D = ballGroup;
  scene3D.add(ballMesh3D);

  // ----- 3D Scoreboard -----
  const sbWidth = 512, sbHeight = 128;
  const scoreboardCanvas = document.createElement("canvas");
  scoreboardCanvas.width = sbWidth;
  scoreboardCanvas.height = sbHeight;
  scoreboardContext = scoreboardCanvas.getContext("2d");
  scoreboardTexture = new THREE.CanvasTexture(scoreboardCanvas);
  const scoreboardMat = new THREE.MeshBasicMaterial({
    map: scoreboardTexture,
    transparent: true,
  });
  const scoreboardGeo = new THREE.PlaneGeometry(256, 64);
  scoreboard3D = new THREE.Mesh(scoreboardGeo, scoreboardMat);
  scoreboard3D.position.set(WIDTH / 2, 250, HEIGHT / 2);
  scoreboard3D.lookAt(camera3D.position);
  scene3D.add(scoreboard3D);
}

function updateScoreboardTexture() {
  scoreboardContext.clearRect(0, 0, 512, 128);
  scoreboardContext.fillStyle = "rgba(0, 0, 0, 0.5)";
  scoreboardContext.fillRect(0, 0, 512, 128);

  const leftCenter = 512 / 4;
  const rightCenter = (3 * 512) / 4;
  scoreboardContext.fillStyle = "#FFF";

  scoreboardContext.font = "bold 30px sans-serif";
  const label1 = "Player 1";
  const label2 = "Player 2";
  const label1Width = scoreboardContext.measureText(label1).width;
  const label2Width = scoreboardContext.measureText(label2).width;
  scoreboardContext.fillText(label1, leftCenter - label1Width / 2, 40);
  scoreboardContext.fillText(label2, rightCenter - label2Width / 2, 40);

  scoreboardContext.font = "bold 40px sans-serif";
  const score1 = pl_1_score.toString();
  const score2 = pl_2_score.toString();
  const score1Width = scoreboardContext.measureText(score1).width;
  const score2Width = scoreboardContext.measureText(score2).width;
  scoreboardContext.fillText(score1, leftCenter - score1Width / 2, 100);
  scoreboardContext.fillText(score2, rightCenter - score2Width / 2, 100);

  scoreboardTexture.needsUpdate = true;
}

// ==============================
// 7. MAIN GAME LOOP (Unified)
// ==============================
function gameLoop() {
  if (!paused) {
    updatePaddles();
    if (speedUpTimer > 0) {
      speedUpTimer--;
      dx = Math.sign(dx) * baseDx * SPEED_UP_FACTOR;
      dy = Math.sign(dy) * baseDy * SPEED_UP_FACTOR;
    } else {
      dx = Math.sign(dx) * baseDx;
      dy = Math.sign(dy) * baseDy;
    }
    updateBall();
    // (Optional power-ups code can be enabled here)
    spawnTrailParticle();
    updateTrailParticles();
  }
  draw2D();
  updateScoreboardTexture();
  ballMesh3D.position.set(x, ballRadius, y);
  paddleLeftMesh3D.position.z = paddleY_1 + paddleHeight / 2;
  paddleRightMesh3D.position.z = paddleY_2 + paddleHeight / 2;
  scoreboard3D.lookAt(camera3D.position);
  renderer3D.render(scene3D, camera3D);
  requestAnimationFrame(gameLoop);
}

// ==============================
// 8. START THE GAME WITH AI MERGED
// ==============================
function startGame(player1Type, player1Colour, player2Type, player2Colour) {
  // Reset ball
  x = WIDTH / 2;
  y = HEIGHT / 2;
  dx = baseDx;
  dy = baseDy;
  pl_1_score = 0;
  pl_2_score = 0;
  // Instantiate players using the Player class.
  // For the second parameter, true indicates AI; false means human.
  player1 = new Player(
    "Player 1",
    player1Type === "human" ? false : true,
    player1Colour,
    paddleWidth,
    paddleHeight,
    7,
    0,
    (HEIGHT - paddleHeight) / 2,
    "w",
    "s",
    HEIGHT,
    WIDTH
  );
  player2 = new Player(
    "Player 2",
    player2Type === "human" ? false : true,
    player2Colour,
    paddleWidth,
    paddleHeight,
    7,
    WIDTH - paddleWidth,
    (HEIGHT - paddleHeight) / 2,
    "ArrowUp",
    "ArrowDown",
    HEIGHT,
    WIDTH
  );
}

document.getElementById("runButton").addEventListener("click", () => {
  // Retrieve player types and colours from DOM elements.
  const player1Type = document.getElementById("player1Type").value;
  const player1Colour = document.getElementById("player1Colour").value;
  const player2Type = document.getElementById("player2Type").value;
  const player2Colour = document.getElementById("player2Colour").value;
  console.log("Game Starting...");
  console.log("Player 1 Type:", player1Type, "Colour:", player1Colour);
  console.log("Player 2 Type:", player2Type, "Colour:", player2Colour);
  startGame(player1Type, player1Colour, player2Type, player2Colour);
  init3DGame();
  gameLoop();
  document.getElementById("runButton").disabled = true;
});
