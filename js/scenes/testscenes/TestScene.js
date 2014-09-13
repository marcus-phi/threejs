TestScene.prototype = new THREE.Scene();
TestScene.prototype.constructor = TestScene;

function TestScene(args){
	this.cubeSize = args && args.cubeSize !== undefined ? args.cubeSize : 5;
	this.sphereSize = args && args.sphereSize !== undefined ? args.sphereSize : 2.5;
	this.groundSize = args && args.groundSize !== undefined ? args.groundSize : 30;
	
	this.cubeGeom = new THREE.BoxGeometry(this.cubeSize, this.cubeSize, this.cubeSize);
	this.sphereGeom = new THREE.SphereGeometry(this.sphereSize, 32, 16);
	
	this.initScene();
	
	this.camera = new THREE.PerspectiveCamera(45, viewportW / viewportH, 0.1, 1000.0);
	this.camera.position.set(0, this.groundSize/2, this.groundSize/2);
	this.camera.lookAt(new THREE.Vector3(0, 0, 0));
}

TestScene.prototype.initScene = function()
{
	this.add(new THREE.HemisphereLight(0xffffff, 0x222222, 1.0));
	var minScale = 0.1, maxScale = 1.0;
	
	var cube;
	for(var i = 0; i < 40; i++)
	{
		cube = new THREE.Mesh(this.cubeGeom, this.randomMat());
		cube.scale.x = cube.scale.y = cube.scale.z = Math.random()*(maxScale-minScale)+minScale;
		cube.position.set(this.randomOnGround(), this.cubeSize/2*cube.scale.x, this.randomOnGround());
		cube.rotation.y = Math.random()*Math.PI;
		this.add(cube);
	}
	
	var sphere;
	for(var i = 0; i < 40; i++)
	{
		sphere = new THREE.Mesh(this.sphereGeom, this.randomMat());
		sphere.scale.x = sphere.scale.y = sphere.scale.z = Math.random()*(maxScale-minScale)+minScale;
		sphere.position.set(this.randomOnGround(), this.sphereSize*sphere.scale.x, this.randomOnGround());
		sphere.rotation.y = Math.random()*Math.PI;
		this.add(sphere);
	}
	
	var ground = new THREE.Mesh(new THREE.PlaneGeometry(this.groundSize, this.groundSize, 32, 32), this.randomMat());
	ground.rotation.x = -Math.PI/2;
	this.add(ground);
}

TestScene.prototype.randomOnGround = function()
{
	return (Math.random()-0.5) * this.groundSize *0.85;
}

TestScene.prototype.randomMat = function()
{
	var color = new THREE.Color();
	color.r = Math.random(); color.g = Math.random(); color.b = Math.random();
	return new THREE.MeshLambertMaterial({color: color});
}