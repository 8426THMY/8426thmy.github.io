/************************************************/
/** To-do:                                     **/
/** 1. Tune and add colour to the mist.        **/
/** 2. Add particles with trails.              **/
/** 3. Add the transluscent reflective cubes.  **/
/************************************************/

/*******************/
/** Miscellaneous **/
/*******************/
var viewport_width;
var viewport_height;
const fov = 60.0 * (Math.PI/180.0);
const near_plane = 0.1/fov;
const far_plane = 1000.0;

const bg_colour = [24.0/255.0, 24.0/255.0, 24.0/255.0];
const fog_start = camera_pos[2] - 0.9*grid_height_max;
const fog_end   = camera_pos[2] - 0.4*grid_height_max;
const vignette_start = 0.6;
const vignette_end   = 1.2;
const vignette_mist_start = 0.4;
const vignette_mist_end = 0.7;

const mist_framebuffer_width  = 128;
const mist_framebuffer_height = 128;
const mist_pass2_offset_xx  = Math.random() * 10.0;
const mist_pass2_offset_xy  = Math.random() * 10.0;
const mist_pass2_time_mod_x = 0.0001 + Math.random() * 0.0001;
const mist_pass2_offset_yx  = Math.random() * 10.0;
const mist_pass2_offset_yy  = Math.random() * 10.0;
const mist_pass2_time_mod_y = 0.0001 + Math.random() * 0.0001;
const mist_contrast_blue     = 1.0;
const mist_contrast_purple   = 4.0;
const mist_brightness_blue   = -0.1;
const mist_brightness_purple = -0.2;
const mist_colour_mix        = 0.8;

const time_start = Date.now();


/**************/
/** Uniforms **/
/**************/
var perspective_matrix;
var view_matrix;
var vp_matrix;


/******************/
/** Framebuffers **/
/******************/
//	framebuffer = {
//		framebuffer, texture,
//      width, height
//	}
const framebuffer_mist = create_framebuffer(
	mist_framebuffer_width, mist_framebuffer_height, context.LINEAR
);


/*************/
/** Shaders **/
/*************/
//	shader_grid = {
//		program,
//		uniform_locations: {vp_matrix, resolution, diffuse}
//	}
const shader_grid = load_shader_grid();

//	shader_mist_texture = {
//		program,
//		uniform_locations: {time}
//	}
const shader_mist_texture = load_shader_mist_texture();
//	shader_mist = {
//		program,
//		uniform_locations: {vp_matrix, mist_transform, resolution, diffuse}
//	}
const shader_mist = load_shader_mist();


/************/
/** Meshes **/
/************/
//	mesh = {
//		vertex_array, vertex_buffer,
//		index_buffer, num_indices
//	}
const mesh_cube = load_mesh_cube();
const mesh_sprite = load_mesh_sprite();


/***************/
/** Instances **/
/***************/
var instances_grid = {
	instance_buffer: context.createBuffer(),
	num_instances: 0
};


/** We probably want to use (fractal) Brownian noise for the mist. **/
/** https://thebookofshaders.com/13/                               **/
/** https://www.shadertoy.com/view/XlGcRh                          **/

/** We should use Gouraud shading for the cubes.    **/
/** https://learnopengl.com/Lighting/Basic-Lighting **/

/** Float32Arrays are slow to construct but fast to access.  **/
/** Most of our mathematics operations do everything with    **/
/** Float32Arrays, but it might be better to just use native **/
/** arrays and convert them when the time comes.             **/

/** As a random note, I've forgotten why the scene only scales **/
/** with the vertical size of the context. It would be nice to **/
/** adjust this so wide resolutions don't look terrible.       **/


