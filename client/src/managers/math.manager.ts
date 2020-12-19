export const getAllNumbersBetween = (x:number, y:number):number[] => {
    var numbers:number[] = [];
    for (let i = x; i < y; i++) {
        numbers.push(i)
    }
    return numbers;
  }

export const removeFromNumberArray = (array: number[], value:number):number[] => {
    const index = array.indexOf(value);
    if (index > -1) {
        array.splice(index, 1);
    }   
    return array
}