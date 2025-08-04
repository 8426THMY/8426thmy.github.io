const SEARCH_SORT_NEWEST = 0;
const SEARCH_SORT_OLDEST = 1;

const search_text_elem        = document.getElementById("search_text");
const search_blog_elem        = document.getElementById("search_blog");
const search_research_elem    = document.getElementById("search_research");
const search_sort_elem        = document.getElementById("search_sort");
const search_sort_newest_elem = document.getElementById("search_sort_newest");
const search_sort_oldest_elem = document.getElementById("search_sort_oldest");

const post_container = document.getElementById("post_container");

var search_text;
var search_types = Array(POST_NUM_TYPES);
var search_sort;


function search_start(){
	search_text                      = search_text_elem.value;
	search_types[POST_TYPE_BLOG]     = search_blog_elem.checked;
	search_types[POST_TYPE_RESEARCH] = search_research_elem.checked;
	search_sort                      = search_sort_elem.value;

	// Store the search criteria.
	sessionStorage.setItem("search_text", search_text);
	sessionStorage.setItem("search_blog", search_types[POST_TYPE_BLOG]);
	sessionStorage.setItem("search_research", search_types[POST_TYPE_RESEARCH]);
	sessionStorage.setItem("search_sort", search_sort);

	// If we're on the search page, simply refresh the results.
	if(location.pathname === "/search.html"){
		search_refresh();
		return false;
	}

	// Otherwise, load the search page.
	return true;
}

function search_restore_ui(){
	// Retrieve the search criteria from the session storage.
	search_text                      = sessionStorage.getItem("search_text");
	// Silly hack to ensure that the boxes are checked
	// by default when the session storage is empty.
	search_types[POST_TYPE_BLOG]     = (sessionStorage.getItem("search_blog") !== "false");
	search_types[POST_TYPE_RESEARCH] = (sessionStorage.getItem("search_research") !== "false");
	search_sort                      = Number(sessionStorage.getItem("search_sort"));

	// Update the search UI using its previous values.
	search_text_elem.value        = search_text;
	search_blog_elem.checked      = search_types[POST_TYPE_BLOG];
	search_research_elem.checked  = search_types[POST_TYPE_RESEARCH];
	// Set the values of the select options.
	search_sort_newest_elem.value = SEARCH_SORT_NEWEST;
	search_sort_oldest_elem.value = SEARCH_SORT_OLDEST;
	search_sort_elem.value        = search_sort;
}

function search_add(tag){
	search_text_elem.value += (search_text_elem.value === "") ? tag : " " + tag;
}

function search_refresh(){
	// Build an array of search terms from the search text.
	// We assume that tags are delimited by whitespace or commas,
	// and the regex below matches strings of these characters.
	const search_terms = search_text.toLowerCase().split(/(?:,|\s)+/).filter(Boolean);
	var results = Array();

	// Add each post matching our search criteria to the results array.
	for(var i = 0; i < posts.length; ++i){
		const post = posts[i];
		const post_tags_array = post[POST_TAGS];
		var j;

		// Ignore this post if we're not searching for its type.
		if(!search_types[post[POST_TYPE]]){
			continue;
		}

		// Check every search term to make sure it's a
		// substring of at least one of the post's tags.
		for(j = 0; j < search_terms.length; ++j){
			var k;
			for(k = 0; k < post_tags_array.length; ++k){
				if(post_tags_array[k].indexOf(search_terms[j]) !== -1){
					break;
				}
			}
			// If this search term isn't a substring of
			// any of the post's tags, exit the loop.
			if(k == post_tags_array.length){
				break;
			}
		}
		// If not every search term had a match, skip this post.
		if(j < search_terms.length){
			continue;
		}

		results.push(i);
	}

	// Posts are automatically sorted from newest to oldest,
	// so just reverse the array if we want oldest first.
	if(search_sort == SEARCH_SORT_OLDEST){
		results.reverse();
	}

	search_display(results);
}

function search_display(results){
	// Make sure we're on a search page.
	if(!post_container){
		return;
	}
	post_container.innerHTML = "";

	for(var i = 0; i < results.length; ++i){
		const post = posts[results[i]];
		const post_tags_array = post[POST_TAGS];
		var tags_string = "";

		for(var j = 0; j < post_tags_array.length; ++j){
			tags_string += '<button class="post_tag" onclick="search_add(\'' + post_tags_array[j] + '\')">' + post_tags_array[j] + '</button>';
		}

		post_container.innerHTML += '\
			<article class="window"> \
				<div class="window_header">' + post[POST_SHORT_TITLE] + '</div> \
				<div class="window_content"> \
					' + (post[POST_ICON] ? ('<img class="post_image" src="' + post[POST_ICON] + '">') : '') + '\
					<div class="post_title">' + post[POST_FULL_TITLE] + '</div> \
					<hr> \
					<div class="post_date">Last updated: ' + post[POST_DATE] + '</div> \
					<div class="post_tags">Tags: ' + tags_string + '</div> \
					<hr> \
					<div class="post_desc">' + post[POST_DESC] + '</div> \
					<div class="post_more"><a href="' + post[POST_PATH] + '">Read more</a></div> \
				</div> \
			</article> \
		';
	}
}


search_restore_ui();
search_refresh();