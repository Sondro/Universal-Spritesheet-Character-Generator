(function(exports){
    class Filter {

        constructor(json){
            // sub category
            this.name = json.name;
            // more specific category
            this.category = json.category;
            this.values = json.values;
            // not defined is a mismatch
            this.mandatory = json.mandatory;
        }
    
        match(sprite, selection){
            let condition = sprite.filters[this.name];
            let value = selection[this.name];
            // use category instead of name
            if(this.category){
                value = selection[this.category.split(';')[0]]
                // remove if it is not in the right category
                if(value && !value.join(';').startsWith(this.category))
                    value = undefined
            }
            // remove category part
            if(value){
                value = value[value.length-1]
                // not specified for this sprite
                if(!condition)
                    return !this.mandatory
                let index = -1;
                for(let i in this.values){
                    if(this.values[i] == value)
                        index = i;
                }
                if(index == -1)
                    return !condition;
                // convert representation
                return condition & (1 << index)
            }
            //no value hides if it’s a condition
            return !condition;
        }
    }
    if(typeof module !== 'undefined'){
        //node
        module.exports = Filter;
    }else{
        // browser
        this['Filter'] = Filter;
    }
}());