// Updates per second, independent to framerate.
const update_rate = 60.0;
const update_time = 1000.0 / update_rate;

var camera_pos = [0.0, 0.0, 30.0];
// Perform one revolution every 240 seconds.
const camera_roll_speed = 2.0*Math.PI/(240.0 * update_rate);
var camera_roll = 0.0;

const grid_rows = 15;
const grid_cols = 15;
const grid_cell_half_size = 1.0;
const grid_row_spacing = 2.5*grid_cell_half_size;
const grid_col_spacing = 2.5*grid_cell_half_size;
const grid_size = grid_rows*(2.0*grid_cell_half_size) + (grid_rows - 1)*(grid_row_spacing - 2.0*grid_cell_half_size);
// Average percentage of grid positions to use.
const grid_fill_percentage = 0.15;
// Depth of the grid's base.
const grid_depth_base = -1000.0;
// Minimum and maximum grid heights.
const grid_height_min = 10.0;
const grid_height_max = 15.0;
// Each instance stores three floats,
// x position, y position and z scale.
var grid_instance_data;

const mist_size  = grid_size;
const mist_depth = 0.75*grid_height_min;


/** We should have some way of prioritizing  **/
/** grid positions that are near the centre. **/


function background_update_initialize(){
	// We use this array of base scales to figure out which instances
	// should be drawn. The scale is a number in the range
	//     [(grid_fill_percentage - 1.0)/grid_fill_percentage, 1.0],
	// and we discard instances with scale less than or equal to zero.
	// This range is chosen so that the positive scale can vary between
	// 0 and 1 while occuring with percentage grid_fill_percentage.
	var grid_base_scales = Array.apply(null, Array(grid_rows*grid_cols)).map(function(x){
		return (1.0/grid_fill_percentage)*(Math.random() - (1.0 - grid_fill_percentage));//(grid_height_max - grid_height_min + 1.0)*Math.random() + grid_height_min;
	});
	// Normal arrays are faster to operate on than Float32Arrays,
	// so we build up this array as an intermediate step.
	var grid_instance_data_array = Array.apply(null, Array(3*grid_rows*grid_cols));

	var cur_index = 0;
	// Set up the array of instance data.
	for(var i = 0; i < grid_rows; ++i){
		for(var j = 0; j < grid_cols; ++j){
			const cur_scale = grid_base_scales[grid_cols*i + j];
			if(cur_scale <= 0.0){
				grid_instance_data_array.length -= 3;
			}else{
				// x position
				grid_instance_data_array[cur_index] = 0.5*grid_col_spacing*(2.0*j - grid_cols + 1.0);
				// y position
				grid_instance_data_array[cur_index + 1] = 0.5*grid_row_spacing*(2.0*i - grid_rows + 1.0);
				// z scale
				grid_instance_data_array[cur_index + 2] = ((grid_height_max - grid_height_min)*cur_scale + grid_height_min) - grid_depth_base;
				cur_index += 3;
			}
		}
	}

	// Copy everything into a Float32Array.
	grid_instance_data = new Float32Array(grid_instance_data_array);
}

function background_update(delta){
	camera_roll -= camera_roll_speed*delta;
}