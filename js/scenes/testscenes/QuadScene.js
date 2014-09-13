QuadScene.prototype = new THREE.Scene();
QuadScene.prototype.constructor = QuadScene;

function QuadScene(args)
{
	this.quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1));
	this.add(this.quad);
}