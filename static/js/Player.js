import { MapObstacleSquare, Dart } from "./powersAndMaps.js";


let upDownButtonsGiven = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "ArrowUp", "ArrowDown", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "Up",           "Down"];
let upDownAlternate =    ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "Up",           "Down", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "ArrowUp", "ArrowDown"];
export default class Player
{

	constructor(name, isAI, paddleColour, paddleWidth, paddleHeight, paddleSpeed, paddleX, paddleY, moveUp, moveDown, canvasHeight, canvasWidth, game_id, player_id, shootButton)
	{
		this.name = name;
		this.isAI = isAI;
		this.paddleColour = paddleColour;
		this.paddleWidth = paddleWidth;
		this.paddleHeight = paddleHeight;
		this.paddleSpeed = paddleSpeed;
		this.paddleX = paddleX;
		this.paddleY = paddleY;
		this.score = 0;
		this.moveUp = moveUp;
		this.moveDown = moveDown;
		this.shootButton = shootButton;
		this.alternateMoveUp = upDownAlternate[upDownButtonsGiven.indexOf(moveUp)];
		this.alternateMoveDown =  upDownAlternate[upDownButtonsGiven.indexOf(moveDown)];
		this.alternateShootButton = upDownAlternate[upDownButtonsGiven.indexOf(shootButton)];
		this.UpPressed = false;
		this.DownPressed = false;
		this.canvasHeight = canvasHeight;
		this.canvasWidth = canvasWidth;

        this.game_id = game_id;
        this.player_id = player_id;

		this.testValueDeleteLater_calculatedYforAI = "";

		if (this.paddleX < canvasWidth / 2)
			this.ballTowardsUs = -1;
		else
			this.ballTowardsUs = 1;


		if (this.moveUp === this.moveDown || this.alternateMoveUp === this.alternateMoveDown || this.moveUp === this.alternateMoveDown || this.moveDown === this.alternateMoveUp)
		{
			console.log("Player", name, "has the same key for up and down movement. Please change this.");
		}

		if (this.isAI)
		{
			this.upperAIpaddleCenterPosition = canvasHeight / 2 - (paddleHeight / 2);
			this.lowerAIpaddleCenterPosition = canvasHeight / 2 + (paddleHeight / 2);
			this.AIcalculatedImpactSpot = canvasHeight / 2;


			this.dangerZone = 0.25;
		}
	}

	drawPaddle(ctx, canvas)
	{
		ctx.beginPath();
		ctx.rect(this.paddleX, this.paddleY, this.paddleWidth, this.paddleHeight);
		//console.log("Player Paddle Colour:", this.paddleColour); delete later, just for tests
		ctx.fillStyle = this.paddleColour.toString();
		//console.log("Player Paddle Colour:", ctx.fillStyle); delete later, just for tests
		ctx.fill(); 
		ctx.closePath();
	}

	expandPaddle()
	{
		this.paddleHeight += 30;
		this.paddleY -= 15;
		if (this.paddleY < 0)
			this.paddleY = 0;
		if (this.paddleY + this.paddleHeight > this.canvasHeight)
			this.paddleY = this.canvasHeight - this.paddleHeight;

	}
	 keyDownHandler(e, dartsFlying, extrasAreOn, gameRunning) {
		if (gameRunning === false)
		{
			console.log("AAAA");
			return;
		}
		console.log("BBB");
		if (e.key === this.moveUp || e.key === this.alternateMoveUp) {
		  this.UpPressed = true;
		  e.preventDefault();
		} else if (e.key === this.moveDown || e.key === this.alternateMoveDown) {
		  this.DownPressed = true;
		  e.preventDefault();
		}
		if ((e.key === this.shootButton || e.key === this.alternateShootButton) && extrasAreOn && (performance.now() - this.lastFiredDart) >= 15000)
		{
			let dartUpperLeftX = this.paddleX <  this.canvasWidth / 2 ? this.paddleX + this.paddleWidth : this.paddleX - 25 -this.paddleWidth;
			dartsFlying.push(new Dart(this.paddleY + (this.paddleHeight / 2) - 2, dartUpperLeftX, 25, 5, this));
			this.lastFiredDart = performance.now();
		}
	}
	   
	 keyUpHandler(e, gameRunning) {
		if (gameRunning === false)
		{
			console.log("CCC");
			return;
		}
		console.log("DDD");
		if (e.key === this.moveUp || e.key === this.alternateMoveUp) {
		  this.UpPressed = false;
		} else if (e.key === this.moveDown || e.key === this.alternateMoveDown) {
		   this.DownPressed = false;
		}
	   }	   

	movePaddlePlayer(canvas)
	{
		if (this.UpPressed)
		{
			this.paddleY = Math.max(this.paddleY - this.paddleSpeed, 0);

		}
		else if (this.DownPressed)
		{
			this.paddleY = Math.min(this.paddleY + this.paddleSpeed, canvas.height - this.paddleHeight);
		}
	}


	/* Functions for AI players*/


