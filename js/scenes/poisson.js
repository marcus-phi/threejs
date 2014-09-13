var camCtrl, scene, camera, gui;
var groundSize = {w: 150, h: 100, d: 0}, sphereGeo, sphereMat, samples, clock;
var rate = 0, count = 0;
var startColor = new THREE.Color(0xff4400), endColor = new THREE.Color(0x00ff00);
var zones;
var params = {
	"Rate": 500,
	"Radius": 5,
	"RandomPop": true,
	"Zones": true,
	"Progress": 0,
};

loadScripts(["js/PoissonSampling.js"], initScene);

function initScene() {
	camera = new THREE.PerspectiveCamera(45, viewportW/viewportH, 0.1, 10000);
	camera.position.set(0, 0, 200);

	camCtrl = new THREE.TrackballControls(camera, renderer.domElement);
	camCtrl.addEventListener('change', renderFrame);
	
	clock = new THREE.Clock(true);
	
	populateInitialScene();
	
	sphereGeo = new THREE.SphereGeometry(0.5, 8, 8);
	sphereMat = new THREE.MeshLambertMaterial({ color: startColor });
		
	resetSamples();
	
	gui = new dat.GUI({ autoPlace: false, width: 150 });
	gui.domElement.style.position = "absolute";
	gui.domElement.style.top = "0px";
	gui.domElement.style.right = "0px";
	viewport.append(gui.domElement);
	gui.add({ Reset: resetSamples }, "Reset");
	gui.add(params, "Rate", 100, 1000);
	gui.add(params, "Radius", 0.4, 5);
	gui.add(params, "RandomPop");
	gui.add(params, "Zones");
	gui.add(params, "Progress", 0, 100).listen();
	
	render = function() {
		camCtrl.update();
		renderFrame();
	}
}

function populateInitialScene() {
	scene = new THREE.Scene();
	
	scene.add(new THREE.HemisphereLight(0xffffff, 0xffffff, 1.0));
	
	var ground = new THREE.Mesh(new THREE.PlaneGeometry(groundSize.w, groundSize.h, 1, 1), new THREE.MeshLambertMaterial({ color: 0x222222 }));
	scene.add(ground);
}

function resetSamples() {
	zones = params["Zones"] ? randomExclusionZones(groundSize) : [];
	samples = PoissonSampling.generateSamples(groundSize, params["Radius"], 5, params["RandomPop"], zones);
	rate = count = 0;
	clock.getDelta();
	sphereMat.color.set(startColor);
	populateInitialScene();
}

function randomExclusionZones(whd) {
	var zones = [];
	var n = Math.randomRange(3, 8);
	for(var i = 0; i < n; i++) {
		var zone = {
			type: Math.random() * 2 < 1.0 ? "rectangle" : "circle",
			xyz: {
				x: whd.w * Math.randomRange(0.2, 0.8), 
				y: whd.h * Math.randomRange(0.2, 0.8),
				z: whd.d * Math.randomRange(0.2, 0.8),
			},
		};
		switch(zone.type) {
			case "rectangle":
				zone.whd = {
					w: whd.w * Math.randomRange(0.1, 0.3),
					h: whd.h * Math.randomRange(0.1, 0.3),
					d: whd.d * Math.randomRange(0.1, 0.3),
				};
				break;
			case "circle":
				zone.r = Math.min(Math.min(whd.w, whd.h), whd.d) * Math.randomRange(0.1, 0.3);
				break;
		}
		zones.push(zone);
	}
	return zones;
}

function renderFrame() {
	if(count < samples.length) {
		rate += clock.getDelta();
		if(rate > 1.0/params["Rate"]) {
			while(rate > 0)
			{
				var sampleMesh = new THREE.Mesh(sphereGeo, sphereMat);
				sampleMesh.position.set(samples[count].x - groundSize.w/2.0, samples[count].y - groundSize.h/2.0, samples[count].z - groundSize.d/2.0);
				scene.add(sampleMesh);
				count++;
				rate -= 1.0/params["Rate"];
				
				params["Progress"] = count/samples.length*100;
				sphereMat.color.set(startColor);
				sphereMat.color.lerp(endColor, count/samples.length);
				if(count == samples.length)
					break;
			}
		}
	}

	renderer.render(scene, camera);
}