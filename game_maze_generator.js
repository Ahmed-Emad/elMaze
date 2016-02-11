var N, M, T, B, H, F;

var grid = [];
var parent = [];
var visited = [];

function pair(x, y) {
    this.x = x;
    this.y = y;
}

pair.prototype.toString = function() {
    return this.x + " " + this.y + " $";
}

function rand(num) {
    return Math.ceil(Math.random()*(1e9 + 7))%num;
}

var src;
var dest;

function initialize() {
    var x = "";
    
    for(var i = 0 ; i < M ; ++ i)
        x += "*";
    
    for(var i = 0 ; i < N ; ++i) {
        parent[i] = [];
        visited[i] = [];
        grid[i] = x;
        for(var j = 0 ; j < M ; ++j) {
            parent[i][j] = new pair(i,j);
            visited[i][j] = false;
        }
    }
}

function find(i) {
    if ( parent[i.x][i.y].x == i.x && parent[i.x][i.y].y == i.y ) 
        return new pair(i.x, i.y);
    var tt = find(parent[i.x][i.y]);
    return parent[i.x][i.y] = new pair(tt.x, tt.y);
}

function union(i, j) {
    var r_i = find(i);
    var r_j = find(j);
    
    if ( r_i.x == r_j.x && r_i.y == r_j.y )
        return false;
    
    parent[r_i.x][r_i.y] = new pair(r_j.x, r_j.y);
    
    return true;
}

var dx = [0, 1, 0, -1];
var dy = [1, 0, -1, 0];

function inrange(x, y, i) {
    return x + dx[i] >= 0 && x + dx[i] < N 
            && y + dy[i] >= 0 && y + dy[i] < M;
}

function edit(x, j, appendor) {
    var ret = "";
    for(var i = 0 ; i < x.length ; ++i)
        ret += ( i == j ? appendor : x[i] );
    return ret;
}

