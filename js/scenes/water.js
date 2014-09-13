var camera, camCtrl, scene, clock, waterParams;
var waterHeightShader, waterHeightMat;

loadScripts(["js/scenes/shaders/WaterHeightShader.js"], initScene);

function initScene() {
	camera = new THREE.PerspectiveCamera(45, viewportW / viewportH, 0.1, 10000);
	camera.position.set(0, 20, 100);
	camera.lookAt(new THREE.Vector3(0, 0, 0));
	
	camCtrl = new THREE.TrackballControls(camera, renderer.domElement);
	camCtrl.addEventListener('change', renderFrame);
	
	clock = new THREE.Clock(true);
	
	scene = new THREE.Scene();
	
	var skyTex = loadCubeMapTexture("NissiBeach");
	var skyShader = THREE.ShaderLib["cube"];
	skyShader.uniforms["tCube"].value = skyTex;
	var skyMat = createMatFromShader(skyShader);
	skyMat.depthWrite = false;
	skyMat.side = THREE.BackSide;
	var skyBox = new THREE.Mesh(new THREE.BoxGeometry(1000, 1000, 1000), skyMat);
	scene.add(skyBox);
	
	waterParams = {As: [], Ws: [], Ps: [], Ds: []};
	randomizeWaterParams(16, 20.0, 250.0, 0.7, Math.PI/4);
	waterHeightShader = new WaterHeightShader({
		uTime: clock.getElapsedTime(),
		uAs: waterParams.As,
		uWs: waterParams.Ws,
		uPs: waterParams.Ps,
		uDs: waterParams.Ds,
		tCube: skyTex,
		viewMatrixInv: camera.matrixWorldInverse,
	});
	waterHeightMat = createMatFromShader(waterHeightShader);
	
	var waterPlane = new THREE.Mesh(new THREE.PlaneGeometry(100, 100, 32, 32), waterHeightMat);
	waterPlane.rotation.x -= Math.PI/2;
	scene.add(waterPlane);
	
	render = function() {
		camCtrl.update();
		renderFrame();
	}
}

function renderFrame() {
	waterHeightShader.uniforms["uTime"].value = clock.getElapsedTime();
	renderer.render(scene, camera);
}

function createMatFromShader(shader, noBlending)
{
	var mat = new THREE.ShaderMaterial();
	mat.uniforms = shader.uniforms;
	mat.vertexShader = shader.vertexShader;
	mat.fragmentShader = shader.fragmentShader;
	if(noBlending !== undefined && noBlending)
		mat.blending = THREE.NoBlending;
	return mat;
}

function randomRange(lower, upper) {
	return Math.random() * (upper - lower) + lower;
}

function randomizeWaterParams(n, maxA, maxW, maxP, D) {
	for(var i = 0; i < n; i++) {
		var ranA = randomRange(maxA*0.2, maxA);
		var ranW = randomRange(maxW*0.6, maxW)/ranA;
		var ranP = randomRange(maxP*0.3, maxP)/ranA;
		var ranD = randomRange(D*0.5, D*1.5);
		waterParams.As.push(ranA);
		waterParams.Ws.push(ranW);
		waterParams.Ps.push(ranP);
		waterParams.Ds.push(ranD);
	}
}