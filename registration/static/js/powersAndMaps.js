
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
		    rectA.x + rectA.width < rectB.x ||  // A is to the left of B
		    rectA.x > rectB.x + rectB.width ||  // A is to the right of B
		    rectA.y + rectA.height < rectB.y || // A is above B
		    rectA.y > rectB.y + rectB.height    // A is below B
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

	 dartHitPowerup(powerUp)
	 {
		let powerUpRect = new Rectangle (powerUp.upperLeftX, powerUp.upperLeftY, powerUp.width, powerUp.height);
		let dartRect = new Rectangle(this.upperLeftX, this.upperLeftY, this.width, this.height);
		return this.twoRectanglesIntersect(powerUpRect, dartRect);
	 }
	
}
