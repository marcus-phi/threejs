function SSAOShader(args) 
{
	this.uniforms = {
		"projectionMatrixInv" : { type: "m4", value: args.projectionMatrixInv },
		"tNormalDepth" : { type: "t", value: args.tNormalDepth },
		"tNoise" : { type: "t", value: args.tNoise },
		"vNoiseScale" : { type: "v2", value: args.vNoiseScale },
		"avSampleKernel" : { type: "v3v", value: args.avSampleKernel },
		"fRadius" : { type: "f", value: args.fRadius },
		"fStrength" : { type: "f", value: args.fStrength },
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
		uniform mat4 projectionMatrix;\n\
		uniform mat4 projectionMatrixInv;\n\
		\n\
		uniform sampler2D tNormalDepth;\n\
		uniform sampler2D tNoise;\n\
		uniform vec2 vNoiseScale;\n\
		uniform vec3 avSampleKernel[32];\n\
		uniform float fRadius;\n\
		uniform float fStrength;\n\
		\n\
		varying vec2 vUV;\n\
		\n\
		const int sampleCount = 32;\n\
		\n\
		void main()\n\
		{\n\
			vec4 normdepth = texture2D(tNormalDepth, vUV);\n\
			\n\
			vec4 viewRay = projectionMatrixInv * vec4(vUV * 2.0 - 1.0, 1.0, 1.0);\n\
			viewRay /= viewRay.w;\n\
			float farClip = -viewRay.z;\n\
			\n\
			vec3 origin = viewRay.xyz * normdepth.w;\n\
			vec3 normal = normalize(normdepth.xyz * 2.0 - 1.0);\n\
			\n\
			vec3 rvec = texture2D(tNoise, vUV * vNoiseScale).xyz * 2.0 - 1.0;\n\
			vec3 tangent = normalize(rvec - normal * dot(rvec, normal));\n\
			vec3 bitangent = cross(normal, tangent);\n\
			mat3 tbn = mat3(tangent, bitangent, normal);\n\
			\n\
			float occlusion = 0.0;\n\
			for (int i = 0; i < sampleCount; ++i) {\n\
				// get sample position:\n\
				vec3 sample = tbn * avSampleKernel[i];\n\
				sample = sample * fRadius + origin;\n\
				\n\
				// project sample position:\n\
				vec4 offset = vec4(sample, 1.0);\n\
				offset = projectionMatrix * offset;\n\
				offset.xy /= offset.w;\n\
				offset.xy = offset.xy * 0.5 + 0.5;\n\
				\n\
				// get sample depth:\n\
				float sampleDepth = texture2D(tNormalDepth, offset.xy).w * farClip;\n\
				\n\
				// range check & accumulate:\n\
				float rangeCheck = abs(-origin.z - sampleDepth) < fRadius ? 1.0 : 0.0;\n\
				occlusion += (sampleDepth <= -sample.z ? fStrength : 0.0) * rangeCheck;\n\
			}\n\
			occlusion = 1.0 - (occlusion / float(sampleCount));\n\
			gl_FragColor = vec4(occlusion, occlusion, occlusion, 1.0);\n\
		}\n\
	";
}