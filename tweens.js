/**
 * Created by Jack on 2/27/2017.
 */

var stage, sprite;

function load() {
    init();
}

function init(){
    stage = new createjs.Stage("canvas");

    ssData = {
        images: ["Bird1.png"],
        frames: {width:75, height:66},
        animations: {flap:[0,1]}
    };

    var spriteSheet = new createjs.SpriteSheet(ssData);
    sprite = new createjs.Sprite(spriteSheet, "flap");

    sprite.framerate = 120;
    sprite.x = 100;
    sprite.y = 100;
    sprite.regX = 75 / 2;
    sprite.regY = 66 / 2;

    var dot = new createjs.Shape();
    dot.graphics.beginFill("#000000").drawCircle(0,0, 5);
    dot.x = sprite.x;
    dot.y = sprite.y;

    var text = new createjs.Text(sprite.regX + " " + sprite.regY, "15px Arial", "#f00911");
    text.x = text.y = 500;

    createjs.Tween.get(sprite, {loop:true} )
        .to({x:500}, 3000)
        .set({scaleX:-1})
        .wait(1000)
        .to({x:100}, 3000)
        .set({scaleX:1})
        .wait(1000);

    stage.addChild(sprite, dot, text);
    stage.update();
    createjs.Ticker.timingMode = createjs.Ticker.RAF_SYNCHED;
    createjs.Ticker.addEventListener("tick", function e(){
        dot.x = sprite.x;
        dot.y = sprite.y;
        stage.update();
    });
}

function flipDirection(thing){
    thing.scaleX *= -1;
}