var camera = new THREE.PerspectiveCamera(75, viewportW/viewportH, 0.1, 10000);
camera.position.z = 1000;

var scene = new THREE.Scene();

var geometry, material, mesh;
geometry = new THREE.BoxGeometry(200, 200, 200);
material = new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true});
mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

render = function () {
	mesh.rotation.x += 0.01;
	mesh.rotation.y += 0.02;
	
	renderer.render(scene, camera);
}