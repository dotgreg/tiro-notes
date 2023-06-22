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

    const cf3 = getDateObj("f31-03-2021_21h13m") 
    expect(cf3.getCustomFormat("full")).toStrictEqual("f31-03-2021_21h13m");

    // legacy
    const cf4 = getDateObj("f03-31-2021_21h13m") 
    expect(cf4.getCustomFormat("full")).toStrictEqual("f31-03-2021_21h13m");

    const cf5 = getDateObj("h31-03-2021_21h") 
    expect(cf5.getCustomFormat("hour")).toStrictEqual("h31-03-2021_21h");

    // legacy bugged format
    const cf6 = getDateObj("d31-03-2021_21h") 
    expect(cf6.getCustomFormat("hour")).toStrictEqual("h31-03-2021_00h");
})