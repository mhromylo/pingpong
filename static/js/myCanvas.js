const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

canvas.width *= 1.5; 		// Scale canvas size
canvas.height *= 1.5;

let x = canvas.width / 2;
let y = canvas.height / 2;
let dx = 2; 				// Ball speed x-direction
let dy = 1.5; 				// Ball speed y-direction
const ballRadius = 10;

let pl_1_score = 0;
let pl_2_score = 0;

let gameType = "2 Player Game";
let player1Id = 0;
let player2Id = 0;

const paddleHeight = 100; 						// Side paddle height
const paddleWidth = 10; 							// Side paddle width
let paddleY_1 = (canvas.height - paddleHeight) / 2; 	// Left paddle
let paddleY_2 = (canvas.height - paddleHeight) / 2; 	// Right paddle

let Wpressed = false;
let Spressed = false;
let UpPressed = false;
let DownPressed = false;

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

function keyDownHandler(e) {
  if (e.key === "W" || e.key === "w") {
    Wpressed = true;
  } else if (e.key === "S" || e.key === "s") {
    Spressed = true;
  }

  if (e.key === "ArrowUp" || e.key === "Up") {
    UpPressed = true;
  } else if (e.key === "ArrowDown" || e.key === "Down") {
    DownPressed = true;
  }
}

function keyUpHandler(e) {
  if (e.key === "W" || e.key === "w") {
    Wpressed = false;
  } else if (e.key === "S" || e.key === "s") {
    Spressed = false;
  }

  if (e.key === "ArrowUp") {
    UpPressed = false;
  } else if (e.key === "ArrowDown") {
    DownPressed = false;
  }
}

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
  ctx.rect(canvas.width - paddleWidth, paddleY_2, paddleWidth, paddleHeight);
  ctx.fillStyle = "red";
  ctx.fill();
  ctx.closePath();
}

function hitBall() {
  if (x - ballRadius < paddleWidth && y > paddleY_1 && y < paddleY_1 + paddleHeight) {
    dx = -dx;
  }
  else if (
    x + ballRadius > canvas.width - paddleWidth &&
    y > paddleY_2 &&
    y < paddleY_2 + paddleHeight)
  {
    dx = -dx;
  }
  else if (x - ballRadius < 0)
 {
    pl_2_score++;
    resetBall();
    if (pl_2_score === 3) {
      saveGameResult(gameType, player2Id, player1Id);
      alert("GAME OVER\n\nPLAYER 2 WINS");
      document.location.reload();
      clearInterval(interval);
    }
  }
  else if (x + ballRadius > canvas.width)
 {
    pl_1_score++;
    resetBall();
    if (pl_1_score === 3) {
      saveGameResult(gameType, player1Id, player2Id);
      alert("GAME OVER\n\nPLAYER 1 WINS");
      document.location.reload();
      clearInterval(interval);
    }
  }

  if (y + dy > canvas.height - ballRadius || y + dy < ballRadius) {
    dy = -dy;
  }
}

function resetBall() {
  x = canvas.width / 2;
  y = canvas.height / 2;
  dx = -dx;
}

function moveBall() {
  hitBall();
  x += dx;
  y += dy;
}

function drawScores() {
  ctx.font = "40px Lato";
  ctx.fillStyle = "green";
  ctx.fillText(pl_1_score.toString(), canvas.width / 4, 50);
  ctx.fillStyle = "red";
  ctx.fillText(pl_2_score.toString(), (canvas.width * 3) / 4, 50);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawScores();
  drawBall();
  drawPaddle1();
  drawPaddle2();

  if (Wpressed) {
    paddleY_1 = Math.max(paddleY_1 - 7, 0);
  } else if (Spressed) {
    paddleY_1 = Math.min(paddleY_1 + 7, canvas.height - paddleHeight);
  }

  if (UpPressed) {
    paddleY_2 = Math.max(paddleY_2 - 7, 0);
  } else if (DownPressed) {
    paddleY_2 = Math.min(paddleY_2 + 7, canvas.height - paddleHeight);
  }

  moveBall();
}

function startGame() {
  interval = setInterval(draw, 10);
}

document.getElementById("runButton").addEventListener("click", function () {
  startGame();
  player1Id = getProfileId();
  player2Id = getPlayer2Id();
  console.log("Player 1 ID:", player1Id);
  console.log("Player 2 ID:", player2Id);
  this.disabled = true;
});

function saveGameResult(gameType, winnerId, player2Id){
	fetch('/save_game_result/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken(),
        },
        body: JSON.stringify({
            game_type: gameType,
            winner_id: winnerId,
			player2id: player2Id,
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Game result saved:', data.message);
        } else {
            console.error('Error saving game result:', data.message);
        }
    })
    .catch(error => console.error('Error:', error));
}
function getCSRFToken() {
    return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
}
function getProfileId() {
    return document.getElementById("profileId").value;
}

function getPlayer2Id() {
    return document.getElementById("player2Id").value; 
}

