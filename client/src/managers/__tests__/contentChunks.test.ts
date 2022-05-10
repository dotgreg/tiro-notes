import { getContentChunks } from "../renderNote.manager";

test('contentChunk : does it chunk well', () => {
	const chunks = getContentChunks(t1)
	expect(chunks).toEqual([]);
});









const t1 = `
[[ctag3]] 
qooooooooooow
[[script]]
woop
[[script]]
fdafdsfadsfdsa
[[ctag3]]

fdsafdasdfsaf

[[ctag2]] 
qooooooooooow
[[ctag2]]
11 fdlskjfldaskjfdsalkj 

[[ctag2]] 
2222222222flsdkjfdslakjfldkjalksfd
[[ctag2]] 
flsdkjflsdkzjsldkfajlkaj

[[ctag]] 111111111fdsafdsafdasfdsafdashhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh[[script]] [[script]] hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh

[[ctag]]ffffffffffffffdsfdsfdssfddfsfds

22222222222dddddddddddddddddddddddddssssjjjjjkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm
d
[[hellow]] 
resdfffffffffffffffffffffffffff

[[hellow]]
rlkajlfaksaj

fdsaljkfdaslkjfdlksaj

[[world]] 
resdfffffffffffffffffffffffffff

[[world]]


resdfffffffffffffffffffffffffff
resdfffffffffffffffffffffffffff
resdfffffffffffffffffffffffffff
`




