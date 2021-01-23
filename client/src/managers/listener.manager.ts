
export interface iEventAction {
    init:Function,
    remove:Function
}
export const onEventDo = (el:any, event:string,  action:Function):iEventAction => {
    let handleEnter = (e:any) => {
        action(e)
    }
    return {
        init:  () => {el.addEventListener('textInput', handleEnter)},
        remove:  () => {el.removeEventListener('textInput',  handleEnter)},
    }
}