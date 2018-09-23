(function(exports){
    class Animation {

        constructor(generalAnimations, tiles){
            
        }

        //calculate which tile in the spritesheet represents the frame
        //-1 if it does not exist
        frameToTile(animation, direction, position){
            return -1;
        }
    
    }
    if(typeof module !== 'undefined'){
        //node
        module.exports = Author;
    }else{
        // browser
        this['Author'] = Author;
    }
}());