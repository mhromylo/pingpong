
export class MapObstacleSquare
{
	constructor(x, y, width, height, colour)
	{
		this.upperLeftX = x;
		this.upperLeftY = y;
		this.width = width;
		this.height = height;
		this.colour = colour;
		this.lowerRightX = x + width;
		this.lowerRightY = y + height;
	}

}


   


/*
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
      function bounceBall() {
 

        if (y + dy > canvas.height - ballRadius || y + dy < ballRadius) {
          dy = -dy;
        }
	   if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
		dx = -dx;
	   }
	   bounceBallOffMapObstacles();
      }


      // Move the ball
      function moveBall()
      {
        hitBall();
        x += dx;
        y += dy;
      }


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
	   ctx.fillText(powerupsOnMap.length.toString(), x, y);
	   let temp = performance.now() - powerupCountdown;
	   ctx.fillText(temp.toString(), x, y + 15)
	   for (let i = 0; i < dartsFlying.length; i++)
	   {
		ctx.font = "15px Lato";
		ctx.fillStyle = "black";
		ctx.fillText(dartsFlying[i].speed.toString(), x, y + 15 + i*15);

	   }
      }

*/


export class BallOfPoints
{
	constructor(x, y, colour, points, colourOfPoints, temp_dx, temp_dy)
	{
		this.x = x;
		this.y = y;
		this.radius = 16 - points;
		this.value = points + 1;
		this.colour = "#" + colour.toString(16).padStart(6, "0");
		this.colourOfPoints = colourOfPoints;
		this.points = points;
		this.dx = temp_dx;
		this.dy = temp_dy;
	}



	 
	 
	 
}





export class PowerUp
{
	constructor(x, y, width, height, powerUpType, speed)
	{
		this.upperLeftX = x;
		this.upperLeftY = y;
		this.width = width;
		this.height = height;
		this.lowerRightX = x + width;
		this.lowerRightY = y + height;
		this.powerUpType = powerUpType;
		this.speed = speed;
		this.mainColour = "MidnightBlue";
		this.crossColour = "PowderBlue";
	}
}

class Rectangle
{
	constructor(x, y, width, height)
	{
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.lowerRightX = x + width;
		this.lowerRightY = y + height;
	}

}

class circle
{
	constructor(x, y, radius)
	{
		this.x = x;
		this.y = y;
		this.radius = radius;
	}
}



export class Dart
{
	constructor(y, x, width, height, player)
	{
		this.upperLeftX = x + 2;
		this.upperLeftY = y;
		this.width = width;
		this.height = height;
		this.player = player;
		this.speed = 2 * -1 * player.ballTowardsUs;
	}


	twoRectanglesIntersect(rectA, rectB) {

		//console.log("rectA.x: " + rectA.x + " rectA.width: " + rectA.width + " rectB.x: " + rectB.x + " rectB.width: " + rectB.width);

		return !(
		    rectA.x + rectA.width < rectB.x ||  
		    rectA.x > rectB.x + rectB.width ||  
		    rectA.y + rectA.height < rectB.y || 
		    rectA.y > rectB.y + rectB.height    
		);
	 }

	  rectangleAndCircleIntersect(rect, circle)
	  {
		// Calculate the closest point on the rectangle to the circle's center
		const closestX = Math.max(rect.x, Math.min(circle.x, rect.lowerRightX));
		const closestY = Math.max(rect.y, Math.min(circle.y, rect.lowerRightY));
	   
		// Calculate the distance between the circle's center and the closest point
		const distanceX = circle.x - closestX;
		const distanceY = circle.y - closestY;
		const distanceSquared = distanceX * distanceX + distanceY * distanceY;
	   
		// Check if the distance is less than or equal to the circle's radius squared
		return distanceSquared <= circle.radius * circle.radius;
	   }

	 
	 dartHitPlayer(playerX, playerY, playerWidth, playerHeight)
	 {
		let playerRect = new Rectangle(playerX, playerY, playerWidth, playerHeight);
		let dartRect = new Rectangle(this.upperLeftX, this.upperLeftY, this.width, this.height);
		return this.twoRectanglesIntersect(playerRect, dartRect);
	 }

	 dartHitDart(dart_2)
	 {
		let dartRect = new Rectangle(this.upperLeftX, this.upperLeftY, this.width, this.height);
		let dart_2_Rect = new Rectangle(dart_2.upperLeftX, dart_2.upperLeftY, dart_2.width, dart_2.height);
		return this.twoRectanglesIntersect(dartRect, dart_2_Rect);
	 }

	 dartHitBall(ballX, ballY, ballRadius)
	 {
		let ballCircle = new circle(ballX, ballY, ballRadius);
		let dartRect = new Rectangle(this.upperLeftX, this.upperLeftY, this.width, this.height);
		return this.rectangleAndCircleIntersect(dartRect, ballCircle);
	 }

	 dartHitMapObstacle(mapObstacle)
	 {
		let mapObstacleRect = new Rectangle(mapObstacle.upperLeftX, mapObstacle.upperLeftY, mapObstacle.width, mapObstacle.height);
		let dartRect = new Rectangle(this.upperLeftX, this.upperLeftY, this.width, this.height);
		return this.twoRectanglesIntersect(mapObstacleRect, dartRect);
	 }
	
}

