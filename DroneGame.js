//============================================================================//
//                              Table of Contents                             //
//============================================================================//
/*
 
Code organized by:
- Variables
- Startup Functions
- Game Input
- Game mechanics
- Game GUI
- Courses
- Game Objects
- collision detection
- game actions
- movable object update / rendering
- animation
- debugging
*/

//============================================================================//
//                                variables                                   //
//============================================================================//

//CONSTANTS
//integers represent the keycode of certain keys on the keyboard
const A_KEY = 65;
const D_KEY = 68;
const ESC_KEY = 27;
const SPACEBAR = 32;

//amount of time in milliseconds for a given course
const COURSE_1_TIME = 1000*60*3;    //3 min

//animation
const WAVE_INT = 1000;  //length in ms of the interval for wave movement

//drone
const UP_SPEED = 1;     //default speed for Drone


//VARIABLES
//createjs objects
var queue;  //object uses Preload library of createjs to load images
var stage;  //container into which everything else is put
var spriteSheet;
var ssData;

//game objects
var dContainer; //container that holds Drone and any object that is picked up
var drone;      //drone the player flies around
var parcel;     //the item the player must deliver to the Drop Zone
var ocean;      //hazard forming the bottom of the playing area
var dropZone;   //Drop Zone is an area player must deliver the parcel to
var bird1;      //hazard

//GUI objects
var pauseText;  //text that is visible when game is paused
var timerText;  //displays the remaining time in the course
var pauseRect;  //white rectangle that text appears in front of at game start
var startupText;//gameplay explanation displayed at game start
var loadScreen; //reference to bitmap image object displayed before game start

//additional variables
var startTime;                  //contains the time allowed for a given course
var droneHomeX, droneHomeY;     //starting position of drone for a course
var parcelHomeX, parcelHomeY;   //starting position of parcel for a course
var waveAnimation;              //ref window interval object for ocean animation
var d_drawRectPropellerL;       //reference to graphics command objects
var d_drawRectPropellerR;       //(see readme for more information)

//diagnostic
var debugText;                  //used to diagnose certain game issues

//drone customization for future gameplay
var d_beginFillBody;            //in the case of Drone upgrades


//VARIABLES WITH VALUES
//variables with values
var gameObjectsArr = [];        //contains all game objects not in dContainer
var movingArr = [];             //contains all moving objects not in a container
var aKeyDown = dKeyDown = escKeyDown = spacebarDown = false; //keyboard input flags
var gameOver = courseOver = false;  //game flags
var currentCourse = 1;  //contains the number of the current course being played





//============================================================================//
//                                startup functions                           //
//============================================================================//

/**
 Function loads images needed for the game into the LoadQueue.
 After loading is complete, function calls init().
 */
function load() { //alert("load()");

    queue = new createjs.LoadQueue(false);
    queue.addEventListener("complete", init);   //"complete" event for LoadQueue
    queue.loadManifest([                        //standard method to load images
        {id:"sky1", src:"Sky1.png"},            //day background
        {id:"sky2", src:"Sky2.png"},            //night background
        {id:"startup", src:"Startup.png"}       //startup image
    ]);

    ssData = {
        images: ["Bird1.png"],
        frames: {width:200, height:176},
        animations: {flap:[0,1]},
        framerate: 2
    };
}


/**
 Function initializes the stage object, builds the loadScreen Bitmap displayed at game startup, adds it to stage, initializes the Ticker, and Tweens loadScreen to fade out. After fade out, function calls buildGame().
 */
function init() { //alert("init()");
    
    //build stage
    stage = new createjs.Stage("canvas");
    
    //build loading screen
    var image = queue.getResult("startup");
    loadScreen = new createjs.Bitmap(image);
    loadScreen.x = loadScreen.y = 0;
    stage.addChild(loadScreen);
    
    //Ticker must be initialized to show fade out
    createjs.Ticker.framerate = 60;
    createjs.Ticker.addEventListener("tick", function(e) { stage.update(e); });
    createjs.Ticker.timingMode = createjs.Ticker.RAF_SYNCHED;
    
    //waits 2 seconds, changes alpha property of loadScreen to 0 over 2 seconds
    //calls buildGame method when this change is complete
    createjs.Tween.get(loadScreen).wait(2000).to({alpha:0}, 2000).call(buildGame);
}


/**
 Function performs all operations necessary to initialize and display game content for a single course. It finishes by displaying the Gameplay Explanation.
 */
