//============================================================================//
//                                 Overview                                   //
//============================================================================//
/*
 Dynamically injected properties include:
 
 - carried
 - direction
 - height
 - isContainer
 - landed
 - nextX
 - nextY
 - onCollision
 - speed
 - width
 - up
 
 It is possible to set a function as a property of an object. Certain objects have
 the property "onCollision". The idea is that if an object is collided into, we call 
 
    <that object>.onCollision(); 
 
 and the function referenced there is called. For the case of a Flock-Of-Birds, 
 onCollision is set to hazardResponse. If a Flock-Of-Birds is collided into by 
 a moving object, the hazardResponse() method will be called, which ends the course.
 
 
 
 Code organized by:
 - Overview
 - Variables
 - Startup Functions
 - Courses
 - Game GUI
 - Game Objects
 - game mechanics
 - collision detection
 - game actions
 - movable object update / rendering
 - animation
 
 
 **Bug 3.01 If land on surface while carrying package, then let go of package, then grab again, sometimes the package sinks below the surface, and when you grab it again, it got the values -30,-33. Has something to with the shiftX, shiftY in Step 2 B of the updatePosition() method. For now, I mitigated it by only choosing to update to point values that are greater than or equal to zero.
 
 */


//============================================================================//
//                                variables                                   //
//============================================================================//

//keycodes represent certain keys on the keyboard
const A_KEY = 65;
const D_KEY = 68;
const ESC_KEY = 27;
const SPACEBAR = 32;

//diagnostic
var debugText;

//createjs objects
var queue, stage;

//game objects
var dContainer, drone, parcel, ocean, dropZone;
var pauseText;
var waveInterval; //reference to window interval for wave animation

//starting positions per course
var droneHomeX, droneHomeY, parcelHomeX, parcelHomeY;

//drone customization
var d_beginFillBody;
var d_beginFillPropellerL; //left side of propeller
var d_beginFillPropellerR; //right side of propeller


//variables with values
var gameObjectsArr = [];   //contains all game objects not in dContainer
var movingArr = [];        //contains all moving objects not in a container
var aKeyDown = dKeyDown = escKeyDown = spacebarDown = false; //keyboard input flags
var gameOver = courseOver = false;



//============================================================================//
//                                startup functions                           //
//============================================================================//

function load() { //alert("load()");

    queue = new createjs.LoadQueue(false);
    queue.addEventListener("complete", init);
    queue.loadManifest([
        {id:"sky1", src:"Sky1.png"},    //day
        {id:"sky2", src:"Sky2.png"}     //night
    ]);
}

function init() { //alert("init()");
    
    stage = new createjs.Stage("canvas");
    
    
    buildCourse1();
    buildGUI();
    startGame();
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
    
    //animation
    waveInterval = window.setInterval(moveWaves, 1000);
}

//============================================================================//
//                                    courses                                 //
//============================================================================//

function buildCourse1(){ //alert("buildCourse1()");
    
    //locate the drone and parcel at the start of the course
    droneHomeX = 5;
    droneHomeY = 145;
    parcelHomeX = 130;
    parcelHomeY = 105;
    
    //add game neutral objects
    buildBackground("sky1");
    buildWall(0,150,175,15,"black");    //starting platform drone and parcel
    buildWall(275,0,10,400,"black");
    buildWall(425,250,10,265,"black");
    buildWall(425,250,300,10,"black");
    buildWall(700,500,100,10,"black");
    buildWall(435,500,150,15,"black");  //drop zone platform
    buildDropZone2(434, 350, 150,150, "blue");

    //add game hazards
    buildOcean(10,10,15,0,20);
    
    //add actors
    buildDrone();
    buildContainer();   //drone before container for proper container bounds
    buildParcel();
    
    stage.update();
}





 
//============================================================================//
//                                  game gui                                  //
//============================================================================//

function buildGUI(){ //alert("buildGUI()");
    
    buildPauseMenu();

    //diagnostic
    //buildLine();
    buildDebugText();
}

function buildPauseMenu() { //alert("buildPauseMenu()");
    
    pauseText = new createjs.Text("Game Paused!\n\nESC to resume.\nSPACEBAR to restart.", "40px Arial", "#f0e906");
    pauseText.x = stage.canvas.width/2;
    pauseText.y = stage.canvas.height/3.5;
    pauseText.textAlign = "center";
    pauseText.shadow = new createjs.Shadow("#000000", 0, 0, 50);
    pauseText.visible = false;
    
    stage.addChild(pauseText);
}

