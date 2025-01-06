const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
let x = canvas.width / 2;
let y = canvas.height - 30;
var dx = -1.1;
var dy = -2;
const ballRadius = 10;
let interval = 0;


const paddleHeight = 10;
const paddleWidth = 75;
let paddleX = (canvas.width - paddleWidth) / 2;

let rightPressed = false;
let leftPressed = false;

let paddleX_2 = (canvas.width - paddleWidth) / 2;

let Apressed = false;
let Dpressed = false;

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);


function keyDownHandler(e) {
	if (e.key === "Right" || e.key === "ArrowRight") {
	  rightPressed = true;
	} else if (e.key === "Left" || e.key === "ArrowLeft") {
	  leftPressed = true;
	}

	if (e.key === "A" || e.key === "a") {
		Apressed = true;
	  }
	else if (e.key === "D" || e.key === "d") {
		Dpressed = true;
	  }	
   }

function keyUpHandler(e) {
	if (e.key === "Right" || e.key === "ArrowRight") {
	  rightPressed = false;
	} else if (e.key === "Left" || e.key === "ArrowLeft") {
	  leftPressed = false;
	}

	if (e.key === "A" || e.key === "a") {
		Apressed = false;
	  }
	else if (e.key === "D" || e.key === "d") {
		Dpressed = false;
	  }
}
   

function drawBall() {
  ctx.beginPath();
  ctx.arc(x, y, ballRadius, 0, Math.PI * 2); // x, y, radius, startAngle, endAngle
  ctx.fillStyle = "#0095DD";
  ctx.fill();
  ctx.closePath();
}

function drawPaddle () {
	ctx.beginPath();
	ctx.rect (paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
	ctx.fillStyle = "green";
	ctx.fill();
	ctx.closePath();
}

function drawPaddle2 () {
	ctx.beginPath();
	ctx.rect (paddleX_2, 0, paddleWidth, paddleHeight);
	ctx.fillStyle = "red";
	ctx.fill();
	ctx.closePath();
}

function hitBall() {
	if (y + dy > canvas.height - ballRadius)
	{
		if (x > paddleX && x < paddleX + paddleWidth)
		{
		  dy = -dy;
		}
		else
		{
		  alert("GAME OVER PLAYER 2 WINS");
		  document.location.reload();
		  clearInterval(interval);
		}
	   }
	else if (y + dy < ballRadius)
	{
		if (x > paddleX_2 && x < paddleX_2 + paddleWidth)
		{
		  dy = -dy;
		}
		else
		{
		  alert("GAME OVER PLAYER 1 WINS");
		  document.location.reload();
		  clearInterval(interval);
		}
	}
	   

}

function moveBall() {
	hitBall();

	
	  if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
		dx = -dx;
	   } 
	  x += dx;
	  y += dy;
	}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBall();
  drawPaddle ();
  drawPaddle2 ();
  if (rightPressed) {
	paddleX = Math.min(paddleX + 7, canvas.width - paddleWidth);
   } else if (leftPressed) {
	paddleX = Math.max(paddleX - 7, 0);
   }
   if (Dpressed) {
	paddleX_2 = Math.min(paddleX_2 + 7, canvas.width - paddleWidth);
   }
   else if (Apressed) {
	paddleX_2 = Math.max(paddleX_2 - 7, 0);
   }

   moveBall();
}


   

function startGame() {
	interval = setInterval(draw, 10);
}

 

document.getElementById("runButton").addEventListener("click", function () {
  startGame();
  this.disabled = true;
});