function buildGame(){ //alert("removeStartup()");
    
    //remove unnecessary object from stage
    if(stage.contains( loadScreen)){
        stage.removeChild(loadScreen);
    }
    
    //Ticker must be reset to display correct time with Game Timer
    createjs.Ticker.reset(); //remove all event listeners and restart runGame time
    
    //build all objects needed for game
    buildCourse(currentCourse);
    buildGUI(); //after building course, so that text appears over image
    
    //explanation of gameplay
    buildPauseRect(500,300,"white");
    buildStartUpMessage();
    window.onkeydown = startGame;       //adds event listener to Window for key press
}

/**
 Function performs all operations necessary to start gameplay.
 */
function startGame(e){ //alert("startGame()");

    if(e.keyCode == SPACEBAR){
        
        //remove event listener to prevent event duplication
        e.target.removeEventListener("onkeydown", startGame);
        
        //remove unnecessary objects from stage
        stage.removeChild(pauseRect, startupText);

        //Ticker
        createjs.Ticker.framerate = 60; //set frames per second
        createjs.Ticker.addEventListener("tick", runGame);  //call runGame per "tick"
        //createjs.Ticker.timingMode = createjs.Ticker.RAF_SYNCHED;   //??add here?
        
        //listen for key / mouse events
        window.onkeydown  = detectKey;  //listener calls detectKey() for "keydown"
        window.onkeyup = removeKey;     //listener calls removeKey() for "keyup"
        window.onmousedown = moveUp;    //listener calls moveUp() for "mousedown"
        window.onmouseup = moveDown;    //listener calls moveDown() for "mouseup"
        
        //animation for ocean done through window not Ticker
        waveAnimation = window.setInterval(moveWaves, WAVE_INT);
    }
}

/**
 Function performs all operations necessary to restart game from beginning.
 Restart does not go through Loading Screen.
 */
function restartGame(e){ //alert("restartGame()");
    
    //clear the stage
    stage.clear();
    
    //clear game arrays
    gameObjectsArr = [];
    movingArr = [];
    
    //remove event listeners from window to prevent event duplication
    window.removeEventListener("keydown", detectKey);
    window.removeEventListener("keyup", removeKey);
    window.removeEventListener("mousedown", moveUp);
    window.removeEventListener("mouseup", moveDown);
    
    createjs.Ticker.paused = false;  //unpause Ticker
    
    //rebuild game objects
    buildGame();
}




//============================================================================//
//                                game input                                  //
//============================================================================//

/**
 Function is called when "keydown" event is triggered.
 Function uses information in event payload to determine which key was pressed and what course of action to take.
 */
