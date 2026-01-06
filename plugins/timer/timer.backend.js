// that file is passed into new Function(code, backendApi) 
// and should return a list of backend functions that will be added to backendApi.pluginsFunctions
// like backendApi.pluginsFunctions.timer_get_daily_stats


// console.log("hello world from backend timer.backend.js, it should return a cb with an array of fns inside it")
const libFns = `
const getDateStr = (date) => {
    let currDate = new Date()
    if (date) currDate = date
    let currDateStr = \`\${currDate.getDate()}-\${currDate.getMonth()+1}-\${currDate.getFullYear()}\`
    return currDateStr
}
const getDateFromStr = (dateStr) => {    
    let dateParts = dateStr.split("-")
    let currDate = new Date()
    currDate.setDate(parseInt(dateParts[0]))
    currDate.setMonth(parseInt(dateParts[1])-1)
    currDate.setFullYear(parseInt(dateParts[2]))
    // set hours/min/s to 0
    currDate.setHours(0, 0, 0, 0)
    return currDate
}
function getMonday(d/*:Date*/) {
    d = new Date(d);
    var day = d.getDay(),
        diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
    // set hours and minutes to 0
    d.setHours(0,0,0,0)
    return new Date(d.setDate(diff));
}
const getWorkedDays = (startDate, endDate) => {
    let currDate = new Date(startDate);
    let workedDays = 0;
    while (currDate <= endDate) {
        // do not work on weekends
        if (currDate.getDay() !== 0 && currDate.getDay() !== 6) {
            workedDays++;
        }
        currDate.setDate(currDate.getDate() + 1);
    }
    return workedDays;
};
const getReferenceHoursWorked = (start, end) => {
    let days = getWorkedDays(start,end)
    return days * 8;
}
const getStartCurrentWeek = () => {
    // if dateObj is < start of the current week (starts from monday)
    const monday = getMonday(new Date())
    return monday
}
const getStartMonth = (monthBefore) => {
    if (!monthBefore) monthBefore = 0;
    let currDate = new Date();
    currDate.setDate(1);
    currDate.setHours(0, 0, 0, 0);
    currDate.setMonth(currDate.getMonth() - monthBefore);
    return currDate;
}
const getPercentageBar = (percentage, size) => {

    if (percentage > 100) percentage = 100
    if (percentage < 0) percentage = 0
    size = size || 6;
    let barFull =  "▓";
    let barEmpty = "░";
    let filled = Math.round((percentage / 100) * size);

    let empty = size - filled;
    return \`\${barFull.repeat(filled)}\${barEmpty.repeat(empty)}\`;
}

`


cb([
    {
        name: "timer_get_daily_stats",
        code: `
            let backendApi = getBackendApi();
            let backendFns = await getBackendApi().plugins.getBackendFunctions()
            let helloworld = backendApi.test.fntest()
            cb(
                {
                    message: \`22 hello world from timer backend function (day)\, 
                        I managed to find these parameters \${JSON.stringify(params)}\ 
                        and here is some backendApi anwsers\`, 
                    allfns:{backendFns}, 
                    apib: {backendApi} ,
                    helloworld: {helloworld}
                }
            )
        `
    },
    {
        name: "timer_get_weekly_stats",
        code: `

            cb({message: \`hello world from timer backend function (week)\, I managed to find these parameters \${JSON.stringify(params)}\ and here is backendApi \${JSON.stringify(getBackendApi())}\`})
        `
    },
    {
        name: "timer_get_stats",
        code: `


        //
        // TUTO
        //
        let explanation = \`This function retrieves the statistics for a specific time period (day, week, month, etc.) based on the provided parameters. 
        ?function=timer_get_stats&stattype=month|day|week|all|raw & startmonth=MONTH_TO_START_FROM (NUMBER) & month = MONTH_TO_GET (NUMBER)
    \`;

        //
        // LOADING LIB FUNCTIONS
        //
        ${libFns}

        //
        // CONFIG
        //
        let notePath = "/.tiro/cache/cache-api/cache-api-storage-timer_plugin_history.md"
        let statType = params.params.stattype || "day"
        let startingMonth = params.params.startmonth || 0;
        let currentMonth = params.params.month || 0;



        //////////////////////
        //
        //
        const router = (rawJson) => {
            let today = getDateStr();
            let weekStart = getDateStr(getStartCurrentWeek());
            let monthStart = getDateStr(getStartMonth());
            let monthEnd = today

            if (currentMonth !== 0) {
                monthStart = getDateStr(getStartMonth(currentMonth));
                monthEnd = getDateStr(getStartMonth(currentMonth-1));
            }
            else if (startingMonth !== 0) {
                monthStart = getDateStr(getStartMonth(startingMonth));
                monthEnd = today;
            }

            let firstDate = "1-1-1980";
            switch (statType) {
                case "day":
                    return getPeriodStats(rawJson, today, today);
                case "week":
                    return getPeriodStats(rawJson, weekStart, today);
                case "month":
                    return getPeriodStats(rawJson, monthStart, monthEnd);
                case "all":
                    return getPeriodStats(rawJson, firstDate, today);
                default:
                    return getPeriodStats(rawJson, today, today);
            }
        }

        // day >> return {hours: 6, tasks:{task1:2, task2:3 ...}}
        const getPeriodStats = (rawJson, start, end) => {
            let referenceHours = 0;
            let startDate = getDateFromStr(start);
            let endDate = getDateFromStr(end);
            console.log(startDate, endDate)
            referenceHours = getReferenceHoursWorked(startDate, endDate);
            let referenceWorkedDays = getWorkedDays(startDate, endDate);

            let totalMinutes = 0;
            let tasks = {};
            let firstDate = "";
            rawJson.forEach(entry => {
                let nameTask = entry.name;
                for (let [date, minutes] of Object.entries(entry.times)) {
                    let dateObj = getDateFromStr(date);
                    if (dateObj < startDate || dateObj > endDate) continue;
                    if (firstDate === "") firstDate = dateObj;
                    totalMinutes += minutes;
                    tasks[nameTask] = (tasks[nameTask] || 0) + Math.round((minutes/60));
                }
            });
            // sort tasks by total time spent
            tasks = Object.fromEntries(
                Object.entries(tasks).sort(([, a], [, b]) => b - a)
            );

            let hours = Math.round(totalMinutes / 60);
            let percentage = Math.round((totalMinutes / (referenceHours * 60)) * 100);
            let shortString = \`\${hours}h/\${referenceHours}h [\${percentage}%]\`;
            let percentageBar = getPercentageBar(percentage);
            let longString = \`\${hours}h/\${referenceHours}h [\${percentage}% \${percentageBar}\]\`;
            let shortString2 = \`\${hours}h/\${referenceHours}h \${percentageBar}\`;

            return { minutes: totalMinutes, hours, 
                shortString, percentage, 
                percentageBar, longString, shortString2,
                referenceHours, referenceWorkedDays, 
                tasks, startDate, endDate, firstDate, start, end, statType };

        }


        getBackendApi().file.openFile(notePath).then(contentExtract => {
            try {
                let contentJson = JSON.parse(contentExtract)
                if (contentJson["content"]) {
                    let statsRes = router(contentJson["content"])
                    cb({message: "success", stats: statsRes,  explanation: explanation})
                } else{
                    cb({message: "error", details:"JSON is malformed or bug in the code (1)", rawJson: contentJson,  explanation: explanation})
                }
            } catch (error) {
                cb({message: "error", details:"JSON is malformed or bug in the code (2)",  error:error.message, explanation: explanation})
            }
        })
        `
    }

])