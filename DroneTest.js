

var queue;  // LoadQueue
var stage;  // Stage
var drone;
var aKeyDown, dKeyDown;

var d_beginFillBody;
var d_beginFillPropellorL; //left side of propellor
var d_beginFillPropellorR; //right side of propellor



const A_KEY = 65;
const D_KEY = 68;


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
      
      //drone
      addDrone();
      
      //game objects
      addPackage();
      

      //ticker
      createjs.Ticker.framerate = 60;
      createjs.Ticker.addEventListener("tick", runGame)
      
      //handle keys
      window.onkeydown = moveDroneX;
      window.onkeyup = stopDroneX;
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
    
    
    //create shape object
    drone = new createjs.Shape(d);
    drone.x = drone.y = 50;
    drone.width = 100;
    drone.height = 31;
    drone.up = false;   //dynamically injected property
    drone.landed = false;
    
    //add to stage
    stage.addChild(drone);
    stage.update();
    
}

function addPackage(){
    
}


// --------------------------- game mechanics ----------------------------- //

  function runGame(e) {
      if (!e.paused) {
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

function moveDroneX(e){
    e = !e ? window.event : e;  //if event is not event, get window.event;
    
    switch(e.keyCode) {
        case A_KEY:
            aKeyDown = true;
            break;
        case D_KEY:
            dKeyDown = true;
            break;
    }
}

function stopDroneX(e){
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
    
    if(drone.up){
        movePropellors();
    }
}



// --------------------- collision detection ---------------------- //













