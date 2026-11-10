import sys,cv2,statistics
f,s,e=sys.argv[1],float(sys.argv[2]),float(sys.argv[3])
c=cv2.VideoCapture(f);cas=cv2.CascadeClassifier(cv2.data.haarcascades+'haarcascade_frontalface_default.xml')
xs=[];t=s
while t<e:
    c.set(cv2.CAP_PROP_POS_MSEC,t*1000);ok,fr=c.read()
    if not ok:break
    H,W=fr.shape[:2];fs=cas.detectMultiScale(cv2.cvtColor(fr,cv2.COLOR_BGR2GRAY),1.2,5,minSize=(W//20,W//20))
    if len(fs):x,y,w,h=max(fs,key=lambda r:r[2]*r[3]);xs.append((x+w/2)/W)
    t+=0.75
print(statistics.median(xs) if xs else 0.5)
