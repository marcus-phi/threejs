function BlurSSAOShader(args)
{
	this.uniforms = {
		"tColor" : { type: "t", value: args.tColor },
		"tSSAO" : { type: "t", value: args.tSSAO },
		"vStepSize" : { type: "v2", value: args.vStepSize },
	};
	
	this.vertexShader = "\
		varying vec2 vUV;\n\
		\n\
		void main()\n\
		{\n\
			vUV = uv;\n\
			gl_Position = vec4(uv * 2.0 - 1.0, 1.0, 1.0);\n\
		}\n\
	";
	
	this.fragmentShader = "\
		uniform sampler2D tColor;\n\
		uniform sampler2D tSSAO;\n\
		uniform vec2 vStepSize;\n\
		\n\
		varying vec2 vUV;\n\
		\n\
		const int blurSize = 2;\n\
		\
		void main()\n\
		{\n\
			vec4 ao;\n\
			for(int i = -blurSize; i <= blurSize; i++)\n\
				for(int j = -blurSize; j <= blurSize; j++)\n\
					ao += texture2D(tSSAO, vUV + vec2(float(i)*vStepSize.x, float(j)*vStepSize.y));\n\
			ao /= float(blurSize*2+1)*float(blurSize*2+1);\n\
			gl_FragColor = ao*texture2D(tColor, vUV);\n\
		}\
	";
}