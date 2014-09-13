function loadScripts(scripts, callback) {
	if(scripts === undefined || scripts.length == 0)
		return;
		
	var newScript = document.createElement("script");
	newScript.src = scripts[0];
	scripts = scripts.slice(1);
	newScript.onload = scripts.length == 0 ? callback : function() {
		loadScripts(scripts, callback);
	}
	
	$("#onDemandScripts").get(0).appendChild(newScript);
}

var viewport, viewportW, viewportH, render, renderer, gl;
function initViewportRenderer() {
	viewport = $("#viewport");
	viewportW = viewport.width(), viewportH = viewport.height();
	
	renderer = new THREE.WebGLRenderer();
	renderer.setSize(viewportW, viewportH);
	renderer.setClearColor(0x000000, 1.0);
	viewport.append(renderer.domElement);
	
	gl = renderer.context;
	
	animate();
}

function animate() {
	requestAnimationFrame(animate);
	if(render) render();
}

function createMatFromShader(shader, noBlending)
{
	var mat = new THREE.ShaderMaterial();
	mat.uniforms = shader.uniforms;
	mat.vertexShader = shader.vertexShader;
	mat.fragmentShader = shader.fragmentShader;
	if(noBlending !== undefined && noBlending)
		mat.blending = THREE.NoBlending;
	mat.needsUpdate = true;
	return mat;
}

function createTexFromFloat(data, width, height) {
	if (!gl.getExtension("OES_texture_float")) {
	   throw("Requires OES_texture_float extension");
	}
	texture = new THREE.Texture( );
	texture.needsUpdate = false;
	texture.__webglTexture = gl.createTexture();

	gl.bindTexture( gl.TEXTURE_2D, texture.__webglTexture );

	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB, gl.FLOAT, new Float32Array(data) );
	texture.__webglInit = false;

	gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
	gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR );

	gl.bindTexture( gl.TEXTURE_2D, null )

	return texture;
}

function loadCubeMapTexture(name) {
	var path = "textures/cube/" + name;
	var urls = [
		path + "_px.jpg", path + "_nx.jpg",
		path + "_py.jpg", path + "_ny.jpg",
		path + "_pz.jpg", path + "_nz.jpg",
	];
	
	var tex = THREE.ImageUtils.loadTextureCube(urls);
	tex.format = THREE.RGBFormat;
	return tex;
}

Math.randomRange = function(lower, upper) {
	return Math.random()*(upper-lower) + lower;
}