// Initialize the WebGL context.
function background_render_initialize(){
	context.clearColor(bg_colour[0], bg_colour[1], bg_colour[2], 1.0);
	context.enable(context.BLEND);
	context.blendFunc(context.SRC_ALPHA, context.ONE_MINUS_SRC_ALPHA);
	context.enable(context.CULL_FACE);
	context.enable(context.DEPTH_TEST);
	context.depthFunc(context.LESS);

	instances_grid.num_instances = grid_instance_data.length / 3;
	// Buffer the grid instance data. We'll still need to
	// enable the vertex attributes when it's time to draw.
	context.bindBuffer(context.ARRAY_BUFFER, instances_grid.instance_buffer);
	context.bufferData(context.ARRAY_BUFFER, grid_instance_data, context.STATIC_DRAW);
	context.bindBuffer(context.ARRAY_BUFFER, null);
}

function background_render(){
	update_view();

	context.clear(context.COLOR_BUFFER_BIT | context.DEPTH_BUFFER_BIT);
	background_render_grid(); // This has no transparency!
	background_render_mist(); // This should be drawn between the lowest and highest points of the previous layer.
	// background_render_particles(); // Particles and their trails are drawn above the mist and the grid.
	// background_render_cubes(); // Cubes use a funny transparency effect, so they're drawn above everything.
}

function background_render_grid(){
	// Bind the shader and uniforms.
	context.useProgram(shader_grid.program);
	context.uniformMatrix4fv(shader_grid.uniform_locations.vp_matrix, false, vp_matrix);
	context.uniform2f(shader_grid.uniform_locations.resolution, viewport_width, viewport_height);

	//context.bindTexture(context.TEXTURE_2D, mesh_cube.texture);

	// Bind the vertex array object, which contains
	// the bindings required for the cube mesh.
	context_ext_vao.bindVertexArrayOES(mesh_cube.vertex_array);
	// The instance data isn't part of our vertex array object,
	// so we'll need to set up the attribute pointers manually.
	context.bindBuffer(context.ARRAY_BUFFER, instances_grid.instance_buffer);
	context.enableVertexAttribArray(3);
	context.vertexAttribPointer(3, 2, context.FLOAT, false, 3*4, 0);
	context_ext_inst.vertexAttribDivisorANGLE(3, 1);
	context.enableVertexAttribArray(4);
	context.vertexAttribPointer(4, 1, context.FLOAT, false, 3*4, 2*4);
	context_ext_inst.vertexAttribDivisorANGLE(4, 1);
	context.bindBuffer(context.ARRAY_BUFFER, null);

	// Draw the cube grid!
	context_ext_inst.drawElementsInstancedANGLE(context.TRIANGLES, mesh_cube.num_indices, context.UNSIGNED_BYTE, 0, instances_grid.num_instances);
}

function background_render_mist_texture(){
	context.viewport(0, 0, framebuffer_mist.width, framebuffer_mist.height);
	context.bindFramebuffer(context.FRAMEBUFFER, framebuffer_mist.framebuffer);
	context.useProgram(shader_mist_texture.program);

	// Set uniforms.
	context.uniform1f(shader_mist_texture.uniform_locations.time, Date.now() - time_start);

	// Render the mist to a texture.
	context_ext_vao.bindVertexArrayOES(mesh_sprite.vertex_array);
	context.drawElements(context.TRIANGLES, mesh_sprite.num_indices, context.UNSIGNED_BYTE, 0);

	context.bindFramebuffer(context.FRAMEBUFFER, null);
	context.viewport(0, 0, viewport_width, viewport_height);
}

function background_render_mist(){
	background_render_mist_texture();

	// Bind the shader and uniforms.
	context.useProgram(shader_mist.program);
	context.uniformMatrix4fv(shader_mist.uniform_locations.vp_matrix, false, vp_matrix);
	context.uniform2f(shader_mist.uniform_locations.mist_transform,
		mist_size, mist_depth
	);
	context.uniform2f(shader_mist.uniform_locations.resolution, viewport_width, viewport_height);
	// Bind the mist frame
	context.bindTexture(context.TEXTURE_2D, framebuffer_mist.texture);

	// Draw the mist!
	context_ext_vao.bindVertexArrayOES(mesh_sprite.vertex_array);
	context.drawElements(context.TRIANGLES, mesh_sprite.num_indices, context.UNSIGNED_BYTE, 0);
}

function background_render_particles(){
	//
}

function background_render_cubes(){
	//
}


