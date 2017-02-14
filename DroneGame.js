const A_KEY = 65;
const D_KEY = 68;
const ESC_KEY = 27;
const SPACEBAR = 32;

var queue, stage; //createjs objects
var sky, dContainer, drone, package, wall1, line;  //game objects
var gameObjects = [];   //contains all game objects not in dContainer

var aKeyDown, dKeyDown, escKeyDown, spacebarDown = false;   //keyboard input flags
var gameOver = courseOver = false;
var droneHomeX, droneHomeY;   //starting position for dContainer/drone in course
var packgeHomeX, packageHomeY;  //starting position for package in course

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
    
    buildGameObjects();
    startGame();
}


function buildGameObjects(){//alert("buildGameObjects()");

    droneHomeX = 75;
    droneHomeY = 75;
    packageHomeX = 100;
    packageHomeY = stage.canvas.height-40;
    
    //build all objects
    buildBackground();
    buildDrone();           //drone before container for proper container sizing
    buildContainer();
    buildWalls();
    buildPackage();
    buildLine();            //??temp
    
    //Add to Stage
    stage.addChild(sky, dContainer, line, package, wall1);
    
    //Add to array
    gameObjects.push(package,wall1);
    
    stage.update();
}

function startGame(){ //alert("startGame()");
    //Ticker
    createjs.Ticker.framerate = 60;
    createjs.Ticker.addEventListener("tick", runGame);
    
    //listen for key / mouse events
    window.onkeydown  = detectKey;
    window.onkeyup = removeKey;
    window.onmousedown = moveUp;
    window.onmouseup = moveDown;
}



// --------------------- game objects ----------------------//

function buildBackground(){//alert("buildBackground());
    var image = queue.getResult("sky1");
    sky = new createjs.Bitmap(image);
    sky.x = sky.y = 0;
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
    d.beginFill("white").beginStroke("grey");
    d.drawRect(13,4,4,8);   //left shaft
    d.drawRect(83,4,4,8);   //right shaft
    d.endStroke();
    
    //legs
    d.beginFill("grey");
    d.moveTo(10,20).lineTo(0,27).lineTo(0,33).lineTo(2,33).lineTo(2,28).lineTo(13.5,20);//left
    d.moveTo(90,20).lineTo(100,27).lineTo(100,33).lineTo(98,33).lineTo(98,28).lineTo(86.5,20);//right
    
    //body
    d.beginFill("red");
    d_beginFillBody = d.command; //store for later
    d.beginStroke("black").moveTo(10,12).lineTo(20,12).lineTo(40,7).lineTo(60,7).lineTo(80,12).lineTo(90,12).lineTo(90,20).lineTo(65,22).lineTo(62,31).lineTo(38,31).lineTo(35,22).lineTo(10,20).lineTo(10,12);
    
    //grabbing pad, area to be positioned on package in order to pick it up
    d.beginFill("black").drawRect(38,31,24,2);
    
    //Shape
    drone = new createjs.Shape(d);
    drone.x = drone.nextX = 0;  //0 of container
    drone.y = drone.nextY = 0;  //0 of container
    drone.width = 100;
    drone.height = 33;
    drone.up = false;       //whether drone is flying upward
    drone.name = "drone";
    
    //set bounds
    drone.setBounds(drone.x,drone.y,drone.width,drone.height);
}

function buildContainer() { //alert("buildContainer()");
    
    //Container
    dContainer = new createjs.Container();
    dContainer.x = dContainer.nextX = droneHomeX;
    dContainer.y = dContainer.nextY = (droneHomeY - drone.height);
    dContainer.speed = 1;
    dContainer.direction = 0;
    dContainer.landed = false;
    dContainer.width = drone.width;
    dContainer.height = drone.height;
    
    //add drone to dContainer
    dContainer.addChild(drone);
    
    //set bounds based on contents (i.e. drone)
    dContainer.setBounds(dContainer.x, dContainer.y, dContainer.width, dContainer.height);
}

function buildLine(){ //??temp function
    var l = new createjs.Graphics();
    l.beginStroke("black").drawRect(0,0,260,167);
    line = new createjs.Shape(l);
}

