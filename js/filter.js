(function(exports){
    class Filter {

        constructor(json){
            // sub category
            this.name = json.name;
            // more specific category
            this.category = json.category;
            this.values = json.values;
            // hide asset if no condition for this filter
            // true shows only if filter active, false shows always
            this.mandatory = json.mandatory;
        }
    
        match(sprite, selection){
            let condition = sprite.filters[this.name];
            let value = selection[this.name];
            if(selection.ignoreFilter){
                return true;
            }
            if(selection.ignoreMandatory && this.mandatory){
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
                    value = undefined
            }
            if(this.mandatory && condition){
                if(condition.toLowerCase() == 'true'){
                    //only show if it has a value
                    return value;
                }else{
                    //always show
                    return true;
                }
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