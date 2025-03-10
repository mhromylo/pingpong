let scene = new THREE.Scene();
import Player from "./Player.js";
import { MapObstacleSquare, Dart } from "./powersAndMaps.js";
import { loadPage } from './main.js';
import { fetchNewCSRFToken } from './main.js';


var canvas = document.getElementById("myCanvas");
var ctx;
let mapObstacleSquares = [];
let dartsFlying = [];
let currentMap;
let powerupsOnMap = [];
let powerupCountdown;
let powerupSpawnSide = "UP";
let extrasAreOn;


let gameRunning = false;
let currentGameTab;

// Three.js variables
let camera, renderer, ball3D;
let paddleMeshes = [];
let obstacleMeshes = [];
let dartMeshes = [];

function setupCanvas() {
  canvas = document.getElementById("myCanvas");
  if (!canvas) {
    return;
  }
  ctx = canvas.getContext("2d");

  initThreeJS();
}

function createObstacleMesh(obstacle) {
	const obstacleGeometry = new THREE.BoxGeometry(obstacle.width, obstacle.height, 20);
	const obstacleMaterial = new THREE.MeshLambertMaterial({ color: obstacle.colour });
	return new THREE.Mesh(obstacleGeometry, obstacleMaterial);
 }

 function createDartMesh(dart) {
	const dartGeometry = new THREE.BoxGeometry(dart.width, dart.height, 10); // Adjust thickness as needed
	const dartMaterial = new THREE.MeshLambertMaterial({ color: dart.player.paddleColour }); // Use player's color
	return new THREE.Mesh(dartGeometry, dartMaterial);
 }

function initThreeJS() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('threejsCanvas') });
  renderer.setSize(canvas.width, canvas.height);

  // Adjust camera position and rotation

  camera.position.y = -200;  // Move camera up
  camera.position.z = 450;  // Move camera back

  camera.rotation.y = -Math.PI / 4;  // Tilt camera down (45 degrees)

  camera.lookAt(0, 0, 0);

  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(1, 1, 1).normalize();
  scene.add(directionalLight);

  // Create 3D ball
  const ballGeometry = new THREE.SphereGeometry(10, 32, 32);
  const ballMaterial = new THREE.MeshLambertMaterial({ color: 0x0095DD });
  ball3D = new THREE.Mesh(ballGeometry, ballMaterial);
  scene.add(ball3D);

  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xdddddd }); // Light gray lines

  // Top edge
  const topPoints = [
    new THREE.Vector3(-canvas.width / 2, -canvas.height / 2, 0),
    new THREE.Vector3(canvas.width / 2, -canvas.height / 2, 0)
  ];
  const topGeometry = new THREE.BufferGeometry().setFromPoints(topPoints);
  const topLine = new THREE.Line(topGeometry, lineMaterial);
  scene.add(topLine);

  // Bottom edge
  const bottomPoints = [
    new THREE.Vector3(-canvas.width / 2, canvas.height / 2, 0),
    new THREE.Vector3(canvas.width / 2, canvas.height / 2, 0)
  ];
  const bottomGeometry = new THREE.BufferGeometry().setFromPoints(bottomPoints);
  const bottomLine = new THREE.Line(bottomGeometry, lineMaterial);
  scene.add(bottomLine);

  // Left edge
  const leftPoints = [
    new THREE.Vector3(-canvas.width / 2, -canvas.height / 2, 0),
    new THREE.Vector3(-canvas.width / 2, canvas.height / 2, 0)
  ];
  const leftGeometry = new THREE.BufferGeometry().setFromPoints(leftPoints);
  const leftLine = new THREE.Line(leftGeometry, lineMaterial);
  scene.add(leftLine);

  // Right edge
  const rightPoints = [
    new THREE.Vector3(canvas.width / 2, -canvas.height / 2, 0),
    new THREE.Vector3(canvas.width / 2, canvas.height / 2, 0)
  ];
  const rightGeometry = new THREE.BufferGeometry().setFromPoints(rightPoints);
  const rightLine = new THREE.Line(rightGeometry, lineMaterial);
  scene.add(rightLine);

  const surfaceGeometry = new THREE.PlaneGeometry(canvas.width, canvas.height);
  const surfaceMaterial = new THREE.MeshBasicMaterial({ color: 0xdddddd, side: THREE.DoubleSide }); // Light gray surface
  const surface = new THREE.Mesh(surfaceGeometry, surfaceMaterial);
  scene.add(surface);
}

