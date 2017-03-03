/**
 * Created by Jack on 2/27/2017.
 */

var stage, sprite;

function load() {
    init();
}

function init() {
    stage = new createjs.Stage("canvas");

    ssData = {
        images: ["Bird1.png"],
        frames: {width: 75, height: 66},
        animations: {flap: [0, 1]}
    };

    var spriteSheet = new createjs.SpriteSheet(ssData);
    sprite = new createjs.Sprite(spriteSheet, "flap");

    sprite.framerate = 120;
    sprite.x = 100;
    sprite.y = 100;
    sprite.setBounds(sprite.x, sprite.y, 75, 66);
    sprite.regX = 75 / 2;
    sprite.regY = 66 / 2;

    var dot = new createjs.Shape();
    dot.graphics.beginFill("#000000").drawRect(0, 0, 100, 100);
    dot.x = sprite.x;
    dot.y = sprite.y;
    dot.setBounds(dot.x, dot.y, 100, 100);

    var text = new createjs.Text("Intersects?" + dot.getBounds().intersects(sprite.getBounds()), "15px Arial", "#f00911");
    text.x = text.y = 250;

    createjs.Tween.get(sprite, {loop: true})
        .to({x: 500}, 3000)
        .set({scaleX: -1})
        .wait(1000)
        .to({x: 100}, 3000)
        .set({scaleX: 1})
        .wait(1000);

    stage.addChild(sprite, dot, text);
    stage.update();
    createjs.Ticker.framerate = 15;
    // createjs.Ticker.timingMode = createjs.Ticker.RAF_SYNCHED;
    createjs.Ticker.addEventListener("tick", function e(){
       sprite.setBounds(sprite.x - (75/2), sprite.y - 33, 75, 66);
         text.text = "X: " + sprite.getBounds().x + "\nY: " + sprite.getBounds().y + "\nIntersects?: " + sprite.getBounds().intersects(dot.getBounds());
        stage.update();
     });
}

function flipDirection(thing){
    thing.scaleX *= -1;
}
