import Player from "./Player.js";

const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

canvas.width;
canvas.height;

let x  ;
let y  ;
let dx ;
let dy ;
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
player1.keyDownHandler(e);
player2.keyDownHandler(e);
});

document.addEventListener("keyup", (e) => {
  player1.keyUpHandler(e);
  player2.keyUpHandler(e);
});

// Draw the ball
function drawBall()
{
  ctx.beginPath();
  ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#0095DD";
  ctx.fill();
  ctx.closePath();
}

// Handle ball collisions
function hitBall() {
  if (x - ballRadius < paddleWidth && y > player1.paddleY && y < player1.paddleY + paddleHeight) {
    dx = -dx;
  } else if (
    x + ballRadius > canvas.width - paddleWidth &&
    y > player2.paddleY &&
    y < player2.paddleY + paddleHeight
  ) {
    dx = -dx;
  } else if (x - ballRadius < 0) {
    player2.score++;
    resetBall();
    if (player2.score === 3) {
      alert("GAME OVER\n\nPLAYER 2 WINS");
      document.location.reload();
      clearInterval(interval);
    }
  } else if (x + ballRadius > canvas.width) {
    player1.score++;
    resetBall();
    if (player1.score === 3) {
      alert("GAME OVER\n\nPLAYER 1 WINS");
      document.location.reload();
      clearInterval(interval);
    }
  }

  if (y + dy > canvas.height - ballRadius || y + dy < ballRadius) {
    dy = -dy;
  }
}

// Reset ball position
function resetBall()
{
  x = canvas.width / 2;
  y = canvas.height / 2;
  dx = -dx;
}

// Move the ball
function moveBall()
{
  hitBall();
  x += dx;
  y += dy;
}

// Draw player scores
function drawScores() {
  ctx.font = "40px Lato";
  ctx.fillStyle = player1.paddleColour;
  ctx.fillText(player1.score.toString(), canvas.width / 4, 50);
  ctx.fillStyle = player2.paddleColour;
  ctx.fillText(player2.score.toString(), (canvas.width * 3) / 4, 50);
}

// Main draw loop
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawScores();
  drawBall();
  printBallDir(dx, dy, x, y, ctx)
  player1.drawPaddle(ctx, canvas);
  player2.drawPaddle(ctx, canvas);
  
  if (player1.isAI)
  {

	if (performance.now() - executeAIlogicInterval_player_1 >= AI_INTERVAL)
	{
  	player1.calculateWhereAIshouldMove(dx, dy, x, y, canvas, ballRadius);
	executeAIlogicInterval_player_1 = performance.now();
	}
	player1.moveAIpaddle(ctx);
  }
  else
  	player1.movePaddlePlayer(canvas);

  if (player2.isAI)
  {
	if (performance.now() - executeAIlogicInterval_player_2 >= AI_INTERVAL)
	{
		player2.calculateWhereAIshouldMove(dx, dy, x, y, canvas, ballRadius);
		executeAIlogicInterval_player_2 = performance.now();
	}   
	player2.moveAIpaddle(ctx);
  }
  else
    player2.movePaddlePlayer(canvas);

  moveBall();
}

// Start the game
function startGame(player1Type, player1Colour, player2Type, player2Colour) {

  if (interval)
  {
  	clearInterval(interval);
  }

  x = canvas.width / 2;
  y = canvas.height / 2;
  dx = 2; 
  dy = 1.5;


  player1 = new Player("Player 1", player1Type === "human" ? false : true, player1Colour, paddleWidth, paddleHeight, 7, 0, (canvas.height - paddleHeight) / 2, "w", "s", canvas.height, canvas.width);
  player2 = new Player("Player 2", player2Type === "human" ? false : true, player2Colour, paddleWidth, paddleHeight, 7, canvas.width - paddleWidth, (canvas.height - paddleHeight) / 2, "ArrowUp", "ArrowDown", canvas.height, canvas.width);

  // Start game loop
  interval = setInterval(draw, 10);
}

// Add event listener to start button
document.getElementById("runButton").addEventListener("click", () => {
  const player1Type = document.getElementById("player1Type").value;
  const player1Colour = document.getElementById("player1Colour").value;
  const player2Colour = document.getElementById("player2Colour").value;
  const player2Type = document.getElementById("player2Type").value;

  console.log("Game Starting...");
  console.log("Player 1 Type:", player1Type);
  console.log("Player 1 Colour:", player1Colour);
  console.log("Player 2 Colour:", player2Colour);
  console.log("Player 2 Type:", player2Type);

  startGame(player1Type, player1Colour, player2Type, player2Colour);
});


	/* TEST FUNCTIONS, DELETE LATER */
function	printBallDir(dx, dy, x, y, ctx)
{
//	ctx.font = "15px Lato";
//	ctx.fillStyle = "black";
//	ctx.fillText("dx: " + dx.toString(), x, y - 25);
//	ctx.fillText("dy: " + dy.toString(), x, y + 25);	
//	ctx.fillText("player 2 ballTowardsUs: " + player2.ballTowardsUs.toString(), x, y + 75);
//
//	ctx.fillText(player2.testValueDeleteLater_calculatedYforAI, x, y + 100);
//
//	
//
//
//	if (player2.ballTowardsUs * dx >= 0)
//		{
//			//print on the canvas that it is going towards the AI for thest
//			ctx.font = "25px Lato";
//			ctx.fillStyle = "black";
//			ctx.fillText("It is going towards the AI", 200, 200);
//		}
//	else
//		{
//			//print on the canvas that it is going towards the player for thest
//			ctx.font = "25px Lato";
//			ctx.fillStyle = "black";
//			ctx.fillText("It is going towards the player", 200, 200);
//		}
}