function buildLine(){ //for diagnostic purposes

    var line = new createjs.Shape();
    line.graphics.beginStroke("red").drawRect(0,0,268,107);
    stage.addChild(line);
}

/* 
 Function adds a Text display object to display object properties during game.
 */
function buildDebugText(){  //alert("buildDebugText()");//for diagnostic purposes
    
    debugText = new createjs.Text("", "15px Arial", "red");
    debugText.x = debugText.y = 10;
    stage.addChild(debugText);
}


//============================================================================//
//                               game objects                                 //
//============================================================================//

function buildBackground(target){//alert("buildBackground()");
    
    var image = queue.getResult(target);
    
    //create bitmap object
    var sky = new createjs.Bitmap(image);
    sky.x = sky.y = 0;
    stage.addChild(sky);
}

function buildWall(x,y,w,h, color){ //alert("buildWall()");
    
    //create shape object
    var wall = new createjs.Shape();
    wall.x = x;
    wall.y = y;
    wall.width = w;
    wall.height = h;
    wall.name = "wall";
    wall.onCollision = neutralResponse;
    wall.graphics.beginFill(color).drawRect(0,0,wall.width, wall.height);
    
    //set bounds for collision detection
    wall.setBounds(wall.x, wall.y, wall.width, wall.height);
    stage.addChild(wall);
    gameObjectsArr.push(wall);  //add to collidable objects
}

function buildDropZone2(x,y,w,h,color){
    
    //rectangular zone
    dropZone = new createjs.Shape();
    dropZone.x = x;
    dropZone.y = y;
    dropZone.width = w;
    dropZone.height = h;
    dropZone.name = "dropZone";
    dropZone.onCollision = dropZoneResponse;
    dropZone.setBounds(dropZone.x, dropZone.y, dropZone.width, dropZone.height);
    dropZone.graphics.beginStroke("black").beginFill(color).drawRect(0,0,dropZone.width, dropZone.height);
    dropZone.alpha = 0.3;
    stage.addChild(dropZone);
    gameObjectsArr.push(dropZone);  //add to collidable objects
    
    //text in zone
 
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
    
    //grabbing pad, area to be positioned on parcel in order to pick it up
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
    dContainer.isContainer = true;
    dContainer.landed = false;
    
    //add drone to dContainer
    dContainer.addChild(drone);
    
    //set bounds based on contents (i.e. drone)
    dContainer.setBounds(dContainer.x, dContainer.y, dContainer.width, dContainer.height);
    
    stage.addChild(dContainer);
    movingArr.push(dContainer);
}

function buildParcel(){ //alert("buildParcel());
    
    //create graphics object
    parcel = new createjs.Shape();
    parcel.width = parcel.height = 40;
    parcel.x = parcel.nextX = parcelHomeX;
    parcel.y = parcel.nextY = parcelHomeY;
    parcel.name = "parcel";
    parcel.landed = false;     //whether the parcel is on a platform
    parcel.direction = 0; //1 = moving right, -1 = moving left, 0 = straight down
    parcel.speed = 2;
    parcel.onCollision = neutralResponse; //method to call in case of collision
    parcel.isContainer = false;
    parcel.carried = false;
    
    //graphics
    parcel.graphics.beginFill("#aa8e67").drawRect(0,0,parcel.width,parcel.height);
    parcel.graphics.beginFill("#e1dcd5").drawRect(0,17,parcel.width,6).drawRect(17,0,6,parcel.height).endFill();
    parcel.graphics.beginStroke("black").drawRect(0,0,parcel.width,parcel.height);

    //set bounds
    parcel.setBounds(parcel.x, parcel.y, parcel.width, parcel.height);
    
    stage.addChild(parcel);
    movingArr.push(parcel);
}

function buildOcean(n, h, depth, a, b){

    var i;
    var w = (stage.canvas.width / n);   //width of a wave
    var bezierCommands = [];
    
    //create Shape
    ocean = new createjs.Shape();
    
    //properties
    ocean.x = 0;
    ocean.y = stage.canvas.height - (h + depth);
    ocean.graphics.beginFill("lightskyblue");
    ocean.graphics.drawRect(0,h,stage.canvas.width, 15);
    ocean.graphics.beginStroke("blue").beginFill("lightskyblue");
    ocean.onCollision = hazardResponse;
    
    ocean.setBounds(ocean.x, ocean.y+(h/2), stage.canvas.width, (h + depth));
    
    //construct the individual bezier curves
    for(i = 0; i < n; i++){
        
        ocean.graphics.moveTo(ocean.x+w*i,h);
        ocean.graphics.bezierCurveTo((w/2 + w*i),a,(w/2 + w*i),b,(w + w*i),h);
        bezierCommands.push(ocean.graphics.command);    //add each curve to array
    }
    ocean.curves = bezierCommands;  //store in ocean object
    
    
    stage.addChild(ocean);      //add to stage
    gameObjectsArr.push(ocean); //add to collidable objects
}




