const preId = "tiro-ls-id-"

export const setLs = (id, obj) => {
    let txt = JSON.stringify(obj)
    localStorage.setItem(preId+id, txt);
}
export const getLs = <T>(id):T|null => {
    let raw = window.localStorage.getItem(preId+id)
    let res
    if (raw) res = JSON.parse(raw)
    if (res) return  res as T;
    else return null
}
