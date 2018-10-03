import processing.video.*;

final static int MAX_RAD = 3,
  THRESH = 700, CAP_INCR = 70;

PImage curr, prev;
int[][] vectors;
Capture myCap;
Branch branch;

void setup() {
 size(1280,720);
 background(0);
 ellipseMode(CENTER);
 noStroke();
 myCap = new Capture(this,width,height,30);
 myCap.start();
 curr = new PImage(width,height);
 prev = new PImage(width,height);
 prev.loadPixels();
 branch = new Branch(width*.5,height*.5);
 branch.c = color(167, 214, 147);
 vectors = new int[width][height];
 
}

void draw() {
 background(0);
 //image(myCap, 0, 0, width, height);
 if(myCap.available()) {
  detectMotion(myCap); 
 }
 branch.update();
 branch.display();
}

void mousePressed() {
 branch.grow(mouseX,mouseY); 
}

void detectMotion(PImage p) {
  myCap.read();
  p = myCap;
  prev.loadPixels();
  int movementSum = 0;
   for (int x = 0; x < p.width; x+=CAP_INCR ) {
    for (int y = 0; y < p.height; y+=CAP_INCR ) {
      int loc = x + y * p.width;
      color currColor = p.pixels[loc];
      color prevColor = prev.pixels[loc];
      int r1 = (currColor >> 16) & 0xFF; 
      int g1 = (currColor >> 8) & 0xFF;
      int b1 = currColor & 0xFF;
      int r2 = (prevColor >> 16) & 0xFF;
      int g2 = (prevColor >> 8) & 0xFF;
      int b2 = prevColor & 0xFF;
      int diffR = abs(r1 - r2);
      int diffG = abs(g1 - g2);
      int diffB = abs(b1 - b2);
      movementSum = diffR + diffG + diffB;
      if(movementSum > THRESH) {
        branch.grow(x, y);
        //vectors[x][y] = movementSum;
      } else {
        if(x >= p.width && y >= p.height) {
          int max = branch.children.size()/2;
          for(int i = 0; i < max; i++) {
           branch.children.remove(i); 
          }
        }
        vectors[x][y] = 0;
      }
    }
  }
}

// direct grow by xy
class Branch {
  
  private float x,y,vx,vy,rad;
  private ArrayList<Branch> children;
  boolean growing;
  public color c;

    public Branch(float x, float y) {
      this.x = x;
      this.y = y;
      vx = random(-2,2);
      vy = random(-2,2);
      rad = MAX_RAD;
      growing = false;
      children = new ArrayList<Branch>();
    }
    
    // add to current branch - change this 
    // throw direction of movement
    void grow(int newX, int newY) {
      Branch b = new Branch(x,y);
      b.vx += abs(newX - x) * (.03) * random(-1,1)>0?1:-1;
      b.vy += abs(newY - y) * (.03) * random(-1,1)>0?1:-1;
      b.c = color(random(167,255), random(214,255), random(147,255));
      children.add(b);
    }
    
    void update() {
      
      // push from current position towards found movement
      for(int xVec = 0; xVec < width; xVec+=CAP_INCR) {
        for(int yVec = 0; yVec < height; yVec+=CAP_INCR) {
          if(vectors[xVec][yVec] > 0) {
            float incX = (xVec - x)*.0001;
            print("TEST" + incX);
            vx += incX;
            //y += (yVec - y)/height;
          }
        }
      }
      
      // fluctuate sizes
      if(rad < 1) growing = true;
      if(rad > MAX_RAD) growing = false;
      rad *= growing ?  1.01 : .99;
      
      // maintain on screen
      if(x < 0) {
       x = 0;
       vx *= -1;
      }
      if(x > width) {
       x = width;
       vx *= -1;
      }
      if(y < 0) {
        y = 0;
        vy *= -1;
      }
      if(y > height) {
        y = height;
        vy *= -1;
      }
      
      // add randomness / distinction
      vx+= noise(x*.02, y*.02, frameCount*.02)-.5;
      vy+= noise(x*.02, (y*.02)+300, frameCount*.02)-.5;
      vx*= .9;//random(.9,.95);
      vy*= .9;//random(.9,.95);
      
      x+= vx;
      y+= vy;
      
      // call on child
      for(int i = 0; i < children.size(); i++)
        children.get(i).update();
    }
    
    void display() {
      fill(c);
      ellipse(x,y,rad,rad);
      for(int i = 0; i < children.size(); i++)
        children.get(i).display();
    }
  
}