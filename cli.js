#!/usr/bin/node
const fs = require('fs')
const path = require('path')
const Character = require('./js/character')
let assetManager = require('./js/assetmanager')

if(process.argv.length < 3){
    console.error('example: ./cli.js --basedir=lpc/ --file=test.png --sex=1 --body="body.light" --legs=legs.robe%20skirt')
    process.exit(1);
}

function delayed(){
    let selection = {}
    for(let i = 2; i < process.argv.length; i++){
        let arg = process.argv[i];
        if(arg.startsWith('--') && arg != '--progress' && !arg.startsWith('--basedir=') && !arg.startsWith('--file=') && !arg.startsWith('--attribution=')){
            arg = arg.substring(2)
            let splitted = arg.split('=');
            selection[splitted[0]] = splitted[1];
        }
    }
    let c = new Character(selection, assetManager);
    let drawn = c.draw();
    let image = file;
    if(!path.isAbsolute(image))
        image = path.join(process.cwd(), image);
    let out = fs.createWriteStream(image)
    out.write(drawn.toBuffer())
    console.log(c.generateAttribution(attribution))
}

function progress(pending, allFiles, lastPath){
    console.error((allFiles-pending) + '/' + allFiles + ' loaded; latest: '+ lastPath)
}

let showProgress = false;
let baseDir = 'lpc/';
let file = 'test.png';
let attribution = 'plain';
for(let i = 2; i < process.argv.length; i++){
    let arg = process.argv[i];
    if(arg == '--progress'){
        showProgress = true;
    }
    if(arg.startsWith('--basedir=')){
        baseDir = arg.substring('--basedir='.length)
        if(!baseDir.endsWith('/'))
        baseDir += '/'
    }
    if(arg.startsWith('--file=')){
        file = arg.substring('--file='.length)
    }
    if(arg.startsWith('--attribution=')){
        attribution = arg.substring('--attribution='.length)
    }
}

assetManager.onLoad = delayed;
if(showProgress)
    assetManager.onProgress = progress;
assetManager.setBaseDir(baseDir)
assetManager.loadList('spritesheets/');