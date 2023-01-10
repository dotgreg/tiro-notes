let evalRes = new Function(`return ${barApi.input}`)()
let strRes = `${barApi.input} => ${evalRes}`
if (evalRes) {
  barApi.setOptions([{label:strRes, value: ""}])
} else {
  barApi.setOptions([{label:`Please enter a calculation like "3*4"`, value: ""}])
}
