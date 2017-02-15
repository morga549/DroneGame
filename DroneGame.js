const A_KEY = 65;
const D_KEY = 68;
const ESC_KEY = 27;
const SPACEBAR = 32;


var queue, stage; //createjs objects
var sky, dContainer, drone, package, wall1, line, pauseText;  //game objects
var gameObjects = [];   //contains all game objects not in dContainer

var aKeyDown, dKeyDown, escKeyDown, spacebarDown = false;   //keyboard input flags
var gameOver = courseOver = false;
var droneHomeX, droneHomeY;   //starting position for dContainer/drone in course
var packgeHomeX, packageHomeY;  //starting position for package in course

//drone customization
var d_beginFillBody;
var d_beginFillPropellerL; //left side of propeller
var d_beginFillPropellerR; //right side of propeller


//**bug 1.001: if drone flies up under package while hugging a wall, goes through package, then resets to 0,0 after it reaches the top of the package; happens because there are two collisions occurring at the same time, and it only responds to the first one. Not sure how to solve this. You could have it adjust position based on multiple collisions with objects. Maybe also after it passes top of wall, suddenly there is only a single object collided with the drone, and because the drone / container is in the middle of the object and the functions haven't been set up to deal with the situation, it somehow defaults the location, perhaps to -100, -100.



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

    //locate the drone and package at the start of the course
    droneHomeX = 75;
    droneHomeY = 75;
    packageHomeX = 100;
    packageHomeY = stage.canvas.height-40;
    
    //build all objects
    buildBackground();
    buildDrone();           //drone before container for proper container bounds
    buildContainer();
    buildWalls();
    buildPackage();
    buildLine();
    buildPauseMenu();
    
    //Add objects to Stage
    stage.addChild(sky, dContainer, line, package, wall1, pauseText);
    
    //Add game objects to array
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
    
    //create bitmap object
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
    drone.landed = false;   //whether drone has landed on a surface
    
    //set bounds
    drone.setBounds(drone.x,drone.y,drone.width,drone.height);
}

function buildPauseMenu() {
    pauseText = new createjs.Text("Game Paused!\nEsc to un-pause.\nQ to quit.", "80px Arial", "#f0e906");
    pauseText.x = stage.canvas.width/2;
    pauseText.y = stage.canvas.height/3.5;
    pauseText.textAlign = "center";
    pauseText.shadow = new createjs.Shadow("#000000", 0, 0, 50);
    pauseText.visible = false; //**maybe make visible false at start, and toggle visible when gamePaused
}

function buildContainer() { //alert("buildContainer()");
    
    //Container
    dContainer = new createjs.Container();
    dContainer.x = dContainer.nextX = droneHomeX;
    dContainer.y = dContainer.nextY = (droneHomeY - drone.height);
    dContainer.speed = 1;
    dContainer.direction = 0; //1 = moving right, -1 = moving left, 0 = straight down
    dContainer.width = drone.width; //match the dimensions of the drone
    dContainer.height = drone.height;
    dContainer.name = "dContainer";
    
    //add drone to dContainer
    dContainer.addChild(drone);
    
    //set bounds based on contents (i.e. drone)
    dContainer.setBounds(dContainer.x, dContainer.y, dContainer.width, dContainer.height);
}

function buildLine(){ //??temp function for diagnosis purposes, TO BE DELETED
    var l = new createjs.Graphics();
    l.beginStroke("black").drawRect(0,0,191,180);
    line = new createjs.Shape(l);
}

function buildPackage(){ //alert("buildPackage());
    
    //create graphics object
    package = new createjs.Shape();
    package.width = package.height = 40;
    package.x = package.nextX = packageHomeX;
    package.y = package.nextY = packageHomeY;
    package.name = "package";
    package.landed = true;     //whether the package is on a platform
    package.direction = 0; //1 = moving right, -1 = moving left, 0 = straight down
    package.speed = 0;
    package.onCollision = neutralResponse; //method to call in case of collision
    
    /*
     It is possible to set a function as a property of an object. In this case, if the object has a collision, we call package.onCollision(); and the function neutralResponse() is then called.
     */

    
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
    wall1.onCollision = neutralResponse;    //method to call in case of collision
    
    //set bounds
    wall1.setBounds(wall1.x, wall1.y, wall1.width, wall1.height);
}





