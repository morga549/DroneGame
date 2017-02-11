

var queue;  // LoadQueue
var stage;  // Stage
var drone;  //Junior the Drone
var package;    //The Package
var aKeyDown, dKeyDown, escKeyDown, spacebarDown;
var gameObjects = [];   //contains all game objects


//drone customization
var d_beginFillBody;
var d_beginFillPropellorL; //left side of propellor
var d_beginFillPropellorR; //right side of propellor



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
    drone.height = 31;
    
    //set bounds
    drone.setBounds(drone.x,drone.y,drone.width,drone.height);
    
    //dynamically injected property
    drone.up = false;       //whether drone is flying upward
    drone.landed = false;   //whether drone has landed on a surface
    drone.carrying = false; //whether drone is carrying The Package
    
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
    package.x = 70;
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


// --------------------------- game mechanics ----------------------------- //

  function runGame(e) {
      if (!e.paused) {
          detectCollision();
          updateDroneX();
          updateDroneY();
          renderDrone();
          stage.update();
          
          
      }    
  }

  function pauseGame(e) {
      createjs.Ticker.paused = !createjs.Ticker.paused;
  }


// ------------------------- drone mechanics ----------------------------- //

function movePropellors(){
    //rotate propellors
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



function updateDroneX(){
    
    var nextX = drone.x;
    if(aKeyDown && !drone.landed){
        nextX = drone.x - 1;
        
        if(nextX < 0){  //offscreen to the left //??collision detection
            nextX = 0;
        }
    }
    else if(dKeyDown && !drone.landed) {
        nextX = drone.x + 1;
        if(nextX > stage.canvas.width - drone.width) {
            nextX = stage.canvas.width - drone.width;
        }
    }
    drone.nextX = nextX;    //dynamically injected property
    
}

function updateDroneY(){//alert(!drone.up);
    
    var nextY = drone.y;
    if(!drone.up){ //drone is falling
        nextY = drone.y + 1;
        
        if(nextY > stage.canvas.height - drone.height){
            nextY = stage.canvas.height - drone.height;
            drone.landed = true;
        }
    }
    else{
        nextY = drone.y - 1;
        
        if(nextY < 0){
            nextY = 0;
        }
    }
    drone.nextY = nextY; //dynamically injected property
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



// --------------------- collision detection ---------------------- //

//detects a collision between drone/package and returns the object hit
function detectCollision(){
    
    var i;
    var objectBounds;
    var droneBounds = drone.getBounds();
    
    
    for(i = 0; i < gameObjects.length; i++){
        
        //get each game object from array
        var current = gameObjects[i];
        
        //get bounds of each object in its local coordinate system
        objectBounds = current.getBounds();
        
        
        if(droneBounds.intersects(objectBounds)){
            //alert("collision: " + current.hazard)
        }
        
        
    }
    
}











