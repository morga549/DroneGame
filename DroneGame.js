const A_KEY = 65;
const D_KEY = 68;
const ESC_KEY = 27;
const SPACEBAR = 32;

var queue, stage;
var dContainer, drone, package, wall1, line;  //game objects
var gameObjects = [];   //contains all game objects not in dContainer

var aKeyDown, dKeyDown, escKeyDown, spacebarDown = false;
var gameOver = false;
var courseOver = false;

//drone customization
var d_beginFillBody;
var d_beginFillPropellerL; //left side of propeller
var d_beginFillPropellerR; //right side of propeller






// --------------------- startup functions ----------------------//

function load() { //alert("load()");

    queue = new createjs.LoadQueue(false);
    queue.addEventListener("complete", init);
    queue.loadManifest([
        {id:"sky1", src:"Sky1.png"}
    ]);
}

function init() { //alert("init()");
    stage = new createjs.Stage("canvas");

    //Game Objects
    buildBackground();
    buildLine();        //??temp
    buildContainer();
    buildDrone();
    buildWalls();
    buildPackage(); //do last, to add to array last

    //Ticker
    createjs.Ticker.framerate = 60;
    createjs.Ticker.addEventListener("tick", runGame)

    //handle keys
    window.onkeydown  = detectKey;
    window.onkeyup = removeKey;
    //window.onmousedown = moveUp;
    //window.onmouseup = moveDown;
}

function buildBackground(){//alert("buildBackground());
    var image = queue.getResult("sky1");
    sky = new createjs.Bitmap(image);
    sky.x = sky.y = 0;
    stage.addChild(sky);
    stage.update();
}

function buildContainer() { //alert("buildContainer()");
    dContainer = new createjs.Container();
    dContainer.x = dContainer.nextX = 75;
    dContainer.y = dContainer.nextY = 75;
    dContainer.speed = 1;
    dContainer.direction = 0;
    dContainer.landed = false;
    
    stage.addChild(dContainer);
    stage.update();
}

function buildLine(){
    var l = new createjs.Graphics();
    l.beginStroke("black");
    l.drawRect(0,0,285,141);
    
    line = new createjs.Shape(l);
    stage.addChild(line);
    stage.update();
}

function buildDrone() { //alert("buildDrone()");
    
    //create graphics object
    var d = new createjs.Graphics();
    
    //propellers
    d.beginFill("lightgrey");
    d_beginFillPropellerL = d.command; //store for later
    d.drawRect(0,0,15,4);   //left side of left propeller
    d.drawRect(70,0,15,4);  //left side of right propeller
    d.beginFill("grey");
    d_beginFillPropellerR = d.command;
    d.drawRect(15,0,15,4);  //right side of left propeller
    d.drawRect(85,0,15,4);  //right side of right propeller
    
    //shafts
    d.beginFill("white");
    d.beginStroke("grey");
    d.drawRect(13,4,4,8);   //left shaft
    d.drawRect(83,4,4,8);   //right shaft
    d.endStroke();
    
    //legs
    d.beginFill("grey");
    d.moveTo(10,20);    //left leg
    d.lineTo(0,27);
    d.lineTo(0,33);
    d.lineTo(2,33);
    d.lineTo(2,28);
    d.lineTo(13.5,20);
    d.moveTo(90,20);    //right leg
    d.lineTo(100,27);
    d.lineTo(100,33);
    d.lineTo(98,33);
    d.lineTo(98,28);
    d.lineTo(86.5,20);
    
    //body
    d.beginFill("red");
    d_beginFillBody = d.command;
    d.beginStroke("black");
    d.moveTo(10,12);
    d.lineTo(20,12);
    d.lineTo(40,7);
    d.lineTo(60,7);
    d.lineTo(80,12);
    d.lineTo(90,12);
    d.lineTo(90,20);
    d.lineTo(65,22);
    d.lineTo(62,31);
    d.lineTo(38,31);
    d.lineTo(35,22);
    d.lineTo(10,20);
    d.lineTo(10,12);
    
    //create grabbing pad
    d.beginFill("black");
    d.drawRect(38,31,24,2);
    
    //create shape object
    drone = new createjs.Shape(d);
    drone.x = drone.nextX = 0;  //0 of container
    drone.y = drone.nextY = 0;  //0 of container
    drone.width = 100;
    drone.height = 33;
    drone.up = false;       //whether drone is flying upward
    
    //set bounds
    drone.setBounds(drone.x,drone.y,drone.width,drone.height);
    
    //add to dContainer
    dContainer.addChild(drone);
    stage.update();
}

