// Wait until document is ready
$(function() {
	// Loop through store after converting it to an array of objects
	for (let [id, student] of Object.entries(students.store)) {
		let row = ""
		row += '<td class="details-control"><i class="fa fa-caret-right"></i></td>'
		row += `<td class="info" id="ID">${id}</td>`
		let hours = 0
		for (let x in student) {
			if (x === "hours") {
				student[x].forEach(function(log) {
					hours += Number(log["hours-completed"])
				})
				row += `<td id=${x}>${hours}</td>`
			}
			else {
				row += `<td class="info" id=${x}>${student[x]}</td>`
			}
		}
		// Manage buttons
		row += `<td><button type="button" class="btn btn-primary" role="edit-student" id="${id}" data-toggle="modal" data-target="#student-edit-modal"><i class="fa fa-pencil-alt"></i> Edit</button> `
		row += `<button type="button" class="btn btn-danger" role="delete-student" id="${id}" data-toggle="modal" data-target="#student-delete-modal"><i class="fa fa-trash"></i> Delete</button> `
		row += `<button type="button" class="btn btn-success" role="add_hours" id="${id}" data-toggle="modal" data-target="#add_hours-modal"><i class="fa fa-plus"></i> Add Hours</button></td>`
		$("#students-table > tbody").append(`<tr>${row}</tr>`)
	}
	var table = $("#students-table").DataTable({
		// Disable ordering and selection via details and manage columns
		columnDefs: [{
			targets: [0, 5],
			orderable: false,
			className: "not-selectable"
		}],
		// Sort by name column by default
		order: [
			[2, "asc"]
		],
		select: {
			style: "multi+shift",
			selector: "td:not(.not-selectable)"
		}
	})

	function addStudent(info, hours) {
		let obj = {}
		let id
		info.forEach(function(v) {
			if (v.name !== "ID") {
				obj[`${v.name}`] = v.value
			}
			else {
				id = v.value
			}
		})
		// Set student hours if given
		obj["hours"] = hours || []
		students.set(id, obj)
		// Add id to object to return
		obj["ID"] = id
		return obj
	}

	function updateRow(id) {
		let student = students.get(id)
		let rowData = table.row(".update").data()
		let hours = 0
		student.hours.forEach(function(log) {
			hours += Number(log["hours-completed"])
		})
		let award = "N/A"
		for (let [name, data] of Object.entries(awards.store)) {
			if (isBetween(hours, data.min, data.max)) {
				award = name
			}
		}
		rowData[1] = id
		rowData[2] = student.name
		rowData[3] = student.grade
		rowData[4] = hours
		table.row(".update").data(rowData).draw(false)
	}
	// Add student
	$("#add-student-form").submit(function(event) {
		// Prevent page from reloading
		event.preventDefault()

		// Check form validity
		let form = $(this)
		if (form[0].checkValidity() === false) {
			event.stopPropagation()
			form.addClass("was-validated")
			return false
		}

		let info = form.serializeArray()
		// Show error if student ID is already in store
		if (students.get(info[0].value)) return
		let student = addStudent(info)
		// Generate buttons
		let buttons = `<button type="button" class="btn btn-primary" role="edit-student" id="${student.ID}" data-toggle="modal" data-target="#student-edit-modal"><i class="fa fa-pencil-alt"></i> Edit</button> ` +
			`<button type="button" class="btn btn-danger" role="delete-student" id="${student.ID}" data-toggle="modal" data-target="#student-delete-modal"><i class="fa fa-trash"></i> Delete</button> ` +
			`<button type="button" class="btn btn-success" role="add_hours" id="${student.ID}" data-toggle="modal" data-target="#add_hours-modal"><i class="fa fa-plus"></i> Add Hours</button>`
		// Add row to table
		let row = table.row.add([
				'<i class="fa fa-caret-right"></i>',
				student.ID,
				student.name,
				student.grade,
				0,
				buttons
			])
			.draw(false) // Don't go back to the first page
			.node() // Get node of row for jQuery
		// Add classes
		$(row).find("td").first().addClass("details-control")
		$(row).find("td").slice(1, -1).addClass("info")
		// Close modal
		$("#add-student-modal").modal("hide")
	})
	// Change id for delete modal
	// and append name to header
	$("#students-table").on("click", '[role="delete-student"]', function() {
		// Set row up for deletion
		table.$("tr.deleting").removeClass("deleting")
		$(this).parent().parent().addClass("deleting")

		let info = $(this).parent().siblings(".info")
		let infoArr = []
		info.each(function() {
			infoArr.push($(this).text())
		})

		let name = infoArr[1]
		$("#student-edit-title").text(`Are you sure you want to delete ${name}?`)
		$('[role="delete-student-confirm"]').attr("id", this.id)
	})
	// Confirm deletion
	$("#student-delete-modal").on("click", '[role="delete-student-confirm"]', function() {
		students.delete(this.id)
		table.row(".deleting").remove().draw(false)
	})
	// Delete selected rows
	$("#delete-selected").click(function() {
		let rows = table.rows(".selected")
		$.each(rows.data(), function(index) {
			let id = this[1]
			students.delete(id)
		})
		rows.remove().draw(false)
	})
	// Enter values of student into inputs
	$("#students-table").on("click", '[role="edit-student"]', function() {
		// Set row up for editing
		table.$("tr.update").removeClass("update")
		$(this).parent().parent().addClass("update")

		let info = $(this).parent().siblings(".info")
		let infoArr = []
		info.each(function() {
			infoArr.push($(this).text())
		})
		// Store current values in inputs
		$("#student-edit-form > .modal-body > .form-group > input").each(function(i) {
			$(this).attr("data-old", infoArr[i])
			$(this).val(infoArr[i])
		})
	})
	// Save changes in edit modal
	$("#student-edit-form").submit(function(event) {
		// Prevent page from reloading
		event.preventDefault()

		// Check form validity
		let form = $("#student-edit-form")
		if (form[0].checkValidity() === false) {
			event.stopPropagation()
			form.addClass("was-validated")
			return false
		}

		let inputs = $("#student-edit-form > .modal-body > .form-group > input")
		// Get old student hours to transfer to new student
		let oldStudent = students.get(inputs.first().attr("data-old").toString())
		// Delete old student in case of id change
		students.delete(inputs.first().attr("data-old").toString())
		// Convert form inputs into array
		let info = $(this).serializeArray()
		let student = addStudent(info, oldStudent.hours)
		// Close modal
		$("#student-edit-modal").modal("hide")
		updateRow(student.ID)
	})
	// Show add hours modal
	$("#students-table").on("click", '[role="add_hours"]', function() {
		// Set row up for updating
		table.$("tr.update").removeClass("update")
		$(this).parent().parent().addClass("update")

		let info = $(this).parent().siblings()
		let infoArr = []
		info.each(function() {
			infoArr.push($(this).text())
		})

		// Set hidden inputs
		let id = infoArr[1]
		let award = infoArr[5]
		$("#add_hours-form > .modal-body > input[name='ID']").val(id)
		$("#add_hours-form > .modal-body > input[name='award']").val(award)
		// Add name to header
		let name = infoArr[2]
		$("#add_hours-form > .modal-header > .modal-title").text(`Add hours for ${name}`)
	})
	// Add hours
	$("#add_hours-form").submit(function(event) {
		// Prevent page from reloading
		event.preventDefault()

		// Check form validity
		let form = $("#add_hours-form")
		if (form[0].checkValidity() === false) {
			event.stopPropagation()
			form.addClass("was-validated")
			return false
		}

		// Convert form inputs into array
		let info = $(this).serializeArray()
		// Create object to push to hours array
		let obj = {}
		let id
		info.forEach(function(v) {
			if (v.name === "ID") {
				id = v.value
			}
			else {
				obj[`${v.name}`] = v.value
			}
		})
		// Push hours to array
		let student = students.get(id)
		console.log(student)
		let hours = student.hours
		hours.push(obj)
		student.hours = hours
		students.set(id, student)
		// Close modal
		form.removeClass('was-validated')
		$("#add_hours-modal").modal("hide")
		// Update table data
		updateRow(id)
		let row = table.row(".update")
		row.child(childTable(row.data())).draw(false)
	})
	// Generate child rows for hours object
	function childTable(data) {
		let id = data[1]
		let student = students.get(id)
		// Get award
		let hours = 0
		student.hours.forEach(function(log) {
			hours += Number(log["hours-completed"])
		})
		let activeAward = "N/A"
		let awardsAchieved = []
		for (let [name, data] of Object.entries(awards.store)) {
			if (isBetween(hours, data.min, data.max)) {
				activeAward = name
			}
			else if (hours >= data.max) {
				awardsAchieved.push(name)
			}
		}
		let table = `<p>Awards achieved: ${awardsAchieved}</p>
<p>Active award: ${activeAward}</p>
<h4>Hours overview for ${student.name}</h4>
<div class="child-table">
<table style="width:100%;">
<thead>
  <tr>
    <th>Description</th>
    <th>Hours</th>
    <th>Date completed</th>
    <th>Manage</th>
  </tr>
</thead>
<tbody>`
		student.hours.forEach(function(log, index) {
			let date = new Date(log["date-completed"].replace("-", "/"))
			let dateString = date.toLocaleDateString("en-US", {
				month: "long",
				day: "numeric",
				year: "numeric"
			})
			table += "<tr>" +
				`<td class="info">${log.description}</td>` +
				`<td class="info">${log["hours-completed"]}</td>` +
				`<td class="info">${dateString}</td>` +
				`<td><button type="button" class="btn btn-link" style="color:inherit;" role="edit-hours" data-index=${index} data-toggle="modal" data-target="#edit-hours-modal"><i class="fa fa-pencil-alt"></i> Edit</button></button> ` +
				`<button type="button" class="btn btn-link" style="color:inherit;" role="delete-hours" data-index=${index} data-toggle="modal" data-target="#delete-hours-modal"><i class="fa fa-trash"></i> Delete</button></td>` +
				"<tr>"
		})
		table += "</tbody></table></div>"
		return table
	}
	// Manage child rows
	$('#students-table > tbody').on('click', 'td.details-control', function() {
		let tr = $(this).parents('tr')
		let row = table.row(tr)

		if (row.child.isShown()) {
			// This row is already open - close it
			row.child.hide();
			tr.removeClass('shown');
			// Modify caret direction in row data
			let data = row.data()
			data[0] = '<i class="fa fa-caret-right">'
			row.data(data).draw(false)
		}
		else {
			row.child(childTable(row.data())).show();
			tr.addClass('shown');
			// Modify caret direction in row data
			let data = row.data()
			data[0] = '<i class="fa fa-caret-down">'
			row.data(data).draw(false)
		}
	})
	// Set up edit hours modal
	$("#students-table").on("click", '[role="edit-hours"]', function() {
		// Set row up for editing
		table.$("tr.update").removeClass("update")
		$(this).parents(":eq(6)").prev().addClass("update")

		let info = $(this).parent().siblings(".info")
		let infoArr = []
		info.each(function() {
			infoArr.push($(this).text())
		})
		// Get student row
		let student = $(this).parents(":eq(6)").prev()
		let id = student.children(".info").first().text()
		$("#edit-hours-form > .modal-body > [name='ID']").val(id)
		// Set array index in form attribute
		$("#edit-hours-form").attr("data-index", $(this).attr("data-index"))
		// Store current values in inputs
		$("#edit-hours-form > .modal-body > .form-group > .form-control").each(function(i) {
			// Set value to date object if on date input
			if (i == 2) {
				let date = new Date(infoArr[i])
				let day = ("0" + date.getDate()).slice(-2);
				let month = ("0" + (date.getMonth() + 1)).slice(-2);
				let today = date.getFullYear() + "-" + (month) + "-" + (day)
				$(this).val(today)
			}
			else {
				$(this).val(infoArr[i])
			}
		})
	})
	// Edit hours
	$("#edit-hours-form").submit(function(event) {
		// Prevent page from reloading
		event.preventDefault()

		// Check form validity
		let form = $(this)
		if (form[0].checkValidity() === false) {
			event.stopPropagation()
			form.addClass("was-validated")
			return false
		}

		// Convert form inputs into array
		let info = $(this).serializeArray()
		console.log(info)
		// Create object to push to hours array
		let obj = {}
		let id
		info.forEach(function(v) {
			if (v.name !== "ID") {
				obj[`${v.name}`] = v.value
			}
			else {
				id = v.value
			}
		})
		// Push hours to array
		let student = students.get(id)
		let hours = student.hours
		let index = Number($(this).attr("data-index"))
		hours[index] = obj
		student.hours = hours
		students.set(id, student)
		// Close modal
		$("#edit-hours-modal").modal("hide")
		// Update table data
		updateRow(id)
		let row = table.row(".update")
		row.child(childTable(row.data())).draw(false)
	})
	// Delete hours
	$("#students-table").on("click", '[role="delete-hours"]', function() {
		// Set row up for deletion
		table.$("tr.deleting").removeClass("update")
		$(this).parents(":eq(6)").prev().addClass("update")

		let info = $(this).parent().siblings(".info")
		let infoArr = []
		info.each(function() {
			infoArr.push($(this).text())
		})

		// Get student row
		let student = $(this).parents(":eq(6)").prev()
		let id = student.children(".info").first().text()
		// Set data for deletion
		$('[role="delete-hours-confirm"]').attr("id", id)
		$('[role="delete-hours-confirm"]').attr("data-index", $(this).attr("data-index"))
	})
	// Confirm deletion
	$("#delete-hours-modal").on("click", '[role="delete-hours-confirm"]', function() {
		// Remove hours from array
		let student = students.get(this.id)
		let hours = student.hours
		let index = Number($(this).attr("data-index"))
		// Delete array element at index
		hours.splice(index, 1)
		student.hours = hours
		students.set(this.id, student)
		// Update table data
		updateRow(this.id)
		let row = table.row(".update")
		row.child(childTable(row.data())).draw(false)
	})
})