/* All of the helper functions are down here, out of the way. */

function update_view(){
	// We need to scale by devicePixelRatio to make sure our canvas
	// size matches the number of physical pixels being displayed.
	viewport_width = Math.round(context.canvas.clientWidth * window.devicePixelRatio);
	viewport_height = Math.round(context.canvas.clientHeight * window.devicePixelRatio);

	if(context.canvas.width != viewport_width || context.canvas.height != viewport_height){
		// Update the canvas and viewport sizes to match the new size.
		context.canvas.width = viewport_width;
		context.canvas.height = viewport_height;
		context.viewport(0, 0, viewport_width, viewport_height);
		// Update the perspective matrix.
		perspective_matrix = mat4_perspective(
			fov, viewport_width/viewport_height,
			near_plane, far_plane
		);
	}

	view_matrix = mat4_lookat(
		new Float32Array(camera_pos),
		new Float32Array([0.0, 0.0, 0.0]),
		new Float32Array([Math.sin(camera_roll), Math.cos(camera_roll), 0.0])
	);
	vp_matrix = mat4_multiply_mat4(perspective_matrix, view_matrix);
}


function shader_program_init(vertex_source, fragment_source){
	const vertex_shader = context.createShader(context.VERTEX_SHADER);
	const fragment_shader = context.createShader(context.FRAGMENT_SHADER);
	const shader_program = context.createProgram();

	// Compile and attach the vertex shader.
	context.shaderSource(vertex_shader, vertex_source);
	context.compileShader(vertex_shader);
	context.attachShader(shader_program, vertex_shader);

	// Compile and attach the fragment shader.
	context.shaderSource(fragment_shader, fragment_source);
	context.compileShader(fragment_shader);
	context.attachShader(shader_program, fragment_shader);

	return shader_program;
}

function load_shader_grid(){
	const shader_program = shader_program_init(
		`
		precision mediump float;

		#define GRID_DEPTH_BASE ${grid_depth_base.toFixed(17)}

		uniform mat4 vp_matrix;

		attribute vec3 vertex_pos;
		attribute vec2 vertex_uv;
		attribute vec3 vertex_normal;
		attribute vec2 instance_pos;
		attribute float instance_scale;

		varying vec2 uv;

		void main(){
			gl_Position = vp_matrix * vec4(vertex_pos.xy + instance_pos.xy, (vertex_pos.z + 0.5) * instance_scale + GRID_DEPTH_BASE, 1.0);
			uv = vertex_uv;
		}
		`,
		`
		precision mediump float;

		#define BG_COLOUR vec3(${bg_colour[0].toFixed(17)}, ${bg_colour[1].toFixed(17)}, ${bg_colour[2].toFixed(17)})
		#define FOG_START ${fog_start.toFixed(17)}
		#define FOG_END   ${fog_end.toFixed(17)}
		#define VIGNETTE_START ${vignette_start.toFixed(17)}
		#define VIGNETTE_END   ${vignette_end.toFixed(17)}

		uniform vec2 resolution;
		uniform sampler2D diffuse;

		varying vec2 uv;

		void main(){
			float z_world = abs(1.0/gl_FragCoord.w);
			float fog_interp = clamp((FOG_END - z_world)/(FOG_END - FOG_START), 0.0, 1.0);

			vec2 screen_pos = (gl_FragCoord.xy - vec2(0.5*resolution.x, 0.5*resolution.y))/resolution.y;
			float vignette_interp = clamp((VIGNETTE_END - length(screen_pos))/(VIGNETTE_END - VIGNETTE_START), 0.0, 1.0);

			gl_FragColor = vec4(mix(
				BG_COLOUR,
				vec3(uv.xy, 1.0),//texture2D(diffuse, uv).xyz,
				fog_interp*vignette_interp
			), 1.0);
		}
		`
	);

	// Specify the attribute locations so
	// they're consistent between shaders.
	context.bindAttribLocation(shader_program, 0, 'vertex_pos');
	context.bindAttribLocation(shader_program, 1, 'vertex_uv');
	context.bindAttribLocation(shader_program, 2, 'vertex_normal');
	context.bindAttribLocation(shader_program, 3, 'instance_pos');
	context.bindAttribLocation(shader_program, 4, 'instance_scale');

	context.linkProgram(shader_program);

	return {
		program: shader_program,
		uniform_locations: {
			vp_matrix:  context.getUniformLocation(shader_program, 'vp_matrix'),
			resolution: context.getUniformLocation(shader_program, 'resolution'),
			diffuse:    context.getUniformLocation(shader_program, 'diffuse')
		}
	};
}

