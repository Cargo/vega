/**
 * Vega
 */

var Design = Design || {
	 keyboardshortcuts: function() {
		// Reset
		Cargo.Core.KeyboardShortcut.Remove("J");
		Cargo.Core.KeyboardShortcut.Remove("K");
		Cargo.Core.KeyboardShortcut.Remove("I");
		Cargo.Core.KeyboardShortcut.Remove("X");

		// Next
		Cargo.Core.KeyboardShortcut.Add("J", 74, function() {
			Design.nextProject();
		});

		// Prev
		Cargo.Core.KeyboardShortcut.Add("K", 75, function() {
			Design.prevProject();
		});

		// Next
		Cargo.Core.KeyboardShortcut.Add("Down", 74, function() {
			Design.nextProject();
		});

		// Prev
		Cargo.Core.KeyboardShortcut.Add("Up", 75, function() {
			Design.prevProject();
		});

		// Index
		Cargo.Core.KeyboardShortcut.Add("I", 73, function() {
			window.location = Cargo.Helper.GetBaseUrl(true, true);
		});

		Cargo.Core.KeyboardShortcut.Add("X", 88, function() {
			window.location = Cargo.Helper.GetBaseUrl(true, true);
		});
	},

	nextProject: function() {
		var pid = $(".project.active").parent().next().attr("data-id") || $(".project_container").first().attr("data-id");
		Design.Project.scrollToProject(pid);
	},

	prevProject: function() {
		var pid = $(".project.active").parent().prev().attr("data-id") || $(".project_container").last().attr("data-id");
		Design.Project.scrollToProject(pid);
	}
};

$(function() {
	Cargo.Core.ReplaceLoadingAnims.init();
	Design.keyboardshortcuts();
});

/**
 * Project methods
 */

