(function (exports) {
    if (typeof window === 'undefined') {
        // imports for node
        fs = require('fs');
        Canvas = require('canvas');
        Image = Canvas.Image;
        DOMParser = require('xmldom').DOMParser;
        path = require('path');
    }

    exports.normalizePath = function (path) {
        //return path;
        let tmp = path.replace('/./', '/');
        // /foo/../
        let regex = /\/[^(\.\.)\/]*\/\.\.\//g
        // replace as long as it can be found
        while (tmp.match(regex)) {
            tmp = tmp.replace(regex, '/');
        }
        return tmp;
    }

    exports.loadXML = function (longFile, cache, callback) {
        let file = exports.normalizePath(longFile)
        if (cache[file]) {
            callback(cache[file]);
        } else {
            if (typeof window === 'undefined') {
                // node
                fs.readFile(path.join(process.cwd(), file), 'utf8', function (err, data) {
                    if (!err) {
                        cache[file] = new DOMParser().parseFromString(data);
                        callback(cache[file]);
                    } else {
                        console.error('Can\'t load XML file ' + path.join(process.cwd(), file))
                    }
                });
            } else {
                // browser
                let req = new XMLHttpRequest();
                req.addEventListener('load', function () {
                    if (this.status === 200) {
                        cache[file] = this.responseXML;
                        callback(cache[file]);
                    } else {
                        console.error('Can\'t load XML file ' + file)
                    }
                })
                req.open('GET', file);
                req.responseType = 'document';
                req.overrideMimeType('text/xml');
                req.send();
            }
        }
    }

    exports.loadPlain = function (longFile, cache, callback) {
        let file = exports.normalizePath(longFile)
        if (cache[file]) {
            callback(cache[file]);
        } else {
            if (typeof window === 'undefined') {
                // node
                fs.readFile(path.join(process.cwd(), file), 'utf8', function (err, data) {
                    if (!err) {
                        cache[file] = data;
                        callback(data);
                    } else {
                        console.error('Can\'t load ' + path.join(process.cwd(), file))
                    }
                });
            } else {
                // browser
                let req = new XMLHttpRequest();
                req.addEventListener('load', function () {
                    if (this.status === 200) {
                        cache[file] = this.responseText;
                        callback(cache[file]);
                    } else {
                        console.error('Can\'t load ' + file)
                    }
                })
                req.open('GET', file);
                req.responseType = 'text';
                req.overrideMimeType('text/plain');
                req.send();
            }
        }
    }

    exports.loadImage = function (longFile, cache, width, height, callback) {
        let file = exports.normalizePath(longFile)
        if (cache[file]) {
            callback(cache[file]);
        } else {
            if (typeof window === 'undefined') {
                // node
                fs.readFile(path.join(process.cwd(), file), function (err, squid) {
                    if (!err) {
                        img = new Image;
                        img.onload = function () {
                            cache[file] = img;
                            callback(img);
                        }
                        img.src = squid;
                    } else {
                        console.error('Can\'t load image ' + path.join(process.cwd(), file))
                    }
                });
            } else {
                // browser
                let img = new Image(width, height);
                img.src = file;
                img.onload = function () {
                    cache[file] = img;
                    callback(img);
                }
            }
        }
    }

    exports.createCanvas = function (width, height) {
        let can
        if (typeof document !== 'undefined') {
            can = document.createElement("canvas");
            can.height = height;
            can.width = width;
        } else {
            can = new Canvas(width, height)
        }
        return can;
    }

    exports.cloneImg = function (img) {
        let can = exports.newCanvas(img.width, img.height);
        let ctx = can.getContext('2d');
        ctx.drawImage(img, 0, 0);
        return can;
    }
}(typeof exports === 'undefined' ? this['tools'] = {} : exports));