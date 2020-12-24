function isBetween(number, min, max) {
	if (number >= min && number < max) {
		return true
	}
	else {
		return false
	}
}

// Wait until page is ready
$(function() {
	// Loop through store after converting it to an array of objects
	for (let [award, data] of Object.entries(awards.store)) {
		let row = ""
		row += '<td class="details-control"><i class="fa fa-caret-right"></i></td>'
		row += `<td class="info" id="award">${award}</td>`
		for (let x in data) {
			row += `<td class="info" id=${x}>${data[x]}</td>`
		}
		// Edit and Delete button
		row += `<td><button type="button" class="btn btn-primary" role="edit-award" id="${award}" data-toggle="modal" data-target="#award-edit-modal"><i class="fa fa-pencil-alt"></i> Edit</button> `
		row += `<button type="button" class="btn btn-danger" role="delete-award" id="${award}" data-toggle="modal" data-target="#award-delete-modal"><i class="fa fa-trash"></i> Delete</button></td>`
		$("#awards-table > tbody").append(`<tr>${row}</tr>`)
	}
	var table = $("#awards-table").DataTable({
		// Disable ordering by details and manage columns
		"columnDefs": [{
			targets: [0, 4],
			orderable: false,
			className: "not-selectable"
		}],
		// Sort by name column by default
		"order": [
			[2, "asc"]
		],
		select: {
			style: "multi+shift",
			selector: "td:not(.not-selectable)"
		}
	})

	function addAward(info) {
		let obj = {}
		let award
		info.forEach(function(v) {
			if (v.name !== "award") {
				obj[`${v.name}`] = v.value
			}
			else {
				award = v.value
			}
		})
		awards.set(award, obj)
		// Add award to object to return
		obj["name"] = award
		return obj
	}

	function updateRow(name) {
		let award = awards.get(name)
		let rowData = table.row(".update").data()
		rowData[1] = name
		rowData[2] = award.min
		rowData[3] = award.max
		table.row(".update").data(rowData).draw(false)
	}
	// Add award
	$("#add-award-form").submit(function(event) {
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
		// Show error if award is already in store
		if (awards.get(info[0].value)) return
		let award = addAward(info)
		//
		let buttons = `<button type="button" class="btn btn-primary" role="edit-award" id="${award.name}" data-toggle="modal" data-target="#award-edit-modal"><i class="fa fa-pencil-alt"></i> Edit</button> ` +
			`<button type="button" class="btn btn-danger" role="delete-award" id="${award.name}" data-toggle="modal" data-target="#award-delete-modal"><i class="fa fa-trash"></i> Delete</button>`
		// Add row to table
		let row = table.row.add([
				'<i class="fa fa-caret-right"></i>',
				award.name,
				award.min,
				award.max,
				buttons
			])
			.draw(false) // Don't go back to the first page
			.node() // Get node of row for jQuery
		// Add classes
		$(row).find("td").first().addClass("details-control")
		$(row).find("td").slice(1, -1).addClass("info")
		// Delete text box values
		$("#add-award-modal").modal("hide")
		$(this).trigger("reset")
	})
	// Change id for delete modal
	// and append name to header
	$("#awards-table").on("click", '[role="delete-award"]', function() {
		// Set row up for deletion
		table.$("tr.deleting").removeClass("deleting")
		$(this).parent().parent().addClass("deleting")

		let info = $(this).parent().siblings(".info")
		let infoArr = []
		info.each(function() {
			infoArr.push($(this).text())
		})

		let name = infoArr[0]
		$("#award-edit-title").text(`Are you sure you want to delete the ${name} award?`)
		$('[role="delete-award-confirm"]').attr("id", this.id)
	})
	// Confirm deletion
	$("#award-delete-modal").on("click", '[role="delete-award-confirm"]', function() {
		awards.delete(this.id)
		table.row(".deleting").remove().draw(false)
	})
	// Enter values of award into inputs
	$("#awards-table").on("click", '[role="edit-award"]', function() {
		// Set row up for editing
		table.$("tr.update").removeClass("update")
		$(this).parent().parent().addClass("update")

		let info = $(this).parent().siblings(".info")
		let infoArr = []
		info.each(function() {
			infoArr.push($(this).text())
		})
		// Store current values in inputs
		$("#award-edit-form > .modal-body > .form-group > input").each(function(i) {
			$(this).attr("data-old", infoArr[i])
			$(this).val(infoArr[i])
		})
	})
	// Save changes in edit modal
	$("#award-edit-form").submit(function(event) {
		// Prevent page from reloading
		event.preventDefault()

		// Check form validity
		let form = $(this)
		if (form[0].checkValidity() === false) {
			event.stopPropagation()
			form.addClass("was-validated")
			return false
		}

		let inputs = $("#award-edit-form > .modal-body > .form-group > input")
		// Get old award hours to transfer to new award
		let oldAward = awards.get(inputs.first().attr("data-old").toString())
		// Delete old award in case of name change
		awards.delete(inputs.first().attr("data-old").toString())
		// Convert form inputs into array
		let info = form.serializeArray()
		let award = addAward(info)
		// Close modal
		form.removeClass('was-validated')
		$("#award-edit-modal").modal("hide")
		updateRow(award.name)
	})
	// Generate child rows
	function childTable(data) {
		let awardName = data[1]
		let minHours = data[2]
		let maxHours = data[3]
		let table = `<h4>Students</h4>
<div class="child-table">
<table style="width:100%;">
<thead>
  <tr>
    <th>ID</th>
    <th>Name</th>
    <th>Grade</th>
    <th>Hours</th>
  </tr>
</thead>
<tbody>`
		for (let [id, student] of Object.entries(students.store)) {
			let hours = 0
			for (let x in student) {
				if (x === "hours") {
					student[x].forEach(function(log) {
						hours += Number(log["hours-completed"])
					})
				}
			}
			// Check if student is in award
			if (isBetween(hours, minHours, maxHours)) {
				table += "<tr>" +
					`<td>${id}</td>` +
					`<td>${student.name}</td>` +
					`<td>${student.grade}</td>` +
					`<td>${hours}</td>` +
					"<tr>"
			}
		}
		return table
	}
	// Manage child rows
	$('#awards-table > tbody').on('click', 'td.details-control', function() {
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
})
