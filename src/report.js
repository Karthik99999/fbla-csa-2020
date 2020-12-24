const {
	app,
	dialog,
	shell
} = electron

$(function() {
	// Generate student hours report
	$(document).on("click", "#student-reports", async function(event) {
		let length
		if (this.id.includes("week")) {
			length = 7
		}
		else {
			length = 30
		}
		let range = length * 24 * 60 * 60 * 1000
		let tableRows = $("#students-table").DataTable().rows()
		let reportContent = `STUDENT HOURS REPORT FOR PAST ${length} DAYS\n\n`
		tableRows.every(function() {
			let id = this.data()[1]
			let student = students.get(id)
			reportContent += `ID:${id} - ${student.name} - Grade ${student.grade}\n\n`
			let hours = 0
			student.hours.forEach(function(log) {
				let date = new Date(log["date-completed"].replace("-", "/")).getTime()
				if (Date.now() - date >= 0 && Date.now() - date <= range) {
					hours += Number(log["hours-completed"])
					reportContent += `	- ${log.description} - ${log["hours-completed"]} hours on ${log["date-completed"]}\n`
				}
			})
			reportContent += `\n	Total Hours: ${hours}\n\n`
		})
		let options = {
			defaultPath: app.getPath("documents") + `/student-hours-report-${Date.now()}.txt`
		}
		let {
			filePath
		} = await dialog.showSaveDialog(null, options)
		// Stop if path wasn't given/dialog was canceled
		if (!filePath) return
		fs.writeFile(filePath, reportContent, function(err) {
			if (err) throw err
		})
		shell.openItem(filePath)
	})
	// Generate award report
	$(document).on("click", "#award-reports", async function(event) {
		// Calculate how far back to go for report
		let length
		if (this.id.includes("week")) {
			length = 7
		}
		else {
			length = 30
		}
		let range = length * 24 * 60 * 60 * 1000
		// Get table data
		let studentTableRows = $("#students-table").DataTable().rows()
		let awardTableRows = $("#awards-table").DataTable().rows()
		// Generate report content
		let reportContent = `AWARD CATEGORY REPORT FOR PAST ${length} DAYS\n\n`

		awardTableRows.every(function() {
			let awardData = this.data()
			let name = awardData[1]
			let minHours = awardData[2]
			let maxHours = awardData[3]
			// Add award heading
			reportContent += `${name} - ${minHours}-${maxHours} hours\n\n`
			studentTableRows.every(function() {
				let id = this.data()[1]
				let student = students.get(id)
				let totalHours = 0
				student.hours.forEach(function(log) {
					totalHours += Number(log["hours-completed"])
				})
				if (isBetween(totalHours, minHours, maxHours)) {
					reportContent += `	ID:${id} - ${student.name} - Grade ${student.grade}\n\n`
					let rangeHours = 0
					student.hours.forEach(function(log) {
						let date = new Date(log["date-completed"].replace("-", "/")).getTime()
						if (Date.now() - date >= 0 && Date.now() - date <= range) {
							rangeHours += Number(log["hours-completed"])
						}
					})
					reportContent += `		Hours for past ${length} days: ${rangeHours} hours\n`
					reportContent += `		Total: ${totalHours} hours\n\n`
				}
			})
		})
		// Save as
		let options = {
			defaultPath: app.getPath("documents") + `/award-category-report-${Date.now()}.txt`
		}
		let {
			filePath
		} = await dialog.showSaveDialog(null, options)
		// Stop if path wasn't given/dialog was canceled
		if (!filePath) return
		fs.writeFile(filePath, reportContent, function(err) {
			if (err) throw err
		})
		// Open report with default text editor
		shell.openItem(filePath)
	})
})
