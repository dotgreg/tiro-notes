
@client/src/components/TtsCustomPopup.component.tsx 
- explain how the text to speech custom works. 
- I have an url curl -X POST "http://192.168.1.141:8099/tts" -H "Content-Type: application/json" -d '{"text": "{{input}}", "language": "French", "return_url": true}' which output {url:"http://192.168.1..../myurl.wav"}, I configured in the parameters that cli to be exec. it works correctly. 

- the system do send requests correctly, but 
  - problem 1: it does not seems to wait for an answer, it requests the same chunk several times, how to stop that behavior, wait for a chunk of audio to be processed   
  - problem 2: the chunk seems to never been played, why?
