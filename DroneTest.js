

var queue;  // LoadQueue
var stage;  // Stage
var drone, package, birds1;  //game objects
var aKeyDown, dKeyDown, escKeyDown, spacebarDown;
var gameObjects = [];   //contains all game objects



//drone customization
var d_beginFillBody;
var d_beginFillPropellorL; //left side of propellor
var d_beginFillPropellorR; //right side of propellor


var gameOver = false;
var courseOver = false;
const A_KEY = 65;
const D_KEY = 68;
const ESC_KEY = 27;
const SPACEBAR = 32;


// --------------------- startup functions ----------------------//

  function load() { //alert("load()");
      
      queue = new createjs.LoadQueue(false);
      queue.addEventListener("complete", init);
      queue.loadManifest([
          {id:"sky1", src:"Sky1.png"}
      ]);
  }

  function init() { //alert("init()");
      
      //stage
      stage = new createjs.Stage("canvas");

      //background
      addSky();

      //game objects
      addPackage();
      
      //drone
      addDrone();
      addBirds();
      

      //ticker
      createjs.Ticker.framerate = 60;
      createjs.Ticker.addEventListener("tick", runGame)
      
      //handle keys
      window.onkeydown = detectKey;
      window.onkeyup = removeKey;
      window.onmousedown = moveUp;
      window.onmouseup = moveDown;
  }



function addSky(){ //alert("addSky()")
    
    var image = queue.getResult("sky1");
    sky = new createjs.Bitmap(image);
    sky.x = sky.y = 0;
    stage.addChild(sky);
    stage.update();
}

function addDrone() { //alert("addDrone()")
    
    //create graphics object
    var d = new createjs.Graphics();
    
    //propellors
    d.beginFill("lightgrey");
    d_beginFillPropellorL = d.command; //store for later
    d.drawRect(0,0,15,4);   //left side of left propellor
    d.drawRect(70,0,15,4);  //left side of right propellor
    d.endFill();
    d.beginFill("grey");
    d_beginFillPropellorR = d.command;
    d.drawRect(15,0,15,4);  //right side of left propellor
    d.drawRect(85,0,15,4);  //right side of right propellor
    
    //shafts
    d.beginFill("white");
    d.beginStroke("grey");
    d.drawRect(13,4,4,8);   //left shaft
    d.drawRect(83,4,4,8);   //right shaft
    d.endFill();
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
    drone.x = drone.y = 50;
    drone.width = 100;
    drone.height = 33;
    
    //set bounds
    drone.setBounds(drone.x,drone.y,drone.width,drone.height);
    //alert(drone.getBounds());
    
    //dynamically injected property
    drone.up = false;       //whether drone is flying upward
    drone.landed = false;   //whether drone has landed on a surface
    drone.carrying = false; //whether drone is carrying The Package
    drone.inGrabPad = false;  //whether The Package is intersecting grabbing pad
    
    //add to stage
    stage.addChild(drone);
    stage.update();
    
}

function addPackage(){
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
    package.x = 200;
    package.y = 150;
    package.width = 40;
    package.height = 40;
    package.name = "package";
    
    //set bounds
    package.setBounds(package.x, package.y, package.width, package.height);
    
    //dynamically injected property
    package.hazard = false;     //whether object will damage drone/package
    package.grabbed = false;    //whether the drone has 'picked up' the package
    
    //add to stage
    stage.addChild(package);
    stage.update();
    
    //add to gameObject array
    gameObjects.push(package);
}

function addBirds(){
    //create graphics object
    var b = new createjs.Graphics();
    b.beginFill("white");
    b.drawRect(0,0,25,25);
    
    //create shape object
    birds1 = new createjs.Shape(b);
    birds1.x = 400;
    birds1.y = 100;
    birds1.width = 25;
    birds1.height = 25;
    birds1.name = "birds";
    
    //set bounds
    birds1.setBounds(birds1.x, birds1.y, birds1.width, birds1.height);
    
    //dynamically injected property
    birds1.hazard = true;
    
    //add to stage
    stage.addChild(birds1);
    stage.update();
    gameObjects.push(birds1);
}


// --------------------------- game mechanics ----------------------------- //

  function runGame(e) {
      if (!e.paused && !courseOver) {
          if( !drone.landed){   //only update drone if drone is moving
              updateDrone();
              renderDrone();
          }
          stage.update();
      }
  }

  function pauseGame(e) {
      createjs.Ticker.paused = !createjs.Ticker.paused;
  }


// ------------------------- drone mechanics ----------------------------- //

function movePropellors(){
    //simulates rotation of propellors
    if(d_beginFillPropellorR.style === "lightgrey") {
        d_beginFillPropellorR.style = "grey";
        d_beginFillPropellorL.style = "lightgrey";
    }
    else {
        d_beginFillPropellorR.style = "lightgrey";
        d_beginFillPropellorL.style = "grey";
    }
}

function detectKey(e){
    e = !e ? window.event : e;  //if event is not event, get window.event;
    
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
            spacebarDown = true;
            break;
    }
}