function buildPackage(){ //alert("buildPackage());
    
    //create graphics object
    package = new createjs.Shape();
    package.width = package.height = 40;
    package.x = package.nextX = packageHomeX;
    package.y = package.nextY = packageHomeY;
    package.name = "package";
    package.hazard = false;     //whether object will damage drone/package
    package.landed = true;     //whether the package is on a platform
    package.direction = 0; //1 = moving right, -1 = moving left, 0 = straight down
    package.speed = 0;
    
    //graphics
    package.graphics.beginFill("#aa8e67").drawRect(0,0,package.width,package.height);
    package.graphics.beginFill("#e1dcd5").drawRect(0,17,package.width,6).drawRect(17,0,6,package.height).endFill();
    package.graphics.beginStroke("black").drawRect(0,0,package.width,package.height);

    //set bounds
    package.setBounds(package.x, package.y, package.width, package.height);
}

function buildWalls(){ //alert("buildWalls()");
    
    //wall1
    //create graphics object
    var w = new createjs.Graphics();
    w.beginFill("black").drawRect(0,0,10,250);
    
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
}





// ------------------Game Mechanics --------------------//

function runGame(e){ //alert("runGame()");
    if(!e.paused){
        detectPackageLanding();
        
        //update package only if it is moving and not inside the container
        if(!package.carried && !package.landed){
            updatePackage();
            renderPackage();
        }
        
        if(!drone.landed){
            updateContainer();
            renderContainer();
        }
        
        
        stage.update();
    }
}


