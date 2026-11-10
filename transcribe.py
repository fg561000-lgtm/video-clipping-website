import sys,json
from faster_whisper import WhisperModel
wav,lang,model=sys.argv[1:4]
P={'ur-roman':('ur',"Aap kaise hain? Main theek hoon, shukriya. Yeh video bohat zabardast hai."),'hi-roman':('hi',"Aap kaise hain? Main theek hoon, dhanyavaad. Yeh video bahut accha hai.")}
l,p=P.get(lang,(lang,None))
m=WhisperModel(model,device='auto',compute_type='int8')
segs,_=m.transcribe(wav,language=l,word_timestamps=True,initial_prompt=p,vad_filter=True)
print(json.dumps([{'w':w.word.strip(),'s':round(w.start,2),'e':round(w.end,2)} for s in segs for w in (s.words or [])]))