//============================================================================//
//                              game mechanics                                //
//============================================================================//

function runGame(e){ //alert("runGame()");
    var i;
    
    if(!e.paused){
        
        detectLanding(parcel);

        for(i = 0; i < movingArr.length; i++){
            
            if(!movingArr[i].landed) {
                updatePosition(movingArr[i]);
                renderPosition(movingArr[i]);
                //alert(movingArr[i]);
            }
        }

        debugText.text = "Dropzone intersects dContainer?: " + dropZone.getBounds().intersects(dContainer.getBounds()) + "\t Carried: " + parcel.carried + "\t Landed: " + dContainer.landed;

        stage.update();
    }
}


function pauseGame(e) { //alert("pauseGame()");
    createjs.Ticker.paused = !createjs.Ticker.paused;
    pauseText.visible = !pauseText.visible;
    stage.update();
    
    if(createjs.Ticker.paused){
        window.clearInterval(waveInterval); //remove interval from window
    } else{
        waveInterval = window.setInterval(moveWaves, 1000); //add interval to window
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
            else if (!parcel.carried){
                checkPickup(parcel);
            }
            else if (parcel.carried){
                drop(parcel);
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
    }
}

function moveUp(e){ //alert("moveUp()");
    
    drone.up = true;
    drone.landed = dContainer.landed = false;
    
    if(parcel.carried) {
        parcel.landed = false;
    }
}

function moveDown(e){ //alert("moveDown()");
    
    drone.up = false;
}




//============================================================================//
//                              collision detection                           //
//============================================================================//

function detectCollision(target, nextX, nextY){ //alert("detectCollision()");
    
    var i,objectBounds, targetBounds;
    var collisionList = [];
    
    //calculate next bounds of target
    targetBounds = target.getBounds();  //current bounds
    targetBounds.x = nextX;
    targetBounds.y = nextY;
    
    for(i = 0; i < gameObjectsArr.length; i++){ //check against each object in array
        
        //get bounds of each object in its local coordinate system
        var current = gameObjectsArr[i];
        objectBounds = current.getBounds();
        
        //determine whether object's Rectangle intersects target's Rectangle
        if(targetBounds.intersects(objectBounds)){  //collision occurred

            collisionList.push(current);
        }
    }
    return collisionList;
}


function revisePosition(target, cObject, nextX, nextY, revisedArr){ //alert("revisePosition()");

    var pt = new createjs.Point(0,0); //used to store revised x,y position
    
    //flags indicate positioning relationship between target and collided object
    var above = below = left = right = false;

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
        dContainer.landed = true;    //if parcel was the collided object
    }
    
    //compare pt against all revised points created in the same collision
    pt = mostRestrictive(target, revisedArr, pt);
    //alert(pt);
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


function mostRestrictive(target, revisedArr, pt){//alert("mostRestrictive()");
    //returns the more restrictive of two or more points, based on relationship to both objects you are colliding with
    
    //compare target against each point in revisedArr and against pt
    //whichever is most restrictive is retained and returned
    
    var i, x1, x2, y1, y2;
    var mostRestrictivePt = pt; //default
    
    for(i = 0; i < revisedArr.length; i++){
        
        //determine most restrictive x value
        x1 = Math.abs(target.x - mostRestrictivePt.x);
        x2 = Math.abs(target.x - revisedArr[i].x);
        
        if( x2 < x1){
            mostRestrictivePt.x = revisedArr[i].x;
            //alert(mostRestrictivePt.x);
        }

        
        //determine most restrictive y value
        y1 = Math.abs(target.y - mostRestrictivePt.y);
        y2 = Math.abs(target.y - revisedArr[i].y)
        
        if( y2 < y1){
            mostRestrictivePt.y = revisedArr[i].y;
            //alert(mostRestrictivePt.y);
        }
    }
    return mostRestrictivePt;
}

//============================================================================//
//                                game actions                                //
//============================================================================//
function checkPickup(target){
    
    var droneBounds, targetBounds;
    
    if(dContainer.landed){  //must land to pick up objects
        
        //get current bounds of drone
        droneBounds = drone.getBounds();
        
        //adjust to reduce pickup area to black grabbing pad only
        droneBounds.x += (drone.width - 24)/2;
        droneBounds.width = 24;
        //alert(droneBounds);
        
        //get target bounds to compare against
        targetBounds = target.getBounds();
        
        if(droneBounds.intersects(targetBounds)){
            //alert("intersect");
            pickup(target);
        }
    }
}


function pickup(target){ //alert("pickup()");
    
    var index;
    var adjustedX, adjustedY;
    
    
    //remove parcel from array of game objects
    index = gameObjectsArr.indexOf(target); //get index of parcel in array
    
    if(index !== -1)    //parcel is in the array
    {
            gameObjectsArr.splice(index,1);    //remove parcel from array
    }
    
    //alert(movingArr.indexOf(parcel));
    
    //add Package to dContainer
    dContainer.addChild(target);   //adding to dContainer removes from Stage
    
    //update dContainer properties
    dContainer.height += target.height;
    
    //update Package properties
    target.carried = true;
    //alert("carried");
    
    //determine correct position inside container
    adjustedX = (dContainer.width - target.width) /2;
    adjustedY = drone.height;
    target.x = adjustedX;
    target.y = adjustedY;
    
    //move parcel to exact position
    //createjs.Tween.get(target).to({x:adjustedX, y:adjustedY}, 100, createjs.Ease.quadOut);
    
    //adjust parcel bounds to match position relative to container
    target.setBounds(target.x, target.y, target.width, target.height);
    //alert("Container: " + dContainer.x + "," + dContainer.y + "," + dContainer.height + "\nParcel: " + target.x +"," + target.y);
}


function drop(target){ //alert("drop()");
    
    //parcel x,y is relative to dContainer and must be readjusted to stage
    var shiftX = (dContainer.width - target.width) /2;
    var shiftY = drone.height;
    var globalPt = target.localToGlobal(target.x-shiftX, target.y-shiftY);
    
    //update properties
    target.direction = dContainer.direction;
    target.speed = dContainer.speed + 2;
    target.carried = false;
    target.landed = false;
    
    //move to correct position inside stage
    target.x = target.nextX = globalPt.x;
    target.y = target.nextY = globalPt.y;//-target.speed;
    
    //adjusts bounds to match position relative to stage
    target.setBounds(target.x, target.y, target.width, target.height);
    
    //add Package to stage
    stage.addChild(target);    //adding to stage removes from dContainer
    
    //add Package to movingArr
    //alert("drop" + parcel.landed);
    
    if(!dContainer.landed){ //mid-air drop
        movingArr.push(target);
    } else {
        gameObjectsArr.push(parcel);
    }
    
    //update dContainer properties
    dContainer.height -= target.height; //no longer carrying the parcel
    dContainer.getBounds().height -= target.height; //update height bounds as well
}

function neutralResponse(){ //alert("neutralResponse()");
    //nothing occurs on purpose
}

function hazardResponse(){alert("hazardResponse()");
    //alert("hit hazard. must restart course.");
}


function dropZoneResponse() { //alert("dropZoneResponse()");
    //alert("carried: " + parcel.carried + "," + "landed: " + dContainer.landed)

    if(parcel.carried && dContainer.landed) {
        alert("You Win!");
    }

}



//============================================================================//
//                      movable object update / rendering                     //
//============================================================================//


//helper
function calcNextPosition(target){
    
    var nextX = target.x;   //current position
    var nextY = target.y;   //current position
    
    if(target.isContainer){
        
        //movement is controlled by user input
        target.direction = 0;   //reset value
        
        //horizontal
        if(aKeyDown){
            target.direction = -1; //move left
            nextX = target.x + (target.speed * target.direction);
        }
        else if(dKeyDown){
            target.direction = 1; //move right
            nextX = target.x + (target.speed * target.direction);
        }
        
        //vertical
        nextY = drone.up ? (target.y - target.speed) : (target.y + target.speed);
        
    } else {    //target is not a container
        
        nextX = target.x + (target.speed * target.direction);
        nextY = (target.y + target.speed);  //can only fall downward
    }
    
    return new createjs.Point(nextX, nextY);
}

//helper
function performCollisionDetection(target, nextX, nextY){

    var collisionArr = [];
    var shiftX = shiftY = 0;    //default value
    
    if(target.parent !== stage){ //child of a container
        
        //determine amount child is shifted inside its container
        shiftX = target.x;
        shiftY = target.y;

        //shift nextX and nextY to detect collisions with this child
        collisionArr = detectCollision(target, nextX + shiftX, nextY + shiftY);
    }
    else { //not a child
        //use nextX, nextY to detect collisions
        collisionArr = detectCollision(target, nextX, nextY);
    }
    return collisionArr;
}

/*
 a clone is created because the function revisePosition() needs to consider where the child currently is in relation to the object it is colliding with in order to properly calculate what to do. We cannot use the child itself because it represents the future position of the object, not its current position.
 */

//helper
function getChildClone(child){
    
    var globalPt;

    //Shape
    var childClone = new createjs.Shape();
    
    //calculate global x,y of child original location, relative to stage
    globalPt = child.localToGlobal(0,0);
    childClone.x = globalPt.x;
    childClone.y = globalPt.y;
    
    //copy properties of child
    childClone.width = child.width;
    childClone.height = child.height;
    childClone.cloneOf = child; //for updating "landed" property of real child
    childClone.name = "clone";
    
    return childClone;
}

//helper
function performPositionRevision(target, collisionArr, nextX, nextY){
    var i;
    var pt;
    var possiblePts = [];
    
    //consider each object that collided with the target
    for( i = 0; i < collisionArr.length; i++){


        collisionArr[i].onCollision(); //what other object does in collision

        if(collisionArr[i].name != "dropZone") {
            //determine revised global position based on collision situation
            pt = revisePosition(target, collisionArr[i], nextX, nextY, possiblePts);
            nextX = pt.x;
            nextY = pt.y;

            //add to array to compare against results from other collided objects
            possiblePts.push(pt);
        }
    } //end for loop

    return new createjs.Point(nextX, nextY);
}



function updatePosition(target){
    
    //variables used in function
    var i;
    var nextX, nextY;
    var collisionArr = [];  //array to hold all objects target / child collides with
    var pt;                 //position to move target to for resolving collision
    var possibleChildPts = [];
    
    //Step 1 - calculate next position of target
    pt = calcNextPosition(target);
    nextX = pt.x;
    nextY = pt.y;
    //if(target.name === "parcel"){alert(nextX +"," + nextY);}
    //Step 2 - perform collision detection based on that next position
    if(target.isContainer){
        
        pt.x = pt.y = -100; //flag value for no change needed
        
        //Step 2 A - perform these calculations for every child
        for( i = 0; i < target.numChildren; i++){
            
            //get child
            var child = target.children[i];
            
            //perform collision detection
            collisionArr = performCollisionDetection(child, nextX, nextY);
            
            //perform position revision
            if(collisionArr.length > 0){ //hit something
                //alert(collisionArr);
                //create a copy of child to compare original position w/ objects
                var childClone = getChildClone(child);

                //use copy to find a revised position
                //shift nextX and nextY to correspond to child, not container
                pt = performPositionRevision(childClone, collisionArr, nextX+child.x, nextY+child.y);
                
                //remove shift from chosen revised position
                pt.x -= child.x;    //x shift of child inside container
                pt.y -= child.y;    //y shift of child inside container
                
                possibleChildPts.push(pt);  //store for comparison later
            }
       
        } // end for
        
        //determine most restrictive of the child points
        pt = mostRestrictive(target, possibleChildPts, pt);
  
                             
        //Step 2 B - after processing children check if nextX, nextY needs changing
        if(pt.x >= 0) { //collision changed x value
            nextX = pt.x;
            //alert(pt); //**for some reason, got -30,-33 here
        }
        if(pt.y >= 0){ //collision changed y value
            nextY = pt.y;
        }
        
    } //end collision detection for container
    else { //target is not a container

        //perform collision detection
        collisionArr = performCollisionDetection(target, nextX, nextY);

        //perform position revision
        if(collisionArr.length > 0){ //hit something
            //alert(collisionArr);
            pt = performPositionRevision(target, collisionArr, nextX, nextY);
            //alert(pt);
        } //end if
    } //end collision detection for standalone object
    
    
    
    //Step 3 - perform edge-of-frame detection based on that next position
    pt = detectEdgeOfFrame(target, nextX, nextY);
    //alert(pt);
    if(pt.x !== -100){ //horizontal edge-of-frame occurred
        nextX = pt.x;
    }
    if(pt.y !== -100){  //vertical edge-of-frame occurred
        nextY = pt.y;
    }

    //Step 4 - update properties of target
    target.nextX = nextX;
    target.nextY = nextY;
}


function renderPosition(target){
    //if(target.name === "parcel"){alert(target.nextX + "," + target.nextY);}
    //move target to calculated next position
    target.x = target.nextX;
    target.y = target.nextY;
    
    //update bounds to match new position
    target.setBounds(target.x, target.y, target.width, target.height);
    
    if(target.isContainer){
        updateChildrenBounds(target, target.x, target.y);
    }
    
    
    if( target.isContainer && drone.up){
        movePropellers();
    }
}


function detectLanding(target){ //alert("detectLanding()");
    
    //check whether parcel is in game array already
    var index = gameObjectsArr.indexOf(target);
    
    //if parcel is not in game array and parcel landed
    //and parcel is not inside the container, add to game objects array
    if( index === -1 && !target.carried && target.landed){
        gameObjectsArr.push(target);
        //alert("landed");
    }
    
    //if parcel is in the movingArray, remove it
    index = movingArr.indexOf(target);
    if(target.landed && index !== -1)
    {
        movingArr.splice(index,1);
        //alert(movingArr.indexOf(target));
        //alert(target.x +"," + target.y);
    }
}

function updateChildrenBounds(container, cX, cY){
    
    var i, xShift, yShift;
    for(i = 0; i < container.numChildren; i++){
        
        var child = container.children[i];
        //alert(child.getBounds());
        xShift = child.x;
        yShift = child.y;
        
        //child bounds set to correspond to bounds relative to stage
        child.setBounds(container.x + xShift, container.y + yShift, child.width, child.height);
    }
}


//============================================================================//
//                                  animation                                 //
//============================================================================//

//drone animation
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


//ocean animation
function moveWaves(e){

    var i, cp1y, cp2y, temp;
    var waveArr = ocean.curves;

        for(i = 0; i < waveArr.length; i++){
            
            cp1y = waveArr[i].cp1y;
            cp2y = waveArr[i].cp2y;
            //alert(cp1y +"," + cp2y);
            //switch the cp1y and cp2y values for each Graphics.BezierCurveTo object
            temp = cp1y;
            waveArr[i].cp1y = cp2y;
            waveArr[i].cp2y = temp;
        }
}




/*
 //deprecated
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
 wall1.onCollision = neutralResponse;
 
 //set bounds
 wall1.setBounds(wall1.x, wall1.y, wall1.width, wall1.height);
 
 //wall 2
 var w2 = new createjs.Graphics();
 w2.beginFill("black").drawRect(0,0,300,10);
 
 wall2 = new createjs.Shape(w2);
 wall2.x = wall1.x+10;
 wall2.y = 250;
 wall2.width = 300;
 wall2.height = 10;
 wall2.name = "wall2";
 wall2.onCollision = neutralResponse; //method to call in case of collision
 
 //set bounds
 wall2.setBounds(wall2.x, wall2.y, wall2.width, wall2.height);
 }
 */


//deprecated
/*
 function buildDropZone(wall){
 
 var dz = new createjs.Graphics();
 dz.beginStroke("#0204FA").beginFill("#2FC4FA").drawRect(0,0,50,50);
 
 dropZone = new createjs.Shape(dz);
 
 dropZone.alpha = 0.3;
 
 dropZone.x = wall.x + (wall.width / 2) - 25;
 dropZone.y = wall.y - 51 ;
 dropZone.name = "dropZone";
 dropZone.onCollision = dropZoneResponse;
 dropZone.setBounds(dropZone.x, dropZone.y, 50, 50);
 
 }
 */


/*
 //deprecated
 function buildGameObjects(){//alert("buildgameObjectsArr()");
 
 //build all objects
 buildBackground();
 buildDrone();           //drone before container for proper container bounds
 buildContainer();
 buildWalls();
 buildParcel();
 buildLine();
 buildPauseMenu();
 buildDropZone(wall2);
 buildOcean(10,10,15,0,20);
 
 // adding a Text display object to display properties during game
 debugText = new createjs.Text("", "15px Arial", "black");
 debugText.x =10;
 debugText.y = 10;
 
 //Add all objects to Stage except drone (drone was added to dContainer)
 stage.addChild(sky, dContainer, parcel, wall1, wall2, line, ocean, pauseText, dropZone, debugText);
 
 //Add game objects to array
 gameObjectsArr.push(wall1, wall2, dropZone,ocean);
 
 //add objects to moving array
 movingArr.push(dContainer, parcel);
 
 stage.update();
 }
 */



