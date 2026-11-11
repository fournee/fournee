import colorsys
def hsl(h,s,l):
    r,g,b=colorsys.hls_to_rgb(h/360,l/100,s/100); return '#%02X%02X%02X'%tuple(round(x*255) for x in (r,g,b))
def lum(h):
    h=h.lstrip('#'); c=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    c=[x/12.92 if x<=0.04045 else ((x+0.055)/1.055)**2.4 for x in c]
    return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2]
def cr(a,b):
    la,lb=sorted([lum(a),lum(b)],reverse=True); return (la+0.05)/(lb+0.05)
toks={'nasa-red':(3,91,59),'nasa-blue':(217,78,50),'red-shade':(3,87,39),'red-tint':(2,93,65),'blue-shade':(218,86,31),'blue-tint':(212,100,58),'intl-orange':(23,83,53),'active-green':(145,67,57),
'carbon-90':(240,8,10),'carbon-80':(240,4,19),'carbon-70':(240,2,27),'carbon-60':(240,2,35),'carbon-50':(240,1,47),'carbon-40':(240,2,59),'carbon-30':(240,1,73),'carbon-20':(0,0,82),'carbon-10':(0,0,89),'carbon-5':(0,0,96),
'green-600':(145,65,46),'green-700':(145,63,37),'orange-500':(23,83,53),'orange-700':(23,78,36),'red-600':(3,89,48),'blue-600':(217,76,42),'chartreuse-500':(127,100,61)}
for k,v in toks.items(): print(k,hsl(*v))
pairs=[('NASA text/bg','#17171B','#FFFFFF'),('NASA text/surface','#17171B','#F6F6F6'),('NASA muted/bg','#444447','#FFFFFF'),('NASA muted/surface','#444447','#F6F6F6'),('NASA tertiary/bg','#77777A','#FFFFFF'),('NASA accent/bg','#1C67E3','#FFFFFF'),('NASA accent/surface','#1C67E3','#F6F6F6'),('NASA btn-text/btn','#FFFFFF','#1C67E3'),('NASA border/bg','#D1D1D1','#FFFFFF'),('NASA fill/track','#1C67E3','#D1D1D1'),('NASA ok green-600/bg',hsl(145,65,46),'#FFFFFF'),('NASA ok green-700/bg',hsl(145,63,37),'#FFFFFF'),('NASA warn orange-500/bg',hsl(23,83,53),'#FFFFFF'),('NASA warn orange-700/bg',hsl(23,78,36),'#FFFFFF'),('NASA bad red-600/bg',hsl(3,89,48),'#FFFFFF'),('NASA red #F64137/bg','#F64137','#FFFFFF'),('NASA red-shade/bg','#B60109','#FFFFFF'),('NASA focus #2491FF/bg','#2491FF','#FFFFFF'),('NASA s-carbon50/bg','#77777A','#FFFFFF'),
('CERN text #151515/bg','#151515','#FFFFFF'),('CERN text/surface','#151515','#F6F6F7'),('CERN muted #3D3D41/bg','#3D3D41','#FFFFFF'),('CERN muted #666666/bg','#666666','#FFFFFF'),('CERN muted #666666/surface','#666666','#F6F6F7'),('CERN accent/bg','#0033A0','#FFFFFF'),('CERN accent/surface','#0033A0','#F6F6F7'),('CERN btn','#FFFFFF','#0033A0'),('CERN border B0B0B3/bg','#B0B0B3','#FFFFFF'),('CERN border CCCCCC','#CCCCCC','#FFFFFF'),('CERN border 999999','#999999','#FFFFFF'),('CERN fill/track CDD6ED','#0033A0','#CDD6ED'),('CERN ok 1A8C48/bg','#1A8C48','#FFFFFF'),('CERN warn FFCD0C/bg','#FFCD0C','#FFFFFF'),('CERN warn text 151515 on FFCD0C','#151515','#FFCD0C'),('CERN bad E6001D/bg','#E6001D','#FFFFFF'),('CERN orange FD6109/bg','#FD6109','#FFFFFF'),('CERN purple 6E2466/bg','#6E2466','#FFFFFF'),('CERN 4486E6/bg','#4486E6','#FFFFFF'),('CERN 385CB4/bg','#385CB4','#FFFFFF'),('CERN mint 224D53','#224D53','#FFFFFF'),('CERN focus 996C00/bg','#996C00','#FFFFFF'),('NASA intl orange as series','#E8722D','#FFFFFF')]
for n,a,b in pairs: print(f'{n}: {a} on {b} = {cr(a,b):.2f}')
