
export const printCss = `

    .preview-title, .date,
    .editor-area, .connected, .left-wrapper, .connection-status, .mobile-view-toggler {
        display:none!important;
    }
    html, body {
        overflow: auto!important;
        height: auto!important;
        background-color: white;
    }
    .main-wrapper .right-wrapper.dual-viewer-view {
        width: 100vw!important;
    }
    .preview-area-wrapper {
				display: block!important;
				.preview-area {
								display: block!important;
				}
        .infos-preview-wrapper {
            .file-path-wrapper {
                display:none!important;
            }
            .title {
                margin-bottom: 40px!important;
                line-height: 40px;
            }
            display:block!important;
        }
        height: auto!important;
        display:block!important;
        overflow: visible!important;
        width: 100vw!important;
        margin-top: 20px!important;
        top: 0;
        font-family: arial, sans-serif!important;
        left: 0;
        margin: 0;
        padding: 15px;
        font-size: 14px;
        line-height: 18px;
    }
`
