import { getDateObj } from "../../../../shared/helpers/date.helper";

test('getDateObj: empty datestring',  () => {
    const cf1 = getDateObj()
    expect(cf1.getCustomFormat("week").length).toStrictEqual(10);
})

test('getDateObj: generating and reading custom formats',  () => {
    const cf1 = getDateObj("w4-03-2023")
    expect(cf1.getCustomFormat("week")).toStrictEqual("w4-03-2023");
    
    const cf2 = getDateObj("d27-03-2022")
    expect(cf2.getCustomFormat("day")).toStrictEqual("d27-03-2022");

    const cf3 = getDateObj("f03-31-2021_21h13m")
    expect(cf3.getCustomFormat("full")).toStrictEqual("f03-31-2021_21h13m");
})