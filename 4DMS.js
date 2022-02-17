class Int2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Int3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

class Pos3D {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

class Int4 {
    constructor(u, x, y, z) {
        this.u = u;
        this.x = x;
        this.y = y;
        this.z = z;
    }

    add(pos) {
        return new Int4(
            this.u + pos.u,
            this.x + pos.x,
            this.y + pos.y,
            this.z + pos.z
        );
    }

    mlt(a) {
        return new Int4(
            this.u * a,
            this.x * a,
            this.y * a,
            this.z * a
        );
    }
}

class Pos4D {
    constructor(u, x, y, z) {
        this.u = u;
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

class Object4D extends Pos4D {
    constructor(u, x, y, z, index) {
        super(u, x, y, z);
        this.index = index;
        this.cartesian = new Pos3D(0, 0, 0);
        this.project();
    }

    project() {
        var f = gameManager.lightSource.u;
        this.cartesian = new Pos3D(
            f / (f - this.u) * this.x,
            f / (f - this.u) * this.y,
            f / (f - this.u) * this.z
        );
    }

    projectParallel() {
        this.cartesian = new Pos3D(
            this.x,
            this.y,
            this.z
        );
    }

    Euler(a, b, c) {
        var ra, rb, rc, ca, sa, cb, sb, cc, sc;
        ra = a * 2 * Math.PI / 360;
        rb = b * 2 * Math.PI / 360;
        rc = c * 2 * Math.PI / 360;
        ca = Math.cos(ra / 2);
        sa = Math.sin(ra / 2);
        cb = Math.cos(rb / 2);
        sb = Math.sin(rb / 2);
        cc = Math.cos(rc / 2);
        sc = Math.sin(rc / 2);
        
        return new Pos4D(
            ca * cb * cc + sa * sb * sc,
            sa * cb * cc - ca * sb * sc,
            ca * sb * cc + sa * cb * sc,
            ca * cb * sc - sa * sb * cc
        );
    }

    mlt(l, r) {
        return new Pos4D(
            l.u * r.u - l.x * r.x - l.y * r.y - l.z * r.z,
            l.u * r.x + l.x * r.u + l.y * r.z - l.z * r.y,
            l.u * r.y - l.x * r.z + l.y * r.u + l.z * r.x,
            l.u * r.z + l.x * r.y - l.y * r.x + l.z * r.u
        );
    }

    rotate(x1, y1, z1, x2, y2, z2) {
        var p = this.mlt(
            this.mlt(
                this.Euler(x1, y1, z1),
                new Pos4D(this.u, this.x, this.y, this.z)
            ),
            this.Euler(x2, y2, z2)
        );

        this.u = p.u;
        this.x = p.x;
        this.y = p.y;
        this.z = p.z;
    }
}

class Cell extends Object4D {
    constructor(u, x, y, z, index) {
        super(u, x, y, z, index);

        this.neighbor = 0;
        this.color = new Int3(0, 0, 0);

        this.danger = false;
        this.demined = false;
        this.flag = false;

        this.label = "";
    }
}

class Controller extends Object4D {
    constructor(u, x, y, z, index, color) {
        super(u, x, y, z, index);
        this.color = color;
    }
}

class GameArea {
    constructor() {
        this.canvas = new Int2(400, 400);
    }
}

class Mouse {
    constructor() {
        this.downPos = new Int2(0, 0);
        this.escapePos = new Int2(0, 0);
        this.updatePos = new Int2(0, 0);
        this.upPos = new Int2(0, 0);

        this.is_down = false;
        this.is_longPress = false;
        this.is_init = false;
    }
}

class GameManager {
    constructor() {
        this.cursor = new Int4(2, 2, 2, 2);
        this.size = new Int4(4, 4, 4, 4);
        this.volume = 4 * 4 * 4 * 4;
        this.mines = 10;
        
        this.lightSource = new Pos4D(200, 0, 0, 0);

        this.cellSize = 5;
        this.cellInterval = 25;

        this.gameclear = false;
        this.gameover = false;
        
        this.startTime = 0;
        this.endTime = 0;
    }
}


var gameArea = new GameArea();
var mouse = new Mouse();
var gameManager = new GameManager();

var canvas, ctx, fixedPlane, date = new Date().getTime();

(() => {
    canvas = document.getElementsByTagName("canvas")[0];
    ctx = canvas.getContext("2d");
    canvas.width = gameArea.canvas.x;
    canvas.height = gameArea.canvas.y;

    ctx.fillStyle = "rgb(0, 0, 0)";
    ctx.fillRect(0, 0, gameArea.canvas.x, gameArea.canvas.y);

    fixedPlane = "ux";
})();

var cellIndexList = [];

var cellList = [];

var controllerList = [];


var neighborList = [];

for(var i = -1; i < 2; ++i) {
    for(var j = -1; j < 2; ++j) {
        for(var k = -1; k < 2; ++k) {
            for(var l = -1; l < 2; ++l) {
                neighborList.push(new Int4(i, j, k, l));
            }
        }
    }
}

gameInitialize();

function cellIndexListInitialize() {
    cellIndexList = [];
    for(var i = 0; i < gameManager.size.u; ++i) {
        for(var j = 0; j < gameManager.size.x; ++j) {
            for(var k = 0; k < gameManager.size.y; ++k){
                for(var l = 0; l < gameManager.size.z; ++l) {
                    cellIndexList.push(new Int4(i, j, k, l));
                }
            }
        }
    }
}

function controllerListInitialize() {
    controllerList = [];
    for(var i = 0; i < 2; ++i) {
        var sgn = 2 * i - 1;
        controllerList.push(new Controller(
            50 * sgn, 0, 0, 0, new Int4(sgn, 0, 0, 0), [100 * i + 50, 100 * i + 75, 100 * i + 100]
        ));
        controllerList.push(new Controller(
            0, 50 * sgn, 0, 0, new Int4(0, sgn, 0, 0), [200 * i, 100, 100]
        ));
        controllerList.push(new Controller(
            0, 0, 50 * sgn, 0, new Int4(0, 0, sgn, 0), [100, 200 * i, 100]
        ));
        controllerList.push(new Controller(
            0, 0, 0, 50 * sgn, new Int4(0, 0, 0, sgn), [100, 100, 200 * i]
        ));

    }
}

function cellListInitialize() {
    cellList = Array(gameManager.size.u);
    for(var i = 0; i < gameManager.size.u; ++i) {
        cellList[i] = Array(gameManager.size.x);
        for(var j = 0; j < gameManager.size.x; ++j) {
            cellList[i][j] = Array(gameManager.size.y);
            for(var k = 0; k < gameManager.size.y; ++k) {
                cellList[i][j][k] = Array(gameManager.size.z);
                for(var l = 0; l < gameManager.size.z; ++l) {
                    cellList[i][j][k][l] = new Cell(
                        gameManager.cellInterval * (i - (gameManager.size.u - 1) / 2),
                        gameManager.cellInterval * (j - (gameManager.size.x - 1) / 2),
                        gameManager.cellInterval * (k - (gameManager.size.y - 1) / 2),
                        gameManager.cellInterval * (l - (gameManager.size.z - 1) / 2),
                        new Int4(i, j, k, l)
                    )
                }
            }
        }
    }

    cellIndexListInitialize();

    dangerInitialize();

    for(var i = 0; i < cellIndexList.length; ++i) {
        var p = cellIndexList[i];
        var neighbors = count(p);
        cellList[p.u][p.x][p.y][p.z].neighbors = neighbors;
        cellList[p.u][p.x][p.y][p.z].color = cellColor(neighbors);
        cellList[p.u][p.x][p.y][p.z].label = (cellList[p.u][p.x][p.y][p.z].danger)
            ? "b"
            : neighbors;
    }
}

function flagCounter() {
    var x = 0;
    for(var i = 0; i < cellIndexList.length; ++i) {
        var p = cellIndexList[i];
        if(cellList[p.u][p.x][p.y][p.z].flag
        && !cellList[p.u][p.x][p.y][p.z].demined) {
            x++;
        }
    }
    return x;
}

function modeChange(m) {
    switch(m) {
        case "easy":
            gameManager.size = new Int4(4, 4, 4, 4);
            gameManager.volume = 4 * 4 * 4 * 4;
            gameManager.mines = 10;
            gameManager.lightSource.u = 200;
            break;
        case "normal":
            gameManager.size = new Int4(6, 6, 6, 6);
            gameManager.volume = 6 * 6 * 6 * 6;
            gameManager.mines = 40;
            gameManager.lightSource.u = 300;
            break;
        case "hard":
            gameManager.size = new Int4(8, 8, 8, 8);
            gameManager.volume = 8 * 8 * 8 * 8;
            gameManager.mines = 99;
            gameManager.lightSource.u = 400;
            break;
        default:
            break;
    }

    gameInitialize();
}

function cellColor(x) {
    var R = (() => {
        switch(x % 3) {
            case 0:
                return 0x11;
            case 1:
                return 0x55;
            case 2:
                return 0x99;
            default:
                return 0;
        }

    })();
  
    var G = (() => {
        switch(Math.floor(x / 2) % 3) {
            case 0:
                return 0x44;
            case 1:
                return 0x88;
            case 2:
                return 0xcc;
            default:
                return 0;
        }

    })();

    var B = (() => {
        switch(Math.floor(x / 3) % 3) {
            case 0:
                return 0x77;
            case 1:
                return 0xbb;
            case 2:
                return 0xff;
            default:
                return 0;
        }

    })();
    
    return [R, G, B];
}

function gameClearJudge() {
    var counter = 0;
    for(var i = 0; i < cellIndexList.length; ++i) {
        var p = cellIndexList[i];
        if(cellList[p.u][p.x][p.y][p.z].demined) {
            counter++;
        }
    }

    if(counter == (gameManager.volume - gameManager.mines)) {
        gameManager.gameclear = true;
        gameManager.gameover = true;
        mouse.is_init = false;
    }

    if(gameManager.gameclear) {
        console.log("game clear");
    }
}

function gameInitialize() {
    gameManager.gameover = false;
    gameManager.gameclear = false;
    gameManager.time = 0;
    mouse.is_init = false;

    mouse.downPos = new Int2(0, 0);
    mouse.updatePos = new Int2(0, 0);
    mouse.upPos = new Int2(0, 0);

    gameManager.cursor = new Int4(2, 2, 2, 2);

    controllerListInitialize();

    cellListInitialize();

    gameDisplay();
}

function dangerInitialize() {
    var mineIndex = [];
    var newIntFlag = true;

    while(mineIndex.length < gameManager.mines) {
        var rand = Math.floor(Math.random() * gameManager.volume);

        newIntFlag = true;
      
        for(var i = 0; i < mineIndex.length; ++i) {
            if(mineIndex[i] == rand) {
                newIntFlag = false;
                break;
            }
        }
        if(newIntFlag) {
            mineIndex.push(rand);
        }
    }
  
    for(var i = 0; i < gameManager.mines; ++i) {
        var p = cellIndexList[mineIndex[i]];
        cellList[p.u][p.x][p.y][p.z].danger = true;
    }
}

function is_inBoard(p) {
    if(p.u >= 0 && p.u < gameManager.size.u
    && p.x >= 0 && p.x < gameManager.size.x
    && p.y >= 0 && p.y < gameManager.size.y
    && p.z >= 0 && p.z < gameManager.size.z) {
        return true;
    } else {
        return false;
    }
}

function demine(p) {
    for(var i = 0; i < neighborList.length; ++i) {
        demine_internal(
            p.add(neighborList[i])
        );
    }
}

function demine_internal(p) {
    if(is_inBoard(p)
    && !cellList[p.u][p.x][p.y][p.z].demined) {
        cellList[p.u][p.x][p.y][p.z].demined = true;
        if(is_safe(p)) {
            demine(p);
        }
    }
    return;
}

function is_safe(p) {
    var ans = true;

    for(var i = 0; i < neighborList.length; ++i) {
        ans = ans && is_safe_internal(
            p.add(neighborList[i])
        );
    }

    return ans;
}

function is_safe_internal(p) {
    if(!is_inBoard(p)) {
        return true;
    } else {
        if(cellList[p.u][p.x][p.y][p.z].danger) {
            return false;
        } else {
            return true;
        }
    }
}

function count(p) {
    var sum = 0;

    for(var i = 0; i < neighborList.length; ++i) {
        sum += count_internal(
            p.add(neighborList[i])
        );
    }

    return sum;
}

function count_internal(p) {
    if(!is_inBoard(p)) {
        return 0;
    } else {
        return cellList[p.u][p.x][p.y][p.z].danger ? 1 : 0;
    }
}

function sortList(list) {
    for(var i = 0; i < list.length; ++i) {
        list[i].project();
        for(var j = i + 1; j < list.lenght; ++j) {
            list[j].project();
            if(list[i].cartesian.x > list[j].cartesian.x) {
                var t = list[i];
                list[i] = list[j];
                list[j] = t;
            }
        }
    }
    return list;
}

function gameDisplay() {
    ctx.fillStyle = "rgb(0, 0, 0)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    var cellList_line = [];
    for(var i = 0; i < cellIndexList.length; ++i) {
        var p = cellIndexList[i];
        cellList_line.push(cellList[p.u][p.x][p.y][p.z]);
    }
    var sortCellList = sortList(cellList_line);
  
    for(var i = 0; i < gameManager.volume; ++i) {
        var object = sortCellList[i];
        object.project();
      
        var fy, fz, fr, oy ,oz, size;
        fy = object.cartesian.y;
        fz = object.cartesian.z;
        fr = gameManager.lightSource.u / (gameManager.lightSource.u - object.cartesian.x);
        oy = gameArea.canvas.x / 2;
        oz = gameArea.canvas.y * 3 / 8;
        size = gameManager.cellSize;
        

        var iu, ix, iy, iz, onCursor;
        iu = object.index.u;
        ix = object.index.x;
        iy = object.index.y;
        iz = object.index.z;
        onCursor = (gameManager.cursor.u == iu)
                && (gameManager.cursor.x == ix)
                && (gameManager.cursor.y == iy)
                && (gameManager.cursor.z == iz);

        var cellColor = (() => {
            if(onCursor) {
                return [254, 254, 254];
            } else {
                if(!object.demined) {
                    return [
                        Math.floor(fr * 10 * 10 + 44),
                        Math.floor(fr * 10 * 10),
                        Math.floor(fr * 10 * 10 + 22)
                    ];
                } else {
                    return object.color;
                }
            }
        })();

        var cellText = (() => {
            if(!object.demined) {
                if(object.flag) {
                    return "f";
                } else {
                    return "";
                }
            } else {
                return object.label;
            }
        })();

        if(!(object.demined && (object.neighbors == 0))
        || onCursor) {
            ctx.fillStyle = "rgb("
                + cellColor[0] + ","
                + cellColor[1] + ","
                + cellColor[2] + ")";

            ctx.beginPath();
            ctx.arc(
                fy * fr + oy, fz * fr + oz, size * fr,
                0, 2 * Math.PI, false
            );
            ctx.fill();

            if(cellText != 0) {
                ctx.strokeStyle = "rgb(1, 1, 1)";
                ctx.strokeText(cellText, fy * fr + oy - 2, fz * fr + oz + 2);
            }
            if(gameManager.gameclear) {
                ctx.strokeStyle = "rgb(254, 254, 254)";
                ctx.strokeText("GAME CLEAR", gameArea.canvas.x / 2, gameArea.canvas.y / 2);
            } else if(gameManager.gameover) {
                ctx.strokeStyle = "rgb(254, 254, 254)";
                ctx.strokeText("GAME OVER", gameArea.canvas.x / 2, gameArea.canvas.y / 2);
            }

        }

    }

    //controller
    var sortControllerList = sortList(controllerList);

    for(var i = 0; i < 8; ++i) {
        var object = sortControllerList[i];
        object.project();

        var cy, cz, cr, oy, oz, size;
        cy = object.cartesian.y;
        cz = object.cartesian.z;
        cr = gameManager.lightSource.u / (gameManager.lightSource.u - object.cartesian.x);
        oy = gameArea.canvas.x / 2;
        oz = gameArea.canvas.y * 13 / 16;
        size = gameManager.cellSize;

        ctx.fillStyle = "rgb("
            + object.color[0] + ","
            + object.color[1] + ","
            + object.color[2] + ")";
        
        ctx.beginPath();
        ctx.arc(
            cy * cr + oy, cz * cr + oz, size * cr,
            0, 2 * Math.PI, false
        );
        ctx.fill();

        var label = (() => {
            if(object.index.u != 0) {
                return "u";
            } else if(object.index.x != 0) {
                return "x";
            } else if(object.index.y != 0) {
                return "y";
            } else if(object.index.z != 0) {
                return "z";
            } else {
                return "";
            }
        })();

        ctx.strokeStyle = "rgb(254,254,254)";
        ctx.strokeText(label, cy * cr * 1.4 + oy - 2.5, cz * cr * 1.4 + oz + 2.5);

        if(i == 3) {
            ctx.fillStyle = "rgb(255,255,255)";
            ctx.beginPath();
            ctx.arc(oy, oz, 2 * size, 0, 2 * Math.PI, false);
            ctx.fill();
        }
    }

    if(!gameManager.gameover) {
        gameManager.endTime = new Date().getTime();
    }
  
    ctx.strokeStyle = "rgb(254,254,254)";
    ctx.strokeText("Flag : " + flagCounter(), 20, gameArea.canvas.y - 40);
    ctx.strokeText("Time : " + Math.floor((gameManager.endTime - gameManager.startTime) / 1000),
                    20, gameArea.canvas.y - 20);
    
    requestAnimationFrame(gameDisplay);
}

canvas.addEventListener("mousedown", e => {
    mouse.is_down = true;
    mouse.is_longPress = false;
    
    var rect = e.target.getBoundingClientRect();
    x = e.clientX - rect.left;
    y = e.clientY - rect.top;
    mouse.downPos = new Int2(x, y);
    mouse.escapePos = new Int2(x, y);
    mouse.updatePos = new Int2(x, y);
});

canvas.addEventListener("mousemove", e => {
    var rect = e.target.getBoundingClientRect();
    x = e.clientX - rect.left;
    y = e.clientY - rect.top;

    if(!mouse.is_longPress
    && Math.sqrt(
        (x - mouse.downPos.x) * (x - mouse.downPos.x)
        + (y - mouse.downPos.y) * (y - mouse.downPos.y)
    ) > 10) {
        mouse.is_longPress = true;
    }

    if(mouse.is_down) {
        mouse.updatePos = new Int2(x, y);
        gameManager.rotZ = (mouse.updatePos.x - mouse.escapePos.x) / 3;
        gameManager.rotY = (mouse.updatePos.y - mouse.escapePos.y) / 3;

        for(var i = 0; i < cellIndexList.length; ++i) {
            var p = cellIndexList[i];
            cellList[p.u][p.x][p.y][p.z].rotate(0, gameManager.rotZ, gameManager.rotY,
                                                0, gameManager.rotZ, gameManager.rotY);
        }
      
        for(var i = 0; i < 8; ++i) {
            controllerList[i].rotate(0, gameManager.rotZ, gameManager.rotY,
                                    0, gameManager.rotZ, gameManager.rotY);
        }

        mouse.escapePos = new Int2(x, y);
    }
});

canvas.addEventListener("mouseup", e => {
    mouse.is_down = false;
    if(mouse.is_longPress) {
        mouse.is_longPress = false;
        return;
    }

    var rect = e.target.getBoundingClientRect();
    x = e.clientX - rect.left;
    y - e.clientY - rect.top;
    var p = ctx.getImageData(x, y, 1, 1).data;

    if(p[0] == 255
    && p[1] == 255
    && p[2] == 255) {
        mouse.is_longPress = false;
        var p =gameManager.cursor;
        var object = cellList[p.u][p.x][p.y][p.z];
        if(!object.demined && !object.flag) {
            cellList[p.u][p.x][p.y][p.z].demined = true;
            if(object.danger) {
                gameManager.gameover = true;
                mouse.is_init = false;
                gameManager.endTime = new Date().getTime();
            } else if(is_safe(p)) {
                demine(p);//掘削
            }

            if(!gameManager.gameover
            && !mouse.is_init) {
                gameManager.startTime = new Date().getTime();
                mouse.is_init = true;
            
            }
        }    
    }

    if(p[0] == 50
    && p[1] == 75
    && p[2] == 100) {
        gameManager.cursor.u--;
        if(gameManager.cursor.u < 0) {
            gameManager.cursor.u += gameManager.size.u;
        }
    }

    if(p[0] == 150
    && p[1] == 175
    && p[2] == 200) {
        gameManager.cursor.u++;
        if(gameManager.cursor.u >= gameManager.size.u) {
            gameManager.cursor.u -= gameManager.size.u;
        }
    }

    if(p[0] == 0
    && p[1] == 100
    && p[2] == 100) {
        gameManager.cursor.x--;
        if(gameManager.cursor.x < 0) {
            gameManager.cursor.x += gameManager.size.x;
        }
    }

    if(p[0] == 200
    && p[1] == 100
    && p[2] == 100) {
        gameManager.cursor.x++;
        if(gameManager.cursor.x >= gameManager.size.x) {
            gameManager.cursor.x -= gameManager.size.x;
        }
    }

    if(p[0] == 100
    && p[1] == 0
    && p[2] == 100) {
        gameManager.cursor.y--;
        if(gameManager.cursor.y < 0) {
            gameManager.cursor.y += gameManager.size.y;
        }
    }

    if(p[0] == 100
    && p[1] == 200
    && p[2] == 100) {
        gameManager.cursor.y++;
        if(gameManager.cursor.y >= gameManager.size.y) {
            gameManager.cursor.y -= gameManager.size.y;
        }
    }

    if(p[0] == 100
    && p[1] == 100
    && p[2] == 0) {
        gameManager.cursor.z--;
        if(gameManager.cursor.z < 0) {
            gameManager.cursor.z += gameManager.size.z;
        }
    }

    if(p[0] == 100
    && p[1] == 100
    && p[2] == 200) {
        gameManager.cursor.z++;
        if(gameManager.cursor.z >= gameManager.size.z) {
            gameManager.cursor.z -= gameManager.size.z;
        }
    }

    mouse.is_longPress = false;
});

document.addEventListener("keydown", e => {
    console.log("keydown key is "+e.key);
  
    switch(e.key) {
        case "f":
            var p = gameManager.cursor;
            var object = cellList[p.u][p.x][p.y][p.z];
            if(object.flag && !object.demined) {
                cellList[p.u][p.x][p.y][p.z].flag = false;
            } else if(!object.flag && !object.demined) {
                cellList[p.u][p.x][p.y][p.z].flag = true;
            }
            break;
        case "e":
            modeChange("easy");
            break;
        case "n":
            modeChange("normal");
            break;
        case "h":
            modeChange("hard");
            break;
        case "r":
            gameInitialize();
            break;        
    }

    var keyRot1 = 0, keyRot2 = 0;
    
    if(e.ctrlKey) {
        switch(e.key) {
            case "ArrowLeft":
                keyRot1 = -10;
                break;
            case "ArrowRight":
                keyRot1 = 10;
                break;
            case "ArrowUp":
                keyRot2 = -10;
                break;
            case "ArrowDown":
                keyRot2 = 10;
                break;
            default:
                break;
        }
    } else if(e.shiftKey) {
        switch(e.key) {
            case "ArrowLeft":
                gameManager.cursor.u -= 1;
                if(gameManager.cursor.u < 0) {
                    gameManager.cursor.u += gameManager.size.u;
                }
                break;
            case "ArrowRight":
                gameManager.cursor.u += 1;
                if(gameManager.cursor.u >= gameManager.size.u) {
                    gameManager.cursor.u -= gameManager.size.u;
                }
                break;
            case "ArrowUp":
                gameManager.cursor.x -= 1;
                if(gameManager.cursor.x < 0) {
                    gameManager.cursor.x += gameManager.size.x;
                }
                break;
            case "ArrowDown":
                gameManager.cursor.x += 1;
                if(gameManager.cursor.x >= gameManager.size.x) {
                    gameManager.cursor.x -= gameManager.size.x;
                }
                break;
            default:
                break;
        }
    } else {
        switch(e.key) {
            case "Enter":
                mouse.is_longPress = false;
                var p =gameManager.cursor;
                var object = cellList[p.u][p.x][p.y][p.z];
                if(!object.demined && !object.flag) {
                    cellList[p.u][p.x][p.y][p.z].demined = true;
                    if(object.danger) {
                        gameManager.gameover = true;
                        mouse.is_init = false;
                        gameManager.endTime = new Date().getTime();
                    } else if(is_safe(p)) {
                        demine(p);//掘削
                    }
                
                    if(!gameManager.gameover
                    && !mouse.is_init) {
                        gameManager.startTime = new Date().getTime();
                        mouse.is_init = true;
                    
                    }
                }    
                break;
            case "ArrowLeft":
                gameManager.cursor.y -= 1;
                if(gameManager.cursor.y < 0) {
                    gameManager.cursor.y += gameManager.size.y;
                }
                break;
            case "ArrowRight":
                gameManager.cursor.y += 1;
                if(gameManager.cursor.y >= gameManager.size.y) {
                    gameManager.cursor.y -= gameManager.size.y;
                }
                break;
            case "ArrowUp":
                gameManager.cursor.z -= 1;
                if(gameManager.cursor.z < 0) {
                    gameManager.cursor.z += gameManager.size.z;
                }
                break;
            case "ArrowDown":
                gameManager.cursor.z += 1;
                if(gameManager.cursor.z >= gameManager.size.z) {
                    gameManager.cursor.z -= gameManager.size.z;
                }
                break;
            default:
                break;
        }
    }

    for(var i = 0; i < cellIndexList.length; ++i) {
        var p = cellIndexList[i];
        cellList[p.u][p.x][p.y][p.z].rotate(0, keyRot1, keyRot2, 0, 0, 0);
    }
    
    for(var i = 0; i < 8; ++i) {
        controllerList[i].rotate(0, keyRot1, keyRot2, 0, 0, 0);
    }

});


