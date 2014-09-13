OBJViewerScene.prototype = new THREE.Scene();
OBJViewerScene.prototype.constructor = OBJViewerScene;

function OBJViewerScene(url)
{
	var scope = this;
	
	var light = new THREE.HemisphereLight(0xffffff, 0x222222, 1.0);
	this.add(light);
	
	this.maxSize = 100.0;
	
	this.camera = new THREE.PerspectiveCamera(45, viewportW / viewportH, 0.01, this.maxSize*10.0);
	this.camera.position.set(0, 1000, 1000);
	this.camera.lookAt(new THREE.Vector3(0, 0, 0));
	
	var loader = new THREE.OBJLoader();
	loader.load(url, function(object) {
		var radius = object.children[0].geometry.boundingSphere.radius;
		scope.add(object);
		object.scale.divideScalar(radius / scope.maxSize);
		scope.camera.position.set(0, scope.maxSize, scope.maxSize);
	});
}