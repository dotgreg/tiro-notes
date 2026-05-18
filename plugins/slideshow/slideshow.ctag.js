const slideshowCtag = (innerTagStr, opts) => {
    if (!opts) opts = {}
    const api = window.api
    const { div, updateContent } = api.utils.createDiv()
    const classId = `slideshow-${api.utils.uuid()}`

    // Parse the innerTagStr to get image URLs
    const urls = innerTagStr.split('\n').map(url => url.trim()).filter(url => url.length > 0)

    // Load viewer.js CSS first
    const viewerCss = `
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/viewerjs/1.11.6/viewer.min.css">
    `

    // Start building HTML with placeholder content
    const html = `
        ${viewerCss}
        <div id="${classId}" class="slideshow-container">
            <ul class="slideshow-list">
                ${urls.map(url => `<li><img src="${url}" alt="Slideshow image"></li>`).join('')}
            </ul>
        </div>
        <style>
            .slideshow-container {
                width: 100%;
                overflow: hidden;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
            .slideshow-list {
                list-style-type: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: row;
                overflow-x: auto;
                overflow-y: hidden;
                width: 100%;
            }
            .slideshow-list li {
                flex: 0 0 auto;
                margin: 0;
                padding: 0;
            }
            .slideshow-list img {
                max-width: 100%;
                height: auto;
                display: block;
            }
        </style>
    `

    // Update with initial HTML
    updateContent(html)

    // Load viewer.js dependencies and initialize
    api.utils.loadScripts([
        'https://cdnjs.cloudflare.com/ajax/libs/viewerjs/1.11.6/viewer.min.js'
    ], () => {
        try {
            // Wait a bit for DOM to update and CSS to load
            setTimeout(() => {
                // Initialize viewer with inline mode and all options activated
                const container = document.getElementById(classId)
                if (container) {
                    const viewer = new Viewer(container, {
                        inline: true,
                        backdrop: true,
                        button: true,
                        navbar: true,
                        title: true,
                        toolbar: true,
                        fullscreen: true,
                        keyboard: true,
                        focus: true,
                        loading: true,
                        loop: true,
                        movable: true,
                        rotatable: true,
                        scalable: true,
                        zoomable: true,
                        zoomOnTouch: true,
                        zoomOnWheel: true,
                        slideOnTouch: true,
                        toggleOnDblclick: true,
                        tooltip: true,
                        transition: true,
                        // Additional options that might be useful
                        initialViewIndex: 0,
                        minWidth: 200,
                        minHeight: 100,
                        zIndexInline: 1000
                    })
                    
                    // Store viewer instance for potential future use
                    window.slideshowViewer = viewer
                    
                    // Resize iframe to fit content
                    setTimeout(() => {
                        api.utils.resizeIframe()
                    }, 100)
                }
            }, 200)
        } catch(e) {
            updateContent(`<pre>Error initializing slideshow: ${e.message}</pre>`)
        }
    })

    // Return placeholder div immediately (required by spec)
    return div
}

window.initCustomTag = slideshowCtag