function buildPackage(){ //alert("buildPackage());
    
    //create graphics object
    var p = new createjs.Graphics();
    
    p.beginFill("#aa8e67");
    p.drawRect(0,0,40,40);
    
    p.beginFill("#e1dcd5");
    p.drawRect(0,17,40,6);
    p.drawRect(17,0,6,40);
    p.endFill();
    
    p.beginStroke("black");
    p.drawRect(0,0,40,40);
    
    //create shape object
    package = new createjs.Shape(p);
    package.width = package.height = 40;
    package.x = package.nextX = 105;
    package.y = package.nextY = stage.canvas.height-package.height;
    package.name = "package";
    package.hazard = false;     //whether object will damage drone/package
    package.landed = true;     //whether the package is on a platform
    package.direction = 0;      //1 = moving right, -1 = moving left, 0 = straight down
    package.speed = 0;
    
    //set bounds
    package.setBounds(package.x, package.y, package.width, package.height);
    
    //add to stage
    stage.addChild(package);
    stage.update();
    
    //add to gameObject array
    gameObjects.push(package);
}

function buildWalls(){ //alert("buildWalls()");
    //create graphics object
    var w = new createjs.Graphics();
    w.beginFill("black");
    w.drawRect(0,0,10,250);
    
    //create shape object
    wall1 = new createjs.Shape(w);
    wall1.x = stage.canvas.width/2;
    wall1.y = 180;
    wall1.width = 10;
    wall1.height = 250;
    wall1.name = "wall1";
    wall1.hazard = false;
    
    //set bounds
    wall1.setBounds(wall1.x, wall1.y, wall1.width, wall1.height);
   
    
    //add to stage
    stage.addChild(wall1);
    stage.update();
    
    //add to array
    gameObjects.push(wall1);
}

// ------------------Game Mechanics --------------------//

function runGame(e){ //alert("runGame()");
    if(!e.paused){
        movePropellers();
        
        
        if(!package.carried && !package.landed){
            updatePackage();
            renderPackage();
        }
        updateContainer();
        renderContainer();
        
        stage.update();
    }
}

function detectKey(e){ //alert("detectKey()");
    e = !e ? window.event : e; //if event is not event, get window.event;
    switch(e.keyCode) {
        case A_KEY:
            aKeyDown = true;
            break;
        case D_KEY:
            dKeyDown = true;
            break;
        case ESC_KEY:
            pauseGame();
            break;
        case SPACEBAR:
            if(createjs.Ticker.paused){
                alert("restart course");
            }
            else if (!package.carried){
                pickup();
            }
            else if (package.carried){
                drop();
            }
            break;
    }
}

function removeKey(e){ //alert("removeKey()");
    e = !e ? window.event : e;  //if event is not event, get window.event;
    switch(e.keyCode) {
        case A_KEY:
            aKeyDown = false;
            break;
        case D_KEY:
            dKeyDown = false;
            break;
        case ESC_KEY:
            escKeyDown = false;
            break;
        case SPACEBAR:
            spacebarDown = false;
            break;
    }
}

function pauseGame() { //alert("pauseGame()");
    createjs.Ticker.paused = !createjs.Ticker.paused;
}


function detectCollision(target){ //alert("detectCollision()");
    var i,objectBounds;
    for(i = 0; i < gameObjects.length; i++){ //check each object in array
        
        //get bounds of each object in its local coordinate system
        var current = gameObjects[i];
        objectBounds = current.getBounds();
        //alert(target.getBounds());
        
        //determine whether two objects intersect
        if(target.getBounds().intersects(objectBounds)){
            return current;
        }
    }
    
    return "none";  //no collision detected
}

function revisePosition(target, cObject, nextX, nextY){ //alert("revisePosition()");
    
    var pt = new createjs.Point(0,0);
    var above, below, left, right = false;  //flags

    var cBounds = cObject.getBounds();
    var cTop = cBounds.y;
    var cBottom = cBounds.y + cBounds.height;
    var cLeft = cBounds.x;
    var cRight = cBounds.x + cBounds.width;
    
    //vertical
    if(cTop >= (target.y + target.height)) {   //target is above
        above = true;
        //alert("top");
    }
    else if( cBottom <= target.y ) {   //target is below
        below = true;
        //alert("below");
    }
    //horizontal
    if(cLeft >= target.x + target.width){ //target at left side
        left = true;
        //alert("left");
    }
    else if(cRight <= target.x){ //target at right side
        right = true;
        //alert("right");
    }
    
    //based on flags, determine next position
    if(above){
        pt.x = nextX;
        pt.y = cTop - target.height;
        target.landed = true;
    }
    else if(below && left){
        pt.x = cLeft - target.width;
        pt.y = nextY;
        target.direction = 0;
    }
    else if(below && right){
        pt.x = cRight;
        pt.y = nextY;
        target.direction = 0;
    }
    else if(below){
        pt.x = nextX;
        pt.y = cBottom;
    }
    else if(left){
        pt.x = cLeft - target.width;
        pt.y = nextY;
        target.direction = 0;
    }
    else if(right){
        pt.x = cRight;
        pt.y = nextY;
        target.direction = 0;
    }
    
    return pt;
    
}
    
