
const calendarApp = (innerTagStr, opts) => {
	if (!opts) opts = {}
	const h = `[CTAG CALENDAR APP] v1.0 `
	const api = window.api;
	const infos = api.utils.getInfos();
	const html_calendar_month = "hello world calendar month"


	const initCalendar = () => {
		var events = [
			{ 'Date': new Date(2022, 6, 7), 'Title': 'Doctor appointment at 3:25pm.' },
			{ 'Date': new Date(2022, 6, 18), 'Title': 'New Garfield movie comes out!', 'Link': 'https://garfield.com' },
			{ 'Date': new Date(2022, 6, 18), 'Title': 'woop1', 'Link': 'https://garfield.com' },
			{ 'Date': new Date(2022, 6, 19), 'Title': 'woop1', 'Link': 'https://garfield.com' },
			{ 'Date': new Date(2022, 6, 20), 'Title': 'woop1', 'Link': 'https://garfield.com' },
			{ 'Date': new Date(2022, 6, 27), 'Title': '25 year anniversary', 'Link': 'https://www.google.com.au/#q=anniversary+gifts' },
		];
		var settings = {};
		var element = document.getElementById('caleandar');
		window.caleandar(element, events, settings);
		setTimeout(() => {
			api.utils.resizeIframe("500px");
		}, 500)
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
				padding-top: 20px;
		}

		#caleandar .cld-main {
				width:100%;
		}
		

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
