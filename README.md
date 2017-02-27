# Drone Delivery
NDSU Spring 2017 | CSCI 313 Project

Drone Delivery is a platform-style JavaScript web-browser game. It is built inside a DOM Canvas object in HTML and utilizes the createjs library.

##1. OBJECTIVE

Players must pick up and deliver The Package (land while carrying it) to the Drop Zone of each course before time runs out on the Game Timer, while avoiding all hazards.


##2. GAME OBJECTS

###2.1. Interactive
####Hazards
-  The Ocean
-  Birds

####Neutral objects
-  Walls
-  Platforms
-  Pickup Objects (i.e. The Package)

####Positives
-  Drop Zone


##3. RULES
###Game Timer
-  The Game Timer countdown begins when the player presses SPACEBAR at the beginning
of the course

###Game Ending
-  If the Drone lands in the Drop Zone while carrying The Package before the Game
Timer runs out, the course is won
-  The Drone and The Package are destroyed if they collide with a hazard
-  The Drone and The Package are not destroyed if they collide with a neutral object
-  The Drone and The Package are not destroyed if they collide with the canvas edge
-  If either the Drone or The Package are destroyed, player loses the course
-  If the Game Timer reaches 0:00 before delivery, player loses the course

###Movement Rules
-  No game objects (including the Drone and The Package) can go outside the canvas
-  The Drone and pickup objects (i.e The Package) cannot pass through a neutral object
-  All pickup objects (i.e The Package) fall downward if dropped in the air
-  All pickup objects bounce horizontally off neutral objects and the canvas edges


##4. CONTROLS
###Drone
Players control a Drone using the keyboard and mouse.

A-KEY:      if the Drone is not landed, move Drone left
D-KEY:      if the Drone is not landed, move Drone right
LEFT MOUSE: click and hold to make the Drone fly upward


###Pickup / Drop
Players control interaction between the Drone and The Package through the keyboard.

SPACEBAR:   if the Drone has landed with its grabber (black area) on The Package,
pick up The Package. If the Drone is carrying The Package, drop The
Package.


###Game Mechanics
Players control game mechanics through the keyboard.

ESC:        pauses the game
SPACEBAR:   if the game is showing the Gameplay Explanation, start the game
if the game is paused, causes the game to restart


##5. GAME DESIGN
###5.1 Basic Game Design
The game is composed of objects, variables, and functions.

####5.1.1. Objects
Objects are composed of standard classes of the createjs library.

-  createjs.Ticker
-  stage       (Stage)
-  dContainer  (Container)
-  sky         (Bitmap)        (i.e. background image)
-  birds       (Sprite)
-  text        (Text)          (multiple)
-  drone       (Shape)
-  ocean       (Shape)
-  walls       (Shape)         (multiple)
-  dropZone    (Shape)


#####About createjs.Ticker:
createjs.Ticker is a built-in component of Stage. It triggers a "tick" event based
on a given framerate. For Drone Delivery we use 60 frames per second, so the "tick"
event occurs 60 times per second. Game mechanics are based on this "tick" event.

#####About dContainer:
dContainer is a container that can contain children. At game start, dContainer contains 
the Drone. The Drone cannot be removed from dContainer. If the Drone "picks up" a 
pickup object (i.e. The Package), that object is also added to dContainer. If the Drone
"drops" an object it was carrying, that object is removed from dContainer.

Keyboard and mouse interactions move dContainer. Moving dContainer moves all of its
children as well.



####5.1.2. Variables
-  gameObjectsArr  (array containing all objects the Drone can interact with)
-  movingArr       (array containing all objects that user can interact with that are
currently moving through the air (i.e. Drone, The Package, etc.))

#####How Variables Are Used
-  Once the game has started, the game loops through all objects in movingArr, updating
and rendering their positions.
-  Updating movingArr object positions involves performing collision detection against
all objects in the gameObjectsArr.

#####Variable Rules:
-  If The Package or a similar pickup object are picked up, it is removed from the
gameObjectsArr.
-  If The Package or a similar pickup object are dropped, it is added to the movingArr.
-  If The Package or a similar pickup object land on a horizontal neutral surface, it
is removed from the movingArr and added to the gameObjectsArr.



####5.1.3. functions
Each function will be described in detail in the implementation section.
Drone Delivery contains the following functions:


#####startup functions
-  load()
-  init()
-  buildGame()
-  startGame()
-  restartGame()

#####game input
-  detectKey(e)
-  removeKey(e)
-  moveUp(e)
-  moveDown(e)

#####game mechanics
-  runGame(e)
-  pauseGame(e)
-  setCourseOver(scenario)

#####game GUI
-  buildGUI()
-  buildPauseMenu(color)
-  buildPauseRect(w, h, color)
-  buildGameTimer(color)
-  convertTime(ms)
-  updateTimer(t)
-  buildStartupMessage()

#####game courses
-  buildCourse(number)
-  buildCourse1()

#####game objects
-  buildBackground(target)
-  buildBird(x,y,w,h)
-  buildWall(x,y,w,h,color)
-  buildDropZone2(x,y,w,h,color)
-  buildDrone()
-  buildContainer()
-  buildParcel()
-  buildOcean(n, h, depth, a, b)

#####collision detection
-  detectCollision(target, nextX, nextY)
-  revisePosition(target, cObject, nextX, nextY, revisedArr)
-  detectEdgeOfFrame(target, nextX, nextY)
-  mostRestrictive(target, revisedArr, pt)

#####game actions
-  checkPickup(target)
-  pickup(target)
-  drop(target)
-  neutralResponse()
-  hazardResponse()
-  dropZoneResponse()

#####movable object update / rendering
-  calcNextPosition(target)
-  performCollisionDetection(target, nextX, nextY)
-  getChildClone( child)
-  performPositionRevision(target, collisionArr, nextX, nextY)
-  updatePosition(target)
-  renderPosition(target)
-  detectLanding(target)
-  updateChildrenBounds(container, cX, cY)

#####animation
-  movePropellers()
-  moveWaves(e)





###5.2 Advanced Game Design

####Dynamically Injected Properties
JavaScript suppports dynamically injected properties. Drone Delivery utilizes this 
feature extensively to store object data. Dynamically injected properties in Drone Delivery include:

- carried
- direction
- height
- isContainer
- landed
- nextX
- nextY
- onCollision
- speedX
- speedY
- width
- up
- xPropeller

It is possible to set a function as a property of an object. Certain objects have
the property "onCollision". The idea is that if an object is collided into, we call 

<that object>.onCollision(); 

and the function referenced there is called. For the case of a Flock-Of-Birds, 
onCollision is set to hazardResponse. If a Flock-Of-Birds is collided into by 
a moving object, the hazardResponse() method will be called, which ends the course.




##6. Bugs

###Bug 3.01 
If Drone lands on surface while carrying package, then lets go of package, then grabs again, sometimes the package sinks below the surface, and when you grab it again, dContainer is getting the call to move to position -30,-33. Has something to with the shiftX, shiftY in Step 2 B of the updatePosition() method. For now, I mitigated it by only choosing to update to point values that are greater than or equal to zero.



