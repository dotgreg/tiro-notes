var app = {
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    onDeviceReady: function() {
        this.startNodeProject();
        setTimeout(() => {
            var iframe2wrapper =  document.getElementById('iframe2');
            iframe2wrapper.innerHTML = '<iframe src="https://localhost:3023"></iframe>'
        }, 3000)
    },

    startNodeProject:function()  {
        nodejs.start('main.js', this.startupCallback);
        // To disable the stdout/stderr redirection to the Android logcat:
        // nodejs.start('main.js', startupCallback, { redirectOutputToLogcat: false });
    },
};

app.initialize();