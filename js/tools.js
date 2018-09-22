(function(exports){
    if (typeof window === 'undefined'){
        // imports for node
        fs = require('fs');
        Canvas = require('canvas');
        Image = Canvas.Image;
        DOMParser = require('xmldom').DOMParser;
        path = require('path');
    }

    exports.loadXML = function(file, callback){
        if (typeof window === 'undefined'){
            // node
            // TODO: return xml dom
            fs.readFile(path.join(process.cwd(),file), 'utf8', function(err, data){
                if(!err){
                    callback(new DOMParser().parseFromString(data));
                }else{
                    console.error('Can\'t load XML file ' + path.join(process.cwd(),file))
                }
            });
        }else{
            // browser
            let req = new XMLHttpRequest();
            req.addEventListener('load', function() {
                if(this.status === 200){
                    callback(this.responseXML);
                }else{
                    console.error('Can\'t load XML file ' + file)
                }
            })
            req.open('GET', file);
            req.responseType = 'document';
            req.overrideMimeType('text/xml');
            req.send();
        }
    }
    
    exports.loadPlain = function(file, callback){
        if (typeof window === 'undefined'){
            // node
            fs.readFile(path.join(process.cwd(),file), 'utf8', function(err, data){
                if(!err){
                    callback(data);
                }else{
                    console.error('Can\'t load ' + path.join(process.cwd(),file))
                }
            });
        }else{
            // browser
            let req = new XMLHttpRequest();
            req.addEventListener('load', function() {
                if(this.status === 200){
                    callback(this.responseText);
                }else{
                    console.error('Can\'t load ' + file)
                }
            })
            req.open('GET', file);
            req.responseType = 'text';
            req.overrideMimeType('text/plain');
            req.send();
        }
    }
    
    exports.loadImage = function(file, width, height, callback){
        if (typeof window === 'undefined'){
            // node
            fs.readFile(path.join(process.cwd(),file), function(err, squid){
                if(!err){
                    img = new Image;
                    img.src = squid;
                    callback(img);
                }else{
                    console.error('Can\'t load image ' + path.join(process.cwd(),file))
                }
            });
        }else{
            // browser
            let img = new Image(width, height);
            img.src = file;
            img.onload = function(){
                callback(img);
            }
        }
    }

    exports.createCanvas = function(height, width){
        let can
        if (typeof document !== 'undefined'){
            can = document.createElement("canvas");
            can.height = height;
            can.width = width;
        }else{
            can = new Canvas(height, width)
        }
        return can;
    }

    exports.cloneImg = function(img){
        let can = exports.newCanvas(img.height, img.width);
        let ctx = can.getContext('2d');
        ctx.drawImage(img, 0, 0);
        return can;
    }
}(typeof exports === 'undefined'? this['tools']={}: exports));