function detectEdgeOfFrame(target, nextX, nextY){ //alert("detectEdgeOfFrame()");
    var pt = new createjs.Point(-100,-100);
    
    //horizontal
    if(nextX < 0){
        pt.x = 0;
        
        if(target.name === "package"){  //package bounces
            target.direction *= -1;
        }
    }
    else if(nextX > stage.canvas.width - target.width){
        pt.x = stage.canvas.width - package.width;
        
        if(target.name === "package"){  //package bounces
            target.direction *= -1;
        }
    }
    //vertical
    if(nextY > stage.canvas.height - target.height){
        pt.y = stage.canvas.height - target.height;
        target.landed = true;
    }
    return pt;
}


// ----------------------- Actions ------------------------ //

function pickup(){ //alert("pickup()");
    var pBounds;
    var index = gameObjects.indexOf(package);
    
    if(index !== -1)    //package is in the array
    {
            gameObjects.splice(index,1);
    }
    stage.removeChild(package);
    dContainer.addChild(package);   //add to dContainer
    
    //update properties
    package.speed = dContainer.speed;
    package.direction = dContainer.direction;
    package.carried = true;
    
    //move to correct position
    createjs.Tween.get(package).to({x:30, y:33}, 100, createjs.Ease.quadOut);
    
    pBounds = package.getBounds();
    pBounds.x = 30; //relative to container
    pBounds.y = 33; //relative to container
    //alert(pBounds);
}


function drop(){ //alert("drop()");
    //package.x, package.y is relative to dContainer and must be readjusted to stage
    var globalPosition = package.localToGlobal(package.x-30, package.y-33);
    var pBounds = package.getBounds();
    package.x = package.nextX = pBounds.x = globalPosition.x;
    package.y = package.nextY = pBounds.y = globalPosition.y;
    //alert("drop"+ pBounds);
    
    dContainer.removeChild(package);
    stage.addChild(package);
    
    //update properties
    package.direction = dContainer.direction;
    package.carried = false;
    package.landed = false; //??temp
    
    if(package.landed){
        gameObjects.push(package);  //add package to end of array
    }
    
    //alert("drop"+ pBounds);
}


//??needs rewriting so it checks the future position of each of the objects inside
//need to convert to global coordinates to do so
function updateContainer(){ //alert("updateContainer()");
    
    dContainer.direction = 0;   //reset
    
    //determine next position of container
    var nextX = dContainer.x;
    if(aKeyDown){
        dContainer.direction = -1;
        nextX = dContainer.x + (dContainer.speed * dContainer.direction);
    }
    else if(dKeyDown){
        dContainer.direction = 1;
        nextX = dContainer.x + (dContainer.speed * dContainer.direction);
    }
    dContainer.nextX = nextX;
}

function renderContainer(){ //alert("renderContainer()");
    dContainer.x = dContainer.nextX;
}



function updatePackage(){ //alert("updatePackage()");
    var cObject, cBounds;    //collision object, collision bounds
    var nextBounds = package.getBounds();   //package bounds
    
    //determine next position
    var nextX = package.x + (package.speed * package.direction);
    var nextY = package.y + package.speed;
    nextBounds.x = nextX;
    nextBounds.y = nextY;
    
    //collision detection based on that next position
    cObject = detectCollision(package);
    if(cObject !== "none" && cObject.hazard) {  //hit a hazard
        
        alert("hit hazard. restart course.");
    }
    else if( cObject !== "none"){   //hit a neutral
        
        cBounds = cObject.getBounds();
        //alert("hit neutral: " + cObject.name);
        
        //determine revised position based on collision type (top, side)
        revisedPt = revisePosition(package, cObject, nextX, nextY);
        nextX = revisedPt.x;
        nextY = revisedPt.y;
    }
    
    //edge of frame detection based on that next position
    revisedPt = detectEdgeOfFrame(package, nextX, nextY);
    if(revisedPt.x !== -100){
        
        nextX = revisedPt.x;
    }
    else if(revisedPt.y !== -100){
        
        nextY = revisedPt.y;
    }
    
    
    
    //update properties
    package.nextX = nextX;
    package.nextY = nextY;
}

function renderPackage(){ //alert("renderPackage()");
    package.x = package.nextX;
    package.y = package.nextY;
    package.setBounds(package.x, package.y, package.width, package.height);
}


// ---------------------- Animation ----------------------- //
function movePropellers(){ //alert("movePropellers()");
    
    if(d_beginFillPropellerR.style === "lightgrey") {
        d_beginFillPropellerR.style = "grey";
        d_beginFillPropellerL.style = "lightgrey";
    }
    else {
        d_beginFillPropellerR.style = "lightgrey";
        d_beginFillPropellerL.style = "grey";
    }
}





