$(document).ready(function () {

    function updateScores(player1Score, player2Score) {
        document.getElementById('player1Score').textContent = player1Score;
        document.getElementById('player2Score').textContent = player2Score;
      }

  if (canvas) {
    ctx = canvas.getContext("2d");

    canvas.width;
    canvas.height;

    let x;
    let y;
    let dx;
    let dy;
    const ballRadius = 10;

    const paddleHeight = 100; // Side paddle height
    const paddleWidth = 10; // Side paddle width

    let interval;

    const AI_INTERVAL = 1000;
    let executeAIlogicInterval_player_1 = performance.now();
    let executeAIlogicInterval_player_2 = performance.now();

    let player1, player2;


    // Add event listeners for key presses
    document.addEventListener("keydown", (e) => {
      if (player1)
        player1.keyDownHandler(e, dartsFlying, extrasAreOn, gameRunning);
      if (player2)
        player2.keyDownHandler(e, dartsFlying, extrasAreOn, gameRunning);
    });

    document.addEventListener("keyup", (e) => {
      if (player1)
        player1.keyUpHandler(e, gameRunning);
      if (player2)
        player2.keyUpHandler(e, gameRunning);
    });

    // Draw the ball
    function drawBall() {
      ctx.beginPath();
      ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
      ctx.fillStyle = "#0095DD";
      ctx.fill();
      ctx.closePath();


      //test delete later
      ctx.font = "15px Lato";
      ctx.fillStyle = "black";
      ctx.fillText(dartsFlying.length.toString(), x, y);
      for (let i = 0; i < dartsFlying.length; i++) {
        ctx.font = "15px Lato";
        ctx.fillStyle = "black";
        ctx.fillText(dartsFlying[i].speed.toString(), x, y + 15 + i * 15);

      }
    }

    // Handle ball collisions

    function bounceBallOffMapObstacles() {
      for (let i = 0; i < mapObstacleSquares.length; i++) {
        if (x < mapObstacleSquares[i].upperLeftX && dx > 0 && x + ballRadius > mapObstacleSquares[i].upperLeftX && y > mapObstacleSquares[i].upperLeftY && y < mapObstacleSquares[i].lowerRightY)
          dx = -dx;
        else if (x > mapObstacleSquares[i].upperLeftX && dx < 0 && x - ballRadius < mapObstacleSquares[i].lowerRightX && y > mapObstacleSquares[i].upperLeftY && y < mapObstacleSquares[i].lowerRightY)
          dx = -dx;
        else if (y < mapObstacleSquares[i].upperLeftY && dy > 0 && y + ballRadius > mapObstacleSquares[i].upperLeftY && x > mapObstacleSquares[i].upperLeftX && x < mapObstacleSquares[i].lowerRightX)
          dy = -dy;
        else if (y > mapObstacleSquares[i].upperLeftY && dy < 0 && y - ballRadius < mapObstacleSquares[i].lowerRightY && x > mapObstacleSquares[i].upperLeftX && x < mapObstacleSquares[i].lowerRightX)
          dy = -dy;
      }
    }
    function hitBall() {
      if (x - ballRadius < paddleWidth && y > player1.paddleY && y < player1.paddleY + paddleHeight && dx < 0) {
        dx = -dx;
      } else if (
        x + ballRadius > canvas.width - paddleWidth &&
        y > player2.paddleY &&
        y < player2.paddleY + paddleHeight && dx > 0
      ) {
        dx = -dx;
      } else if (x - ballRadius < 0) {
        player2.score++;
        updateScores(player1.score, player2.score);
        resetBall();
        if (player2.score >= 3) {
          gameRunning = false;
          enableButtons();
          alert("GAME OVER\n\nPLAYER 2 WINS");
          clearInterval(interval);
          saveGameResult(player1.game_id, player1.player_id, player2.player_id, player1.score, player2.score);
        }
      } else if (x + ballRadius > canvas.width) {
        player1.score++;
        updateScores(player1.score, player2.score);
        resetBall();
        if (player1.score >= 3) {
          gameRunning = false;
          enableButtons();
          alert("GAME OVER\n\nPLAYER 1 WINS");
          clearInterval(interval);
          saveGameResult(player1.game_id, player1.player_id, player2.player_id, player1.score, player2.score);
        }
      }

      if (y + dy > canvas.height - ballRadius || y + dy < ballRadius) {
        dy = -dy;
      }
      bounceBallOffMapObstacles();
    }

    function movePowerups() {
      for (let i = powerupsOnMap.length - 1; i >= 0; i--) {
        powerupsOnMap[i].upperLeftY += powerupsOnMap[i].speed;
        if ((powerupsOnMap[i].speed > 0 && powerupsOnMap[i].upperLeftY + powerupsOnMap[i].height >= canvas.height) ||
          (powerupsOnMap[i].speed < 0 && powerupsOnMap[i].upperLeftY <= 0)) {
          powerupsOnMap[i].speed *= -1;
        }

        // ADD THIS LATER, bouncing off the mapObstacleSquares
        //for (let j = 0; j < mapObstacleSquares.length; j++)
        //{
        //	//powerups go up and down
        //	{
        //		powerupsOnMap[i].speed *= -1;
        //	}
        //
        //}
      }

    }


    function createPaddleMesh(player, paddleWidth, paddleHeight) {
      const paddleGeometry = player.isHorizontal
        ? new THREE.BoxGeometry(paddleHeight, paddleWidth, 20) // Taller for horizontal paddles
        : new THREE.BoxGeometry(paddleWidth, paddleHeight, 20); // Taller for vertical paddles
      const paddleMaterial = new THREE.MeshLambertMaterial({ color: player.paddleColour }); // Use Lambert for shading
      return new THREE.Mesh(paddleGeometry, paddleMaterial);
    }

    // Reset ball position
    function resetBall() {
      x = canvas.width / 2;
      y = canvas.height / 2;
      dx = -dx;

      if (currentMap === "box")
        y = 100;
    }

    // Move the ball
    function moveBall() {
      hitBall();
      x += dx;
      y += dy;
    }

    function moveDarts() {
      for (let i = dartsFlying.length - 1; i >= 0; i--) {
        if (dartsFlying[i].upperLeftX + dartsFlying[i].width < 0 || dartsFlying[i].upperLeftX > canvas.width) {
          dartsFlying.splice(i, 1);
        }
        else
            dartsFlying[i].upperLeftX += dartsFlying[i].speed;
      }
    }

    function dartsHitThings() {
      let dartsToRemove = [];
     
      for (let i = dartsFlying.length - 1; i >= 0; i--) {  //this can be rewritten to be in the other file if we have time, the classes are passed by reference in JavaScript
          if (dartsFlying[i].dartHitPlayer(player1.paddleX, player1.paddleY, player1.paddleWidth, player1.paddleHeight) && dartsFlying[i].player !== player1) {
           player1.score -= 0.5;
           dartsToRemove.push(i);
          }
          if (dartsFlying[i].dartHitPlayer(player2.paddleX, player2.paddleY, player2.paddleWidth, player2.paddleHeight) && dartsFlying[i].player !== player2) {
           player2.score -= 0.5;
           dartsToRemove.push(i);
          }
      }
      for (let index of dartsToRemove) {
          dartsFlying.splice(index, 1);
      }
      dartsToRemove = [];
  
      for (let i = 0; i < dartsFlying.length; i++)
      {
        let j = i+1;
        while (j < dartsFlying.length)
        {
          if (dartsFlying[i].dartHitDart(dartsFlying[j]))
          {
            dartsToRemove.push(i);
            dartsToRemove.push(j);
            let temp = dartsFlying[i].player.score;
            dartsFlying[i].player.score = dartsFlying[j].player.score;
            dartsFlying[j].player.score = temp;
            for (let k = dartsToRemove.length - 1; k >= 0; k--) {
                dartsFlying.splice(k, 1);
            }
            break;
          }
          j++;
        }
      }
      dartsToRemove = [];
  
      for (let i = dartsFlying.length - 1; i >= 0; i--)
      {
        for (let j = 0; j < mapObstacleSquares.length; j++)
        {
          if (dartsFlying[i].dartHitMapObstacle(mapObstacleSquares[j]))
          {
            dartsFlying.splice(i, 1);
            break;
          }
        }
      }
  
      for (let i = dartsFlying.length - 1; i >= 0; i--)
      {
        if (dartsFlying[i].dartHitBall(x, y, ballRadius))
        {
          dartsFlying[i].player.score -= 0.5;
          dartsFlying.splice(i, 1);
        }
      
      }
     }

    // Draw player scores
    function drawScores() {
      ctx.font = "40px Lato";
      ctx.fillStyle = player1.paddleColour;
      ctx.fillText(player1.score.toString(), canvas.width / 4, 50);
      ctx.fillStyle = player2.paddleColour;
      ctx.fillText(player2.score.toString(), (canvas.width * 3) / 4, 50);
    }

    function drawMapObstacles() {
      for (let i = 0; i < mapObstacleSquares.length; i++) {
        ctx.beginPath();
        ctx.rect(mapObstacleSquares[i].upperLeftX, mapObstacleSquares[i].upperLeftY, mapObstacleSquares[i].width, mapObstacleSquares[i].height);
        ctx.fillStyle = mapObstacleSquares[i].colour;
        ctx.fill();
        ctx.closePath();
      }
    }
    function drawDarts() {
      for (let i = 0; i < dartMeshes.length; i++)
        {
          scene.remove(dartMeshes[i]);
        }
        dartMeshes = [];

        for (let i = 0; i < dartsFlying.length; i++) {
          const dartMesh = createDartMesh(dartsFlying[i]);
          dartMesh.position.set(dartsFlying[i].upperLeftX + dartsFlying[i].width / 2 - canvas.width / 2, -dartsFlying[i].upperLeftY - dartsFlying[i].height / 2 + canvas.height / 2, 5); // Adjust z-position
          scene.add(dartMesh);
          dartMeshes.push(dartMesh);
        }

    //   for (let i = 0; i < dartsFlying.length; i++) {
    //     ctx.beginPath();
    //     ctx.rect(dartsFlying[i].upperLeftX, dartsFlying[i].upperLeftY, dartsFlying[i].width, dartsFlying[i].height);
    //     ctx.fillStyle = dartsFlying[i].player.paddleColour;
    //     ctx.fill();
    //     ctx.closePath();
    //   }
    }

    // Main draw loop
    function draw() {

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      //createPowerups();
    //   drawMapObstacles();
      drawScores();
    //   drawBall();
      drawDarts();
      //drawPowerups();
    //   player1.drawPaddle(ctx, canvas);
    //   player2.drawPaddle(ctx, canvas);

      if (player1.isAI) {

        if (performance.now() - executeAIlogicInterval_player_1 >= AI_INTERVAL) {
          player1.calculateWhereAIshouldMove(dx, dy, x, y, canvas, ballRadius);
          executeAIlogicInterval_player_1 = performance.now();
        }
        player1.moveAIpaddle(ctx);
      }
      else
        player1.movePaddlePlayer(canvas);

      if (player2.isAI) {
        if (performance.now() - executeAIlogicInterval_player_2 >= AI_INTERVAL) {
          player2.calculateWhereAIshouldMove(dx, dy, x, y, canvas, ballRadius);
          executeAIlogicInterval_player_2 = performance.now();
        }
        player2.moveAIpaddle(ctx);
      }
      else
        player2.movePaddlePlayer(canvas);

      player2.paddleMesh.position.set(player2.paddleX - canvas.width / 2 + player2.paddleWidth / 2, -player2.paddleY + canvas.height / 2 - player2.paddleHeight / 2, 10);
      player1.paddleMesh.position.set(player1.paddleX - canvas.width / 2 + player1.paddleWidth / 2, -player1.paddleY + canvas.height / 2 - player1.paddleHeight / 2, 10);


      dartsHitThings();
      moveBall();
      movePowerups();
      moveDarts();

      if (ball3D && typeof x !== 'undefined' && typeof y !== 'undefined') {
        ball3D.position.set(x - canvas.width / 2, -y + canvas.height / 2, 0);
      }
      renderer.render(scene, camera);

      if (window.location.href != currentGameTab) {
        gameRunning = false;
        alert("Game ended");
        clearInterval(interval);
      }
    }

    function startGame(player1Type, player1Colour, player2Type, player2Colour, chosenMap, extrasOnOff, game_id, player1_id, player2_id) {


      if (interval) {
        clearInterval(interval);
      }
      currentGameTab = window.location.href;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      mapObstacleSquares = [];
      dartsFlying = [];
      powerupsOnMap = [];
      powerupCountdown = performance.now() - 70000;

      x = canvas.width / 2;
      y = canvas.height / 2;
      dx = 2;
      dy = 1.5;
      currentMap = chosenMap;

      if (chosenMap === "box") {
        mapObstacleSquares.push(new MapObstacleSquare(canvas.width * 0.4, canvas.height * 0.4, canvas.width * 0.2, canvas.height * 0.2, "Khaki"));
        y = 100;
      }
      else if (chosenMap === "twoLines") {
        mapObstacleSquares.push(new MapObstacleSquare(canvas.width * 0.2, canvas.height * 0.2, canvas.width * 0.25, canvas.height * 0.1, "Khaki"));
        mapObstacleSquares.push(new MapObstacleSquare(canvas.width * 0.55, canvas.height * 0.7, canvas.width * 0.25, canvas.height * 0.1, "Khaki"));
      }

      if (extrasOnOff === "ON")
        extrasAreOn = true;
      else
        extrasAreOn = false;

      for (let i = 0; i < paddleMeshes.length; i++) {
        scene.remove(paddleMeshes[i]);
      }
      paddleMeshes = []; // Clear the array


      player1 = new Player("Player 1", player1Type === "human" ? false : true, player1Colour, paddleWidth, paddleHeight, 7, 0, (canvas.height - paddleHeight) / 2, "w", "s", canvas.height, canvas.width, "d", game_id, player1_id);
      player2 = new Player("Player 2", player2Type === "human" ? false : true, player2Colour, paddleWidth, paddleHeight, 7, canvas.width - paddleWidth, (canvas.height - paddleHeight) / 2, "ArrowUp", "ArrowDown", canvas.height, canvas.width, "ArrowLeft", game_id, player2_id);

      if (player1 && player1.paddleMesh) scene.remove(player1.paddleMesh);
      if (player2 && player2.paddleMesh) scene.remove(player2.paddleMesh);

      player1.paddleMesh = createPaddleMesh(player1, paddleWidth, paddleHeight);
      player2.paddleMesh = createPaddleMesh(player2, paddleWidth, paddleHeight);

      paddleMeshes.push(player1.paddleMesh);
      paddleMeshes.push(player2.paddleMesh);

      scene.add(player1.paddleMesh);
      scene.add(player2.paddleMesh);
      scene.background = new THREE.Color(0xabcdef);

      for (let i = 0; i < obstacleMeshes.length; i++) {
        scene.remove(obstacleMeshes[i]);
       }
       obstacleMeshes = []; 
  
       // Create and add new obstacle meshes
       for (let i = 0; i < mapObstacleSquares.length; i++) {
        const obstacleMesh = createObstacleMesh(mapObstacleSquares[i]);
        obstacleMesh.position.set(mapObstacleSquares[i].upperLeftX + mapObstacleSquares[i].width / 2 - canvas.width / 2, -mapObstacleSquares[i].upperLeftY - mapObstacleSquares[i].height / 2 + canvas.height / 2, 10);
        scene.add(obstacleMesh);
        obstacleMeshes.push(obstacleMesh);
       }

      // Start game loop
      interval = setInterval(draw, 10);
      gameRunning = true;
    }

    function handleBeginGameClick(event) {
      setupCanvas();
      disableButtons();

      const game_id = event.target.getAttribute('data-game-id');
      const player1_id = event.target.getAttribute('data-player1-id');
      const player2_id = event.target.getAttribute('data-player2-id');
      const player1Type = document.getElementById("player1Type").value;
      const player1Colour = document.getElementById("player1Colour").value;
      const player2Colour = document.getElementById("player2Colour").value;
      const player2Type = document.getElementById("player2Type").value;
      const chosenMap = document.getElementById("chosenMap").value;
      const extrasOnOff = document.getElementById("extrasAreOn").value;


      startGame(player1Type, player1Colour, player2Type, player2Colour, chosenMap, extrasOnOff, game_id, player1_id, player2_id);
    }

    function handleRunButtonClick(event) {

      setupCanvas();
      const player1Type = document.getElementById("player1Type").value;
      const player1Colour = document.getElementById("player1Colour").value;
      const player2Colour = document.getElementById("player2Colour").value;
      const player2Type = document.getElementById("player2Type").value;
      const chosenMap = document.getElementById("chosenMap").value;
      const extrasOnOff = document.getElementById("extrasAreOn").value;


      startGame(player1Type, player1Colour, player2Type, player2Colour, chosenMap, extrasOnOff, 0, 0, 0);
    }
    function handleStartTournamentGameClick(event) {

      setupCanvas();
      disableButtons();

      const game_id = event.target.getAttribute('data-game-id');
      const player1_id = event.target.getAttribute('data-player1-id');
      const player2_id = event.target.getAttribute('data-player2-id');


      startGame("human", "blue", "human", "red", "normal", "OFF", game_id, player1_id, player2_id);
    }
    $(document).on("click", ".beginGame", function (event) {
      handleBeginGameClick(event);
    });
    $(document).on("click", ".startTournamentGame", function (event) {
      handleStartTournamentGameClick(event);
    });
    // $(document).on("click", "#runButton", function () {
    //     handleRunButtonClick();
    // });

    $(document).on("click", "#runButton", function (event) {
      setupCanvas();
      const player1Type = document.getElementById("player1Type").value;
      const player1Colour = document.getElementById("player1Colour").value;
      const player2Colour = document.getElementById("player2Colour").value;
      const player2Type = document.getElementById("player2Type").value;
      //    const player3Type = document.getElementById("player3Type").value;
      //    const player3Colour = document.getElementById("player3Colour").value;
      //    const player4Type = document.getElementById("player4Type").value;
      //    const player4Colour = document.getElementById("player4Colour").value;
      const chosenMap = document.getElementById("chosenMap").value;
      const extrasOnOff = document.getElementById("extrasAreOn").value;


      

      if (window.location.href === "https://localhost/game_setup/")
        startGame(player1Type, player1Colour, player2Type, player2Colour, chosenMap, extrasOnOff, 0, 0, 0);
    });






  }
});






