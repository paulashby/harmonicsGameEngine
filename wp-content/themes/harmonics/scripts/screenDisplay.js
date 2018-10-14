window.onload = function () {

  var 
  body = document.getElementsByTagName('body')[0],
  serverSentEventurl = body.dataset['sseurl'],
  asseturl = body.dataset['asseturl'],
  ////////////////////////////////////////////////////////////
  // Uncomment for production ////////////////////////////////

  source = new EventSource(serverSentEventurl),

   ////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////

  queuedAnimations = 0,
  config = {
    "transparent": true,
    type: Phaser.AUTO,
    width: 1600,
    height: 900,
    scene: {
        preload: preload,
        create: create,
        update: update
    }
  },
  game = new Phaser.Game(config);

  function preload ()
  {
      this.load.image("heart", asseturl + "heart_emoji.png");
      this.load.image("hardparticle", asseturl + "particle.png");
      this.load.image("softparticle", asseturl + "sparkle.png");
      this.load.image("explosionParticle", asseturl + "particleRed.png");
  }

  function create () {

     var emojis = [],
        maxEmojis = 8,
        emojiGroup = this.add.group(this),  
        xmin = 180,
        xmax = 1420,
        xoffset,
        sparkleParticles = this.add.particles('softparticle'),
        heartParticles = this.add.particles('heart'),
        explosionParticles = this.add.particles('explosionParticle'),
        currEmoji,
        activeEmojis = 0,
        getRandomInt = function (min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }, 
        animationTimer,      
        makePoints = function (xmin, xmax, y) {
          
          var RISE_FOR = 7,
          FLOAT_FOR = 12, 
          Y_SPEED = 125,
          FLOAT_DAMPING = 5,
          X_DRIFT = 80,
          Y_DRIFT = 55,
          VARIATION = 200,

          variance,
          currX = xmin,
          currY = y,
          yZenith = 0,
          points = [],
          currY,
          i;            

          for (i= 0; i < RISE_FOR; i++) {
            variance = getRandomInt(0, VARIATION);
            points.push(i % 2 !== 0 ? currX - X_DRIFT + variance : currX + variance);
            points.push(currY - Y_SPEED * i);
          }
          yZenith = points[points.length -1] + getRandomInt(0, VARIATION);

          for (i = 0; i < FLOAT_FOR; i++) {
            points.push(xmin);
            points.push( i % 2 !== 0 ? yZenith : yZenith + Y_DRIFT - (FLOAT_DAMPING * i) );
          }  
          return points;          
        },
        addEmoji = function (scene, points, x, y, texture) {
          var EMOJI_DUR_MIN = 20000,
            EMOJI_DUR_MAX = 35000,
            emoji = scene.add.follower(new Phaser.Curves.Spline(points), x, y, texture);
            emoji.xoffset = x;
            emoji.endZone = emoji.path.points[emoji.path.points.length -1].y;
            emoji.rotDir = 1; 
            emoji.scaleFactor = 0.008;
            emoji.countdown = 40;

          emoji.update = function () {     

            var currEmoji = emojis[this.emojiIndex],
              i,
              ilen;

            if( this.ending === undefined) {
              if(this.y < this.endZone) {
                this.ending = 300;
              }              
            }  else {

              // Now in end phase - counting down to remove everyting
              this.ending--;
              if(this.ending < 100) {  
                                             
                currEmoji.sparkleEmitter && currEmoji.sparkleEmitter.stop();
                currEmoji.heartEmitter &&  currEmoji.heartEmitter.stop();
              }
              if(this.ending <= 0) {
                if(this.ending < -20) {
                  
                  currEmoji.explosionEmitter && currEmoji.explosionEmitter.stop();

                }
                if(! this.pulsed) {

                  // Swell up first
                  this.setScale(this.scaleX + this.scaleFactor, this.scaleY + this.scaleFactor);
                  if(this.scaleX > 1.2) {
                    this.pulsed = true;
                    this.scaleFactor = Math.min(0.008, this.scaleFactor - 0.008);
                  }                  
                } else {

                  // Then explode
                  if(! currEmoji.explosionEmitter) {                    
                    currEmoji.explosionEmitter = explosionParticles.createEmitter({
                      // blendMode: 'ADD',
                      alpha: {start: 1, end: 0},
                      angle: { min: 0, max: 360 },
                      accelerationY: 50,
                      frequency: 2,
                      lifespan: 1000,
                      quantity: 1000,
                      scale: { start: 1, end: 0 },
                      speed: { min: -200, max: 200 }
                    });
                    currEmoji.explosionEmitter.startFollow(currEmoji.pathFollower);
                  }
                  
                  // And shrink back down
                  if ( this.scaleX > 0){
                    this.scaleFactor = Math.max(0.008, this.scaleFactor + 0.008);
                    this.setScale(this.scaleX - this.scaleFactor, this.scaleY - this.scaleFactor); 
                  } else if(this.countdown > 0 ){
                    this.countdown--;                      
                  } else {
                                        
                    currEmoji.pathFollower.pathOffset = {x: -1000, y: -2000};
                    if(this.isActive) {
                      this.isActive = false;
                      activeEmojis--;
                    }

                    if(! queuedAnimations && ! activeEmojis) {
                      debugger;
                      ilen = emojis.length;
                      for(i = 0; i < ilen; i++) {
                        currEmoji = emojis[i];
                        if(currEmoji) {
                          if(currEmoji.sparkleEmitter) {
                            currEmoji.sparkleEmitter = null;
                          }
                          if(currEmoji.heartEmitter) {
                            currEmoji.heartEmitter = null;
                          }
                          if(currEmoji.explosionEmitter) {
                            currEmoji.explosionEmitter.y = 2000;
                            currEmoji.explosionEmitter = null;                          
                          }
                          if(currEmoji.pathFollower) {
                            currEmoji.pathFollower.destroy();
                            currEmoji.pathFollower = null;
                          }                          
                          currEmoji = null;
                        }                        
                      }
                    }
                  }
                }
              }              
            }            

            if (this.rotation < -0.5) {
                this.rotDir = 1;
              }
              if (this.rotation > 0.5) {
                this.rotDir = -1;
              }
              this.rotation += (.01 - Math.abs(this.rotation) * 0.015) * this.rotDir;            
          };                      
          emoji.startFollow({
            duration: getRandomInt(EMOJI_DUR_MIN, EMOJI_DUR_MAX)
          });
          return emoji;
        },
        onServerSend = function (scene) {

          var currEmoji;

          if(queuedAnimations) {

            activeEmojis++;
            xoffset = ((xmax - xmin) / 4) * activeEmojis % xmax;

             currEmoji = emojis[emojis.push({
              // Path follower extends Sprite, so is the emoji 'graphic'
              pathFollower: addEmoji(scene, makePoints(180, 1420, 850), xmin + xoffset, 850, 'heart'),
              sparkleEmitter: sparkleParticles.createEmitter({
                  accelerationY: 150,
                  frequency: 500,
                  lifespan: 1500,
                  scale: { start: 1, end: 0 },
                  speed: { min: -20, max: 100 }
              }),
              heartEmitter: heartParticles.createEmitter({
                accelerationY: 50,
                blendMode: 'SCREEN',
                frequency: 200,
                lifespan: 4000,
                quantity: 1,
                speed: { min: -100, max: 10 },
                scale: { start: 0.5, end: 0 }
              })
            }) -1]; 
            currEmoji.pathFollower.emojiIndex = emojis.length-1;
            currEmoji.sparkleEmitter.startFollow(currEmoji.pathFollower);
            currEmoji.heartEmitter.startFollow(currEmoji.pathFollower);
            currEmoji.isActive = true;

            // Sprites and followers don't have update called automatically, so adding to group which calls update
            emojiGroup.add(currEmoji.pathFollower); 

              queuedAnimations--;
              animationTimer = setInterval(function() {onServerSend(this);}.bind(scene), 500);              

          }

        }; 

      emojiGroup.runChildUpdate = true;

      ////////////////////////////////////////////////////////////
      // Uncomment for Production ////////////////////////////

      if(typeof(EventSource) !== 'undefined') {  

        source.onmessage = (function(scene) {
        
        return function (event) {

          // For now, we're only worrying about the hearts entry
          var heartCount;

          if (event.data !==  '0') {
            // console.log('server message received');             
            heartCount = parseInt(event.data, 10); 
            queuedAnimations += heartCount;
            onServerSend(scene);
          }
        }

        }(this));
      } else {
          alert('Sorry! No server-sent events support');
      }

      ////////////////////////////////////////////////////////////
      ////////////////////////////////////////////////////////////
      // if(queuedAnimations) {
      //   onServerSend(this);
      // }
       
      // for(i = 0; i < 12; i++) {
      //   onServerSend(this);  
      // }      
  }

  function update () {
  }
};