function pauseGame() { //alert("pauseGame()");
    createjs.Ticker.paused = !createjs.Ticker.paused;
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

function moveUp(e){ //alert("moveUp()");
    
    drone.up = true;
    drone.landed = false;
    
    if(package.carried) {
        package.landed = false;
    }
}

function moveDown(e){ //alert("moveDown()");
    
    drone.up = false;
}



//---------------------- Collision Detection -------------------------//

function detectCollision(target, nextX, nextY){ //alert("detectCollision()");
    
    var i,objectBounds, targetBounds;
    
    //get next bounds of target
    targetBounds = target.getBounds();
    targetBounds.x = nextX;
    targetBounds.y = nextY;
    
    for(i = 0; i < gameObjects.length; i++){ //check each object in array
        
        //get bounds of each object in its local coordinate system
        var current = gameObjects[i];
        objectBounds = current.getBounds();
        
        //determine whether two objects intersect
        if(targetBounds.intersects(objectBounds)){
            //alert("targetBounds:" + targetBounds);
            return current; //stop checking for other collisions
        }
    }
    return "none";  //no collision detected
}


function revisePosition(target, cObject, nextX, nextY){ //alert("revisePosition()");
    var original;
    var pt = new createjs.Point(0,0); //used to store revised x,y position
    
    //flags indicate relationship between target and collided object
    var above, below, left, right = false;

    //determine the edges of collided object
    var cBounds = cObject.getBounds();
    var cTop = cBounds.y;
    var cBottom = cBounds.y + cBounds.height;
    var cLeft = cBounds.x;
    var cRight = cBounds.x + cBounds.width;
    //alert("target x,y: " + target.x + "," + target.y);
    
    //determine positioning relationship between target and collided object
    //vertical
    if(cTop >= (target.y + target.height)) {   //target is above collided object
        above = true; //alert("top");
    }
    else if( cBottom <= target.y ) {   //target is below collided object
        below = true; //alert("below");
    }
    //horizontal
    if(cLeft >= target.x + target.width){ //target at left side of collided object
        left = true; //alert("left");
    }
    else if(cRight <= target.x){ //target at right side of collided object
        right = true; //alert("right");
    }
    
    //based on relationship, revise next position of target
    //There are eight possible relationships
    if(above && left){ //alert("above and left");
        pt.x = cLeft - target.width;
        pt.y = nextY
    }
    else if(above && right){ //alert("above and right");
        pt.x = cRight;
        pt.y = nextY;
    }
    else if(above){
        pt.x = nextX;
        pt.y = cTop - target.height;
        target.landed = true;
    }
    else if(below && left){
        pt.x = cLeft - target.width;
        pt.y = nextY;
        target.direction *= -0.25;   //bounce
    }
    else if(below && right){
        pt.x = cRight;
        pt.y = nextY;
        target.direction *= -0.25;   //bounce
    }
    else if(below){
        pt.x = nextX;
        pt.y = cBottom;
    }
    else if(left){ //alert("left");
        pt.x = cLeft - target.width;
        pt.y = nextY;
        target.direction *= -0.25;
    }
    else if(right){ //alert("right");
        pt.x = cRight;
        pt.y = nextY;
        target.direction *= -0.25;
    }

    //need to update the landed property of the original object, if using a clone
    if(target.name === "clone" && target.landed){ //alert("target is clone");
        original = target.cloneOf;
        original.landed = true;
        original.container.landed = true;
        //alert(original.name);
    }
    
    return pt;      //return the x,y position that target should be moved to
}


function detectEdgeOfFrame(target, nextX, nextY){ //alert("detectEdgeOfFrame()");
    
    //Point used to store revised x,y position
    var pt = new createjs.Point(-100,-100); //-100 is a flag for 'no change made'
    
    //horizontal
    if(nextX < 0){
        
        pt.x = 0;
        target.direction *= -0.25;     //bounce
    }
    else if(nextX > stage.canvas.width - target.width){
        
        pt.x = stage.canvas.width - package.width;
        target.direction *= -0.25;     //bounce
    }
    //vertical
    if(nextY > stage.canvas.height - target.height){
        pt.y = stage.canvas.height - target.height;
        target.landed = true;
    }
    return pt;
}

function detectPackageLanding(){ //alert("detectPackageLanding");
    var index = gameObjects.indexOf(package);
    
    if( index === -1 && package.landed && !package.carried){
        gameObjects.push(package);
        //alert("package landed");
    }
}





// --------------------------- Actions --------------------------------- //

function pickup(){ //alert("pickup()");
    
    var index = gameObjects.indexOf(package); //get index of package in array
    
    if(index !== -1)    //package is in the array
    {
            gameObjects.splice(index,1);    //remove package from array
    }
    
    //add Package to dContainer
    dContainer.addChild(package);   //adding to dContainer removes from Stage
    
    //update properties
    package.speed = dContainer.speed;
    package.direction = dContainer.direction;
    package.carried = true;
    
    //move to correct position inside container
    var adjustedX = (dContainer.width - package.width) /2;
    var adjustedY = drone.height;
    createjs.Tween.get(package).to({x:adjustedX, y:adjustedY}, 100, createjs.Ease.quadOut);
    
    //adjust bounds to match position relative to container
    var pBounds = package.getBounds();
    pBounds.x = package.x;
    pBounds.y = package.y;
}


function drop(){ //alert("drop()");
    
    //package.x, package.y is relative to dContainer and must be readjusted to stage
    var adjustedX = (dContainer.width - package.width) /2;
    var adjustedY = drone.height;
    var globalPt = package.localToGlobal(package.x-adjustedX, package.y-adjustedY);
    
    //move to correct position inside stage
    package.x = package.nextX = globalPt.x;
    package.y = package.nextY = globalPt.y;
    
    //adjusts bounds to match position relative to stage
    var pBounds = package.getBounds();
    pBounds.x = package.x;
    pBounds.y = package.y;
    
    //add Package to stage
    stage.addChild(package);    //adding to stage removes from dContainer
    
    //update properties
    package.direction = dContainer.direction;
    package.carried = false;
    package.landed = false;
}


// ----------------------update / rendering --------------------------//

//used if package is moving on its own
function updatePackage(){ //alert("updatePackage()");
    
    var revisedPt; //x,y values needed to adjust after collision / edge of frame
    
    //calculate next position
    var nextX = package.x + (package.speed * package.direction);
    var nextY = package.y + package.speed;  //only falling
    
    //perform collision detection based on that next position
    var cObject = detectCollision(package, nextX, nextY); //object collided with
    if(cObject !== "none" && cObject.hazard) {  //hit a hazard
        
        alert("hit hazard. must restart course.");
    }
    else if( cObject !== "none"){               //hit a neutral
        
        //determine revised global position based on collision type
        revisedPt = revisePosition(package, cObject, nextX, nextY);
        nextX = revisedPt.x;
        nextY = revisedPt.y;
    }
    
    //perform edge of frame detection based on that next position
    revisedPt = detectEdgeOfFrame(package, nextX, nextY);
    if(revisedPt.x !== -100){   //horizontal edge of frame occurred
        
        nextX = revisedPt.x;
    }
    if(revisedPt.y !== -100){   //vertical edge of frame occured
        
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

function checkChildren(){ //alert("checkChildren()");
    
    var shiftX, shiftY, nextX, nextY, current, cObject, globalPt;
    
    var currentClone;
    var revisedPt = new createjs.Point(-100,-100);
    
    //for each object inside the container
    //perform collision detection based on next position of that object
    //stop after the first object that has a collision
    for(i = 0; i < dContainer.numChildren;i++){
        
        //get child
        current = dContainer.children[i];
        
        //determine if child is shifted in container
        shiftX = current.x;
        shiftY = current.y;
        
        //determine next position of current object based on properties of dContainer
        nextX = current.x + (dContainer.speed * dContainer.direction);
        
        if(!drone.up){  //alert("falling");    //drone falling
            nextY = current.y + dContainer.speed;
        }
        else if(drone.up){ //alert("rising"); //drone rising
            nextY = current.y - dContainer.speed;
        }

        
        //shift next position to match if child is shifted in container
        nextX -= shiftX;
        nextY -= shiftY;
        
        //convert next position into global coordinate system
        globalPt = current.localToGlobal(nextX, nextY);
        nextX = globalPt.x;
        nextY = globalPt.y;
  
        /*
        if(current.name === "package"){
            alert("localToGlobal: " + globalPt + "\nglobalToLocal: " + current.globalToLocal(globalPt.x, globalPt.y));
        }
         */

        //perform collision detection using this global next position
        cObject = detectCollision(current, nextX, nextY);
        
        if(cObject !== "none" && cObject.hazard){    //hit a hazard
            alert("hit hazard. must restart course.");
        }
        //else if( cObject !== "none" && package.dropped){
        //    drop();
        //}
        else if( cObject !== "none"){               //hit a neutral
            
            //create global replica of child for use in revise position
            globalPt = current.localToGlobal(current.x, current.y);
            currentClone = new createjs.Shape();
            currentClone.x = globalPt.x - shiftX;
            currentClone.y = globalPt.y - shiftY;
            currentClone.width = current.width;
            currentClone.height = current.height;
            currentClone.cloneOf = current; //need this reference to update "landed"
            currentClone.name = "clone";
            
            
            //determine revised global position based on collision type
            revisedPt = revisePosition(currentClone, cObject, nextX, nextY);
            revisedPt.x -= shiftX;
            revisedPt.y -= shiftY;
            
            //don't convert revised position back into local coordinate system
            //revisedPt = current.globalToLocal(nextX,nextY);
            //alert(revisedPt);
            //alert(shiftX + "," + shiftY);
            return revisedPt; //return directly without shifting back
            //represents the next position the container should take
            //to remove collision of child
        }
    }
    return revisedPt;
}


//??
function updateContainer(){ //alert("updateContainer()");
    
    var i, revisedPt;
    
    //determine next position of container
    var nextX = dContainer.x;
    var nextY = dContainer.y;
    
    //horizontal
    if(aKeyDown){
        dContainer.direction = -1;
        nextX = dContainer.x + (dContainer.speed * dContainer.direction);
    }
    else if(dKeyDown){
        dContainer.direction = 1;
        nextX = dContainer.x + (dContainer.speed * dContainer.direction);
    }
    
    //vertical
    if(!drone.up){ //drone is falling
        
        nextY = dContainer.y + dContainer.speed;
    }
    else if( !drone.landed){         //drone is rising
        
        nextY = dContainer.y - dContainer.speed;
    }
    
    //check if a child collides with an object and container position must adjust
    revisedPt = checkChildren();
    
    if(revisedPt.x !== -100 ){  //collision occurred
        nextX = revisedPt.x;
        //alert(revisedPt);
    }
    if(revisedPt.y !== -100 ){ //collision occurred
        nextY = revisedPt.y;
    }
    
    dContainer.nextX = nextX;
    dContainer.nextY = nextY;
}

function renderContainer(){ //alert("renderContainer()");
    dContainer.x = dContainer.nextX;
    dContainer.y = dContainer.nextY;
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





















