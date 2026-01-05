import { getApi } from "../hooks/api/api.hook";
import { evalCode } from "./evalCode.manager";

export const updatePageTitle = (title?: string, disableTitleNoteConfig?:boolean) => {
    let defaultTitle = "Tiro"
    if (!title) title = defaultTitle;
    if (disableTitleNoteConfig) {
        document.title = title;
        return;
    }

    getApi(api => {
        // check if note /.tiro/pagetitle.md exists
        api.file.getContent("/.tiro/app-title.md", noteContent => {
            if (noteContent === "NO_FILE") {
                document.title = title || defaultTitle;
            } else {
                evalCode(noteContent, {"api":api}, (result) => {
                    document.title = result || defaultTitle;
                });
            }
        });
    });
}
