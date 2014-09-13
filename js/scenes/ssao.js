var camCtrl, scene, quadScene, gui;
var params = {
	"SSAO" : true,
	"Color" : true,
	"Radius" : 2.0,
	"Strength" : 2.0,
};
var normalDepthMat, ssaoMat, ssaoParams, blurSSAOMat;
var width = viewportW, height = viewportH;
var projectionMatrixInv;

loadScripts(["js/scenes/testscenes/TestScene.js",
			"js/scenes/testscenes/QuadScene.js",
			"js/scenes/shaders/NormalDepthShader.js",
			"js/scenes/shaders/SSAOShader.js",
			"js/scenes/shaders/BlurSSAOShader.js"],
			initScene);

function initScene() {
	scene = new TestScene();

	camCtrl = new THREE.TrackballControls(scene.camera, renderer.domElement);
	camCtrl.addEventListener('change', renderFrame);
	
	initShaderPass();
	
	gui = new dat.GUI({ autoPlace: false, width: 150 });
	gui.add(params, "SSAO");
	gui.add(params, "Color");
	gui.add(params, "Radius", 0.1, 4.0);
	gui.add(params, "Strength", 0.1, 4.0);
	gui.domElement.style.position = "absolute";
	gui.domElement.style.top = "0px";
	gui.domElement.style.right = "0px";
	viewport.append(gui.domElement);
	
	render = function() {
		camCtrl.update();
		renderFrame();
	}
}

function renderFrame() {
	scene.overrideMaterial = params["Color"] ? null : new THREE.MeshLambertMaterial({color: 0xffffff});
	if(!params["SSAO"])
		renderer.render(scene, scene.camera);
	else
	{
		// color pass
		renderer.render(scene, scene.camera, quadScene.rtTexColor, true);
		
		// normal-depth pass
		scene.overrideMaterial = normalDepthMat;
		renderer.render(scene, scene.camera, quadScene.rtTexNormalDepth, true);
		
		// ssao pass
		ssaoMat.uniforms["fRadius"].value = params["Radius"];
		ssaoMat.uniforms["fStrength"].value = params["Strength"];
		quadScene.quad.material = ssaoMat;
		renderer.render(quadScene, scene.camera, quadScene.rtTexSSAO, true);
		
		// blur pass
		quadScene.quad.material = blurSSAOMat;
		renderer.render(quadScene, scene.camera);
	}
}

function initShaderPass()
{
	projectionMatrixInv = new THREE.Matrix4();
	projectionMatrixInv.getInverse(scene.camera.projectionMatrix);
	
	quadScene = new QuadScene();
	
	// color pass
	quadScene.rtTexColor = new THREE.WebGLRenderTarget(width, height, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
	
	// normal-depth pass
	normalDepthMat = createMatFromShader(
		new NormalDepthShader({ 
			fFarClip: scene.camera.far }), true);
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