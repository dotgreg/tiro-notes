
const calendarApp = (innerTagStr, opts) => {
		if (!opts) opts = {}
		const h = `[CTAG CALENDAR APP] v1.0.1`
		const api = window.api;
		const infos = api.utils.getInfos();
		const html_calendar_month = "hello world calendar month"
		let source_events = opts.source ? opts.source : ''
																												console.log(h, `init with source ${source_events}`);

		const initCalendar = () => {
				api.call("file.getContent", [source_events], noteContent => {
				let lines = noteContent.split("\n")
				let events = []

				function urlify(text) {
						var urlRegex = /(https?:\/\/[^\s]+)/g;
						return text.replace(urlRegex, function (url) {
				return '<a href="' + url + '" target="_blank">' + url + '</a>';
		})
				}

				// for each line, create a new event
																 for (var i = 0; i < lines.length; i++) {
						const l = lines[i]
						const p = l.split("|")
						let title = p[0] ? p[0] : ""
																					let start = p[1] ? new Date(p[1]) : false
																																									let body = p[2] ? p[2] : ""

																																																							 if (title && start) {
								let titleAndBody = `
								<div class='event-wrapper'>
								<div class='title'>${title}</div>
								<div class='body'>${body}</div>
								</div>`

								events.push({
				'Date': start,
				'Title': titleAndBody,
				'Link': function (e) {
						e.preventDefault();
						api.call("popup.show", [urlify(body), "Event Details"])
				}
		})

						}
				}


				console.log(h, "events : ", events);

				var settings = {};
				var element = document.getElementById('caleandar');
				window.caleandar(element, events, settings);
				setTimeout(() => {
		api.utils.resizeIframe("500px");
}, 500)
		})
		}

		api.utils.loadRessources(
				[
						'https://raw.githubusercontent.com/jackducasse/caleandar/master/js/caleandar.js',
						'https://raw.githubusercontent.com/jackducasse/caleandar/master/css/theme3.css'
				], () => {
						initCalendar()
				}
		)

		const styleHtml = `<style>
		#caleandar {
				padding-top: 0px;
		}

		#caleandar .cld-main {
				width:100%;
		}
		#caleandar li:before {
									content: none;
}


/* #caleandar .event-wrapper { */
/* 		position: relative */
/* } */
/* #caleandar .event-wrapper:hover { */
/* } */
/* #caleandar .event-wrapper:hover .body { */
/* 		display: absolute; */
/* 		top: 0px; */
/* } */
/* #caleandar .event-wrapper { */
/* } */

#caleandar .cld-main .cld-title {
		font-size: 8px;
		height: 10px;
		overflow: hidden;
		line-height: 9px;
}
</style>`
return `${styleHtml}<div id="caleandar" class="no-css"></div>`
}

 // console.log(11111111111112);
 window.initCustomTag = calendarApp