function load_shader_mist_texture(){
	const shader_program = shader_program_init(
		`
		precision mediump float;

		attribute vec2 vertex_pos;

		void main(){
			gl_Position = vec4(2.0*vertex_pos, 0.0, 1.0);
		}
		`,
		`
		precision highp float;

		#define MIST_WIDTH      ${framebuffer_mist.width.toFixed(0)}.0
		#define MIST_HEIGHT     ${framebuffer_mist.height.toFixed(0)}.0

		#define MIST_PASS2_OFFSET_XX  ${mist_pass2_offset_xx.toFixed(17)}
		#define MIST_PASS2_OFFSET_XY  ${mist_pass2_offset_xy.toFixed(17)}
		#define MIST_PASS2_TIME_MOD_X ${mist_pass2_time_mod_x.toFixed(17)}
		#define MIST_PASS2_OFFSET_YX  ${mist_pass2_offset_yx.toFixed(17)}
		#define MIST_PASS2_OFFSET_YY  ${mist_pass2_offset_yy.toFixed(17)}
		#define MIST_PASS2_TIME_MOD_Y ${mist_pass2_time_mod_y.toFixed(17)}

		#define MIST_CONTRAST_BLUE     ${mist_contrast_blue.toFixed(17)}
		#define MIST_CONTRAST_PURPLE   ${mist_contrast_purple.toFixed(17)}
		#define MIST_BRIGHTNESS_BLUE   ${mist_brightness_blue.toFixed(17)}
		#define MIST_BRIGHTNESS_PURPLE ${mist_brightness_purple.toFixed(17)}
		#define MIST_COLOUR_MIX        ${mist_colour_mix.toFixed(17)}

		#define NUM_OCTAVES 4

		uniform float time;

		// Simple hash function from https://github.com/FarazzShaikh/glNoise.
		// The "classic" hash implicitly requires high precision floats!
		float hash(in vec2 v){
			return fract(1e4 * sin(17.0 * v.x + v.y * 0.1) * (0.1 + abs(sin(v.y * 13.0 + v.x))));
		}
		// Fast Perlin-like noise from https://www.shadertoy.com/view/4dS3Wd.
		float noise(vec2 v) {
			vec2 i = floor(v);
			vec2 f = fract(v);

			float a = hash(i);
			float b = hash(i + vec2(1.0, 0.0));
			float c = hash(i + vec2(0.0, 1.0));
			float d = hash(i + vec2(1.0, 1.0));

			vec2 u = f * f * (3.0 - 2.0 * f);
			return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
		}
		// Fractal Brownian motion.
		float fbm(in vec2 v){
			float x = 0.0;
			float a = 0.5;
			vec2 shift = vec2(100.0);
			// The noise we generate is a bit blocky,
			// so we rotate at each octave to hide it.
			mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
			for(int i = 0; i < NUM_OCTAVES; ++i){
				x += a*noise(v);
				v = 2.0*rot*v + shift;
				a *= 0.5;
			}
			return x;
		}

		void main(){
			vec2 screen_pos = (gl_FragCoord.xy - vec2(0.5*MIST_WIDTH, 0.5*MIST_HEIGHT))/MIST_HEIGHT;
			vec2 pass1;
			vec2 pass2;
			vec2 mist_colour;

			screen_pos *= 4.0;
			// Simulate mist using fractal Brownian noise.
			pass1.x = fbm(screen_pos);
			pass1.y = fbm(screen_pos + vec2(1.0));
			pass2.x = fbm(screen_pos + pass1 + vec2(MIST_PASS2_OFFSET_XX, MIST_PASS2_OFFSET_XY) + MIST_PASS2_TIME_MOD_X*time);
			pass2.y = fbm(screen_pos + pass1 + vec2(MIST_PASS2_OFFSET_YX, MIST_PASS2_OFFSET_YY) + MIST_PASS2_TIME_MOD_Y*time);
			mist_colour = vec2(pass2.x, pass2.y);//fbm(screen_pos + pass2);

			// Tune the brightness and contrast.
			// We do brightness first, then contrast.
			mist_colour.x = max(0.0, 0.5 + MIST_CONTRAST_BLUE*(mist_colour.x + MIST_BRIGHTNESS_BLUE - 0.5));
			mist_colour.y = max(0.0, 0.5 + MIST_CONTRAST_PURPLE*(mist_colour.y + MIST_BRIGHTNESS_PURPLE - 0.5));

			gl_FragColor = vec4(mist_colour.x*vec3(0.0, 0.0, 1.0) + MIST_COLOUR_MIX*mist_colour.y*vec3(0.4, 0.0, 1.0), mist_colour.x);
		}
		`
	);

	// Specify the attribute locations so
	// they're consistent between shaders.
	context.bindAttribLocation(shader_program, 0, 'vertex_pos');

	context.linkProgram(shader_program);

	return {
		program: shader_program,
		uniform_locations: {
			time: context.getUniformLocation(shader_program, 'time')
		}
	};
}

