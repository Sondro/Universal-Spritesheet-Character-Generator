(function(exports){
    exports.loadXML = function(path, callback){
        let req = new XMLHttpRequest();
        req.addEventListener('load', function() {
            if(this.status === 200){
                callback(this.responseXML);
            }else{
                console.error('Can\'t load ' + path)
            }
        })
        req.open('GET', path);
        req.responseType = 'document';
        req.overrideMimeType('text/xml');
        req.send();
    }
    
    exports.loadPlain = function(path, callback){
        let req = new XMLHttpRequest();
        req.addEventListener('load', function() {
            if(this.status === 200){
                callback(this.responseText);
            }else{
                console.error('Can\'t load ' + path)
            }
        })
        req.open('GET', path);
        req.responseType = 'text';
        req.overrideMimeType('text/plain');
        req.send();
    }
    
    exports.loadImage = function(path, width, height, callback){
        let img = new Image(width, height);
        img.src = path;
        img.onload = function(){
            callback(img);
        }
    }

    exports.cloneImg = function(img){
        let can = document.createElement("canvas");
        can.height = img.height;
        can.width = img.width;
        let ctx = can.getContext('2d');
        ctx.drawImage(img, 0, 0);
        return can;
    }
}(this['tools'] = {}));