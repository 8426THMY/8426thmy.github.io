/* Random linear algebra helper functions. */

// This is the usual reminder that in OpenGL, all
// matrices are stored in column major format!

function vec3_subtract(v1, v2){
	return new Float32Array([v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]]);
}

function vec3_dot(v1, v2){
	return v1[0]*v2[0] + v1[1]*v2[1] + v1[2]*v2[2];
}

function vec3_normalize(v){
	const magnitude = Math.sqrt(vec3_dot(v, v));
	return new Float32Array([v[0]/magnitude, v[1]/magnitude, v[2]/magnitude]);
}

function vec3_cross(v1, v2){
	return new Float32Array([
		v1[1]*v2[2] - v1[2]*v2[1],
		v1[2]*v2[0] - v1[0]*v2[2],
		v1[0]*v2[1] - v1[1]*v2[0]
	]);
}

function mat4_multiply_vec3(m, v){
	return new Float32Array([
		m[0]*v[0] + m[4]*v[1] + m[8]*v[2]  + m[12],
		m[1]*v[0] + m[5]*v[1] + m[9]*v[2]  + m[13],
		m[2]*v[0] + m[6]*v[1] + m[10]*v[2] + m[14]
	]);
}

function mat4_multiply_vec4(m, v){
	return new Float32Array([
		m[0]*v[0] + m[4]*v[1] + m[8]*v[2]  + m[12]*v[3],
		m[1]*v[0] + m[5]*v[1] + m[9]*v[2]  + m[13]*v[3],
		m[2]*v[0] + m[6]*v[1] + m[10]*v[2] + m[14]*v[3],
		m[3]*v[0] + m[7]*v[1] + m[11]*v[2] + m[15]*v[3]
	]);
}


function mat4_multiply_mat4(m1, m2){
	return new Float32Array([
		m1[0]*m2[0]  + m1[4]*m2[1]  + m1[8]*m2[2]   + m1[12]*m2[3],
		m1[1]*m2[0]  + m1[5]*m2[1]  + m1[9]*m2[2]   + m1[13]*m2[3],
		m1[2]*m2[0]  + m1[6]*m2[1]  + m1[10]*m2[2]  + m1[14]*m2[3],
		m1[3]*m2[0]  + m1[7]*m2[1]  + m1[11]*m2[2]  + m1[15]*m2[3],

		m1[0]*m2[4]  + m1[4]*m2[5]  + m1[8]*m2[6]   + m1[12]*m2[7],
		m1[1]*m2[4]  + m1[5]*m2[5]  + m1[9]*m2[6]   + m1[13]*m2[7],
		m1[2]*m2[4]  + m1[6]*m2[5]  + m1[10]*m2[6]  + m1[14]*m2[7],
		m1[3]*m2[4]  + m1[7]*m2[5]  + m1[11]*m2[6]  + m1[15]*m2[7],

		m1[0]*m2[8]  + m1[4]*m2[9]  + m1[8]*m2[10]  + m1[12]*m2[11],
		m1[1]*m2[8]  + m1[5]*m2[9]  + m1[9]*m2[10]  + m1[13]*m2[11],
		m1[2]*m2[8]  + m1[6]*m2[9]  + m1[10]*m2[10] + m1[14]*m2[11],
		m1[3]*m2[8]  + m1[7]*m2[9]  + m1[11]*m2[10] + m1[15]*m2[11],

		m1[0]*m2[12] + m1[4]*m2[13] + m1[8]*m2[14]  + m1[12]*m2[15],
		m1[1]*m2[12] + m1[5]*m2[13] + m1[9]*m2[14]  + m1[13]*m2[15],
		m1[2]*m2[12] + m1[6]*m2[13] + m1[10]*m2[14] + m1[14]*m2[15],
		m1[3]*m2[12] + m1[7]*m2[13] + m1[11]*m2[14] + m1[15]*m2[15]
	]);
}

function mat4_view(right, up, forward, pos){
	return new Float32Array([
		             right[0],              up[0],              forward[0], 0.0,
		             right[1],              up[1],              forward[1], 0.0,
		             right[2],              up[2],              forward[2], 0.0,
		-vec3_dot(right, pos), -vec3_dot(up, pos), -vec3_dot(forward, pos), 1.0
	]);
}

function mat4_lookat(eye, target, world_up){
	const forward = vec3_normalize(vec3_subtract(eye, target));
	const right   = vec3_normalize(vec3_cross(world_up, forward));
	const up      = vec3_normalize(vec3_cross(forward, right));

	return mat4_view(right, up, forward, eye);
}

function mat4_perspective(fov, aspect_ratio, near, far){
	const inv_scale = 1.0/(aspect_ratio * Math.tan(fov * 0.5));
	const depth_scale = 1.0/(near - far);

	return new Float32Array([
		inv_scale,                    0.0,                      0.0,  0.0,
		      0.0, aspect_ratio*inv_scale,                      0.0,  0.0,
		      0.0,                    0.0, (near + far)*depth_scale, -1.0,
		      0.0,                    0.0, 2.0*near*far*depth_scale,  0.0
	]);
}