export function disableButtons() {
  // Get the buttons by class or ID
  const buttons = document.querySelectorAll('button, a, form');
  buttons.forEach((element) => {
    element.disabled = true;  // Disable the button
    element.classList.add('disabled');  // Add Bootstrap's 'disabled' class for styling
    element.style.pointerEvents = 'none';
  });
}

// Function to enable the buttons (e.g., when the game ends)
export function enableButtons() {
  // Get the buttons by class or ID
  const buttons = document.querySelectorAll('button, a, form');
  buttons.forEach((element) => {
    element.disabled = false;  // Enable the button
    element.classList.remove('disabled');  // Remove the 'disabled' class
    element.style.pointerEvents = 'auto';
  });
}











function getCSRFToken() {
  let csrfToken = document.querySelector('input[name=csrfmiddlewaretoken]')?.value;
  if (!csrfToken) {
    csrfToken = document.cookie.split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
  }
  if (!csrfToken) {
    console.error("CSRF token not found!");
  }
  return csrfToken;
}

function saveGameResult(game_id, player1_id, player2_id, player1_score, player2_score) {
  const csrfToken = getCSRFToken();


  fetch('/save_game_result/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken,
    },
    body: JSON.stringify({
      game_id: game_id,
      player1_id: player1_id,
      player2_id: player2_id,
      player1_score: player1_score,
      player2_score: player2_score,
    }),
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        if (data.redirect_url) {
          fetchNewCSRFToken();
          loadPage(data.redirect_url); // Dynamically load the login page
        }

      } else {
        console.error('Error saving game result:', data.message);
      }
    })
    .catch(error => console.error('Error:', error));
}





