import Player from "./Player_new_game.js";
import { MapObstacleSquare, Dart, PowerUp, BallOfPoints } from "./powersAndMaps_new_game.js";
import { enableButtons } from './tournament.js';
import { disableButtons } from './tournament.js';
import { loadPage } from './main.js';
import { fetchNewCSRFToken } from './main.js';

var canvas = document.getElementById("newGameCanwas");
var ctx;
let mapObstacleSquares = [];
let dartsFlying = [];
let powerupsOnMap = [];
let ballsOfPoints = [];
let powerupCountdown;
let powerupSpawnSide = "UP";
let extrasAreOn;
let timerStart;

let gameRunning = false;

function setupCanvas() {
  canvas = document.getElementById("newGameCanwas");
  if (!canvas) {
      console.error("Canvas not found!");
      return;
  }
  ctx = canvas.getContext("2d");
}

$(document).ready(function ()
{
  if (canvas)
  {
      ctx = canvas.getContext("2d");

      canvas.width;
      canvas.height;


      const paddleHeight = 20; // Side paddle height
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

      // Handle ball collisions



	function movePowerups()
	{
		for (let i = powerupsOnMap.length - 1; i >= 0; i--)
		{
			powerupsOnMap[i].upperLeftY += powerupsOnMap[i].speed;
			if ((powerupsOnMap[i].speed > 0 && powerupsOnMap[i].upperLeftY + powerupsOnMap[i].height >= canvas.height) || 
				(powerupsOnMap[i].speed < 0 && powerupsOnMap[i].upperLeftY <= 0))
			{
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


	 function moveDarts()
	 {
		for (let i = dartsFlying.length - 1; i >= 0; i--)
		{
			if (dartsFlying[i].upperLeftX + dartsFlying[i].width < 0 || dartsFlying[i].upperLeftX > canvas.width)
			{
				dartsFlying.splice(i, 1);
			}
			dartsFlying[i].upperLeftX += dartsFlying[i].speed;  
		}
	 }

	 function createInitialBalls()
	 {
		for (let i = 0; i < 15; i++)
		{
			//need random colour
			let tempBallColour = Math.floor(Math.random() * 16777216 );
			let tempDistanceFromCentre = Math.floor(Math.random() * (canvas.width / 3)) + 100;
			let tempDistanceFromTop = Math.floor(Math.random() * (canvas.height - 40)) + 20;
			let tempBallSize = Math.floor(Math.random() * 9) + 6;
			let tempBallColourOfPoints;
			if (tempBallColour >= 16777216/2)
				tempBallColourOfPoints = "black";
			else
				tempBallColourOfPoints = "white";

			let temp_dx = Math.floor(Math.random() * 4) + 1;
			let temp_dy = Math.floor(Math.random() * 4) + 1;


			//add dirs and speeds here

			//...
			ballsOfPoints.push(new BallOfPoints(canvas.width/2 + tempDistanceFromCentre, tempDistanceFromTop, tempBallColour, tempBallSize, tempBallColourOfPoints, temp_dx, temp_dy));
			ballsOfPoints.push(new BallOfPoints(canvas.width/2 - tempDistanceFromCentre, tempDistanceFromTop, tempBallColour, tempBallSize, tempBallColourOfPoints, -temp_dx, temp_dy));


		}
	 }

	function createReplacementBall(player)
	 {
		let tempBallColour = Math.floor(Math.random() * 16777216 );
		let tempDistanceFromCentre = Math.floor(Math.random() * (canvas.width / 3)) + 100;
		if (player.paddleX < canvas.width / 2)
			tempDistanceFromCentre = -tempDistanceFromCentre;

		let tempDistanceFromTop = Math.floor(Math.random() * (canvas.height - 40)) + 20;
		let tempBallSize = Math.floor(Math.random() * 9) + 6;
		let tempBallColourOfPoints;
		if (tempBallColour >= 16777216/2)
			tempBallColourOfPoints = "white";
		else
			tempBallColourOfPoints = "black";
		let temp_dx = Math.floor(Math.random() * 4) + 1;
		let temp_dy = Math.floor(Math.random() * 4) + 1;
		ballsOfPoints.push(new BallOfPoints(canvas.width/2 + tempDistanceFromCentre, tempDistanceFromTop, tempBallColour, tempBallSize, tempBallColourOfPoints, temp_dx, temp_dy));

	 }


	 function dartsHitThings() {
		let dartsToRemove = [];
	 


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
		for (let j = ballsOfPoints.length - 1; j >= 0; j--)
		{
			if (dartsFlying[i].dartHitBall(ballsOfPoints[j].x, ballsOfPoints[j].y, ballsOfPoints[j].radius))
			{
				dartsFlying[i].player.score += ballsOfPoints[j].value;
				createReplacementBall(dartsFlying[i].player);
				dartsFlying.splice(i, 1);
				ballsOfPoints.splice(j, 1);
				break;
			}
		}
	
	}
	 }

	 function bounceBallOffMapObstacles(ball)
	 {  
		for (let i = 0; i < mapObstacleSquares.length; i++) {
		    if (ball.x < mapObstacleSquares[i].upperLeftX && ball.dx > 0 && ball.x + ball.radius > mapObstacleSquares[i].upperLeftX && ball.y > mapObstacleSquares[i].upperLeftY && ball.y < mapObstacleSquares[i].lowerRightY)
			   ball.dx = -ball.dx;
		    else if (ball.x > mapObstacleSquares[i].upperLeftX && ball.dx < 0 && ball.x - ball.radius < mapObstacleSquares[i].lowerRightX && ball.y > mapObstacleSquares[i].upperLeftY && ball.y < mapObstacleSquares[i].lowerRightY)
			   ball.dx = -ball.dx;
		    else if (ball.y < mapObstacleSquares[i].upperLeftY && ball.dy > 0 && ball.y + ball.radius > mapObstacleSquares[i].upperLeftY && ball.x > mapObstacleSquares[i].upperLeftX && ball.x < mapObstacleSquares[i].lowerRightX)
			   ball.dy = -ball.dy;
		    else if (ball.y > mapObstacleSquares[i].upperLeftY && ball.dy < 0 && ball.y - ball.radius < mapObstacleSquares[i].lowerRightY && ball.x > mapObstacleSquares[i].upperLeftX && ball.x < mapObstacleSquares[i].lowerRightX)
			   ball.dy = -ball.dy;
		}
	 }
	 
	 function moveBalls() {
		for (let i = 0; i < ballsOfPoints.length; i++) {
		    if (ballsOfPoints[i].x + ballsOfPoints[i].dx > canvas.width - ballsOfPoints[i].radius || ballsOfPoints[i].x + ballsOfPoints[i].dx < ballsOfPoints[i].radius) {
			   ballsOfPoints[i].dx = -ballsOfPoints[i].dx;
		    }
		    if (ballsOfPoints[i].y + ballsOfPoints[i].dy > canvas.height - ballsOfPoints[i].radius || ballsOfPoints[i].y + ballsOfPoints[i].dy < ballsOfPoints[i].radius) {
			   ballsOfPoints[i].dy = -ballsOfPoints[i].dy;
		    }
		    bounceBallOffMapObstacles(ballsOfPoints[i]);  
		    ballsOfPoints[i].x += ballsOfPoints[i].dx;
		    ballsOfPoints[i].y += ballsOfPoints[i].dy;
		}
	 }


	 function declareWinner()
	 {
		if (performance.now() - timerStart > 30000)
		{
			if (player1.score > player2.score)
			{
                gameRunning = false;
                          enableButtons();
				ctx.beginPath();
				ctx.rect(canvas.width*0.45, canvas.height*0.40, canvas.width*0.1, canvas.height*0.2);
				ctx.fillStyle = player1.paddleColour;
				ctx.fill();
				alert("Player 1 wins!");
                saveAnotherGameResult(player1.another_game_id, player1.player_id, player2.player_id, player1.score, player2.score );
			}
			else if (player2.score > player1.score)
			{
                gameRunning = false;
                          enableButtons();
				ctx.beginPath();
				ctx.rect(canvas.width*0.45, canvas.height*0.40, canvas.width*0.1, canvas.height*0.2);
				ctx.fillStyle = player2.paddleColour;
				ctx.fill();
				alert("Player 2 wins!");
                saveAnotherGameResult(player1.another_game_id, player1.player_id, player2.player_id, player1.score, player2.score );
			}
			else
			{
                gameRunning = false;
                          enableButtons();
				ctx.beginPath();
				ctx.rect(canvas.width*0.45, canvas.height*0.40, canvas.width*0.1, canvas.height*0.2);
				ctx.fillStyle = "black";
				ctx.fill();

				alert("It's a tie! we didnt save result");
			}
			clearInterval(interval);
		}

		}

	function drawBallsOfPoints()
	 {
		for (let i = 0; i < ballsOfPoints.length; i++)
		{
			ctx.beginPath();
			ctx.arc(ballsOfPoints[i].x, ballsOfPoints[i].y, ballsOfPoints[i].radius, 0, Math.PI * 2);
			ctx.fillStyle = ballsOfPoints[i].colour;
			ctx.fill();
			ctx.closePath();

			ctx.font = "12px Lato";
			ctx.fillStyle = ballsOfPoints[i].colourOfPoints;
			ctx.fillText(ballsOfPoints[i].value.toString(), ballsOfPoints[i].x - 2, ballsOfPoints[i].y);
		}
	 }	 

	 


      function drawScores() {
        ctx.font = "40px Lato";
        ctx.fillStyle = player1.paddleColour;
        ctx.fillText(player1.score.toString(), canvas.width / 4, 50);
        ctx.fillStyle = player2.paddleColour;
        ctx.fillText(player2.score.toString(), (canvas.width * 3) / 4, 50);

	   let current_second = Math.abs(Math.floor((performance.now() - timerStart) / 1000) - 29);
	   ctx.font = "40px Lato";
	   ctx.fillStyle = "white";
	   let adjust = 0;
	   if (current_second < 10)
		adjust = 10;
	   ctx.fillText(current_second.toString(), canvas.width / 2 - 20 + adjust, canvas.height / 2 - 10);
      }

	 function drawMapObstacles()
	 {
		for (let i = 0; i < mapObstacleSquares.length; i++)
		{
			ctx.beginPath();
			ctx.rect(mapObstacleSquares[i].upperLeftX, mapObstacleSquares[i].upperLeftY, mapObstacleSquares[i].width, mapObstacleSquares[i].height);
			ctx.fillStyle = mapObstacleSquares[i].colour;
			ctx.fill();
			ctx.closePath();
		}
	 }
	 function drawDarts()
	 {
		for (let i = 0; i < dartsFlying.length; i++)
		{
			ctx.beginPath();
			ctx.rect(dartsFlying[i].upperLeftX, dartsFlying[i].upperLeftY, dartsFlying[i].width, dartsFlying[i].height);
			ctx.fillStyle = dartsFlying[i].player.paddleColour;
			ctx.fill();
			ctx.closePath();
		}
	 }

	 function drawPowerups()
	 {
		for (let i = 0; i < powerupsOnMap.length; i++)
		{
			ctx.beginPath();
			ctx.rect(powerupsOnMap[i].upperLeftX, powerupsOnMap[i].upperLeftY, powerupsOnMap[i].width, powerupsOnMap[i].height);
			ctx.fillStyle = powerupsOnMap[i].mainColour;
			ctx.fill();
			ctx.closePath();
			ctx.beginPath();
			ctx.rect(powerupsOnMap[i].upperLeftX + powerupsOnMap[i].width/2 - 5, powerupsOnMap[i].upperLeftY + 5, 10, 20);
			ctx.fillStyle = powerupsOnMap[i].crossColour;
			ctx.fill();
			ctx.closePath();
			ctx.beginPath();
			ctx.rect(powerupsOnMap[i].upperLeftX + 5, powerupsOnMap[i].upperLeftY + powerupsOnMap[i].height/2 - 5, 20, 10);
			ctx.fillStyle = powerupsOnMap[i].crossColour;
			ctx.fill();
	 }
	}

      // Main draw loop
      function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
	   //createPowerups();
	   drawMapObstacles();
        drawScores();
        //drawBall();
	   drawBallsOfPoints();
	   drawDarts();
	   //drawPowerups();
        player1.drawPaddle(ctx, canvas);
        player2.drawPaddle(ctx, canvas);
        
        player1.movePaddlePlayer(canvas);
        player2.movePaddlePlayer(canvas);

	   dartsHitThings();
        moveBalls();
	   movePowerups();
	   moveDarts();
	   declareWinner();

       if (window.location.href != "https://localhost/another_game/") {
        gameRunning = false;
        alert("Game ended");
        clearInterval(interval);
      }
      }

      // Start the game
      function startGame(player1Type, player1Colour, player2Type, player2Colour, another_game_id, player1_id, player2_id) {

        if (interval)
        {
          clearInterval(interval);
        }
	   timerStart = performance.now();

        ctx.clearRect(0, 0, canvas.width, canvas.height);
	   mapObstacleSquares = [];
	   dartsFlying = [];
	   powerupsOnMap = [];
	   ballsOfPoints = [];
	   powerupCountdown = performance.now() - 70000;




	   
	mapObstacleSquares.push(new MapObstacleSquare(canvas.width*0.45, canvas.height*0.40, canvas.width*0.1, canvas.height*0.2, "black"));
	mapObstacleSquares.push(new MapObstacleSquare(canvas.width*0.48, 0, canvas.width*0.04, canvas.height, "black"));
	   

	extrasAreOn = true;


	createInitialBalls();
        player1 = new Player("Player 1", player1Type === "human" ? false : true, player1Colour, paddleWidth, paddleHeight, 7, 0, (canvas.height - paddleHeight) / 2, "w", "s", canvas.height, canvas.width,  "r", another_game_id, player1_id);
        player2 = new Player("Player 2", player2Type === "human" ? false : true, player2Colour, paddleWidth, paddleHeight, 7, canvas.width - paddleWidth, (canvas.height - paddleHeight) / 2, "ArrowUp", "ArrowDown", canvas.height, canvas.width, "l", another_game_id, player2_id);

        // Start game loop
        interval = setInterval(draw, 10);
        gameRunning = true;
      }

      $(document).on("click", "#newRunButton", function (event) {
        setupCanvas();
        const player1Type  = "human";
        const player1Colour = document.getElementById("player1Colour").value;
        const player2Colour = document.getElementById("player2Colour").value;
        const player2Type = "human";
        const another_game_id = event.target.getAttribute('data-another_game-id');
        const player1_id = event.target.getAttribute('data-player1-id');
        const player2_id = event.target.getAttribute('data-player2-id');

        disableButtons();
        console.log("Another Game Starting...");
        console.log("another_game_id:", another_game_id);
        console.log("player1_id:", player1_id);
        console.log("player2_id:", player2_id);
        console.log("Player 1 Type:", player1Type);
        console.log("Player 1 Colour:", player1Colour);
        console.log("Player 2 Colour:", player2Colour);
        console.log("Player 2 Type:", player2Type);

      
        startGame(player1Type, player1Colour, player2Type, player2Colour, another_game_id, player1_id, player2_id);
      });

  }
  
})

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

function saveAnotherGameResult(another_game_id, player1_id, player2_id, player1_score, player2_score) {
  const csrfToken = getCSRFToken();

  const payload = {
    another_game_id: another_game_id,
    player1_id: player1_id,
    player2_id: player2_id,
    player1_score: player1_score,
    player2_score: player2_score,
  };

  console.log('Payload:', payload); // Log the payload

  fetch('/save_another_game_result/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken,
    },
    body: JSON.stringify({
    another_game_id: another_game_id,
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
        console.log('Game result saved:', data.message);
      } else {
        console.error('Error saving game result:', data.message);
      }
    })
    .catch(error => console.error('Error:', error));
}
