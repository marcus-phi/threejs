function NormalDepthShader(args) {

	this.uniforms = {
		"fFarClip" : { type: "f", value: args.fFarClip },
	};
	
	this.vertexShader = "\
		varying vec3 vNormal;\n\
		varying float fDepth;\n\
		\n\
		void main()\n\
		{\n\
			vec4 vPos = modelViewMatrix * vec4(position, 1.0);\n\
			vNormal = normalMatrix * normal;\n\
			fDepth = vPos.z;\n\
			gl_Position = projectionMatrix * vPos;\n\
		}\
	";
	
	this.fragmentShader = "\
		uniform float fFarClip;\n\
		\n\
		varying vec3 vNormal;\n\
		varying float fDepth;\n\
		\n\
		void main()\n\
		{\n\
			vec3 norm = (normalize(vNormal) + 1.0)/2.0;\n\
			float depth = -fDepth/fFarClip;\n\
			gl_FragColor = vec4(norm, depth);\n\
		}\
	";
}