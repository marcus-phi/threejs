function HanoiTower(){};

HanoiTower.getSteps = function(num) {
	if(num === undefined || num < 1)
		num = 7;
	
	this.stacks = [[],[],[]];
	for(var i = num-1; i >= 0; i--)
		this.stacks[0].push(i);
		
	var steps = [];
	this.move(0, 2, num, steps);
	return steps;
}

HanoiTower.move = function(from, to, numToMove, steps) {
	if(from.length == 0 || numToMove == 0) return;
	
	var temp = (Math.max(from, to) + Math.abs(from - to)) % 3;
	
	this.move(from, temp, numToMove-1, steps);
	
	this.stacks[to].push(this.stacks[from].pop());
	steps.push({from: from, to: to});
		
	this.move(temp, to, numToMove-1, steps);
}