// ------------------Game Mechanics --------------------//

function runGame(e){ //alert("runGame()");
    if(!e.paused){
        
        //update package only if it is moving and not inside the container
        if(!package.carried && !package.landed){
            updatePackage();
            renderPackage();
            detectPackageLanding();
        }
        
        if(!drone.landed){
            updateContainer();
            renderContainer();
        }
        
        
        stage.update();
    }
}


function pauseGame(e) { //alert("pauseGame()");
    createjs.Ticker.paused = !createjs.Ticker.paused;
    pauseText.visible = !pauseText.visible;
    
    /* **unnecessary
    if(gamePaused) {
        createjs.Ticker.paused = !createjs.Ticker.paused;
        pauseText.visible = !pauseText.visible;
        gamePaused = !gamePaused;

    } else {
        createjs.Ticker.paused = !createjs.Ticker.paused;
        pauseText.visible = !pauseText.visible;
        gamePaused = !gamePaused;
    }
     */
    stage.update();
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
    //var collisionList = []; //**fix simultaneous collision bug
    
    //calculate next bounds of target
    targetBounds = target.getBounds();  //current bounds
    targetBounds.x = nextX;
    targetBounds.y = nextY;
    
    for(i = 0; i < gameObjects.length; i++){ //check against each object in array
        
        //get bounds of each object in its local coordinate system
        var current = gameObjects[i];
        objectBounds = current.getBounds();
        
        //determine whether object's Rectangle intersects target's Rectangle
        if(targetBounds.intersects(objectBounds)){  //collision occurred

            //collisionList.push(current); //**fix simultaneous collision bug
            return current; //stop checking for other collisions
        }
    }
    //return collisionList; //**fix simultaneous collision bug
    return "none";  //no collision detected
}


function revisePosition(target, cObject, nextX, nextY){ //alert("revisePosition()");

    var pt = new createjs.Point(0,0); //used to store revised x,y position
    
    //flags indicate positioning relationship between target and collided object
    var above, below, left, right = false;

    //determine the edges of collided object
    var cBounds = cObject.getBounds();
    var cTop = cBounds.y;
    var cBottom = cBounds.y + cBounds.height;
    var cLeft = cBounds.x;
    var cRight = cBounds.x + cBounds.width;
    
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
    else if(left){
        pt.x = cLeft - target.width;
        pt.y = nextY;
        target.direction *= -0.25;
    }
    else if(right){
        pt.x = cRight;
        pt.y = nextY;
        target.direction *= -0.25;
    }

    //need to update the landed property of the original object, if using a clone
    if(target.name === "clone" && target.landed){ //alert("target is clone");
        
        var original = target.cloneOf;
        original.landed = true;
        drone.landed = true;    //if package was the collided object
    }
    
    return pt;      //return the x,y position that target should be moved to
}


function detectEdgeOfFrame(target, nextX, nextY){ //alert("detectEdgeOfFrame()");
    
    //Point used to store revised x,y position
    var pt = new createjs.Point(-100,-100); //-100 is a flag for 'no change made'
    
    //horizontal
    if(nextX < 0){  //left edge
        
        pt.x = 0;
        target.direction *= -0.25;     //bounce
    }
    else if(nextX > stage.canvas.width - target.width){ //right edge
        
        pt.x = stage.canvas.width - target.width;
        target.direction *= -0.25;     //bounce
    }
    //vertical
    if(nextY < 0){  //top edge
        
        pt.y = 0;
    }
    if(nextY > stage.canvas.height - target.height){    //bottom edge
        
        pt.y = stage.canvas.height - target.height;
        target.landed = true;
    }
    
    return pt;
}