function load_shader_mist(){
	const shader_program = shader_program_init(
		`
		precision mediump float;

		uniform mat4 vp_matrix;
		uniform vec2 mist_transform;

		attribute vec2 vertex_pos;
		attribute vec2 vertex_uv;

		varying vec2 uv;

		void main(){
			gl_Position = vp_matrix * vec4(mist_transform.x*vertex_pos.xy, mist_transform.y, 1.0);
			uv = vertex_uv;
		}
		`,
		`
		precision mediump float;

		#define BG_COLOUR vec3(${bg_colour[0].toFixed(17)}, ${bg_colour[1].toFixed(17)}, ${bg_colour[2].toFixed(17)})
		#define VIGNETTE_START ${vignette_mist_start.toFixed(17)}
		#define VIGNETTE_END   ${vignette_mist_end.toFixed(17)}

		uniform vec2 resolution;
		uniform sampler2D diffuse;

		varying vec2 uv;

		void main(){
			vec2 screen_pos = (gl_FragCoord.xy - vec2(0.5*resolution.x, 0.5*resolution.y))/resolution.y;
			float vignette_interp = clamp((VIGNETTE_END - length(screen_pos))/(VIGNETTE_END - VIGNETTE_START), 0.0, 1.0);
			vec4 mist_colour = texture2D(diffuse, uv);

			gl_FragColor = mix(
				vec4(BG_COLOUR, 0.0),
				mist_colour,
				vignette_interp
			);
		}
		`
	);

	// Specify the attribute locations so
	// they're consistent between shaders.
	context.bindAttribLocation(shader_program, 0, 'vertex_pos');
	context.bindAttribLocation(shader_program, 1, 'vertex_uv');

	context.linkProgram(shader_program);

	return {
		program: shader_program,
		uniform_locations: {
			vp_matrix:      context.getUniformLocation(shader_program, 'vp_matrix'),
			mist_transform: context.getUniformLocation(shader_program, 'mist_transform'),
			resolution:     context.getUniformLocation(shader_program, 'resolution'),
			diffuse:        context.getUniformLocation(shader_program, 'diffuse')
		}
	};
}


