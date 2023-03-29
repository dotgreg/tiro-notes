const preId = "tiro-ls-id-"

export const setLs = (id, obj) => {
    let txt = JSON.stringify(obj)
    localStorage.setItem(preId+id, txt);
}
export const getLs = <T>(id) => {
    let res = window.localStorage.getItem(preId+id)
    if (res) res = JSON.parse(res);
    return res as T;
}