	calculateApproxHitSpot(dx, dy, x, y, canvas)
	{
		if (dy < 0)
		{
			this.AIcalculatedImpactSpot = this.paddleHeight;
		}
		else
		{
			this.AIcalculatedImpactSpot = this.canvasHeight - this.paddleHeight;
		}
	}

	calculateWhereAiShouldInterceptBall(ballDirX, ballDirY, ballx, bally, ballRadius)
	{

	let timeToVerticalWall;
	if (ballDirX > 0)
		timeToVerticalWall = (this.canvasWidth - ballx  +  ballRadius) / Math.abs(ballDirX);
	else
	{
		timeToVerticalWall = (ballx - ballRadius) / Math.abs(ballDirX);
	}
   
	let predictedY = bally + ballDirY * timeToVerticalWall;
   
	if (predictedY - ballRadius < 0 || predictedY + ballRadius > this.canvasHeight)
	{
	  let timeToHorizontalWall = 
	    predictedY - ballRadius < 0 
		 ? (ballRadius - bally) / ballDirY
		 : (this.canvasHeight - ballRadius - bally) / ballDirY;
   
	  let newBallX = ballx + ballDirX * timeToHorizontalWall;
	  let newBallY;
	  if (ballDirY > 0)
		newBallY = this.canvasHeight - ballRadius;
	  else
		newBallY = ballRadius;

	  let newBallDirY = -ballDirY;
	  this.calculateWhereAiShouldInterceptBall(ballDirX, newBallDirY, newBallX, newBallY, ballRadius);
	}
	else
	{
	  this.AIcalculatedImpactSpot = predictedY;
	  this.testValueDeleteLater_calculatedYforAI = "predictedY: " + predictedY + " ballDirY: " + ballDirY + " \ntimeToVerticalWall: " + timeToVerticalWall + " \nbally: " + bally + " ballRadius: " + ballRadius + " ";

	}
}

	calculateWhereAIshouldMove(dx, dy, x, y, canvas, ballRadius)
	{

		if (this.ballTowardsUs * dx < 0)
		{
			this.AIcalculatedImpactSpot = this.canvasHeight / 2;
			this.upperAIpaddleCenterPosition = this.AIcalculatedImpactSpot - (this.paddleSpeed / 2);
			this.lowerAIpaddleCenterPosition = this.AIcalculatedImpactSpot + (this.paddleSpeed / 2);
		}
		else if ((this.canvasWidth * (1 - this.dangerZone) > x && this.ballTowardsUs === 1) || (this.canvasWidth * this.dangerZone < x && this.ballTowardsUs === -1))
		{
			this.calculateApproxHitSpot(dx, dy, x, y);
		}
		else
		{
		   this.calculateWhereAiShouldInterceptBall(dx, dy, x, y, ballRadius);
		}
	   
		if (this.AIcalculatedImpactSpot >= (this.canvasHeight - (this.paddleHeight / 2)))
		{
		   this.upperAIpaddleCenterPosition = this.canvasHeight - (this.paddleHeight / 2);
		   this.lowerAIpaddleCenterPosition = this.upperAIpaddleCenterPosition + 1;
		}
		else if (this.AIcalculatedImpactSpot <= this.paddleHeight / 2)
		{
		   this.lowerAIpaddleCenterPosition = this.paddleHeight / 2;
		   this.upperAIpaddleCenterPosition = this.lowerAIpaddleCenterPosition - 1;
		}
		else
		{
			this.upperAIpaddleCenterPosition = this.AIcalculatedImpactSpot - (this.paddleSpeed / 2);
			this.lowerAIpaddleCenterPosition = this.AIcalculatedImpactSpot + (this.paddleSpeed / 2);
		}	
	}

	moveAIpaddle(ctx) {

		let paddleCenter = this.paddleY + this.paddleHeight / 2;
	
		//draw circle around paddle center for testing
		ctx.beginPath();
		ctx.arc(this.paddleX - (10 * this.ballTowardsUs), paddleCenter, 5, this.paddleX, Math.PI * 2);
		ctx.fillStyle = "gray";
		ctx.fill();
		ctx.closePath();
		
		ctx.beginPath();
		ctx.arc(this.paddleX - (10 * this.ballTowardsUs), this.upperAIpaddleCenterPosition, 5, this.paddleX, Math.PI * 2);
		ctx.fillStyle = "white";
		ctx.fill();
		ctx.closePath();
		
		ctx.beginPath();
		ctx.arc(this.paddleX - (10 * this.ballTowardsUs), this.lowerAIpaddleCenterPosition, 5, this.paddleX, Math.PI * 2);
		ctx.fillStyle = "black";
		ctx.fill();
		ctx.closePath();




		  if ((paddleCenter >= this.upperAIpaddleCenterPosition) && (paddleCenter <= this.lowerAIpaddleCenterPosition))
		  {
			return;
		  }
		  if (paddleCenter > this.lowerAIpaddleCenterPosition)
			this.paddleY = Math.max(this.paddleY - 7, 0);
		  else
			this.paddleY = Math.min(this.paddleY + 7, this.canvasHeight - this.paddleHeight);
	}




}