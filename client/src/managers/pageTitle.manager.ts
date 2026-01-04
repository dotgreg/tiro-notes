import { getApi } from "../hooks/api/api.hook";
import { evalCode } from "./evalCode.manager";

export const updatePageTitle = (title?: string, disableTitleNoteConfig?:boolean) => {
    if (!title) title = "Tiro"
    if (disableTitleNoteConfig) {
        document.title = title;
        return;
    }

    getApi(api => {
        // check if note /.tiro/pagetitle.md exists
        api.file.getContent("/.tiro/app-title.md", noteContent => {
            if (noteContent === "NO_FILE") {
                document.title = title;
            } else {
                evalCode(noteContent, {"api":api}, (result) => {
                    document.title = result;
                });
            }
        });
    });
}
