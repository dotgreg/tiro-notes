import { genUrlPreviewStr } from "../url.manager"

const h = "[genUrlPreviewStr]"

test(`${h} : normal url -> site/path`, () => {
	expect(genUrlPreviewStr("https://www.websocial.cc/backups/tiro.0.tar.xz/")).toEqual("websocial.cc/tiro0tarxz")
})

// regression: scp-like path in a note made the whole note render throw (TypeError: Invalid URL)
test(`${h} : scp-like path does not throw`, () => {
	expect(genUrlPreviewStr("https://u0_a184@ssht.websocial.cc:~/_tiro_datas_backup/")).toEqual("u0_a184@ssht.websocial.cc:~/_t")
})

test(`${h} : host:port does not throw`, () => {
	expect(genUrlPreviewStr("https://mail.protonmail.ch:25/")).toEqual("mail.protonmail")
})
