var camCtrl, scene, camera, clock, gui;
var stacks, pickedRing = null, steps, running = false;
var UP = 0, MOVE = 1, DOWN = 2;
var params = {
	"NumRings": 7,
	"Speed": 10,
	"SSAO" : true,
	"Radius" : 0.2,
	"Strength" : 1.3,
}
var postHeight, ringHeight = 0.2;

var normalDepthMat, ssaoMat, ssaoParams, blurSSAOMat;
var width = viewportW, height = viewportH;
var quadScene, projectionMatrixInv;

loadScripts(["js/HanoiTower.js",
			"js/scenes/testscenes/QuadScene.js",
			"js/scenes/shaders/NormalDepthShader.js",
			"js/scenes/shaders/SSAOShader.js",
			"js/scenes/shaders/BlurSSAOShader.js"], initScene);

function initScene() {
	camera = new THREE.PerspectiveCamera(45, viewportW/viewportH, 0.1, 10000);
	camera.position.set(0, 3, 5);
	
	camCtrl = new THREE.TrackballControls(camera, renderer.domElement);
	camCtrl.addEventListener('change', renderFrame);
	
	clock = new THREE.Clock(true);
	
	populateInitialScene();
	initShaderPass();
	
	steps = HanoiTower.getSteps(params["NumRings"]);
	
	render = function() {
		camCtrl.update();
		if(updateRing(clock.getDelta()))
			nextStep();
		renderFrame();
	}
	
	gui = new dat.GUI({ autoPlace: false, width: 150 });
	gui.domElement.style.position = "absolute";
	gui.domElement.style.top = "0px";
	gui.domElement.style.right = "0px";
	viewport.append(gui.domElement);
	gui.add({ Reset: resetAll }, "Reset");
	gui.add({ Run: run }, "Run");
	gui.add(params, "NumRings", 4, 10).step(1);
	gui.add(params, "Speed", 1, 20);
	var ssaoFolder = gui.addFolder("SSAO");
	ssaoFolder.add(params, "SSAO");
	ssaoFolder.add(params, "Radius", 0.1, 4.0);
	ssaoFolder.add(params, "Strength", 0.1, 4.0);
}

function populateInitialScene() {
	scene = new THREE.Scene();
	scene.add(new THREE.HemisphereLight(0xffffff, 0x222222, 1.0));
	
	var woodMat = new THREE.MeshLambertMaterial({color: 0x663300});
	var base = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 0.5), woodMat);
	base.position.set(0, -0.1, 0);
	scene.add(base);
	
	var diskGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 32);
	for(var i = -1; i <= 1; i++) {
		var disk = new THREE.Mesh(diskGeo, woodMat);
		disk.position.set(i, -0.1, 0);
		scene.add(disk);
	}
	
	postHeight = ringHeight * (params["NumRings"] + 1);
	var postRadius = 0.1,
		postGeo = new THREE.CylinderGeometry(postRadius, postRadius, postHeight, 16);
	for(var i = -1; i <= 1; i++) {
		var post = new THREE.Mesh(postGeo, woodMat);
		post.position.set(i, postHeight/2, 0);
		scene.add(post);
	}
	
	stacks = [[], [], []];
	stacks[0].x = -1; stacks[1].x = 0; stacks[2].x = 1;
	
	var n = params["NumRings"],
		bottomColor = new THREE.Color(0x663399),
		topColor = new THREE.Color(0xff0000);
	for(var i = 0; i < n; i++) {
		var ring = new THREE.Mesh(new THREE.TorusGeometry(lerp(postRadius+ringHeight/2, 0.5-ringHeight/2, 1-i/(n-1)), ringHeight/2, 16, 32),
								  new THREE.MeshLambertMaterial({color: lerpHue(bottomColor, topColor, i/(n-1))}));
		ring.position.set(-1, ringHeight/2 + ringHeight*i, 0);
		ring.rotation.x = Math.PI/2;
		scene.add(ring);
		stacks[0].push(ring);
	}
}

function resetAll() {
	pickedRing = null;
	steps = HanoiTower.getSteps(params["NumRings"]);
	running = false;
	populateInitialScene();
}

function run() {
	if(running)
		return;
	running = true;
	nextStep();
}

function lerp(a, b, ratio) {
	return a * (1 - ratio) + b * ratio;
}

function lerpHue(colorA, colorB, ratio) {
	var hslA = colorA.getHSL(), hslB = colorB.getHSL();
	var h = hslA.h * (1 - ratio) + hslB.h * ratio,
		s = hslA.s * 0.5 + hslB.s * 0.5,
		l = hslA.l * 0.5 + hslB.l * 0.5;
	var color = new THREE.Color();
	color.setHSL(h, s, l);
	return color;
}

function nextStep() {
	if(steps.length == 0) return;
	var step = steps.splice(0, 1)[0];
	pickedRing = stacks[step.from].pop();
	pickedRing.from = step.from;
	pickedRing.to = step.to;
	pickedRing.move = UP;
}