function shuffle(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

var edge_list = [];
var tower_nodes = [];

function edge(x, y) {
    this.x = x;
    this.y = y;
}

edge.prototype.toString = function() {
    return this.x + " " + this.y;
}

function dfs_range(i,j) {
    return i >= Math.min(src.x, dest.x) && i <= Math.max(src.x, dest.x) && j >= 0 && j < M;
}

var srcmin;     

function dfs(i, j, c) {
    if( !dfs_range(i,j) ) return;
    if(i == dest.x && j == dest.y) return;
    if(visited[i][j]) return;
    
    if(grid[i][j] != 'S' && grid[i][j] != 'D')
        grid[i] = edit(grid[i], j, c);
    
    visited[i][j] = true;
    
    var r = rand(2);
    
    switch(srcmin) {
        case 0:
            dfs(i, j+1, c);
            break;
        case 1:
            if(r == 1) r = 3;
            if( dfs_range( i + dx[r] , j + dy[r] ) ) {
                dfs(i + dx[r] , j + dy[r], c);
            } else {
                if(r == 0) r = 3;
                else r = 0;
                dfs(i + dx[r] , j + dy[r], c);
            }
            break;    
        case 2:
           if( dfs_range( i + dx[r] , j + dy[r] ) ) {
                dfs(i + dx[r] , j + dy[r], c);
            } else {
                r ++;
                r %= 2;
                dfs(i + dx[r] , j + dy[r], c);
            } 
    }
    
    
}

function buildmaze() {
    initialize();
    
    var t = 0;
    
    for(var i = 0 ; i < N ; ++i)
        for(var j = 0 ; j < M ; ++j) 
            for(var k = 0 ; k < 4 ; ++k) {
                if ( !inrange(i,j,k) ) continue;
                edge_list[t++] = new edge(new pair(i,j), new pair(i+dx[k], j+dy[k]));
            }
    
    edge_list = shuffle(edge_list);
    
    var limit = edge_list.length;
    limit /= ((F*N)/M);
    limit = Math.ceil(limit);
    
    var roads = Math.ceil((N-1)/(limit));
        
    dfs(src.x, src.y, '-');
    
    var TempDest = new pair(dest.x, dest.y);
    
    var vis = [];
    vis[dest.x] = true;
    
    for(var i = 0, selector = rand(N) ; i < roads ; ++ i, selector = rand(N)) {
        
        for(var j = 0 ; j < N ; ++j)
            for(var k = 0 ; k < M ; ++ k)
                visited[j][k] = false;
        
        while(vis[selector] && selector != TempDest)
            selector = rand(N);
        
        dest.x = selector;
        vis[selector] = true;
        srcmin = (src.x > dest.x ? 1 : src.x < dest.x ? 2 : 0);
        dfs(src.x,src.y, '-');
    }
    
    dest.x = TempDest.x;
    dest.y = TempDest.y;
    
    for(var i = 0 ; i < limit && i < edge_list.length ; ++i) {
        
        if ( union(edge_list[i].x, edge_list[i].y) ) {
            
            var x = edge_list[i].x.x;
            var y = edge_list[i].x.y;
            var x2 = edge_list[i].y.x;
            var y2 = edge_list[i].y.y;

            var allp = true;
            var allp2 = true;
            
            for(var k = 0 ; k < 4; ++k) {
                if( inrange(x,y,k) )
                    allp &= grid[x+dx[k]][y+dy[k]] == '-';
                if(inrange(x2,y2,k))
                    allp2 &= grid[x2+dx[k]][y2+dy[k]] == '-';
            }
            if(allp || allp2) continue;
            grid[edge_list[i].x.x] = edit(grid[edge_list[i].x.x], edge_list[i].x.y, '-');
            grid[edge_list[i].y.x] = edit(grid[edge_list[i].y.x], edge_list[i].y.y, '-');
        } else limit++;
    }
    
    var cnt = 0;
    
    
    grid[src.x] = edit(grid[src.x], src.y, 'S');
    grid[dest.x] = edit(grid[dest.x], dest.y, 'D');
    
    var t = 0;
    
    for(var i = 0 ; i < N ; ++i)
        for(var j = 0 ; j < M ; ++j) {
            if(grid[i][j] == '*') {
                for(var k = 0 ; k < 4 ; ++ k ) {
                    if(inrange(i,j,k))
                        if(grid[i+dx[k]][j+dy[k]] == '-') {
                            tower_nodes[t++] = new pair(i,j);
                        }
                }
            }
        }
    tower_nodes = shuffle(tower_nodes);

    for(var i = 0 ; i < T && i < tower_nodes.length ; ++i)
        grid[tower_nodes[i].x] = edit(grid[tower_nodes[i].x], tower_nodes[i].y, 'T');

    var tt = "";
    for(var i = 0 ; i < M+2 ; ++ i)
        tt += "F";
    
    var grid2 = [];
    
    for(var i = 0 ; i < N+2 ; ++i)
        grid2[i] = tt;

    for(var i = 0 ; i < N ; ++ i)
        for(var j = 0 ; j < M ; ++j )
            grid2[i+1] = edit(grid2[i+1], j+1, grid[i][j]);
    
    for(var i = 0 ; i < N+2 ; ++ i) {
        if( grid2[i][1] == 'S' ) {
            grid2[i] = edit(grid2[i], 0, 'S');
            grid2[i] = edit(grid2[i], 1, '-');
        }
        
        if( grid2[i][M] == 'D' ) {
            grid2[i] = edit(grid2[i], M+1, 'D');
            grid2[i] = edit(grid2[i], M, '-');
        }
    }
    
    grid = grid2;
    
    console.log('Maze generation is done\n\n');
    
    var tt = "";
    
    for(var i = 0 ; i < M+2 ; ++i )
        tt += "X";
    
    console.log(tt);
    
    for(var i = 0 ; i < N+2 ; ++ i)
        console.log(grid[i]);
}

function getMaze(n, m, t, factor) {
    N = n;
    M = m;
    N -= 2;
    M -= 2;
    T = t;
    F = factor;
    src = new pair(rand(N), 0);
    dest = new pair(rand(N),M-1);
    while( Math.abs(src.x-dest.x) < Math.floor(N/2) ) {
        src.x += rand(Math.ceil(N/2));
        ++dest.x;
        dest.x %= N;
        src.x %= N;
    }
    srcmin = (src.x > dest.x ? 1 : src.x < dest.x ? 2 : 0);
    buildmaze();
    return grid;
}
// 31 160 40 71
// 30 20  10 7

/*
var xBlockCount = 40;
var yBlockCount = 20;
var blockDim = 50;
var towerCount = 10;
var mazeDifficuilty = 19;
var monsterCount = 20;
var minesCount = 4;
var tntsCount = 3;
*/