function removeKey(e){
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

function moveUp(e){ //alert("moveDroneY()");
    drone.up = true;
    drone.landed = false;
    
}

function moveDown(e){ //alert("moveDroneY()");
    drone.up = false;
}



function updateDrone(){
    
    var nextX = drone.x;
    var nextY = drone.y;
    var nextBounds = drone.getBounds();
    var cObject, cBounds;
    
    
    
    //determine next position for drone
    //horizontal
    if(aKeyDown && !drone.landed){  //drone is moving to the left
        
        nextX = drone.x - 1;
        nextBounds.x -= 1;
    }
    else if(dKeyDown && !drone.landed) { //drone is moving to the right
        
        nextX = drone.x + 1;
        nextBounds.x += 1; //update bounds
    }
    
    //vertical
    if(!drone.up && !drone.landed){ //drone is falling
        
        nextY = drone.y + 1;
        nextBounds.y += 1;
    }
    else if( !drone.landed){         //drone is rising
        
        nextY = drone.y - 1;
        nextBounds.y -= 1;
    }
        
    
    //revise next position for drone
    /*
     There are eight possible types of collisions
     1. Hit bottom
     2. Hit bottom left corner
     3. Hit bottom right corner
     4. Hit left side
     5. Hit right side
     6. Hit top
     7. Hit top left corner
     8. Hit top right corner
     
     
     There are six possible combinations of movement
     1. Up and Left
     2. Up and Right
     3. Up
     4. Down and Left
     5. Down and Right
     6. Down
     
     The position will be revised depending on which types exist.
     */
    
    
    //perform collision detection
    cObject = detectCollision(nextBounds);
    
    if(cObject !== "none" && cObject.hazard){   //hazard collision
        destroyDrone();
    }
    
    if(cObject !== "none" && !cObject.hazard){   //neutral collision
        cBounds = cObject.getBounds();
        //alert("collision!");
        
        //determine revised position based on collision combination
        //down only
        if(!drone.up && !aKeyDown && !dKeyDown){
            //alert("down only");
            //get top y value of collision object
            var top = cBounds.y;
            nextY = top - drone.height; //set drone nextY to this value
            drone.landed = true;
        }
        
        //down, moving left
        else if(!drone.up && aKeyDown){
            //alert("down, moving left");
            
            //check position drone contacts object
            if(cBounds.y < (drone.nextY + drone.height)) { //side hit
                //alert("side hit");
                var rightSide = cBounds.x + cBounds.width;
                nextX = rightSide;
            }
            else {  //top hit
                var top = cBounds.y;
                nextY = top - drone.height; //set drone nextY to this value
                drone.landed = true;
            }
        }
        
        //down, moving right
        else if(!drone.up && dKeyDown){
            //alert("down, moving right");
            
            //check position drone contacts object
            if(cBounds.y < (drone.nextY + drone.height)) { //side hit
                //alert("side hit");
                var leftSide = cBounds.x;
                nextX = leftSide - drone.width;
            }
            else {  //top hit
                var top = cBounds.y;
                nextY = top - drone.height; //set drone nextY to this value
                drone.landed = true;
            }
        }
        
        //up only
        else if(drone.up && !aKeyDown && !dKeyDown){
            //alert("up only");
            //get bottom y value of collision object
            var bottom = cBounds.y + cBounds.height;
            nextY = bottom; //set drone nextY to this value
        }
        
        //up, moving left
        else if(drone.up && aKeyDown){
            //alert("up, moving left");
            
            //check position drone contacts object
            if((cBounds.y + cBounds.height) > drone.nextY ){ //side hit
                //alert("side hit");
                var rightSide = cBounds.x + cBounds.width;
                nextX = rightSide;
            }
            else {  //bottom hit
                var bottom = cBounds.y + cBounds.height;
                nextY = bottom; //set drone nextY to this value
            }
        }
        
        //up, moving right

        else if(drone.up && dKeyDown){
            //alert("up, moving right");
            
            //check position drone contacts object
            if((cBounds.y + cBounds.height) > drone.nextY ){ //side hit
                //alert("side hit");
                var leftSide = cBounds.x;
                nextX = leftSide - drone.width;
            }
            else {  //bottom hit
                var bottom = cBounds.y + cBounds.height;
                nextY = bottom; //set drone nextY to this value
            }
        }
    } //end if collision
    

    
    
    //perform edge of screen detection
    //horizontal
    if(aKeyDown ) {
        if(nextX < 0){  //offscreen to the left
            nextX = 0;
        }
    }
    else if(dKeyDown) {
        if(nextX > stage.canvas.width - drone.width) {
            nextX = stage.canvas.width - drone.width;
        }
    }
    
    //vertical
    if(!drone.up){
        if(nextY > stage.canvas.height - drone.height){
            nextY = stage.canvas.height - drone.height;
            drone.landed = true;
        }
    }
    else {
        if(nextY < 0){
            nextY = 0;
        }
    }
    
    drone.nextX = nextX;    //dynamically injected property
    drone.nextY = nextY;
    
}



function renderDrone(){
    drone.x = drone.nextX;
    drone.y = drone.nextY;
    
    //update bounds to move with drone
    drone.setBounds(drone.x,drone.y,drone.width, drone.height);
    
    if(drone.up){
        movePropellors();
    }
}

function destroyDrone(){
    courseOver = true;
    alert("Drone is destroyed! Course Must Be Retried.");
}



// --------------------- collision detection ---------------------- //

//detects a collision between target and a game object and returns the object hit
function detectCollision(targetBounds){
    
    var i;
    var objectBounds;
    //alert(targetBounds);
    
    for(i = 0; i < gameObjects.length; i++){
        
        //get each game object from array
        var current = gameObjects[i];
        
        //get bounds of each object in its local coordinate system
        objectBounds = current.getBounds();
        
        
        //determine whether two objects intersect
        if(targetBounds.intersects(objectBounds)){
            return current;
        }
    }
    
    return "none";  //no collision detected
}











