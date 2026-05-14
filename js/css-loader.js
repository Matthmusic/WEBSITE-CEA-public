document.querySelectorAll('link[rel="preload"][as="style"]').forEach(function(l){
    var s=document.createElement('link');
    s.rel='stylesheet';
    s.href=l.href;
    if(l.crossOrigin)s.crossOrigin=l.crossOrigin;
    if(l.integrity)s.integrity=l.integrity;
    document.head.appendChild(s);
});
