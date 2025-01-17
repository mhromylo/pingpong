const canvas_4p = document.getElementById("fourPlayer");
const ctx_4p = canvas_4p.getContext("2d");

canvas_4p.width *= 1.5; // Scale canvas size
canvas_4p.height *= 1.5;

let x_4p = canvas_4p.width / 2;
let y_4p = canvas_4p.height / 2;
let dx_4p = 2; // Ball speed x-direction
let dy_4p = 1.5; // Ball speed y-direction
const ballRadius_4p = 10;

let pl_1_score_4p = 0;
let pl_2_score_4p = 0;
let pl_3_score_4p = 0;
let pl_4_score_4p = 0;

const paddleHeight_4p = 100; // Side paddle height
const paddleWidth_4p = 10; // Side paddle width
const topBottomPaddleWidth_4p = 100; // Top/Bottom paddle width
const topBottomPaddleHeight_4p = 10; // Top/Bottom paddle height

// Side paddles
let paddleY_1_4p = (canvas_4p.height - paddleHeight_4p) / 2; // Left paddle
let paddleY_2_4p = (canvas_4p.height - paddleHeight_4p) / 2; // Right paddle

// Top and bottom paddles
let paddleX_3_4p = (canvas_4p.width - topBottomPaddleWidth_4p) / 2; // Top paddle
let paddleX_4_4p = (canvas_4p.width - topBottomPaddleWidth_4p) / 2; // Bottom paddle

let lastTouch_4p = null; // Tracks the last player to touch the ball

let Wpressed_4p = false;
let Spressed_4p = false;
let OPressed_4p = false;
let LPressed_4p = false;
let numpad4Pressed_4p = false;
let numpad6Pressed_4p = false;
let Npressed_4p = false;
let Mpressed_4p = false;

document.addEventListener("keydown", keyDownHandler_4p, false);
document.addEventListener("keyup", keyUpHandler_4p, false);

function keyDownHandler_4p(e) {
  if (e.key === "W" || e.key === "w") {
    Wpressed_4p = true;
  } else if (e.key === "S" || e.key === "s") {
    Spressed_4p = true;
  }

  if (e.key === "O" || e.key === "o") {
    OPressed_4p = true;
  } else if (e.key === "L" || e.key === "l") {
    LPressed_4p = true;
  }

  if (e.key === "4") {
    numpad4Pressed_4p = true;
  } else if (e.key === "6") {
    numpad6Pressed_4p = true;
  }

  if (e.key === "n" || e.key === "N") {
    Npressed_4p = true;
  } else if (e.key === "m" || e.key === "M") {
    Mpressed_4p = true;
  }
}

function keyUpHandler_4p(e) {
  if (e.key === "W" || e.key === "w") {
    Wpressed_4p = false;
  } else if (e.key === "S" || e.key === "s") {
    Spressed_4p = false;
  }

  if (e.key === "O" || e.key === "o") {
    OPressed_4p = false;
  } else if (e.key === "L" || e.key === "l") {
    LPressed_4p = false;
  }

  if (e.key === "4") {
    numpad4Pressed_4p = false;
  } else if (e.key === "6") {
    numpad6Pressed_4p = false;
  }

  if (e.key === "n" || e.key === "N") {
    Npressed_4p = false;
  } else if (e.key === "m" || e.key === "M") {
    Mpressed_4p = false;
  }
}

function drawBall_4p() {
  ctx_4p.beginPath();
  ctx_4p.arc(x_4p, y_4p, ballRadius_4p, 0, Math.PI * 2);
  ctx_4p.fillStyle = "#0095DD";
  ctx_4p.fill();
  ctx_4p.closePath();
}

function drawPaddle1_4p() {
  ctx_4p.beginPath();
  ctx_4p.rect(0, paddleY_1_4p, paddleWidth_4p, paddleHeight_4p);
  ctx_4p.fillStyle = "green";
  ctx_4p.fill();
  ctx_4p.closePath();
}

function drawPaddle2_4p() {
  ctx_4p.beginPath();
  ctx_4p.rect(canvas_4p.width - paddleWidth_4p, paddleY_2_4p, paddleWidth_4p, paddleHeight_4p);
  ctx_4p.fillStyle = "red";
  ctx_4p.fill();
  ctx_4p.closePath();
}

function drawPaddle3_4p() {
  ctx_4p.beginPath();
  ctx_4p.rect(paddleX_3_4p, 0, topBottomPaddleWidth_4p, topBottomPaddleHeight_4p);
  ctx_4p.fillStyle = "orange";
  ctx_4p.fill();
  ctx_4p.closePath();
}

function drawPaddle4_4p() {
  ctx_4p.beginPath();
  ctx_4p.rect(paddleX_4_4p, canvas_4p.height - topBottomPaddleHeight_4p, topBottomPaddleWidth_4p, topBottomPaddleHeight_4p);
  ctx_4p.fillStyle = "blue";
  ctx_4p.fill();
  ctx_4p.closePath();
}

