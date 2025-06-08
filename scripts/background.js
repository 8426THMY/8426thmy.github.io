// Frames per second. If fps <= 0,
// use the monitor's refresh rate.
const render_rate = 0.0;
const render_time = (render_rate <= 0) ? 0.0 : 1000.0 / render_rate;
var time_prev;
var time_next;


function background_initialize(){
	background_update_initialize();
	background_render_initialize();
	time_prev = Date.now();
	time_next = time_prev;
	background_loop();
}

function background_loop(){
	const time_cur = Date.now();
	// Prepare the next frame if it's time to render.
	if(render_rate <= 0 || time_cur >= time_next){
		// Our update and render rates are linked, so the
		// number of times we update everything depends on
		// the refresh rate of the user's monitor. To make
		// sure things look the same for everyone, we scale
		// the contributions of updates by this delta.
		//
		// A smarter way to do this would be to do a fixed
		// number of updates per second regardless of the
		// user's refresh rate, then interpolate between
		// the previous and current states when rendering.
		// Obviously, this is a lot more complicated, and
		// hardly worth it for something as dumb as this.
		const delta = (time_cur - time_prev) / update_time;

		background_update(delta);
		background_render();

		time_prev = time_cur;
		// Add the remaining time for this timestep to
		// the current time to get the next render time.
		time_next = time_cur + render_time - (time_cur - time_next) % render_time;
	}
	window.requestAnimationFrame(background_loop);
}


background_initialize();