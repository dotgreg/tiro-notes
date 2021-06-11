
export const printCss = `

    .preview-title, .date,
    .editor-area, .connected, .left-wrapper, .connection-status, .mobile-view-toggler {
        display:none!important;
    }
    html {
        overflow-y: scroll!important;
    }
    html, body {
        height: auto!important;
        background-color: white;
    }
    .preview-area {
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