function load_mesh_cube(){
	const vertices = new Float32Array([
		// position                                      | uv        | normal
		// Right face.
		 grid_cell_half_size, -grid_cell_half_size,  0.5,   0.0, 0.0,   1.0,  0.0,  0.0,
		 grid_cell_half_size, -grid_cell_half_size, -0.5,   0.0, 1.0,   1.0,  0.0,  0.0,
		 grid_cell_half_size,  grid_cell_half_size,  0.5,   1.0, 0.0,   1.0,  0.0,  0.0,
		 grid_cell_half_size,  grid_cell_half_size, -0.5,   1.0, 1.0,   1.0,  0.0,  0.0,
		// Left face.
		-grid_cell_half_size, -grid_cell_half_size, -0.5,   0.0, 0.0,  -1.0,  0.0,  0.0,
		-grid_cell_half_size, -grid_cell_half_size,  0.5,   0.0, 1.0,  -1.0,  0.0,  0.0,
		-grid_cell_half_size,  grid_cell_half_size, -0.5,   1.0, 0.0,  -1.0,  0.0,  0.0,
		-grid_cell_half_size,  grid_cell_half_size,  0.5,   1.0, 1.0,  -1.0,  0.0,  0.0,
		// Top face.
		-grid_cell_half_size,  grid_cell_half_size,  0.5,   0.0, 0.0,   0.0,  1.0,  0.0,
		 grid_cell_half_size,  grid_cell_half_size,  0.5,   0.0, 1.0,   0.0,  1.0,  0.0,
		-grid_cell_half_size,  grid_cell_half_size, -0.5,   1.0, 0.0,   0.0,  1.0,  0.0,
		 grid_cell_half_size,  grid_cell_half_size, -0.5,   1.0, 1.0,   0.0,  1.0,  0.0,
		// Bottom face.
		-grid_cell_half_size, -grid_cell_half_size, -0.5,   0.0, 0.0,   0.0, -1.0,  0.0,
		 grid_cell_half_size, -grid_cell_half_size, -0.5,   0.0, 1.0,   0.0, -1.0,  0.0,
		-grid_cell_half_size, -grid_cell_half_size,  0.5,   1.0, 0.0,   0.0, -1.0,  0.0,
		 grid_cell_half_size, -grid_cell_half_size,  0.5,   1.0, 1.0,   0.0, -1.0,  0.0,
		// Front face.
		-grid_cell_half_size, -grid_cell_half_size,  0.5,   0.0, 0.0,   0.0,  0.0,  1.0,
		 grid_cell_half_size, -grid_cell_half_size,  0.5,   0.0, 1.0,   0.0,  0.0,  1.0,
		-grid_cell_half_size,  grid_cell_half_size,  0.5,   1.0, 0.0,   0.0,  0.0,  1.0,
		 grid_cell_half_size,  grid_cell_half_size,  0.5,   1.0, 1.0,   0.0,  0.0,  1.0,
		// Back face.
		 grid_cell_half_size, -grid_cell_half_size, -0.5,   0.0, 0.0,   0.0,  0.0, -1.0,
		-grid_cell_half_size, -grid_cell_half_size, -0.5,   0.0, 1.0,   0.0,  0.0, -1.0,
		 grid_cell_half_size,  grid_cell_half_size, -0.5,   1.0, 0.0,   0.0,  0.0, -1.0,
		-grid_cell_half_size,  grid_cell_half_size, -0.5,   1.0, 1.0,   0.0,  0.0, -1.0
	]);
	const indices = new Uint8Array([
		// Right face.
		 0,  1,  2,  2, 1, 3,
		// Left face.
		 4,  5,  6,  6, 5, 7,
		// Top face.
		 8,  9, 10, 10, 9, 11,
		// Bottom face.
		12, 13, 14, 14, 13, 15,
		// Front face.
		16, 17, 18, 18, 17, 19,
		// Back face.
		20, 21, 22, 22, 21, 23
	]);

	const vertex_array  = context_ext_vao.createVertexArrayOES();
	const vertex_buffer = context.createBuffer();
	const index_buffer  = context.createBuffer();

	context_ext_vao.bindVertexArrayOES(vertex_array);
		// Buffer vertices.
		context.bindBuffer(context.ARRAY_BUFFER, vertex_buffer);
		context.bufferData(context.ARRAY_BUFFER, vertices, context.STATIC_DRAW);
		// Vertex positions.
		context.enableVertexAttribArray(0);
		context.vertexAttribPointer(0, 3, context.FLOAT, false, 32, 0);
		// Vertex UVs.
		context.enableVertexAttribArray(1);
		context.vertexAttribPointer(1, 2, context.FLOAT, false, 32, 12);
		// Vertex normals.
		//context.enableVertexAttribArray(2);
		//context.vertexAttribPointer(2, 3, context.FLOAT, false, 32, 20);

		// Buffer indices.
		context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, index_buffer);
		context.bufferData(context.ELEMENT_ARRAY_BUFFER, indices, context.STATIC_DRAW);
	context_ext_vao.bindVertexArrayOES(null);

	return {
		vertex_array:  vertex_array,
		vertex_buffer: vertex_buffer,
		index_buffer:  index_buffer,
		num_indices:   indices.length
	};
}