function updateRing(dT) {
	if(pickedRing == null) return false;
	var direction = new THREE.Vector3();
	switch(pickedRing.move) {
		case UP:
			direction.set(0, 1, 0);
			break;
		case MOVE:
			direction.set(stacks[pickedRing.to].x - stacks[pickedRing.from].x, 0, 0);
			break;
		case DOWN:
			direction.set(0, -1, 0);
			break;
	}
	
	direction.normalize();
	direction.multiplyScalar(params["Speed"] * dT);
	pickedRing.position.add(direction);
	
	switch(pickedRing.move) {
		case UP:
			if(pickedRing.position.y >= postHeight + ringHeight) {
				pickedRing.position.y = postHeight + ringHeight;
				pickedRing.move = MOVE;
			}
			break;
		case MOVE:
			if(Math.abs(pickedRing.position.x - stacks[pickedRing.from].x) >= Math.abs(stacks[pickedRing.to].x - stacks[pickedRing.from].x)) {
				pickedRing.position.x = stacks[pickedRing.to].x;
				pickedRing.move = DOWN;
			}
			break;
		case DOWN:
			if(pickedRing.position.y <= ringHeight/2 + ringHeight*stacks[pickedRing.to].length) {
				pickedRing.position.y = ringHeight/2 + ringHeight*stacks[pickedRing.to].length;
				stacks[pickedRing.to].push(pickedRing);
				pickedRing = null;
				return true;
			}
			break;
	}
	
	return false;
}

function renderFrame() {
	if(!params["SSAO"])
		renderer.render(scene, camera);
	else
	{
		// color pass
		renderer.render(scene, camera, quadScene.rtTexColor, true);
		
		// normal-depth pass
		scene.overrideMaterial = normalDepthMat;
		renderer.render(scene, camera, quadScene.rtTexNormalDepth, true);
		scene.overrideMaterial = null;
		
		// ssao pass
		ssaoMat.uniforms["fRadius"].value = params["Radius"];
		ssaoMat.uniforms["fStrength"].value = params["Strength"];
		quadScene.quad.material = ssaoMat;
		renderer.render(quadScene, camera, quadScene.rtTexSSAO, true);
		
		// blur pass
		quadScene.quad.material = blurSSAOMat;
		renderer.render(quadScene, camera);
	}
}

function initShaderPass()
{
	projectionMatrixInv = new THREE.Matrix4();
	projectionMatrixInv.getInverse(camera.projectionMatrix);
	
	quadScene = new QuadScene();
	
	// color pass
	quadScene.rtTexColor = new THREE.WebGLRenderTarget(width, height, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
	
	// normal-depth pass
	normalDepthMat = createMatFromShader(
		new NormalDepthShader({ 
			fFarClip: camera.far }), true);
	quadScene.rtTexNormalDepth = new THREE.WebGLRenderTarget(width, height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, type: THREE.FloatType });
	
	// ssao pass
	initSSAOParams();
	ssaoMat = createMatFromShader(
		new SSAOShader({
			projectionMatrixInv: projectionMatrixInv,
			tNormalDepth: quadScene.rtTexNormalDepth,
			tNoise: ssaoParams.tNoise,
			vNoiseScale: ssaoParams.vNoiseScale,
			avSampleKernel: ssaoParams.avSampleKernel,
			fRadius: ssaoParams.fRadius,
			fStrength: ssaoParams.fStrength }));
	quadScene.rtTexSSAO = new THREE.WebGLRenderTarget(width, height, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, type: THREE.FloatType });
	
	// blur pass
	blurSSAOMat = createMatFromShader(
		new BlurSSAOShader({ 
			tColor: quadScene.rtTexColor,
			tSSAO: quadScene.rtTexSSAO,
			vStepSize: new THREE.Vector2(1.0/width, 1.0/height) }));
}

function initSSAOParams() {
	ssaoParams = {};
	
	var noise = [], noiseDim = 128.0;
	for(var i = 0; i < noiseDim*noiseDim; i++)
	{
		var v = new THREE.Vector3(Math.random(), Math.random(), 0.0);
		v.normalize();
		noise.push(v.x);
		noise.push(v.y);
		noise.push(v.z);
	}
	ssaoParams.tNoise = createTexFromFloat(noise, noiseDim, noiseDim);
	ssaoParams.vNoiseScale = new THREE.Vector2(width/noiseDim, height/noiseDim);
	
	ssaoParams.avSampleKernel = [];
	var sampleCount = 32.0;
	for(var i = 0; i < sampleCount; i++)
	{
		var v = new THREE.Vector3(Math.random() * 2.0 - 1.0, Math.random() * 2.0 - 1.0, Math.random());
		v.normalize();
		var scale = i/sampleCount;
		scale = 0.1*(1.0 - scale*scale) + 1.0*(scale*scale);
		v.multiplyScalar(scale);
		ssaoParams.avSampleKernel.push(v);
	}
	
	ssaoParams.fRadius = params["Radius"];
	ssaoParams.fStrength = params["Strength"];
}