function detectKey(e){ //alert("detectKey()");
    e = !e ? window.event : e; //if event is not event, get window.event;
    switch(e.keyCode) {
        case A_KEY:
            aKeyDown = true;    //flag for movement
            break;
        case D_KEY:
            dKeyDown = true;    //flag for movement
            break;
        case ESC_KEY:
            pauseGame();        //calls function
            break;
        case SPACEBAR:
            if(createjs.Ticker.paused){
                restartGame();
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

/**
 Function is called when "keyup" event is triggered.
 Function uses information in event payload to determine which key was released and what course of action to take.
 
 Releasing ESC or SPACEBAR is not monitored because it is not necessary.
 */
function removeKey(e){ //alert("removeKey()");
    e = !e ? window.event : e;  //if event is not event, get window.event;
    switch(e.keyCode) {
        case A_KEY:
            aKeyDown = false;   //reset flat
            break;
        case D_KEY:
            dKeyDown = false;   //reset flag
            break;
    }
}

/**
 Function is called when "mousedown" event is triggered.
 It updates object properties to reflect Drone movement upward.
 */
function moveUp(e){ //alert("moveUp()");
    
    drone.up = true;    //flag
    drone.landed = dContainer.landed = false;   //object is no longer landed
    dContainer.speedY = UP_SPEED;   //reverts vertical speed to default
    
    if(parcel.carried) {
        parcel.landed = false;  //any carried object is also no longer landed
    }
}

/**
 Function is called when "mouseup" event is triggered.
 It updates object properties to reflect Drone movement downward.
 */
function moveDown(e){ //alert("moveDown()");
    
    drone.up = false;   //reset flag
    dContainer.speedY = dContainer.speedY*2;    //falls faster to simulate gravity
}




//============================================================================//
//                              game mechanics                                //
//============================================================================//

/**
 Function is called when "tick" event is triggered (bsaed on framerate).
 If game is not paused, updates the Timer, checks whether the parcel has landed, performs position updates and rendering for each object in the movingArr, and updates the stage to reflect any changes.
 */
function runGame(e){ //alert("runGame()");
    
    var i;
    
    if(!e.paused){
        
        updateTimer(e.runTime); //changes the time displayed on game timer
        movePropellers();       //animates the propellers
        
        for(i = 0; i < movingArr.length; i++){ //process all moving objects
            
            if(!movingArr[i].landed) {  //only objects that have not landed
                updatePosition(movingArr[i]);   //calculates next position
                renderPosition(movingArr[i]);   //moves object to next position
            }
        }
        detectLanding(parcel);  //checks whether parcel has landed
        
        updateDebugText();
        stage.update();         //redraws the stage
    }
}

/**
 Function is called when ESC is pressed. It performs the operations necessary to pause or unpause all game activity.
 */
function pauseGame(e) { //alert("pauseGame()");
    
    createjs.Ticker.paused = !createjs.Ticker.paused;
    pauseText.visible = !pauseText.visible;
    
    //handles window interval changes
    if(createjs.Ticker.paused){
        //remove interval from window
        window.clearInterval(waveAnimation);
    }
    else{
        //add interval to window
        waveAnimation = window.setInterval(moveWaves, WAVE_INT);
    }
    
    stage.update();         //redraws stage
}


/**
 Function performs the operations necessary to end a given course.
 Scenario is a numeric input that indicates the reason why the course was ended.
 */
function setCourseOver(scenario){ //alert("courseOver()");
    
    courseOver = true;              //flag
    createjs.Ticker.paused = true;
    pauseText.visible = true;
    
    //pauseText displays the appropriate message based on why the course ended
    switch(scenario){
        case 0: //if Drone destroyed, Parcel destroyed, ran out of time
            pauseText.text = "You Lose!\n\nSPACEBAR to restart.";
            break;
        case 1: //if Parcel successfully delivered
            pauseText.text = "You Win!\n\nSPACEBAR to restart.";
            break;
    }
}


//============================================================================//
//                                  game GUI                                  //
//============================================================================//
/**
 Function builds the GUI for the game.
 */
function buildGUI(){ //alert("buildGUI()");
    
    buildPauseMenu("#f0e906");  //displayed when game is paused
    buildGameTimer("white");    //visualization of game time remaining
    
    //diagnostic purposes
    buildLine();
    buildDebugText();
}

/**
 Function builds the Pause Menu.
 Color can be customized to go with the course theme.
 */
function buildPauseMenu(color) { //alert("buildPauseMenu()");
    
    var message = "Game Paused!\n\nESC to resume.\nSPACEBAR to restart.";
    
    //Text object
    pauseText = new createjs.Text(message, "40px Arial", color);
    pauseText.x = stage.canvas.width/2;     //horizontally centered
    pauseText.y = stage.canvas.height/3.5;  //to center multiple lines
    pauseText.textAlign = "center";
    pauseText.shadow = new createjs.Shadow("#000000", 0, 0, 50);
    pauseText.visible = false;
    
    //Add to stage
    stage.addChild(pauseText);
}

/**
 Function builds the rectangle displayed behind the Gameplay Explanation at game startup.
 
 Color can be customized to go with the course theme.
 */
function buildPauseRect(w,h,color){ //alert("buildPauseRect()");
    
    //Shape object
    pauseRect = new createjs.Shape();
    pauseRect.width = w;
    pauseRect.height = h;
    pauseRect.graphics.beginStroke("black").beginFill(color).drawRect(0,0,pauseRect.width,pauseRect.height);
    pauseRect.regX = pauseRect.width/2; //center of rectangle
    pauseRect.regY = pauseRect.height/2;//center of rectangle
    pauseRect.x = stage.canvas.width/2; //center of stage
    pauseRect.y = stage.canvas.height/2;//center of stage
    
    stage.addChild(pauseRect);
}

/**
 Function builds the game timer and creates a Text object to display time remaining.
 First, the function builds an anonymous objects containing information about the current time. This object has two properties, min and sec. 
 
    min: the number of minutes remaining
    sec: the number of seconds remaining
 
 This numeric information is converted into string to be displayed with the game timer. Color can be customized to go with the course theme.
 */
function buildGameTimer(color){ //alert("buildGameTimer()");
    
    var timer, min, sec, message;
    
    //get formatted time
    timer = convertTime(startTime); //converts time in milliseconds into object
    min = timer.min;
    sec = timer.sec < 10 ? "0" + timer.sec : timer.sec; //padded if below two digits

    //update timerText object
    message = "Time Remaining: " + min + ":" + sec;
    timerText = new createjs.Text(message, "30px Arial", color);
    timerText.x = stage.canvas.width - 315; //default location
    timerText.y = 10;
    
    //add to stage
    stage.addChild(timerText);
}

/**
 Function converts a given time in milliseconds into minutes and seconds, then returns an anonymous object with two properties, min and sec.
 
    min: the number of minutes remaining
    sec: the number of seconds remaining
 
 Time is rounded to nearest whole number values.
 */
function convertTime(ms){ //alert("convertTime()");
    
    var totalSec, m, s, time;
    
    //convert course time in milliseconds into minutes and seconds
    totalSec = ms/1000;
    m = parseInt(totalSec / 60);    //whole minutes using integer division
    s = parseInt(totalSec % 60);    //round additional seconds using modular operator
    
    return {min:m, sec:s};  //return anonymous object with min and sec properties
}

/**
 Function revises the text of the game timer. If there is no time remaining, function ends the course. If there is less than 10 seconds remaining, function changes the color of the text to red as a warning.
 */
function updateTimer(t){ //alert("updateTimer()");
    
    var timer, min, sec, remaining;
    
    //get time remaining
    remaining = startTime - t;  //use precise values to check if time ran out
    
    //detect if timer runs out
    if(Math.floor(remaining) < 1){  //range to reflect imprecision of method
        
        setCourseOver(0);   //ends course
    }

    //update timer object
    timer = convertTime(remaining); //milliseconds into minutes and seconds
    min = timer.min;
    sec = timer.sec < 10 ? "0" + timer.sec : timer.sec;
    
    //update text field
    timerText.text = "Time Remaining: " + min + ":" + sec;
    
    //change color if time remaining is less than 10 seconds
    if(timer.min < 1 && timer.sec < 10)
    {
        timerText.color = "red";
    }
}

/**
 Function builds the Gameplay Explanation message displayed at game startup. The message explains the rules of the game and how to control the Drone.
 */
function buildStartUpMessage(){ //alert("buildStartUpMessage()");
    
    var m1 = "                             Welcome to Drone Delivery!\n\n";
    
    var m2 = "GOAL:\nPickup and deliver the Package to the Drop Zone. Land in the\nDrop Zone while carrying the Package to finish the course.\n\nAvoid hazards like birds and water. You must beat the Timer too!\n\n";
    
    var m3 = "CONTROLS:\nClick and Hold the Left Mouse button to fly upward\nA Key: move left\nD Key: move right\n\n";
    
    var m4 = "You cannot move while landed. Press ESC to pause the game.\n\n";
    
    var m5 = "                  - press SPACEBAR to start the game -";
    
    //Text object
    startupText = new createjs.Text(m1 + m2 + m3 + m4 + m5, "16px Arial", "black");
    startupText.x = pauseRect.x - 225;
    startupText.y = pauseRect.y - 125;
    
    //add to stage
    stage.addChild(startupText);
    stage.update();
}



//============================================================================//
//                                    courses                                 //
//============================================================================//

/**
 Function calls the correct course to build, based on given input.
 */
function buildCourse(number){
    
    switch(number){
        case 1:
            buildCourse1();
            break;
    }
}

/**
 Function performs all operations necessary to build the game objects for course 1.
 */
function buildCourse1(){ //alert("buildCourse1()");
    
    //locate the drone and parcel at the start of the course
    droneHomeX = 5;
    droneHomeY = 145;
    parcelHomeX = 130;
    parcelHomeY = 105;

    //add game neutral objects
    buildBackground("sky1");
    buildWall(0,150,170,15,"black");    //starting platform drone and parcel
    buildWall(275,0,10,400,"black");
    buildWall(425,250,10,265,"black");
    buildWall(425,250,300,10,"black");
    buildWall(700,500,100,10,"black");
    buildWall(435,500,150,15,"black");  //drop zone platform
    buildDropZone2(434, 350, 150,150, "blue");
    
    //add game hazards
    buildOcean(10,10,15,0,20);
    buildBird(25, 250, 200, 176);
    
    //add movable objects
    buildDrone();
    buildContainer();   //drone before container for proper container bounds
    buildParcel();

    //stores the amount of time given to complete the course
    startTime = COURSE_1_TIME;  //set start time//starting positions per course
    
    stage.update();
}



//============================================================================//
//                               game objects                                 //
//============================================================================//
/**
 Function builds the image displayed as the game background and adds it to stage.
 */
function buildBackground(target){//alert("buildBackground()");
    
    var image, sky;
    
    //get image object from LoadManifest()
    image = queue.getResult(target);
    
    //create bitmap object
    sky = new createjs.Bitmap(image);
    sky.x = sky.y = 0;  //position in upper left corner of stage
    
    //add to stage
    stage.addChild(sky);
}

/**
 
 */
function buildBird(x,y,w,h) {
    var spriteSheet = new createjs.SpriteSheet(ssData);
    bird1 = new createjs.Sprite(spriteSheet, "flap");
    //bird1.scaleX = .5;
    //bird1.scaleY = .5;
    bird1.framerate = 20;
    bird1.x = x;
    bird1.y = y;
    bird1.setBounds(bird1.x, bird1.y, w, h);
    bird1.onCollision = neutralResponse;
    stage.addChild(bird1);
    gameObjectsArr.push(bird1);
}

/**
 Function builds a single wall based on given input and adds it to the stage and gameObjectsArr. 
 
 Note that walls can be designed to be horizontal (in which case they function as platforms).
 */
function buildWall(x,y,w,h, color){ //alert("buildWall()");
    
    var wall;
    
    //Shape object
    wall = new createjs.Shape();
    wall.x = x;
    wall.y = y;
    wall.width = w;     //store object width in pixels
    wall.height = h;    //store object height in pixels
    wall.name = "wall"; //provide a name
    wall.onCollision = neutralResponse; //method to call in case of collision
    wall.graphics.beginFill(color).drawRect(0,0,wall.width, wall.height);
    
    //set bounds for collision detection
    wall.setBounds(wall.x, wall.y, wall.width, wall.height);
    
    //add to appropriate containers
    stage.addChild(wall);
    gameObjectsArr.push(wall);  //add to collidable objects
}

/**
 
 */
function buildDropZone2(x,y,w,h,color){
    
    var zoneText;
    
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
    zoneText = new createjs.Text("DROP\nZONE", "40px Arial", "white");
    zoneText.textAlign = "center";
    zoneText.x = dropZone.x + dropZone.width/2;
    zoneText.y = dropZone.y + dropZone.height/4;
    zoneText.alpha = dropZone.alpha*2;
    stage.addChild(zoneText);
 
}

/**
 Function builds the Drone. It does not add it to stage or a container.
 */
function buildDrone() { //alert("buildDrone()");
    
    var d;
    
    //Graphics object
    d = new createjs.Graphics();
    
    //propellers version 2
    d.beginFill("lightgrey").drawRect(0,0,30,4).drawRect(70,0,30,4).beginFill("#adadad").drawRect(20,0,5,4);
    d_drawRectPropellerL = d.command;   //store reference for animation
    d.drawRect(90,0,5,4);
    d_drawRectPropellerR = d.command;   //store reference for animation
    
    //shafts
    d.beginFill("white").beginStroke("grey");
    d.drawRect(13,4,4,8);   //left shaft
    d.drawRect(83,4,4,8);   //right shaft
    d.endStroke();
    
    //legs
    d.beginFill("grey");
    d.moveTo(10,20).lineTo(0,27).lineTo(0,33).lineTo(2,33).lineTo(2,28).lineTo(13.5,20);//left leg
    d.moveTo(90,20).lineTo(100,27).lineTo(100,33).lineTo(98,33).lineTo(98,28).lineTo(86.5,20);//right leg
    
    //body
    d.beginFill("red");
    d_beginFillBody = d.command; //store reference for use with drone upgrades
    d.beginStroke("black").moveTo(10,12).lineTo(20,12).lineTo(40,7).lineTo(60,7).lineTo(80,12).lineTo(90,12).lineTo(90,20).lineTo(65,22).lineTo(62,31).lineTo(38,31).lineTo(35,22).lineTo(10,20).lineTo(10,12);
    
    //grabbing pad, area to be positioned on target in order to pick it up
    d.beginFill("black").drawRect(38,31,24,2);
    
    //Shape
    drone = new createjs.Shape(d);
    drone.x = drone.nextX = 0;  //0 relative to container
    drone.y = drone.nextY = 0;  //0 relative to container
    drone.width = 100;
    drone.height = 33;
    drone.up = false;       //whether drone is flying upward
    drone.name = "drone";
    drone.landed = false;   //whether drone has landed on a surface
    drone.xPropeller = 20;  //starting x position of gray box on each propeller
    
    //set bounds
    drone.setBounds(drone.x,drone.y,drone.width,drone.height);
}

/**
 Function builds the container for Drone and any picked up objects. Drone is added to container and container is added to stage. Container is also added to movingArr.
 */
function buildContainer() { //alert("buildContainer()");
    
    //Container
    dContainer = new createjs.Container();
    
    //set x,y based on where Drone is first added to course
    dContainer.x = dContainer.nextX = droneHomeX;   //based on given course
    dContainer.y = dContainer.nextY = (droneHomeY - drone.height); //course and drone
    
    //container height and width match the dimensions of the drone to start
    dContainer.width = drone.width;
    dContainer.height = drone.height;
    
    //other properties
    dContainer.speedX = dContainer.speedY = UP_SPEED;
    dContainer.direction = 0; //1 = moving right, -1 = moving left, 0 = straight down
    dContainer.name = "dContainer";
    dContainer.isContainer = true;  //flag for collision detection functions
    dContainer.landed = false;
    
    //add drone to dContainer
    dContainer.addChild(drone);
    
    //set bounds based on contents (currently, only the drone)
    dContainer.setBounds(dContainer.x, dContainer.y, dContainer.width, dContainer.height);
    
    //add to stage
    stage.addChild(dContainer);
    movingArr.push(dContainer); //for movement update /rendering
}

/**
 Function builds the parcel the Drone must deliver to the Drop Zone and adds it to the stage and movingArr.
 */
function buildParcel(){ //alert("buildParcel());
    
    //Shape object
    parcel = new createjs.Shape();
    parcel.width = parcel.height = 40;
    parcel.x = parcel.nextX = parcelHomeX;  //based on the given course
    parcel.y = parcel.nextY = parcelHomeY;
    parcel.name = "parcel";
    parcel.direction = 0; //1 = moving right, -1 = moving left, 0 = straight down
    parcel.speedX = 2;
    parcel.speedY = 2;
    parcel.onCollision = neutralResponse; //method to call in case of collision
    parcel.isContainer = false;
    parcel.carried = false;
    parcel.landed = false;     //whether the parcel is on a platform
    
    //graphics
    //body
    parcel.graphics.beginFill("#aa8e67").drawRect(0,0,parcel.width,parcel.height);
    
    //packing tape
    parcel.graphics.beginFill("#e1dcd5").drawRect(0,17,parcel.width,6).drawRect(17,0,6,parcel.height).endFill();
    parcel.graphics.beginStroke("black").drawRect(0,0,parcel.width,parcel.height);

    //set bounds
    parcel.setBounds(parcel.x, parcel.y, parcel.width, parcel.height);
    
    //add to appropriate containers
    stage.addChild(parcel);
    movingArr.push(parcel);
}

/**
 Function builds the ocean hazard using bezier curves.
    n:      number of bezier curves to fit horizontally on the Stage
    h:      indicates the height in pixels between start point and end of curve
    depth:  used to set how much "water" is placed below curve itself
    a:      y position of control point 1, relative to graphics object
    b:      y position of control point 2, relative to graphics object
 
 bezierCurveTo( cp1x, cp1y, cp2x, cp2y, x, y)
 Draws a bezier curve from the current drawing point to (x, y) using the control points (cp1x, cp1y) and (cp2x, cp2y).

 
 buildOcean(10,10,15,0,20);
 */
function buildOcean(n, h, depth, a, b){

    var i, w, bezierCommands, startX, startY, cp1x, cp1y, cp2x, cp2y, endX, endY;
    
    w = (stage.canvas.width / n);   //width of a wave
    bezierCommands = [];            //ref to each bezier graphics command object
    
    //Shape
    ocean = new createjs.Shape();
    
    //properties
    ocean.x = 0;
    ocean.y = stage.canvas.height - (h + depth);
    ocean.onCollision = hazardResponse;
    
    //graphics
    ocean.graphics.beginFill("lightskyblue");
    ocean.graphics.drawRect(0,h,stage.canvas.width, 15); //to fill below curves
    ocean.graphics.beginStroke("blue").beginFill("lightskyblue");
    
    //construct the individual bezier curves
    for(i = 0; i < n; i++){
        
        //calculate values for individual bezier curve
        startX = ocean.x + (w*i);   //moves over the width of a wave for next curve
        startY = h;                 //same as end y
        
        //cp1x horizontally aligned with cp2x for symmetry (see readme)
        cp1x = (w/2 + w*i); //starts 1/2 of a wave length in from end
                            //moves over the width of a wave for next curve
        cp2x = (w/2 + w*i);
        
        
        //cp1y and cp2y are positioned symmetrically about the startY, endY
        cp1y = a;           //a indicates top control point
        cp2y = b;           //b indicates bottom control point
        
        endX  = (w   + w*i);//moves over the width of a wave for the next curve
        endY  = h;          //same as start y
        
        //move to next starting x,y position
        ocean.graphics.moveTo(startX,startY);
        
        //draw given bezier curve
        ocean.graphics.bezierCurveTo(cp1x,cp1y,cp2x,cp2y,endX,endY);
        
        //add reference to each bezier graphics command object to beizerCommand array
        bezierCommands.push(ocean.graphics.command);
    }
    
    //for later reference
    ocean.curves = bezierCommands;  //store in ocean object
    
    //set bounds
    ocean.setBounds(ocean.x, ocean.y+(h/2), stage.canvas.width, (h + depth));
    
    //add to appropriate containers
    stage.addChild(ocean);
    gameObjectsArr.push(ocean); //add to collidable objects
}



//============================================================================//
//                              collision detection                           //
//============================================================================//

/**
 Function compares the bounds of given target against the bounds of each object in gameObjectsArr. Returns an array containing any game objects that had a collision with target.
 */
function detectCollision(target, nextX, nextY){ //alert("detectCollision()");
    
    var i,objectBounds, targetBounds, current;
    var collisionList = []; //array to hold all objects that collided with target
    
    //calculate next bounds of target
    targetBounds = target.getBounds();  //get current bounds
    targetBounds.x = nextX;             //update based on calculated future position
    targetBounds.y = nextY;
    
    for(i = 0; i < gameObjectsArr.length; i++){ //check against each object in array
        
        //get bounds of each game object relative to its container
        current = gameObjectsArr[i];
        objectBounds = current.getBounds(); //returns a Rectangle representing bounds
        
        //determine whether object's Rectangle intersects target's Rectangle
        if(targetBounds.intersects(objectBounds)){  //collision occurred

            collisionList.push(current);    //add to collisionList
        }
    }
    return collisionList;
}

/**
 Function calculates what the revised position of target should be, based on relationship between the original position of the target (prior to collision) and the position of the collided object, as well as any other revised points that had been calculated previously for the target during the same collision.
 
        target:     the object the revised position is calculated for
        cObject:    the object target collided with
        nextX:      calculated future position of target
        nextY:      calculated future position of target
        revisedArr: contains all other points position of target could be revised to
 */
function revisePosition(target, cObject, nextX, nextY, revisedArr){ //alert("revisePosition()");

    var pt, above, below, left, right, cBounds, cTop, cBottom, cLeft, cRight, original;
    
    
    
    pt = new createjs.Point(0,0); //used to store revised x,y position
    
    //flags indicate positioning relationship between target and collided object
    above = below = left = right = false;

    //determine the edges of collided object
    cBounds     = cObject.getBounds();
    cTop        = cBounds.y;
    cBottom     = cBounds.y + cBounds.height;
    cLeft       = cBounds.x;
    cRight      = cBounds.x + cBounds.width;
    
    //determine positioning relationship between target and collided object
    //vertical
    if(cTop >= (target.y + target.height)) {   //target is above collided object
        above = true;   //set flag
    }
    else if( cBottom <= target.y ) {   //target is below collided object
        below = true;
    }
    //horizontal
    if(cLeft >= target.x + target.width){ //target at left side of collided object
        left = true;
    }
    else if(cRight <= target.x){ //target at right side of collided object
        right = true;
    }
    
    //based on calculated relationship, revise next x,y position of target
    //There are eight possible relationships
    if(above && left){
        pt.x = cLeft - target.width;
        pt.y = nextY
    }
    else if(above && right){
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
        target.direction *= -0.25;      //simulate a bounce
    }
    else if(below && right){
        pt.x = cRight;
        pt.y = nextY;
        target.direction *= -0.25;      //simulate bounce
    }
    else if(below){
        pt.x = nextX;
        pt.y = cBottom;
    }
    else if(left){
        pt.x = cLeft - target.width;
        pt.y = nextY;
        target.direction *= -0.25;      //simulate a bounce
    }
    else if(right){
        pt.x = cRight;
        pt.y = nextY;
        target.direction *= -0.25;      //simulate a bounce
    }

    //if using a clone, need to update the landed property of the original object
    if(target.name === "clone" && target.landed){
        
        original = target.cloneOf;
        original.landed = true;
        dContainer.landed = true;    //if parcel was the collided object
    }
    
    //compare calculate pt against all revised points created in the same collision
    pt = mostRestrictive(target, revisedArr, pt);
    
    //return the most restrictive x,y position that target should be moved to
    return pt;
}

/**
 Function compares calculated future position of target against the edges of the canvas. Returns a Point object that represents a revised position for the target. The value of the revised position is based on whether the target's calculated future position would have placed the object outside of the visible canvas.
 */
function detectEdgeOfFrame(target, nextX, nextY){ //alert("detectEdgeOfFrame()");
    
    //Point used to store revised x,y position
    var pt = new createjs.Point(-100,-100); //-100 is a flag for 'no change made'
    
    //horizontal
    if(nextX < 0){  //target goes past left edge
        
        pt.x = 0;
        target.direction *= -0.25;     //simulate a bounce
    }
    else if(nextX > stage.canvas.width - target.width){ //target goes past right edge
        
        pt.x = stage.canvas.width - target.width;
        target.direction *= -0.25;     //simulate a bounce
    }
    //vertical
    if(nextY < 0){  //target goes past top edge
        
        pt.y = 0;
    }
    if(nextY > stage.canvas.height - target.height){ //target goes past bottom edge
        
        pt.y = stage.canvas.height - target.height;
        target.landed = true;   //target has now landed on "bottom" of canvas
    }
    
    return pt;
}

/**
 Function returns the more restrictive of two or more points, based on relationship of target to each of the possible points it can move to. Function compares target against each point in revisedArr and against pt and whichever is most restrictive is retained and returned.
 */
function mostRestrictive(target, revisedArr, pt){//alert("mostRestrictive()");
    
    var i, x1, x2, y1, y2, mostRestrictivePt;
    
    mostRestrictivePt = pt; //set pt as default
    
    for(i = 0; i < revisedArr.length; i++){ //for each point in revisedArr
        
        //determine most restrictive x value
        //calc difference betweem target.x, x of most restrictive pt so far
        x1 = Math.abs(target.x - mostRestrictivePt.x);
        
        //calc difference between target.x, x of point in array
        x2 = Math.abs(target.x - revisedArr[i].x);
        
        if( x2 < x1){       //new point has the more restrictive x
            mostRestrictivePt.x = revisedArr[i].x;
        }

        
        //determine most restrictive y value
        //calc difference betweem target.y, y of most restrictive pt so far
        y1 = Math.abs(target.y - mostRestrictivePt.y);
        
        //calc difference between target.y, y of point in array
        y2 = Math.abs(target.y - revisedArr[i].y)
        
        if( y2 < y1){       //new point has more restrictive y
            mostRestrictivePt.y = revisedArr[i].y;
        }
    }
    return mostRestrictivePt;
}

//============================================================================//
//                                game actions                                //
//============================================================================//
/**
 
 */
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
    
    var cBounds;
    
    //parcel x,y is relative to dContainer and must be readjusted to stage
    var shiftX = (dContainer.width - target.width) /2;
    var shiftY = drone.height;
    var globalPt = target.localToGlobal(target.x-shiftX, target.y-shiftY);
    
    //update properties
    target.direction = dContainer.direction;
    target.speedY = dContainer.speedY*2;
    target.speedX = dContainer.speedX;
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
    
    //update dContainer bounds
    cBounds = dContainer.getBounds();
    dContainer.setBounds(cBounds.x, cBounds.y, cBounds.width, dContainer.height);
}

function neutralResponse(){ //alert("neutralResponse()");
    //nothing occurs on purpose
}

function hazardResponse(){//alert("hazardResponse()");
    
    setCourseOver(0);
}


function dropZoneResponse() { //alert("dropZoneResponse()");

    if(parcel.carried && dContainer.landed) {
        setCourseOver(1);
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
            nextX = target.x + (target.speedX * target.direction);
        }
        else if(dKeyDown){
            target.direction = 1; //move right
            nextX = target.x + (target.speedX * target.direction);
        }
        
        //vertical
        nextY = drone.up ? (target.y - target.speedY) : (target.y + target.speedY);
        
    } else {    //target is not a container
        
        nextX = target.x + (target.speedX * target.direction);
        nextY = (target.y + target.speedY);  //can only fall downward
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
    
    /*
     //unnecessary
    if( target.isContainer && drone.up){
        movePropellers2();
    }
     */
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
function movePropellers(){//alert("movePropellers2()");
    
    //change position of grey box, don't let go off of propeller
    //find next position based on whether drone is flying upward or not
    drone.xPropeller = drone.up ? drone.xPropeller - 7 : drone.xPropeller - 2;
    
    if(drone.xPropeller < 0){ //goes off left side of each propellor
    
        drone.xPropeller = 25;   //reset
    }
    d_drawRectPropellerL.x = drone.xPropeller;
    d_drawRectPropellerR.x = (70 + drone.xPropeller);
    
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

//============================================================================//
//                                  debugging                                 //
//============================================================================//

//debugging
function buildLine(){ //for diagnostic purposes
    
    var line = new createjs.Shape();
    line.graphics.beginStroke("red").drawRect(bird1.getBounds().x, bird1.getBounds().y, bird1.getBounds().width, bird1.getBounds().height);
    stage.addChild(line);
}

/*
 Function adds a Text display object to display object properties during game.
 */
function buildDebugText(){  //alert("buildDebugText()b");//for diagnostic purposes
    
    debugText = new createjs.Text("", "15px Arial", "red");
    debugText.x = 10;
    debugText.y = 550;
    stage.addChild(debugText);
}

function updateDebugText(){

    debugText.text  = "Bird1 Bounds W: " + bird1.getBounds().width +  "Drone Intersect Bird? "
    + drone.getBounds().intersects(bird1.getBounds());
}






