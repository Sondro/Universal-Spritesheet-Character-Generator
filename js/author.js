(function (exports) {
    class Author {

        constructor(name, url) {
            this.name = name;
            this.url = url;
            this.sprites = []
        }

        addSprite(ss) {
            this.sprites.push(ss);
        }
    }
    if (typeof module !== 'undefined') {
        //node
        module.exports = Author;
    } else {
        // browser
        this['Author'] = Author;
    }
}());