Design.Project = {
	"$container": null,
	"$thumbcontainer": null,

	data: {
		"thumb_height"	 : 0,
		"thumb_click"	 : false,
		"thumb_hover"	 : false,
		"scrollY"		 : 0,
		"ticking"		 : null,
		"last_project"	 : null,
		"position_offset": 0,
		"project_height" : 0,
		"window_height"	 : 0
	},

	positions: [],

	init: function() {
		// Cache some elements
		Design.Project.$container = $(window);
		Design.Project.$thumbcontainer = $(".thumbnails_container");

		// Set some data
		Design.Project.data.thumb_height = $(".project_thumb:first").outerHeight();

		// Set scroll event
		Design.Project.$container
			.bind("scroll", Design.Project.onScroll)
			.bind("touchmove", Design.Project.onScroll);

		// Thumbnail scroll
		Design.Project.$thumbcontainer
			.bind("mouseenter", function() {
				$("body").addClass("disable_scroll");
				Design.Project.data.thumb_hover = true;
			})
			.bind("mouseleave", function() {
				$("body").removeClass("disable_scroll");
				Design.Project.data.thumb_hover = false;
			});
	},

	paginateProjects: function() {
		// Reset and set data
		Design.Project.positions = [];

		Design.Project.data.window_height = $(window).height();
		Design.Project.data.position_offset = Math.floor((Design.Project.data.window_height - $(".thumb_block").height()) / Design.Project.data.thumb_height) / 2;

		// Store the projects
		$(".project").each(function() {
			// Add the positions to an array
			Design.Project.positions.push($(this).offset().top);

			// Minimum height
			$(this).css({
				"min-height": Design.Project.data.window_height / 2 + 10 + "px"
			});
		});

		// Scroll if we're not over thumbs
		if (!Design.Project.data.thumb_hover) {
			Design.Project.onScroll();
		}
	},

	onScroll: function(e) {
		Design.Project.scrollY = Design.Project.$container.scrollTop() + (Design.Project.data.window_height / 2);
		Design.Project.requestTick();
		if (e) {
			e.stopPropagation();
		}
	},

	requestTick: function() {
		if (!Design.Project.ticking) {
			requestAnimationFrame(Design.Project.scroll);
		}

		Design.Project.ticking = true;
	},

	scroll: function() {
		// Update data
		Design.Project.ticking = false;

		for (var i = Design.Project.positions.length - 1; i >= 0; i--) {
			var offset = Design.Project.positions[i];

			if (Design.Project.scrollY > offset && Design.Project.scrollY != Design.Project.data.window_height / 2) {
				// Active classes
				if (i != Design.Project.data.last_project) {
					// Reset old
					if (Design.Project.data.last_project) {
						Design.Project.data.last_project.removeClass("active");
					}

					// Update
					Design.Project.data.last_project = $(".project").eq(i);
					Design.Project.data.project_height = Design.Project.data.last_project.outerHeight();

					// Set new
					Design.Project.data.last_project.addClass("active");

					// Ignore if clicked
					if (!Design.Project.data.thumb_click) {
						$(".project_thumb.active").removeClass("active");
						$(".project_thumb").eq(i).addClass("active");
					}
				}

				var position = Design.Project.scrollY - offset;
					position = position / Design.Project.data.project_height;

				var top =  (Design.Project.data.thumb_height * (i - Design.Project.data.position_offset));
					top += (position * Design.Project.data.thumb_height);
					top =  Math.floor(top);

				// Scroll it
				if (!Design.Project.data.thumb_click) {
					Design.Project.$thumbcontainer.scrollTop(top);
				}

				break;
			}
		};
	},

	formatThumbnails: function() {
		$(".project_thumb").each(function() {
			// Center the title
			var offset = ($(this).height() - $(this).find(".thumb_title").height()) / 2;

			$(this).find(".thumb_title").css({
				paddingTop: offset + "px"
			});

			// Center the image
			var thumb_width			  = $(this).find(".thumb_image img").width(),
				thumb_container_width = $(this).find(".thumb_image").width();

			// Margin
			if (thumb_width > thumb_container_width) {
				var margin = (thumb_width - thumb_container_width) / 2
				$(this).find(".thumb_image img").css("margin-left", "-" + margin + "px");
			}

			$(this).addClass("formatted");
		});
	},

	clickThumbnail: function() {
		var click_timeout;

		$("#project_thumbnails").on("click dblclick", ".project_thumb", function(e) {
			// Scroll to the project
			if (!$(this).hasClass("active")) {
				Design.Project.scrollToProject($(this).attr("data-id"));
			}

			// Active
			$(".project_thumb").removeClass("active");
			$(this).addClass("active");

			$("#project_thumbnails").mouseleave();
			setTimeout(function() {
				$("#project_thumbnails").mouseenter();
			}, 10);
		});
	},

	scrollToProject: function(pid) {
		var current_position = Design.Project.$container.scrollTop(),
			new_position     = $(".project_container[data-id='" + pid + "']").position().top + 1;

		// Direction
		if (current_position > new_position) {
			current_position = new_position + 50;
		} else {
			current_position = new_position - 50;
		}

		// Browser
		var $scroll_target = $("body");
		if (typeof InstallTrigger !== "undefined") {
			$scroll_target = $("html");
		}

		// Scroll to
		$scroll_target.animate({
			scrollTop: current_position
		}, 0, function() {
			$scroll_target.animate({
				scrollTop: new_position
			}, 100);
		});
	}
};

$(function() {
	Design.Project.formatThumbnails();
	Design.Project.clickThumbnail();
	Design.Project.init();

	// Safari retina scroll bug fix
	if (typeof InstallTrigger !== "undefined") {
		$(".thumbnails_container").addClass("scrollfix");
	}

	setTimeout(function() {
		Design.Project.paginateProjects();
	}, 100);

	var resizer;
	$(window).resize(function(event) {
		// Debounce
		clearTimeout(resizer);
		resizer = setTimeout(function() {
			Design.Project.paginateProjects();
		}, 100);
	});
});

/**
 * Events
 */

Cargo.Event.on("slideshow_thumbnails_toggle", function(el, obj) {
	setTimeout(function() {
		Design.Project.paginateProjects();
	}, 100);
});

Cargo.Event.on("element_resizer_init", function(plugin) {
	plugin.setOptions({
		adjustElementsToWindowHeight: false,
		centerElements: false
	});
});

Cargo.Event.on("pagination_complete", function(new_page) {
	Design.Project.formatThumbnails();

	setTimeout(function() {
		Cargo.Plugins.elementResizer.refresh();
		Design.Project.paginateProjects();
	}, 100);
});

Cargo.Event.on("inspector_unload", function() {
	Design.Project.formatThumbnails();
});