function hitBall_4p() {
  // Left paddle
  if (x_4p - ballRadius_4p < paddleWidth_4p && y_4p > paddleY_1_4p && y_4p < paddleY_1_4p + paddleHeight_4p) {
    dx_4p = -dx_4p;
    lastTouch_4p = "pl_1";
  }
  // Right paddle
  else if (x_4p + ballRadius_4p > canvas_4p.width - paddleWidth_4p && y_4p > paddleY_2_4p && y_4p < paddleY_2_4p + paddleHeight_4p) {
    dx_4p = -dx_4p;
    lastTouch_4p = "pl_2";
  }
  // Top paddle
  else if (y_4p - ballRadius_4p < topBottomPaddleHeight_4p && x_4p > paddleX_3_4p && x_4p < paddleX_3_4p + topBottomPaddleWidth_4p) {
    dy_4p = -dy_4p;
    lastTouch_4p = "pl_3";
  }
  // Bottom paddle
  else if (y_4p + ballRadius_4p > canvas_4p.height - topBottomPaddleHeight_4p && x_4p > paddleX_4_4p && x_4p < paddleX_4_4p + topBottomPaddleWidth_4p) {
    dy_4p = -dy_4p;
    lastTouch_4p = "pl_4";
  }
  // Scoring
  if (x_4p - ballRadius_4p <= 0 || x_4p + ballRadius_4p >= canvas_4p.width || y_4p - ballRadius_4p <= 0 || y_4p + ballRadius_4p >= canvas_4p.height) {
    handleScore_4p();
    resetBall_4p();
  }
}

function declareWinner_4p() {
	  if (pl_1_score_4p === 2) {
		alert("GAME OVER\n\nPLAYER 1 WINS");
		document.location.reload();
		clearInterval(interval);
	   }
	  if (pl_2_score_4p === 2) {
		alert("GAME OVER\n\nPLAYER 2 WINS");
		document.location.relow4an6ad();
		clearInterval(interval);
	   }
	  if (pl_3_score_4p === 2) {
		alert("GAME OVER\n\nPLAYER 3 WINS");
		document.location.reload();
		clearInterval(interval);
	  }
	  if (pl_4_score_4p === 2) {
		alert("GAME OVER\n\nPLAYER 4 WINS");
		document.location.reload();
		clearInterval(interval);
	  }
}

function handleScore_4p() {
  if (x_4p - ballRadius_4p <= 0)
  {
    pl_1_score_4p -= 0.5;
  }
  else if (x_4p + ballRadius_4p >= canvas_4p.width)
  {
  	pl_2_score_4p -= 0.5;
  }
  else if (y_4p - ballRadius_4p <= 0)
  {
  	pl_3_score_4p -= 0.5;
  }
  else if (y_4p + ballRadius_4p >= canvas_4p.height)
  {
  	pl_4_score_4p -= 0.5;
  }
			
  if (lastTouch_4p === "pl_1") pl_1_score_4p++;
  if (lastTouch_4p === "pl_2") pl_2_score_4p++;
  if (lastTouch_4p === "pl_4") pl_4_score_4p++;
  if (lastTouch_4p === "pl_3") pl_3_score_4p++;

  pl_1_score_4p = Math.max(pl_1_score_4p, 0);
  pl_2_score_4p = Math.max(pl_2_score_4p, 0);
  pl_3_score_4p = Math.max(pl_3_score_4p, 0);
  pl_4_score_4p = Math.max(pl_4_score_4p, 0);

  declareWinner_4p();
  lastTouch_4p = false;
}

function resetBall_4p() {
  x_4p = canvas_4p.width / 2;
  y_4p = canvas_4p.height / 2;
  dx_4p = Math.random() < 0.5 ? 4 : -4;
  dx_4p *=Math.random();
  dy_4p = Math.random() < 0.5 ? 4 : -4;
  dy_4p *=Math.random();
}

function moveBall_4p() {
  hitBall_4p();
  x_4p += dx_4p;
  y_4p += dy_4p;
}

function drawScores_4p() {
  ctx_4p.font = "30px Lato";
  ctx_4p.fillStyle = "green";
  ctx_4p.fillText(pl_1_score_4p.toString(), 40, canvas_4p.height/2);
  ctx_4p.fillStyle = "red";
  ctx_4p.fillText(pl_2_score_4p.toString(), canvas_4p.width - 80, canvas_4p.height/2);
  ctx_4p.fillStyle = "orange";
  ctx_4p.fillText(pl_3_score_4p.toString(), canvas_4p.width / 2 - 15, 50);
  ctx_4p.fillStyle = "blue";
  ctx_4p.fillText(pl_4_score_4p.toString(), canvas_4p.width / 2 - 15, canvas_4p.height - 60);
}

function draw_4p() {
  ctx_4p.clearRect(0, 0, canvas_4p.width, canvas_4p.height);
  drawScores_4p();
  drawBall_4p();
  drawPaddle1_4p();
  drawPaddle2_4p();
  drawPaddle3_4p();
  drawPaddle4_4p();

  if (Wpressed_4p) paddleY_1_4p = Math.max(paddleY_1_4p - 7, 0);
  if (Spressed_4p) paddleY_1_4p = Math.min(paddleY_1_4p + 7, canvas_4p.height - paddleHeight_4p);
  if (OPressed_4p) paddleY_2_4p = Math.max(paddleY_2_4p - 7, 0);
  if (LPressed_4p) paddleY_2_4p = Math.min(paddleY_2_4p + 7, canvas_4p.height - paddleHeight_4p);
  if (numpad4Pressed_4p) paddleX_3_4p = Math.max(paddleX_3_4p - 7, 0);
  if (numpad6Pressed_4p) paddleX_3_4p = Math.min(paddleX_3_4p + 7, canvas_4p.width - topBottomPaddleWidth_4p);
  if (Npressed_4p) paddleX_4_4p = Math.max(paddleX_4_4p - 7, 0);
  if (Mpressed_4p) paddleX_4_4p = Math.min(paddleX_4_4p + 7, canvas_4p.width - topBottomPaddleWidth_4p);

  moveBall_4p();
}

function startGame_4p() {
  interval_4p = setInterval(draw_4p, 10);
}

// startGame_4p();