function detectPackageLanding(){ //alert("detectPackageLanding");
    
    //check whether package is in game array already
    var index = gameObjects.indexOf(package);
    
    //if package is not in game array and package landed
    //and package is not inside the container, add to game objects array again
    if( index === -1 && package.landed && !package.carried){
        gameObjects.push(package);
    }
}





// --------------------------- Actions --------------------------------- //

function pickup(){ //alert("pickup()");
    
    var index;
    var adjustedX, adjustedY;
    
    
    //remove package from array of game objects
    index = gameObjects.indexOf(package); //get index of package in array
    
    if(index !== -1)    //package is in the array
    {
            gameObjects.splice(index,1);    //remove package from array
    }
    
    //add Package to dContainer
    dContainer.addChild(package);   //adding to dContainer removes from Stage
    
    //update dContainer properties
    dContainer.height += package.height;
    
    //update Package properties
    package.carried = true;
    
    //determine correct position inside container
    adjustedX = (dContainer.width - package.width) /2;
    adjustedY = drone.height;
    
    //move package to exact position
    createjs.Tween.get(package).to({x:adjustedX, y:adjustedY}, 100, createjs.Ease.quadOut);
    
    //adjust package bounds to match position relative to container
    package.setBounds(package.x, package.y, package.width, package.height);
}


function drop(){ //alert("drop()");
    
    //package x,y is relative to dContainer and must be readjusted to stage
    var shiftX = (dContainer.width - package.width) /2;
    var shiftY = drone.height;
    var globalPt = package.localToGlobal(package.x-shiftX, package.y-shiftY);
    
    //move to correct position inside stage
    package.x = package.nextX = globalPt.x;
    package.y = package.nextY = globalPt.y;
    
    //adjusts bounds to match position relative to stage
    package.setBounds(package.x, package.y, package.width, package.height);
    
    //add Package to stage
    stage.addChild(package);    //adding to stage removes from dContainer
    
    //update properties
    package.direction = dContainer.direction;
    package.speed = dContainer.speed;
    package.carried = false;
    package.landed = false;
    
    //update dContainer properties
    dContainer.height -= package.height; //no longer carrying the package
    dContainer.getBounds().height -= package.height; //update height bounds as well
}

function neutralResponse(){ //alert("neutralResponse()");
    //nothing occurs on purpose
}

function hazardResponse(){alert("hazardResponse()");
    //alert("hit hazard. must restart course.");
}

function powerpackResponse(){alert("powerpackResponse()");
    
}





// ---------------------- package update / rendering --------------------------//

