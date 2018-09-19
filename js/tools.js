(function(exports){
    if (typeof window === 'undefined'){
        // imports for node
        fs = require('fs');
        Canvas = require('canvas');
        Image = Canvas.Image;
        DOMParser = require('xmldom').DOMParser;
    }

    exports.loadXML = function(path, callback){
        if (typeof window === 'undefined'){
            // node
            // TODO: return xml dom
            fs.readFile(__dirname + '/../' + path, 'utf8', function(err, data){
                callback(new DOMParser().parseFromString(data));
            });
        }else{
            // browser
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
    }
    
    exports.loadPlain = function(path, callback){
        if (typeof window === 'undefined'){
            // node
            fs.readFile(__dirname + '/../' + path, 'utf8', function(err, data){
                callback(data);
            });
        }else{
            // browser
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
    }
    
    exports.loadImage = function(path, width, height, callback){
        if (typeof window === 'undefined'){
            // node
            fs.readFile(__dirname + '/../' + path, function(err, squid){
                if (err) throw err;
                img = new Image;
                img.src = squid;
                callback(img);
            });
        }else{
            // browser
            let img = new Image(width, height);
            img.src = path;
            img.onload = function(){
                callback(img);
            }
        }
    }

    exports.cloneImg = function(img){
        let can
        if (typeof document !== 'undefined'){
            can = document.createElement("canvas");
            can.height = img.height;
            can.width = img.width;
        }else{
            can = new Canvas(img.height, img.width)
        }
        let ctx = can.getContext('2d');
        ctx.drawImage(img, 0, 0);
        return can;
    }
}(typeof exports === 'undefined'? this['tools']={}: exports));