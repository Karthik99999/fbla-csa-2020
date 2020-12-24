const settings = new Store({
	name: "settings",
	watch: true,
	schema: {
		theme: {
			type: "string",
			default: "light"
		}
	}
})

const students = new Store({
	name: "students"
})

const awards = new Store({
	name: "awards"
})

// Only show data page on startup
$(".page").hide()
$("#students-page").show()
// Load all blocks
$("#sidebar").load("./blocks/sidebar.html")
$("#students-page").load("./blocks/students.html")
$("#awards-page").load("./blocks/awards.html")
$("#help-page").load("./blocks/help.html")

// Run all code after document is loaded
$(document).ready(function() {
	// Change background color, text and table colors
	function changeTheme(theme) {
		if (theme === "dark") {
			$("body").css({
				"background-color": "#121212",
				"color": "#FFFFFF"
			})

			$("#sidebar").css({
				"background-color": "#363636",
				"color": "#FFFFFF"
			})
			$(".sidebar-header").css({
				"background-color": "#242424",
				"color": "#FFFFFF"
			})
			$("#sidebar ul li").css({
				"background-color": "#363636",
			})
			$("#sidebar ul li.active").css({
				"background-color": "#505050",
			})
			$("#sidebar ul.components").css({
				"border-bottom": "1px solid #505050"
			})

			$("table").addClass("table-dark")
			// Don't add table-dark to open child tables to prevent visual glitches
			$("div.child-table > table").removeClass("table-dark")

			$(".modal-content").addClass("modal-dark")
			$(".modal-header").addClass("modal-header-dark")
			$(".modal-footer").addClass("modal-footer-dark")
			// Change button values
			$("#change-theme > span").text("Turn on the lights")
			$("#change-theme").addClass("dark")
			$("#change-theme > i").addClass("fa-sun")
		}
		else {
			$("body").css({
				"background-color": "#FFFFFF",
				"color": "#000000"
			})

			$("#sidebar").css({
				"background-color": "#e3e3da",
				"color": "#000000"
			})
			$("#sidebar .sidebar-header").css({
				"background-color": "#d1d1c5",
				"color": "#000000"
			})
			$("#sidebar ul li").css({
				"background-color": "#e3e3da",
			})
			$("#sidebar ul li.active").css({
				"background-color": "#adada5",
			})
			$("#sidebar ul.components").css({
				"border-bottom": "1px solid #adada5"
			})

			$("table").removeClass("table-dark")

			$(".modal-content").removeClass("modal-dark")
			$(".modal-header").removeClass("modal-header-dark")
			$(".modal-footer").removeClass("modal-footer-dark")
			// Change button values
			$("#change-theme > span").text("Turn off the lights")
			$("#change-theme").addClass("light")
			$("#change-theme > i").addClass("fa-moon")
		}
	}

	changeTheme(settings.get("theme"))
	// Change theme when value modified
	settings.onDidChange("theme", function(theme) {
		changeTheme(theme)
	})
	// Change theme value with button press
	$("#change-theme").click(function() {
		// Used to set theme value
		$(this).toggleClass("dark")
		$(this).toggleClass("light")
		var classList = $(this).attr("class").split(/\s+/)
		var theme = classList[classList.length - 1]
		// Change button icon between sun/moon
		$(this).find("i").toggleClass("fa-sun")
		$(this).find("i").toggleClass("fa-moon")
		settings.set("theme", theme)
	})
	// Handle hovering on sidebar items
	$("#sidebar > ul > li > a").mouseover(function() {
		if ($("#change-theme").hasClass("light")) {
			$(this).css({
				"background-color": "#adada5",
			})
		}
		else {
			$(this).css({
				"background-color": "#505050",
			})
		}
	}).mouseout(function() {
		$(this).css({
			"background-color": "inherit",
		})
	})
	// Change background of active tab
	$("#sidebar > ul > li > a").click(function() {
		if ($("#change-theme").hasClass("light")) {
			$(this).parent().css({
				"background-color": "#adada5",
			})
			$(this).parent().siblings().css({
				"background-color": "#e3e3da",
			})
		}
		else {
			$(this).parent().css({
				"background-color": "#505050",
			})
			$(this).parent().siblings().css({
				"background-color": "#363636",
			})
		}
	})
  // Handle tab switching
	$(".nav-link").click(function() {
		// Hide open page
		// Show selected page
		// Switch active class
		$(".page").hide()
		$(`#${this.id}-page`).show()
		$(".active").removeClass("active")
		$(this).parent().toggleClass("active")
		// Change sidebar manage text and actions
		let dropdown = $("#manage-dropdown")
		// Remove manage dropdown on help page
		if (this.id === "help") {
			dropdown.hide()
			return
		}
		dropdown.show()
		dropdown.find("button").html(`Manage ${this.id.charAt(0).toUpperCase() + this.id.slice(1)} <i class="fa fa-caret-down"></i>`)
		dropdown.find('a[data-toggle="modal"]').attr("data-target", `#add-${this.id.slice(0, -1)}-modal`)
		dropdown.find('a[data-toggle="modal"]').text(`Add ${this.id.slice(0, -1)}`)
		dropdown.find(".reports").attr("id", `${this.id.slice(0, -1)}-reports`)
	})
	// Change invalid feedback message
	$('input[type="text"]').each(function() {
		$(this).on("input", function() {
			// Stop if pattern doesn't exist
			if (!$(this).attr("pattern")) return

			let value = $(this).val().trim()
			let invalidMsg = $(this).siblings(".invalid-feedback")
			let patternType = $(this).attr("pattern") === "^[0-9]+$" ? "numbers" : "letters"

			if (value === "") {
				invalidMsg.text("This field is required")
			}
			else {
				invalidMsg.text(`This field can only contain ${patternType}`)
			}
		})
	})
	// Remove validation class and reset inputs on modal close
	$(".modal").on("hidden.bs.modal", function() {
		$(this).find("form").trigger("reset").removeClass("was-validated")
	})
})
