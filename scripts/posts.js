const POST_NUM_TYPES     = 2;
const POST_TYPE_BLOG     = 0;
const POST_TYPE_RESEARCH = 1;

const POST_TYPE = 0;
const POST_TAGS = 1;
const POST_DATE = 2;
const POST_SHORT_TITLE = 3;
const POST_ICON = 4;
const POST_FULL_TITLE = 5;
const POST_DESC = 6;
const POST_PATH = 7;

const RECENT_POSTS_MAX = 5;

const recent_posts = document.getElementById("recent_posts");


// Each post is stored in order of newest
// to oldest to make sorting quicker.
const posts = [
	[
		POST_TYPE_RESEARCH,
		["algebras", "categories", "category", "frobenius-perron", "fusion", "grothendieck", "groups", "matrix", "modules", "near-group", "notes", "objects", "ostrik", "phd", "pointed", "rings", "thesis"],
		"2025/08/10",
		"Some Results on Modules over Near-Groups",
		"./resource/shared/unsw-crest.png",
		"Some Results on Modules over Near-Groups (Slides)",
		"Slides for a short talk on module categories over near-group fusion categories for UNSW's postgraduate conference.",
		"./research/near-group_results_postgrad/near-group_module_results.pdf"
	],

	[
		POST_TYPE_RESEARCH,
		["algebras", "categories", "category", "frobenius-perron", "fusion", "grothendieck", "groups", "matrix", "modules", "near-group", "notes", "objects", "ostrik", "phd", "pointed", "rings", "thesis"],
		"2025/08/06",
		"Ph.D. Notes",
		"./resource/shared/unsw-crest.png",
		"Notes on Fusion Categories and Their Modules",
		"Random notes on fusion categories and fusion module categories, with a focus on some new results for near-group fusion categories. These will probably end up being a \"director's cut\" for my Ph.D. thesis.",
		"./research/fusion_category_modules_phd/phd_notes.pdf"
	],

	[
		POST_TYPE_RESEARCH,
		["categories", "category", "diagrammatics", "framed", "fusion", "graphs", "groups", "homflypt", "invariants", "jones", "kauffman", "knots", "links", "manifolds", "pivotal", "polynomials", "quantum", "reshetikhin", "ribbon", "slides", "turaev", "witten"],
		"2025/06/15",
		"Ribbon Categories and RT Invariants",
		"./research/ribbon_categories_rt_invariants/icon.png",
		"Ribbon Categories and Reshetikhin-Turaev Invariants (Slides)",
		"Slides from a short talk at the <a href='https://sites.google.com/view/dominic-matan/seminar/'>UNSW Maths PhD/Masters Seminar</a> organized by Dominic Matan and Joe Baine.",
		"./research/ribbon_categories_rt_invariants/ribbon_categories_rt_invariants.pdf"
	],

	[
		POST_TYPE_RESEARCH,
		["algebras", "categories", "category", "frobenius-perron", "fusion", "grothendieck", "groups", "haagerup-izumi", "matrix", "modules", "near-group", "notes", "objects", "ostrik", "pointed", "rings"],
		"2025/06/08",
		"Fusion Categories and Their Modules",
		"./research/fusion_category_modules_anna/icon.png",
		"Fusion Categories and Their Modules (Notes)",
		"Notes from a talk given for Anna Romanov's research group.",
		"./research/fusion_category_modules_anna/fusion_category_modules.pdf"
	]
];
/*const posts = [
	[
		POST_TYPE_BLOG,
		["tag1", "long_tag2", "very_long_tag3", "absurdly_annoyingly_long_tag4"],
		"2025/05/09",
		"Short Content Title 1",
		"/resource/sun.png",
		"Content Title 1",
		"This is a temporary description for a temporary post!",
		"/blog/test_entry_1/post.html"
	],

	[
		POST_TYPE_RESEARCH,
		["tag1", "long_tag2", "very_long_tag3", "absurdly_annoyingly_long_tag4"],
		"2025/05/09",
		"Short Content Title 2",
		"/resource/moon.png",
		"Content Title 2",
		"This is a temporary description for a temporary post!",
		"/research/test_entry_2/post.html"
	],

	[
		POST_TYPE_BLOG,
		["tag1"],
		"2025/05/09",
		"Short Content Title 3",
		"/resource/sun.png",
		"Content Title 3",
		"This is a temporary description for a temporary post!",
		"/blog/test_entry_3/post.html"
	],

	[
		POST_TYPE_RESEARCH,
		["tag1"],
		"2025/05/09",
		"Short Content Title 4",
		"/resource/moon.png",
		"Content Title 4",
		"This is a temporary description for a temporary post!",
		"/research/test_entry_4/post.html"
	],

	[
		POST_TYPE_BLOG,
		["long_tag2"],
		"2025/05/09",
		"Short Content Title 5",
		"/resource/sun.png",
		"Content Title 5",
		"This is a temporary description for a temporary post!",
		"/blog/test_entry_5/post.html"
	],

	[
		POST_TYPE_RESEARCH,
		["long_tag2"],
		"2025/05/09",
		"Short Content Title 6",
		"/resource/moon.png",
		"Content Title 6",
		"This is a temporary description for a temporary post!",
		"/research/test_entry_6/post.html"
	],

	[
		POST_TYPE_BLOG,
		["very_long_tag3"],
		"2025/05/09",
		"Short Content Title 7",
		"/resource/sun.png",
		"Content Title 7",
		"This is a temporary description for a temporary post!",
		"/blog/test_entry_7/post.html"
	],

	[
		POST_TYPE_RESEARCH,
		["very_long_tag3"],
		"2025/05/09",
		"Short Content Title 8",
		"/resource/moon.png",
		"Content Title 8",
		"This is a temporary description for a temporary post!",
		"/research/test_entry_8/post.html"
	],

	[
		POST_TYPE_BLOG,
		["absurdly_annoyingly_long_tag4"],
		"2025/05/09",
		"Short Content Title 9",
		"/resource/sun.png",
		"Content Title 9",
		"This is a temporary description for a temporary post!",
		"/blog/test_entry_9/post.html"
	],

	[
		POST_TYPE_RESEARCH,
		["absurdly_annoyingly_long_tag4"],
		"2025/05/09",
		"Short Content Title 10",
		"/resource/moon.png",
		"Content Title 10",
		"This is a temporary description for a temporary post!",
		"/research/test_entry_10/post.html"
	]
];*/


function recent_posts_fill(num_posts){
	// Make sure we're on page with the recent posts list.
	if(!recent_posts){
		return;
	}
	recent_posts.innerHTML = "";

	num_posts = Math.min(posts.length, num_posts);
	for(var i = 0; i < num_posts; ++i){
		const post = posts[i];
		recent_posts.innerHTML += '<li><a href="' + post[POST_PATH] + '">' + post[POST_SHORT_TITLE] + '</a> (' + post[POST_DATE] + ')</li>';
	}
}


recent_posts_fill(RECENT_POSTS_MAX);