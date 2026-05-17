const slideshowApp = (innerTagStr, opts) => {
    if (!opts) opts = {}
    const api = window.api;
    const h = "[CTAG SLIDESHOW]";

    const loadViewerJS = () => {
        return new Promise((resolve) => {
            if (window.Viewer) {
                resolve();
                return;
            }

            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "https://unpkg.com/viewerjs@latest/dist/viewer.min.css";
            document.head.appendChild(link);

            const script = document.createElement("script");
            script.src = "https://unpkg.com/viewerjs@latest/dist/viewer.min.js";
            script.onload = () => resolve();
            document.head.appendChild(script);
        });
    };

    const parseImagePaths = (str) => {
        return str
            .split("\n")
            .map(s => s.trim())
            .filter(s => s !== "" && s.length > 0);
    };

    const App = () => {
        const React = window.React;
        const createElement = window.React.createElement;
        const [viewerInstance, setViewerInstance] = React.useState(null);
        const containerRef = React.useRef(null);
        const viewerContainerRef = React.useRef(null);

        const imagePaths = React.useMemo(() => {
            return parseImagePaths(innerTagStr);
        }, []);

        React.useEffect(() => {
            loadViewerJS().then(() => {
                if (viewerContainerRef.current && imagePaths.length > 0) {
                    const viewer = new window.Viewer(viewerContainerRef.current, {
                        hidden: true,
                        viewed: function() {
                            viewer.zoomTo(1);
                        },
                    });
                    setViewerInstance(viewer);
                }
            });

            return () => {
                if (viewerInstance) {
                    viewerInstance.destroy();
                }
            };
        }, []);

        const openSlideshow = () => {
            if (viewerInstance) {
                viewerInstance.show();
            }
        };

        if (imagePaths.length === 0) {
            return createElement("div", {
                style: { padding: "20px", color: "#888", textAlign: "center" }
            }, "No images configured. Add image paths inside the slideshow tag.");
        }

        const thumbnailStyle = {
            display: "inline-block",
            margin: "5px",
            padding: "5px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            cursor: "pointer",
            maxWidth: "150px",
            maxHeight: "150px",
            overflow: "hidden",
        };

        const imageStyle = {
            maxWidth: "140px",
            maxHeight: "140px",
            objectFit: "contain",
        };

        return createElement("div", { style: { padding: "10px" } },
            createElement("div", {
                style: {
                    marginBottom: "10px",
                    fontSize: "14px",
                    color: "#666"
                }
            }, `${imagePaths.length} image(s) - Click to view slideshow`),
            createElement("div", { style: { marginBottom: "15px" } },
                imagePaths.map((path, index) =>
                    createElement("div", {
                        key: index,
                        style: thumbnailStyle,
                        onClick: openSlideshow,
                        title: path
                    },
                        createElement("img", {
                            src: path,
                            style: imageStyle,
                            onError: (e) => {
                                e.target.style.display = "none";
                            }
                        })
                    )
                )
            ),
            createElement("div", {
                ref: viewerContainerRef,
                style: { display: "none" }
            },
                imagePaths.map((path, index) =>
                    createElement("img", {
                        key: index,
                        src: path,
                        alt: `Image ${index + 1}`
                    })
                )
            )
        );
    };

    const renderApp = () => {
        if (!window.React) {
            console.error(h, "React not available");
            return;
        }

        const container = document.createElement("div");
        document.body.appendChild(container);

        window.ReactDOM.render(window.React.createElement(App), container);
    };

    setTimeout(renderApp, 100);

    return "";
};

if (typeof window !== "undefined") {
    window._tiroPluginsCommon = window._tiroPluginsCommon || {};
    window._tiroPluginsCommon.slideshowApp = slideshowApp;
}