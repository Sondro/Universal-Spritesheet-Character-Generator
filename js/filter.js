(function(exports){
    class Filter {

        constructor(json){
            // sub category
            this.name = json.name;
            // more specific category
            this.category = json.category;
            this.values = json.values;
            this.default = json.default;
            this.assume = json.assume;
        }
    
        match(sprite, selection){
            let condition = false;
            if(sprite.filters)
                condition = sprite.filters[this.name];
            if(!condition){
                condition = this.assume
                // always show those without conditions for this filter
                if(selection.ignoreMandatory || !condition)
                    return true;
            }
            let value = selection[this.name];
            if(selection.ignoreFilter){
                return true;
            }
            // always show sprite if sprite triggers the filter
            if((this.category && this.category.split(';')[0] == sprite.category[0]) || this.name == sprite.category[0]){
                return true;
            }
            // use category instead of name
            if(this.category){
                value = selection[this.category.split(';')[0]]
                // remove if it is not in the right category
                if(value && !value.join(';').startsWith(this.category))
                    value = false
            }
            if(!value)
                value = [this.name, 'none']
            if(this.name == 'body')
                console.log(value)
            // remove category part
            value = value[value.length-1]
            // not specified for this sprite
            if(!condition)
                return !this.mandatory
            let index = -1;
            for(let i in this.values){
                if(this.values[i] == value){
                    index = i;
                }
            }
            if(index == -1)
                return !condition;
            // convert representation
            return condition & (1 << index)
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