(function(){
    class Category {
        constructor(name) {
            this.name = name;
            this.subcategories = [];
            this.sprites = [];
        }
    
        hasCategory(name) {
            for (let i in this.subcategories)
                if (this.subcategories[i].name == name)
                    return true;
            return false;
        }
    
        getCategory(name) {
            for (let i in this.subcategories)
                if (this.subcategories[i].name == name)
                    return this.subcategories[i];
        }
    
        getCategories() {
            return this.subcategories;
        }
    
        addCategory(name) {
            this.subcategories.push(new Category(name));
        }
    
        hasSpriteset(name) {
            for (let i in this.sprites)
                if (this.sprites[i][0].name == name)
                    return true;
            return false;
        }
    
        getSpriteset(name) {
            for (let i in this.sprites)
                if (this.sprites[i][0].name == name)
                    return this.sprites[i];
        }
    
        getSpritesets() {
            return this.sprites;
        }
    
        //add to existing set or create new one
        addSprite(sprite) {
            for (let i in this.sprites){
                if (this.sprites[i][0].name == sprite.name){
                    this.sprites[i].push(sprite);
                    return;
                }
            }
            this.sprites.push([sprite]);
        }
    }
    this['Category'] = Category;
}());