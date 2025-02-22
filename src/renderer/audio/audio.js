var CiderAudio = {
    context : null,
    source : null,
    audioNodes : {
        gainNode : null,
        spatialNode : null,
        spatialInput: null,
    },
    init: function (cb = function () { }) {
        //AudioOutputs.fInit = true;
        searchInt = setInterval(function () {
          if (document.getElementById("apple-music-player")) {
            //AudioOutputs.eqReady = true;
            document.getElementById("apple-music-player").crossOrigin = "anonymous";
            CiderAudio.connectContext(document.getElementById("apple-music-player"), 0);
    
            cb();
            clearInterval(searchInt);
          }
        }, 1000);
    },
    off: function(){
        try{
        CiderAudio.audioNodes.gainNode.disconnect();
        CiderAudio.audioNodes.spatialNode.disconnect();
        CiderAudio.source.connect(CiderAudio.context.destination);} catch(e){}
    },
    connectContext: function (mediaElem){

        if (!CiderAudio.context){
        CiderAudio.context = new (window.AudioContext || window.webkitAudioContext);
        }
        if (!CiderAudio.source){
        CiderAudio.source = CiderAudio.context.createMediaElementSource(mediaElem);
        } else {try{CiderAudio.source.disconnect(CiderAudio.context.destination)}catch(e){}}
        CiderAudio.audioNodes.gainNode = CiderAudio.context.createGain()
        CiderAudio.source.connect(CiderAudio.audioNodes.gainNode);
        CiderAudio.audioNodes.gainNode.connect(CiderAudio.context.destination);
        if(app.cfg.audio.normalization){
            CiderAudio.normalizerOn()
        }
        if (app.cfg.audio.spatial){
            CiderAudio.spatialOn()
        }    
    },
    normalizerOn: function (){},
    normalizerOff: function (){
        CiderAudio.audioNodes.gainNode.gain.setTargetAtTime(1, CiderAudio.context.currentTime+ 1, 0.5);
    },
    spatialOn: function (){
        try{
        CiderAudio.audioNodes.gainNode.connect(CiderAudio.context.destination);} catch(e){}
        CiderAudio.audioNodes.spatialNode = new ResonanceAudio(CiderAudio.context);
        CiderAudio.audioNodes.spatialNode.output.connect(CiderAudio.context.destination);
        let roomDimensions = {
            width: 32,
            height: 12,
            depth: 32,
        };
        let roomMaterials = {
            // Room wall materials
            left: 'metal',
            right: 'metal',
            front: 'brick-bare',
            back: 'brick-bare',
            down: 'acoustic-ceiling-tiles',
            up: 'acoustic-ceiling-tiles',
        };
        CiderAudio.audioNodes.spatialNode.setRoomProperties(roomDimensions, roomMaterials);
        CiderAudio.audioNodes.spatialInput = CiderAudio.audioNodes.spatialNode.createSource();
        CiderAudio.audioNodes.gainNode.connect(CiderAudio.audioNodes.spatialInput.input);
    },
    spatialOff: function (){
        try{
        CiderAudio.audioNodes.spatialNode.output.disconnect(CiderAudio.context.destination);
        CiderAudio.audioNodes.gainNode.disconnect(CiderAudio.audioNodes.spatialInput.input);} catch(e){}
        CiderAudio.audioNodes.gainNode.connect(CiderAudio.context.destination);
    },
    sendAudio: function (){
        var options = {
            mimeType : 'audio/webm; codecs=opus'
          };
          var destnode =  CiderAudio.context.createMediaStreamDestination();
          CiderAudio.audioNodes.gainNode.connect(destnode)
          var mediaRecorder = new MediaRecorder(destnode.stream,options); 
          mediaRecorder.start(1);
          mediaRecorder.ondataavailable = function(e) {
            e.data.arrayBuffer().then(buffer => {  
                ipcRenderer.send('writeAudio',buffer)
            }
          );                   
        }
    }

}
if (app.cfg.advanced.AudioContext){
    CiderAudio.init()
   
}