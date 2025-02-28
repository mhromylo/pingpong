import Player from "./Player.js";
import { MapObstacleSquare, Dart } from "./powersAndMaps.js";

var canvas = document.getElementById("myCanvas");
var ctx;
let mapObstacleSquares = [];
let dartsFlying = [];
let currentMap;
let extrasAreOn;

function setupCanvas() {
  canvas = document.getElementById("myCanvas");
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
		player1.keyDownHandler(e, dartsFlying, extrasAreOn);
		player2.keyDownHandler(e, dartsFlying, extrasAreOn);
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


	   //test delete later
	   ctx.font = "15px Lato";
	   ctx.fillStyle = "black";
	   ctx.fillText(dartsFlying.length.toString(), x, y);
	   for (let i = 0; i < dartsFlying.length; i++)
	   {
		ctx.font = "15px Lato";
		ctx.fillStyle = "black";
		ctx.fillText(dartsFlying[i].speed.toString(), x, y + 15 + i*15);

	   }
      }

      // Handle ball collisions

	 function bounceBallOffMapObstacles()
	 {
		for (let i = 0; i < mapObstacleSquares.length; i++)
		{
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
          resetBall();
          if (player2.score === 3) {
            alert("GAME OVER\n\nPLAYER 2 WINS");
            console.log('Saving game result with:', {
                game_id: player1.game_id,
                player1_id: player1.player_id,
                player2_id: player2.player_id,
                player1_score: player1.score,
                player2_score: player2.score,
            });
            clearInterval(interval);
            saveGameResult(player1.game_id, player1.player_id, player2.player_id, player1.score, player2.score);
          }
        } else if (x + ballRadius > canvas.width) {
          player1.score++;
          resetBall();
          if (player1.score === 3) {
            alert("GAME OVER\n\nPLAYER 1 WINS");
            console.log('Saving game result with:', {
                game_id: player1.game_id,
                player1_id: player1.player_id,
                player2_id: player2.player_id,
                player1_score: player1.score,
                player2_score: player2.score,
            });
            clearInterval(interval);
            saveGameResult(player1.game_id, player1.player_id, player2.player_id, player1.score, player2.score);
          }
        }

        if (y + dy > canvas.height - ballRadius || y + dy < ballRadius) {
          dy = -dy;
        }
	   bounceBallOffMapObstacles();
      }

      // Reset ball position
      function resetBall()
      {
        x = canvas.width / 2;
        y = canvas.height / 2;
        dx = -dx;

	   if (currentMap === "box")
		y = 100;
      }

      // Move the ball
      function moveBall()
      {
        hitBall();
        x += dx;
        y += dy;
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

	 function dartsHitThings() {
		let dartsToRemove = [];
	 
		for (let i = dartsFlying.length - 1; i >= 0; i--) {
		    if (dartsFlying[i].dartHitPlayer(player1.paddleX, player1.paddleY, player1.paddleWidth, player1.paddleHeight) && dartsFlying[i].player !== player1) {
			   player1.score -= 0.5;
			   dartsToRemove.push(i);
		    }
		    if (dartsFlying[i].dartHitPlayer(player2.paddleX, player2.paddleY, player2.paddleWidth, player2.paddleHeight) && dartsFlying[i].player !== player2) {
			   player2.score -= 0.5;
			   dartsToRemove.push(i);
		    }
		}
	 
		// Remove marked darts **after** loop (to avoid skipping elements)
		for (let index of dartsToRemove) {
		    dartsFlying.splice(index, 1);
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

      // Main draw loop
      function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
	   drawMapObstacles();
        drawScores();
        drawBall();
	   drawDarts();
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

	   dartsHitThings();
        moveBall();
	   moveDarts();
      }

      // Start the game
      function startGame(player1Type, player1Colour, player2Type, player2Colour, chosenMap, extrasOnOff, game_id, player1_id, player2_id) {

        
        if (interval)
        {
          clearInterval(interval);
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
	   mapObstacleSquares = [];
	   dartsFlying = [];


        x = canvas.width / 2;
        y = canvas.height / 2;
        dx = 2; 
        dy = 1.5;
	   currentMap = chosenMap;

	   if (chosenMap === "box")
	   {
		mapObstacleSquares.push(new MapObstacleSquare(canvas.width*0.4, canvas.height*0.4, canvas.width*0.2, canvas.height*0.2, "black"));
		y = 100;
	   }
	   else if (chosenMap === "twoLines")
	   {
		mapObstacleSquares.push(new MapObstacleSquare(canvas.width*0.2, canvas.height*0.2, canvas.width*0.25, canvas.height*0.1, "black"));
		mapObstacleSquares.push(new MapObstacleSquare(canvas.width*0.55, canvas.height*0.7, canvas.width*0.25, canvas.height*0.1, "black"));
   	  }

	  if (extrasOnOff === "ON")
		extrasAreOn = true;
	  else
	  	extrasAreOn = false;

	


        player1 = new Player("Player 1", player1Type === "human" ? false : true, player1Colour, paddleWidth, paddleHeight, 7, 0, (canvas.height - paddleHeight) / 2, "w", "s", canvas.height, canvas.width, game_id, player1_id);
        player2 = new Player("Player 2", player2Type === "human" ? false : true, player2Colour, paddleWidth, paddleHeight, 7, canvas.width - paddleWidth, (canvas.height - paddleHeight) / 2, "ArrowUp", "ArrowDown", canvas.height, canvas.width, game_id, player2_id);

        // Start game loop
        interval = setInterval(draw, 10);
      }

    //   $(document).on("click", "#startTournamentGame", function () {
    //     setupCanvas();
    //     const game_id = $(this).data("game-id");
    //     const player1_id = $(this).data("player1-id");
    //     const player2_id = $(this).data("player2-id");
    
    //     console.log('game:', game_id); // Log the payload
    //     console.log('player1:', player1_id);
    //     console.log('player2_id:', player2_id);
    //    const gameCanvas = document.getElementById('myCanvas');
    //    // Scroll to the canvas element  
    //    gameCanvas.scrollIntoView({
    //        behavior: 'smooth',  // Smooth scrolling
    //        block: 'center',     // Scroll to the center of the canvas element
    //        inline: 'center'     // Optionally, center horizontally as well
    //    });

    //     startGame("human", "red", "human", "red", "normal", "OFF", game_id, player1_id, player2_id);
    //   });


      
    // $(document).on("click", ".startTournamentGame", function () {
    //     const game_id = $(this).data("game-id");
    //     const player1_id = $(this).data("player1-id");
    //     const player2_id = $(this).data("player2-id");
    
    //     console.log('game:', game_id);
    //     console.log('player1:', player1_id);
    //     console.log('player2:', player2_id);

    //     const gameCanvas = document.getElementById('myCanvas');
    //    // Scroll to the canvas element  
    //     gameCanvas.scrollIntoView({
    //        behavior: 'smooth',  // Smooth scrolling
    //        block: 'center',     // Scroll to the center of the canvas element
    //        inline: 'center'     // Optionally, center horizontally as well
    //     });
    
    //     // Call your function
    //     startGame("human", "blue", "human", "red", "normal", "OFF", game_id, player1_id, player2_id);
    // });

//     document.querySelectorAll('.startTournamentGame').forEach(button => {
//         button.addEventListener('click', function () {
//             console.log('Button clicked!'); // Check if this logs when the button is clicked

//             const game_id = this.getAttribute('data-game-id');
//             const player1_id = this.getAttribute('data-player1-id');
//             const player2_id = this.getAttribute('data-player2-id');

//             console.log('game:', game_id);
//             console.log('player1:', player1_id);
//             console.log('player2:', player2_id);

//             // Call your function
//             const gameCanvas = document.getElementById('myCanvas');
//    // Scroll to the canvas element  
//             gameCanvas.scrollIntoView({
//                 behavior: 'smooth',  // Smooth scrolling
//                 block: 'center',     // Scroll to the center of the canvas element
//                 inline: 'center'     // Optionally, center horizontally as well
//                 });

//     // Call your function
//             startGame("human", "blue", "human", "red", "normal", "OFF", game_id, player1_id, player2_id);
//         });
//     });

    document.addEventListener("click", function (event) {
        if (event.target.classList.contains("startTournamentGame")) {
            console.log('Button clicked!');

            const game_id = event.target.getAttribute('data-game-id');
            const player1_id = event.target.getAttribute('data-player1-id');
            const player2_id = event.target.getAttribute('data-player2-id');

            console.log('game:', game_id);
            console.log('player1:', player1_id);
            console.log('player2:', player2_id);

            const gameCanvas = document.getElementById('myCanvas');
            if (gameCanvas) {
                gameCanvas.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            } else {
                console.error("Canvas element not found!");
            }

            startGame("human", "blue", "human", "red", "normal", "OFF", game_id, player1_id, player2_id);
        }
    });
    
    //   $(document).on("click", "#runButton", function () {
    //     setupCanvas();
    //     const player1Type = document.getElementById("player1Type").value;
    //     const player1Colour = document.getElementById("player1Colour").value;
    //     const player2Colour = document.getElementById("player2Colour").value;
    //     const player2Type = document.getElementById("player2Type").value;
	//    const chosenMap = document.getElementById("chosenMap").value;
	//    const extrasOnOff = document.getElementById("extrasAreOn").value;
      
    //     console.log("Game Starting...");
    //     console.log("Player 1 Type:", player1Type);
    //     console.log("Player 1 Colour:", player1Colour);
    //     console.log("Player 2 Colour:", player2Colour);
    //     console.log("Player 2 Type:", player2Type);
      
    //     startGame(player1Type, player1Colour, player2Type, player2Colour, chosenMap, extrasOnOff, 1, 1, 2);
    //   });
    
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

  function saveGameResult(game_id, player1_id, player2_id, player1_score, player2_score){
    const csrfToken = getCSRFToken();

    if (!game_id || !player1_id || !player2_id) {
        console.error("Missing game/player IDs!");
        return;
    }

    const payload = {
        game_id: game_id,
        player1_id: player1_id,
        player2_id: player2_id,
        player1_score: player1_score,
        player2_score: player2_score,
    };

    console.log('Payload:', payload); // Log the payload

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
            console.log('Game result saved:', data.message);
        } else {
            console.error('Error saving game result:', data.message);
        }
    })
    .catch(error => console.error('Error:', error));
}

  }
  })
