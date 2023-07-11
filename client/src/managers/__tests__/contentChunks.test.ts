
// import { tu } from '../../__tests__/testsUtils'
// import { noteApiFuncs } from '../renderNote.manager';


// test('contentChunk : first el should be a tag', () => {
// 	const chunks = noteApiFuncs.chunks.chunk(t2)
// 	expect(chunks[0].type).toEqual("tag");
// });

// test('contentChunk : first el should be a text', () => {
// 	const chunks = noteApiFuncs.chunks.chunk("starting text" + t2)
// 	expect(chunks[0].type).toEqual("text");
// });



// test('contentChunk : several unclosed tags => list nb', () => {
// 	const chunks = noteApiFuncs.chunks.chunk(textSeveralOneTag)
// 	expect(chunks.length).toEqual(3);
// });


// test('contentChunk : one unclosed tags => output length', () => {
// 	const chunks = noteApiFuncs.chunks.chunk(textOneTag)
// 	expect(chunks[0].content.length).toEqual(textOneTag.length);
// });




// test('contentChunk : no tags', () => {
// 	const chunks = noteApiFuncs.chunks.chunk(textNoTags)
// 	expect(chunks.length).toEqual(1);
// });

// test('contentChunk : no tags => content size check', () => {
// 	const chunks = noteApiFuncs.chunks.chunk(textNoTags)
// 	expect(chunks[0].content.length).toEqual(textNoTags.length);
// });





// test('contentChunk : length result', () => {
// 	const chunks = noteApiFuncs.chunks.chunk(t1)
// 	expect(chunks.length).toEqual(13);
// });

// test('contentChunk : last object', () => {
// 	const chunks = noteApiFuncs.chunks.chunk(t1)
// 	expect(tu.equalObj(
// 		chunks[chunks.length - 1],
// 		{ type: 'text', content: '\n\n\nOUT8\nOUT9\n', start: 16, end: 17 }
// 	)).toEqual(true);
// });


// const t2 = `[[ctag3]] 
// qoooooooooooweeeeeeee
// [[script]]
// woop
// [[script]]
// fdafdsfadsfdsadddddddd
// [[ctag3]]


// [[ctag2]] 
// qooooooooooow
// [[ctag2]]
// 11 fdlskjfldaskjfdsalkj 

// [[ctag2]] 
// 2222222222flsdkjfdslakjfldkjalksfd
// [[ctag2]] 
// flsdkjflsdkzjsldkfajlkaj

// [[ctag]] 111111111fdsafdsafdasfdsafdashhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh[[script]] [[script]] hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh

// [[ctag]]ffffffffffffffdsfdsfdssfddfsfds

// 22222222222dddddddddddddddddddddddddssssjjjjjkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm
// d
// [[hellow]] 
// resdfffffffffffffffffffffffffff

// [[hellow]]
// rlkajlfaksaj

// fdsaljkfdaslkjfdlksaj

// [[world]] 
// resdfffffffffffffffffffffffffff

// [[world]]


// resdfffffffffffffffffffffffffff
// resdfffffffffffffffffffffffffff
// resdfffffffffffffffffffffffffff
// `




// const textNoTags = `
// Hello world1
// Hello world1
// Hello world1
// Hello world1
// Hello world1
// Hello world1
// Hello world1
// Hello world1

// Hello world12
// Hello world12
// Hello world12
// Hello world12
// Hello world12
// Hello world12
// Hello world12
// Hello world12
// Hello world12
// Hello world12
// Hello world12
// Hello world12

// Hello world123
// Hello world12
// Hello world12
// Hello world12
// Hello world12
// `





// const textSeveralOneTag = `
//  no several closed no several closed1
// no several closed no several closed1
// no several closed no several closed1
// no several closed no several closed1
// no several closed no several closed1
// no several closed no several closed1
// no several closed no several closed1
// no several closed no several closed1
// no several closed no several closed1
// no several closed no several closed1
// no several closed no several closed1
// no several closed no several closed1
// no several closed no several closed1
// [[imnoseveralclosed]]

// no several closed no several closed12
// no several closed no several closed12
// no several closed no several closed12
// no several closed no several closed12
// no several closed no several closed12
// no several closed no several closed12
// no several closed no several closed12
// no several closed no several closed12
// no several closed no several closed12
// no several closed no several closed12
// [[imclosed2]]
// IN1
// [[imclosed2]]
// no several closed no several closed123
// no several closed no several closed123
// no several closed no several closed123
// no several closed no several closed123
// no several closed no several closed123
// no several closed no several closed123
// no several closed no several closed123
// no several closed no several closed123
// no several closed no several closed123
// no several closed no several closed123
// no several closed no several closed123
// [[imno severalclosed2]]
// no several closed no several closed1234
// no several closed no several closed1234
// no several closed no several closed1234
// no several closed no several closed1234
// no several closed no several closed1234
// no several closed no several closed1234
// no several closed no several closed1234
// no several closed no several closed1234
// no several closed no several closed1234
// `

// const textOneTag = `
// not closed not closed1
// not closed not closed1
// not closed not closed1
// not closed not closed1
// not closed not closed1
// not closed not closed1
// not closed not closed1
// not closed not closed1
// not closed not closed1
// not closed not closed1
// not closed not closed1
// not closed not closed1
// not closed not closed1
// [[imnotclosed]]

// not closed not closed12
// not closed not closed12
// not closed not closed12
// not closed not closed12
// not closed not closed12
// not closed not closed12
// not closed not closed12
// not closed not closed12
// not closed not closed12
// not closed not closed12
// not closed not closed12
// not closed not closed12
// not closed not closed12
// not closed not closed12
// not closed not closed12
// `



// const t1 = `
// [[ctag3]] 
// IN1
// [[script]]
// IN2
// [[script]]
// IN3
// [[ctag3]]

// OUT1

// [[ctag2]] 
// IN4
// [[ctag2]]
// OUT2

// [[ctag2]] 
// IN5
// [[ctag2]] 
// OUT3

// [[ctag]] IN6 [[script]] [[script]] IN7

// [[ctag]]OUT4 

// OUT5
// [[hellow]] 
// IN8

// [[hellow]]
// OUT6
// OUT7

// [[world]] 
// IN9

// [[world]]


// OUT8
// OUT9
// `





// export const testsContentNoteContents = {
// 	t1,
// 	t2,
// 	textNoTags,
// 	textOneTag,
// 	textSeveralOneTag,
// }

test('nothing', () => { expect(1).toEqual(1); });
export { }
