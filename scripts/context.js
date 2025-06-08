var context;
var context_ext_inst;
var context_ext_vao;


function context_initialize(){
	const canvas = document.getElementById("canvas_background");
	context = canvas.getContext("webgl");
	
	if(
		!context ||
		!(context_ext_inst = context.getExtension("ANGLE_instanced_arrays")) ||
		!(context_ext_vao = context.getExtension("OES_vertex_array_object"))
	){

		console.log("No WebGL support, panic!");
	}
}


context_initialize();