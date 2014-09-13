function WaterHeightShader(args) {
	this.uniforms = {
		"uTime" : { type: "f", value: args.uTime },
		"uAs" : { type: "fv1", value: args.uAs },
		"uWs" : { type: "fv1", value: args.uWs },
		"uPs" : { type: "fv1", value: args.uPs },
		"uDs" : { type: "fv1", value: args.uDs },
		"tCube" : { type: "t", value: args.tCube },
		"viewMatrixInv" : { type: "m4", value: args.viewMatrixInv },
	};
	
	this.vertexShader = "\
		varying vec2 vUV;\n\
		varying vec3 vNormal;\n\
		varying vec3 vViewRay;\n\
		\n\
		void main()\n\
		{\n\
			vUV = uv;\n\
			vNormal = normal;\n\
			vec4 pos = modelViewMatrix * vec4(position, 1.0);\n\
			vViewRay = pos.xyz;\n\
			gl_Position = projectionMatrix * pos;\n\
		}\n\
	";
	
	this.fragmentShader = "\
		uniform mat3 normalMatrix;\n\
		uniform mat4 viewMatrixInv;\n\
		\n\
		uniform float uTime;\n\
		uniform float uAs[16];\n\
		uniform float uWs[16];\n\
		uniform float uPs[16];\n\
		uniform float uDs[16];\n\
		uniform samplerCube tCube;\n\
		\n\
		varying vec2 vUV;\n\
		varying vec3 vNormal;\n\
		varying vec3 vViewRay;\n\
		\n\
		const int numWaves = 16;\n\
		\n\
		float getHeight(vec2 xy)\n\
		{\n\
			vec2 D;\n\
			float h = 0.0;\n\
			for(int i = 0; i < numWaves; i++)\n\
			{\n\
				D = vec2(cos(uDs[i]), sin(uDs[i]));\n\
				h += uAs[i] * sin(dot(D, xy) * uWs[i] - uTime * uPs[i]);\n\
			}\n\
			return h;\n\
		}\n\
		\n\
		float mapHeight(float h)\n\
		{\n\
			float sumA = 0.0;\n\
			for(int i = 0; i < numWaves; i++)\n\
				sumA += uAs[i];\n\
			return (h + sumA) / (sumA * 2.0);\n\
		}\n\
		vec3 getNorm(vec2 xy)\n\
		{\n\
			vec2 D;\n\
			vec3 norm = vec3(0,0,1);\n\
			for(int i = 0; i < numWaves; i++)\n\
			{\n\
				D = vec2(cos(uDs[i]), sin(uDs[i]));\n\
				norm.xy += -uWs[i] * D * uAs[i] * cos(dot(D, xy) * uWs[i] - uTime * uPs[i]);\n\
			}\n\
			return normalize(norm);\n\
		}\n\
		\n\
		void main()\n\
		{\n\
			vec3 norm = normalize(normalMatrix * getNorm(vUV));\n\
			vec3 reflectRay = reflect(vViewRay, norm);\n\
			vec4 reflectRayWorld = viewMatrixInv * vec4(reflectRay, 0.0);\n\
			gl_FragColor = textureCube(tCube, -reflectRayWorld.xyz);\n\
		}\n\
	";
}