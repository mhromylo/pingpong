
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

	//drawSquare(ctx)
	//{
	//	ctx.beginPath();
	//	ctx.rect(this.x, this.y, this.width, this.height);
	//	ctx.fillStyle = this.colour;
	//	ctx.fill();
	//	ctx.closePath();
	//}
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

		console.log("rectA.x: " + rectA.x + " rectA.width: " + rectA.width + " rectB.x: " + rectB.x + " rectB.width: " + rectB.width);

		return !(
		    rectA.x + rectA.width < rectB.x ||  // A is to the left of B
		    rectA.x > rectB.x + rectB.width ||  // A is to the right of B
		    rectA.y + rectA.height < rectB.y || // A is above B
		    rectA.y > rectB.y + rectB.height    // A is below B
		);
	 }
	 
	 dartHitPlayer(playerX, playerY, playerWidth, playerHeight)
	 {
		let playerRect = new Rectangle(playerX, playerY, playerWidth, playerHeight);
		let dartRect = new Rectangle(this.upperLeftX, this.upperLeftY, this.width, this.height);
		return this.twoRectanglesIntersect(playerRect, dartRect);
	 }
	
}

