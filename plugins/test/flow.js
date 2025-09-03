// @flow
/*::
type MyAlias = {
  foo: number,
  bar: boolean,
  baz: Array<string>,
};
*/

function method(value /*: MyAlias */) /*: boolean */ {
    return value.bar;
}
  
  method({foo: 1, bar: true, baz: "oops"}); 