//used if package is moving on its own
function updatePackage(){ //alert("updatePackage()");
    
    var cObject; //object package collided with
    var revisedPt; //x,y values needed to adjust after collision / edge of frame
    
    //calculate next position
    var nextX = package.x + (package.speed * package.direction);
    var nextY = package.y + package.speed;  //package only falls
    
    //perform collision detection based on that next position
    cObject = detectCollision(package, nextX, nextY);
    if(cObject !== "none") {  //hit something
        
        cObject.onCollision();
        
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
    if(revisedPt.y !== -100){   //vertical edge of frame occurred
        
        nextY = revisedPt.y;
    }
    
    //update properties
    package.nextX = nextX;
    package.nextY = nextY;
}

function renderPackage(){ //alert("renderPackage()");
    package.x = package.nextX;
    package.y = package.nextY;
    
    //update bounds to match new position
    package.setBounds(package.x, package.y, package.width, package.height);
}



// ---------------------- dContainer update / rendering --------------------------//

function checkChildren(){ //alert("checkChildren()");
    
    var i;
    var shiftX, shiftY; //values represent whether child is shifted inside container
    var nextX, nextY; //next X and Y position of child
    var cObject; //object child collided with
    var globalPt; //represents child's x,y position relative to the stage
    
    //Point for revised position if collision or edge of screen detection occurs
    //values set to detect whether revised point needs to be considered
    var revisedPt = new createjs.Point(-100,-100);
    
    //for each child inside the container
    //perform collision detection based on next position of that child
    //stop after the first child that has a collision
    for(i = 0; i < dContainer.numChildren;i++){
        
        //get child
        var current = dContainer.children[i];
        
        //calculate the amount of shift to child's position inside the container
        shiftX = current.x;
        shiftY = current.y;
        
        //determine next position of child based on properties of container
        //horizontal
        nextX = current.x + (dContainer.speed * dContainer.direction);
        
        //vertical
        if(!drone.up){  //alert("falling");    //drone falling
            nextY = current.y + dContainer.speed;
        }
        else if(drone.up){ //alert("rising"); //drone rising
            nextY = current.y - dContainer.speed;
        }

        //shift calculated position to match if child is shifted in container
        nextX -= shiftX;
        nextY -= shiftY;
        
        //convert shifted position into global coordinate system (relative to stage)
        globalPt = current.localToGlobal(nextX, nextY);
        nextX = globalPt.x;
        nextY = globalPt.y;

        //perform collision detection using this global position
        cObject = detectCollision(current, nextX, nextY);
        
        if(cObject !== "none"){    //hit something
            cObject.onCollision();
            
            //create global replica of child for use in revisePosition()
            //get the x,y position of child relative to stage, including shift
            globalPt = current.localToGlobal(current.x - shiftX, current.y - shiftY);
            var currentClone = new createjs.Shape();
            
            //copy properties of child
            currentClone.x = globalPt.x;
            currentClone.y = globalPt.y;
            currentClone.width = current.width;
            currentClone.height = current.height;
            currentClone.cloneOf = current; //for updating "landed" property
            currentClone.name = "clone";
            
            /*
             a clone is created because the function revisePosition needs to consider where the object currently in relation to the object it is colliding with. We cannot use current because it represents the future position of the object, not its current position.
             */
            
            //determine revised global position based on collision location
            revisedPt = revisePosition(currentClone, cObject, nextX, nextY);
            
            //by removing shift, this revised point now represents the x,y position
            //the container should take to resolve the collision of its child
            revisedPt.x -= shiftX;
            revisedPt.y -= shiftY;
            return revisedPt;
        }
    }
    return revisedPt; //in the case that no child has a collision
}


function updateContainer(){ //alert("updateContainer()");
    
    var revisedPt;
    
    //determine next position of container
    var nextX = dContainer.x;   //current position
    var nextY = dContainer.y;   //current position
    
    dContainer.direction = 0;   //reset direction
    
    //horizontal
    if(aKeyDown){
        dContainer.direction = -1; //move left
        nextX = dContainer.x + (dContainer.speed * dContainer.direction);
    }
    else if(dKeyDown){
        dContainer.direction = 1; //move right
        nextX = dContainer.x + (dContainer.speed * dContainer.direction);
    }
    
    //vertical
    if(!drone.up){ //drone is falling
        
        nextY = dContainer.y + dContainer.speed;
    }
    else if( !drone.landed){//drone is rising
        
        nextY = dContainer.y - dContainer.speed;
    }
    
    //check if a child collides with an object and container position must adjust
    revisedPt = checkChildren();
    if(revisedPt.x !== -100 ){  //collision changed x value
        nextX = revisedPt.x;
        //alert(revisedPt);
    }
    if(revisedPt.y !== -100 ){ //collision change y value
        nextY = revisedPt.y;
    }
    
    //perform edge of frame detection based on that next position
    revisedPt = detectEdgeOfFrame(dContainer, nextX, nextY);
    if(revisedPt.x !== -100){   //horizontal edge of frame occurred
        
        nextX = revisedPt.x;
    }
    if(revisedPt.y !== -100){   //vertical edge of frame occured
        
        nextY = revisedPt.y;
    }
    
    //update properties of dContainer
    dContainer.nextX = nextX;
    dContainer.nextY = nextY;
}


function renderContainer(){ //alert("renderContainer()");
    dContainer.x = dContainer.nextX;
    dContainer.y = dContainer.nextY;
    
    //update bounds to match new position
    dContainer.setBounds(dContainer.x, dContainer.y, dContainer.width, dContainer.height);
    
    //updateChildrenBounds(); **need to revise bounds of each child too??
    
    if(drone.up){
        movePropellers();
    }
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





















