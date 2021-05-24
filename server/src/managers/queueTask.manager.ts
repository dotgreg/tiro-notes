

export const processTasksByChunk = (task: (...args: any[]) => void) => {
    setImmediate(task)
}