function load_mesh_sprite(){
	const vertices = new Float32Array([
		// position | uv
		-0.5, -0.5,   0.0, 0.0,
		 0.5, -0.5,   0.0, 1.0,
		-0.5,  0.5,   1.0, 0.0,
		 0.5,  0.5,   1.0, 1.0
	]);
	const indices = new Uint8Array([
		0, 1, 2, 2, 1, 3
	]);

	const vertex_array  = context_ext_vao.createVertexArrayOES();
	const vertex_buffer = context.createBuffer();
	const index_buffer  = context.createBuffer();

	context_ext_vao.bindVertexArrayOES(vertex_array);
		// Buffer vertices.
		context.bindBuffer(context.ARRAY_BUFFER, vertex_buffer);
		context.bufferData(context.ARRAY_BUFFER, vertices, context.STATIC_DRAW);
		// Vertex positions.
		context.enableVertexAttribArray(0);
		context.vertexAttribPointer(0, 2, context.FLOAT, false, 16, 0);
		// Vertex UVs.
		context.enableVertexAttribArray(1);
		context.vertexAttribPointer(1, 2, context.FLOAT, false, 16, 8);

		// Buffer indices.
		context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, index_buffer);
		context.bufferData(context.ELEMENT_ARRAY_BUFFER, indices, context.STATIC_DRAW);
	context_ext_vao.bindVertexArrayOES(null);

	return {
		vertex_array:  vertex_array,
		vertex_buffer: vertex_buffer,
		index_buffer:  index_buffer,
		num_indices:   indices.length
	};
}


function load_texture(path){
	const texture = context.createTexture();
	var image = new Image();

	context.bindTexture(context.TEXTURE_2D, texture);
	context.texImage2D(context.TEXTURE_2D, 0, context.RGBA, 1, 1, 0, context.RGBA, context.UNSIGNED_BYTE, new Uint8Array([255, 102, 0, 255]));
	context.bindTexture(context.TEXTURE_2D, null);

	image.src = path;
	image.addEventListener("load", function(){
		context.bindTexture(context.TEXTURE_2D, texture);
		context.texImage2D(context.TEXTURE_2D, 0, context.RGBA, context.RGBA, context.UNSIGNED_BYTE, image);
		context.bindTexture(context.TEXTURE_2D, null);
	});


	return(texture);
}

function create_framebuffer(width, height, filtering){
	const framebuffer  = context.createFramebuffer();
	const texture      = context.createTexture();

	// Create a texture to store the rendered frame.
	context.bindTexture(context.TEXTURE_2D, texture);
	context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, filtering);
	context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, filtering);
	context.texImage2D(context.TEXTURE_2D, 0, context.RGBA, width, height, 0, context.RGBA, context.UNSIGNED_BYTE, null);
	context.bindTexture(context.TEXTURE_2D, null);

	// Create a framebuffer object and bind the texture to it.
	context.bindFramebuffer(context.FRAMEBUFFER, framebuffer);
	context.framebufferTexture2D(context.FRAMEBUFFER, context.COLOR_ATTACHMENT0, context.TEXTURE_2D, texture, 0);
	context.bindFramebuffer(context.FRAMEBUFFER, null);
	
	return {
		framebuffer:  framebuffer,
		texture:      texture,
		width:        width,
		height:       height
	};
}