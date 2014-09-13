function PoissonSampling(){}

PoissonSampling.generateSamples = function(whd, min_dist, new_points_count, random_pop, exclusion_zones) {
	var cellSize = min_dist/Math.sqrt(2);
	
	var gridDimension = {
		w: (whd.w === undefined || whd.w < cellSize) ? 1 : Math.ceil(whd.w/cellSize),
		h: (whd.h === undefined || whd.h < cellSize) ? 1 : Math.ceil(whd.h/cellSize),
		d: (whd.w === undefined || whd.d < cellSize) ? 1 : Math.ceil(whd.d/cellSize),
	}
	var grid = this.initGrid(gridDimension);
	
	var processList = [];
	var samplePoints = [];
	
	var firstPoint = { x: Math.random()*whd.w, y: Math.random()*whd.h, z: Math.random()*whd.d };
	while(this.inExclusionZones(firstPoint, exclusion_zones))
		firstPoint = { x: Math.random()*whd.w, y: Math.random()*whd.h, z: Math.random()*whd.d };
	
	processList.push(firstPoint);
	samplePoints.push(firstPoint);
	
	this.addPointToGrid(firstPoint, grid, cellSize);
	
	while(processList.length > 0) {
		var point = PoissonSampling.pop(processList, random_pop);
		for(var i = 0; i < new_points_count; i++) {
			var newPoint = this.generateRandomPointAround(point, min_dist, grid.d > 1);
			if(this.inRectangle(newPoint, {x: 0, y: 0, z: 0}, whd) == true && 
				this.inExclusionZones(newPoint, exclusion_zones) == false &&
				this.inNeighborhood(grid, newPoint, min_dist, cellSize) == false) {
				processList.push(newPoint);
				samplePoints.push(newPoint);
				this.addPointToGrid(newPoint, grid, cellSize);
			}
		}
	}
	
	return samplePoints;
}

PoissonSampling.initGrid = function(whd) {
	var grid = [];
	
	for(var d = 0; d < whd.d; d++) {
		var plane = [];
		for(var h = 0; h < whd.h; h++) {
			var row = [];
			for(var w = 0; w < whd.w; w++)
				row.push({});
			plane.push(row);
		}
		grid.push(plane);
	}
	
	grid.w = whd.w;
	grid.h = whd.h;
	grid.d = whd.d;
	
	return grid;
}

PoissonSampling.getGridIndexFromPos = function(point, cell_size) {
	return { x: Math.floor(point.x/cell_size), y: Math.floor(point.y/cell_size), z: Math.floor(point.z/cell_size) };
}

PoissonSampling.addPointToGrid = function(point, grid, cell_size) {
	var idx = this.getGridIndexFromPos(point, cell_size);
	grid[idx.z][idx.y][idx.x] = point;
}

PoissonSampling.pop = function(list, random) {
	if(!random)
		return list.pop();
	var ranIdx = Math.floor(Math.random() * list.length);
	return list.splice(ranIdx, 1)[0];
}

PoissonSampling.generateRandomPointAround = function(point, min_dist, sphere) {
	var radius = min_dist * (1 + Math.random());
	var azi = Math.PI * 2 * Math.random();
	var inc = sphere ? Math.PI * Math.random() : Math.PI / 2;
	return { x: point.x + radius * Math.sin(inc) * Math.cos(azi), 
			 y: point.y + radius * Math.sin(inc) * Math.sin(azi),
			 z: point.z + radius * Math.cos(inc) };
}

PoissonSampling.inRectangle = function(point, xyz, whd) {
	return ( point.x >= xyz.x && point.x <= xyz.x + whd.w && 
			 point.y >= xyz.y && point.y <= xyz.y + whd.h && 
			 point.z >= xyz.z && point.z <= xyz.z + whd.d );
}

PoissonSampling.inCircle = function(point, xyz, r) {
	return this.getDistance(point, xyz) <= r;
}

PoissonSampling.inExclusionZones = function(point, zones) {
	if(zones === undefined)
		return false;
		
	for(var i = 0; i < zones.length; i++) {
		switch(zones[i].type) {
			case "rectangle":
				if(this.inRectangle(point, zones[i].xyz, zones[i].whd))
					return true;
				break;
			case "circle":
				if(this.inCircle(point, zones[i].xyz, zones[i].r))
					return true;
				break;
		}
	}
	return false;
}

PoissonSampling.inNeighborhood = function(grid, point, min_dist, cell_size) {
	var idx = this.getGridIndexFromPos(point, cell_size);
	var squareSize = 5;
	for(var z = idx.z - (squareSize-1)/2.0; z <= idx.z + (squareSize-1)/2.0; z++) {
		if(z < 0 || z >= grid.d) continue;
		for(var y = idx.y - (squareSize-1)/2.0; y <= idx.y + (squareSize-1)/2.0; y++) {
			if(y < 0 || y >= grid.h) continue;
			for(var x = idx.x - (squareSize-1)/2.0; x <= idx.x + (squareSize-1)/2.0; x++) {
				if(x < 0 || x >= grid.w) continue;
				if(grid[z][y][x].x !== undefined) {
					if(this.getDistance(grid[z][y][x], point) < min_dist)
						return true;
				}
			}
		}
	}
	return false;
}

PoissonSampling.getDistance = function(a, b) {
	return Math.sqrt((a.x - b.x)*(a.x - b.x) + (a.y - b.y)*(a.y - b.y) + (a.z - b.z)*(a.z - b.z));
}