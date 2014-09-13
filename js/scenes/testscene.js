var camCtrl, scene;

loadScripts(["js/scenes/testscenes/TestScene.js"], initScene);

function initScene(){
	scene = new TestScene();

	camCtrl = new THREE.TrackballControls(scene.camera, renderer.domElement);
	camCtrl.addEventListener('change', renderFrame);

	render = function() {
		camCtrl.update();
		renderFrame();
	}
}

function renderFrame() {
	renderer.render(scene, scene.camera);
}