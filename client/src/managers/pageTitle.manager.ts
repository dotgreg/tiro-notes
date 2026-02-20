import { getApi } from "../hooks/api/api.hook";
import { isMobile } from "./device.manager";
import { evalCode } from "./evalCode.manager";


export const updatePageTitle = (title?: string, forceTitle?:boolean) => {
    let defaultTitle = "Tiro"
    console.log("Updating page title to:", title, forceTitle);
    if (!title) title = defaultTitle;
    if (forceTitle) document.title = title;
    if (forceTitle) return
    console.log("Checking for custom title...");
    getApi(api => {
        // check if note /.tiro/pagetitle.md exists
        api.file.getContent("/.tiro/app-title.md", noteContent => {
            if (noteContent === "NO_FILE") {
                document.title = title || defaultTitle;
            } else {
                evalCode(noteContent, {"api":api, isMobile}, (result) => {
                    document.title = result || defaultTitle;
                });
            }
        });
    });
}
