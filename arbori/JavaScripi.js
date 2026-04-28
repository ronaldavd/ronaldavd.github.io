// ==================== GRAPH FUNCTIONS ====================
let currentGraph = null;

function updateInputArea() {
    clearMessage();
    const method = document.getElementById('method').value;
    let example = '';
    let exampleLabel = '';
    switch(method) {
        case 'direct':
            exampleLabel = 'Direct G=(V,E):';
            example = 'V={1,2,3,4,5} E={{1,2},{2,3},{3,4},{4,5},{1,5}}';
            break;
        case 'adjmatrix':
            exampleLabel = 'Matrice de adiaceță:';
            example = '0 1 1 0\n1 0 1 1\n1 1 0 1\n0 1 1 0';
            break;
        case 'adjlist':
            exampleLabel = 'Listă de adiacență:';
            example = '1: 2,3,5\n2: 1,3,4\n3: 1,2,4\n4: 2,3\n5: 1';
            break;
        case 'incmatrix':
            exampleLabel = 'Matrice de incidență:';
            example = '1 1 0 1 0\n1 0 1 0 1\n0 1 1 0 0\n0 0 1 1 0\n1 0 0 0 1';
            break;
    }
    const inputElement = document.getElementById('input');
    if (!inputElement.value) {
        inputElement.placeholder = example;
    }
    document.getElementById('example').innerHTML =
        '<p><strong><i class="fas fa-book"></i> Exemplu pentru metoda selectată:</strong></p>' +
        '<p>' + exampleLabel + '</p>' +
        '<pre>' + example + '</pre>';
}

function createGraph() {
    clearMessage();
    hideStats();
    const method = document.getElementById('method').value;
    const input = document.getElementById('input').value.trim();
    if (!input) {
        showMessage('Introduceți datele pentru graf înainte de a crea graful.', 'error');
        return;
    }
    let graph = { vertices: [], edges: [] };
    try {
        switch(method) {
            case 'direct':
                graph = parseDirect(input);
                break;
            case 'adjmatrix':
                graph = parseAdjMatrix(input);
                break;
            case 'adjlist':
                graph = parseAdjList(input);
                break;
            case 'incmatrix':
                graph = parseIncMatrix(input);
                break;
        }
        if (!graph.vertices.length) {
            throw new Error('Graful nu conține niciun vârf. Verificați datele de intrare.');
        }
        currentGraph = graph;
        showMessage('✓ Graful a fost creat cu succes!', 'success');
        drawGraph(graph);
    } catch (e) {
        showMessage('❌ Eroare: ' + e.message, 'error');
    }
}

function parseDirect(input) {
    const vMatch = input.match(/V\s*=\s*[\{\(]([^\}\)]*)[\}\)]/i);
    const eMatch = input.match(/E\s*=\s*(\{.+\})/i);
    if (!vMatch || !eMatch) throw new Error('Format invalid pentru Direct G=(V,E).');
    const verticesRaw = vMatch[1].replace(/[()]/g, '');
    const vertices = verticesRaw.split(',').map(v => v.trim()).filter(Boolean);
    const edgesRaw = eMatch[1].trim();
    const edges = [];
    if (edgesRaw.length) {
        const innerEdges = edgesRaw.slice(1, -1);
        const edgesStr = innerEdges.match(/\{[^}]+\}/g) || [];
        edgesStr.forEach(pair => {
            const edge = pair.replace(/[{}()]/g, '').split(',').map(v => v.trim()).filter(Boolean);
            if (edge.length === 2) edges.push(edge);
        });
    }
    return { vertices, edges };
}

function parseAdjMatrix(input) {
    const lines = input.split('\n').map(l => l.trim()).filter(Boolean).map(line => line.split(/\s+/).map(Number));
    if (!lines.length) throw new Error('Matricea de adiaceță este goală.');
    const n = lines.length;
    const vertices = Array.from({length: n}, (_, i) => (i+1).toString());
    const edges = [];
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            if (lines[i][j] === 1) edges.push([vertices[i], vertices[j]]);
        }
    }
    return { vertices, edges };
}

function parseAdjList(input) {
    const lines = input.split('\n').map(l => l.trim()).filter(Boolean);
    const adj = {};
    lines.forEach(line => {
        const [node, neighbors] = line.split(':');
        if (node && neighbors !== undefined) {
            adj[node.trim()] = neighbors.split(',').map(n => n.trim()).filter(Boolean);
        }
    });
    const vertices = Object.keys(adj);
    const edges = [];
    const seen = new Set();
    vertices.forEach(v => {
        adj[v].forEach(u => {
            const key = [v, u].sort().join('-');
            if (!seen.has(key)) {
                seen.add(key);
                edges.push([v, u]);
            }
        });
    });
    return { vertices, edges };
}

function parseIncMatrix(input) {
    const lines = input.split('\n').map(l => l.trim()).filter(Boolean).map(line => line.split(/\s+/).map(Number));
    if (!lines.length) throw new Error('Matricea de incidență este goală.');
    const numVertices = lines.length;
    const numEdges = lines[0].length;
    const vertices = Array.from({length: numVertices}, (_, i) => (i+1).toString());
    const edges = [];
    for (let j = 0; j < numEdges; j++) {
        const edgeVertices = [];
        for (let i = 0; i < numVertices; i++) {
            if (lines[i][j] === 1) edgeVertices.push(vertices[i]);
        }
        if (edgeVertices.length === 2) edges.push(edgeVertices);
    }
    return { vertices, edges };
}

// ==================== GRAPH ALGORITHMS ====================
function buildAdjList(graph) {
    const adj = {};
    graph.vertices.forEach(v => adj[v] = []);
    graph.edges.forEach(([u, v]) => {
        adj[u].push(v);
        adj[v].push(u);
    });
    return adj;
}

function runBFS() {
    if (!currentGraph || !currentGraph.vertices.length) {
        showMessage('❌ Creați mai întâi un graf!', 'error');
        return;
    }
    const adj = buildAdjList(currentGraph);
    const start = currentGraph.vertices[0];
    const visited = new Set();
    const queue = [start];
    const order = [];
    visited.add(start);

    while (queue.length) {
        const v = queue.shift();
        order.push(v);
        adj[v].forEach(u => {
            if (!visited.has(u)) {
                visited.add(u);
                queue.push(u);
            }
        });
    }

    document.getElementById('bfsResult').textContent = 'BFS (Lățime): ' + order.join(' → ');
    document.getElementById('algorithms').style.display = 'block';
}

function runDFS() {
    if (!currentGraph || !currentGraph.vertices.length) {
        showMessage('❌ Creați mai întâi un graf!', 'error');
        return;
    }
    const adj = buildAdjList(currentGraph);
    const visited = new Set();
    const order = [];

    function dfs(v) {
        visited.add(v);
        order.push(v);
        adj[v].forEach(u => {
            if (!visited.has(u)) {
                dfs(u);
            }
        });
    }

    dfs(currentGraph.vertices[0]);
    document.getElementById('dfsResult').textContent = 'DFS (Adâncime): ' + order.join(' → ');
    document.getElementById('algorithms').style.display = 'block';
}

function analyzeGraph() {
    if (!currentGraph || !currentGraph.vertices.length) {
        showMessage('❌ Creați mai întâi un graf!', 'error');
        return;
    }

    const adj = buildAdjList(currentGraph);
    
    // Calculate degrees
    const degrees = {};
    currentGraph.vertices.forEach(v => {
        degrees[v] = adj[v].length;
    });
    const maxDegree = Math.max(...Object.values(degrees));

    // Check if connected
    const visited = new Set();
    function dfs(v) {
        visited.add(v);
        adj[v].forEach(u => {
            if (!visited.has(u)) dfs(u);
        });
    }
    dfs(currentGraph.vertices[0]);
    const isConnected = visited.size === currentGraph.vertices.length ? 'DA ✓' : 'NU ✗';

    document.getElementById('vertexCount').textContent = currentGraph.vertices.length;
    document.getElementById('edgeCount').textContent = currentGraph.edges.length;
    document.getElementById('maxDegree').textContent = maxDegree;
    document.getElementById('isConnected').textContent = isConnected;
    document.getElementById('stats').style.display = 'block';

    showMessage('✓ Analiza completă!', 'success');
}

function hideStats() {
    const statsElement = document.getElementById('stats');
    if (statsElement) statsElement.style.display = 'none';
}

// ==================== DRAWING FUNCTIONS ====================
function drawGraph(graph) {
    const canvas = document.getElementById('graphCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!graph.vertices.length) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 80;
    const angleStep = (2 * Math.PI) / graph.vertices.length;
    const positions = {};

    graph.vertices.forEach((v, i) => {
        const angle = i * angleStep - Math.PI / 2;
        positions[v] = {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle)
        };
    });

    // Draw edges
    ctx.strokeStyle = 'rgba(102, 126, 234, 0.6)';
    ctx.lineWidth = 3;
    graph.edges.forEach(edge => {
        const [v1, v2] = edge;
        const p1 = positions[v1];
        const p2 = positions[v2];
        if (p1 && p2) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();

            // Draw edge label (distance)
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
        }
    });

    // Draw vertices
    graph.vertices.forEach(v => {
        const p = positions[v];
        // Vertex circle
        ctx.fillStyle = 'rgba(102, 126, 234, 0.9)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 28, 0, 2 * Math.PI);
        ctx.fill();

        // Border
        ctx.strokeStyle = '#764ba2';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Text
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(v, p.x, p.y);
    });
}

// ==================== MESSAGE FUNCTIONS ====================
function showMessage(text, type) {
    const messageElement = document.getElementById('message');
    messageElement.textContent = text;
    messageElement.className = 'message ' + type;
    messageElement.style.display = 'block';
    setTimeout(() => {
        messageElement.style.display = 'none';
    }, 5000);
}

function clearMessage() {
    const messageElement = document.getElementById('message');
    messageElement.textContent = '';
    messageElement.className = 'message';
    messageElement.style.display = 'none';
}

// ==================== TREE FUNCTIONS ====================
let currentTree = null;

function createTree() {
    clearMessage();
    hideTreStats();
    const input = document.getElementById('treeInput').value.trim();
    if (!input) {
        showMessage('❌ Introduceți datele pentru arbore!', 'error');
        return;
    }
    try {
        const method = document.getElementById('method').value;
        let tree;
        if (method === 'direct') {
            tree = parseTreeDirect(input);
        } else if (method === 'inorder_preorder') {
            tree = parseTreeFromTraversals(input, 'preorder');
        } else if (method === 'inorder_postorder') {
            tree = parseTreeFromTraversals(input, 'postorder');
        }
        
        currentTree = tree;
        const traversals = getTraversals(tree);
        
        document.getElementById('srd').textContent = traversals.preorder.join(' → ');
        document.getElementById('rsd').textContent = traversals.inorder.join(' → ');
        document.getElementById('rds').textContent = traversals.postorder.join(' → ');
        document.getElementById('levelOrder').textContent = traversals.levelorder.join(' → ');
        document.getElementById('traversals').style.display = 'block';
        
        drawTree(tree);
        showMessage('✓ Arborele a fost creat cu succes!', 'success');
    } catch (e) {
        showMessage('❌ Eroare: ' + e.message, 'error');
    }
}

function parseTreeDirect(input) {
    const relations = input.split(';').map(r => r.trim()).filter(Boolean);
    const tree = {};
    relations.forEach(rel => {
        const [parent, childrenStr] = rel.split(':');
        if (!parent || !childrenStr) throw new Error('Format invalid pentru relație.');
        const parentTrim = parent.trim();
        const children = childrenStr.split(',').map(c => c.trim()).filter(Boolean);
        if (children.length > 2) throw new Error('Arborele binar nu poate avea mai mult de 2 copii.');
        if (!tree[parentTrim]) tree[parentTrim] = { left: null, right: null };
        if (children.length >= 1) tree[parentTrim].left = children[0];
        if (children.length >= 2) tree[parentTrim].right = children[1];
        children.forEach(child => {
            if (!tree[child]) tree[child] = { left: null, right: null };
        });
    });
    
    const allNodes = new Set(Object.keys(tree));
    const children = new Set();
    Object.values(tree).forEach(node => {
        if (node.left) children.add(node.left);
        if (node.right) children.add(node.right);
    });
    const roots = [...allNodes].filter(n => !children.has(n));
    if (roots.length !== 1) throw new Error('Arborele trebuie să aibă exact o rădăcină.');
    
    return { root: roots[0], nodes: tree };
}

function parseTreeFromTraversals(input, type) {
    const parts = input.split(';').map(p => p.trim()).filter(Boolean);
    if (parts.length !== 2) throw new Error('Trebuie să introduceți exact două traversări.');
    
    let inorder = [];
    let traversal = [];
    parts.forEach(part => {
        const [key, values] = part.split(':').map(s => s.trim());
        const vals = values.split(/[\s,]+/).filter(Boolean);
        if (['inorder', 'inordine', 'rsd'].includes(key.toLowerCase())) {
            inorder = vals;
        } else if ((type === 'preorder' && ['preorder', 'preordine', 'srd'].includes(key.toLowerCase())) ||
                   (type === 'postorder' && ['postorder', 'postordine', 'rds'].includes(key.toLowerCase()))) {
            traversal = vals;
        }
    });
    
    if (!inorder.length || !traversal.length) throw new Error('Ambele traversări trebuie prezente.');
    if (inorder.length !== traversal.length) throw new Error('Traversările trebuie să aibă același număr de noduri.');
    
    const nodes = {};
    function buildTree(inOrder, trav) {
        if (!inOrder.length) return null;
        let rootVal;
        if (type === 'preorder') {
            rootVal = trav.shift();
        } else {
            rootVal = trav.pop();
        }
        const rootIndex = inOrder.indexOf(rootVal);
        if (rootIndex === -1) throw new Error('Nodul ' + rootVal + ' nu există în inorder.');
        
        const leftIn = inOrder.slice(0, rootIndex);
        const rightIn = inOrder.slice(rootIndex + 1);
        nodes[rootVal] = { left: null, right: null };
        
        const left = buildTree(leftIn, trav);
        const right = buildTree(rightIn, trav);
        nodes[rootVal].left = left;
        nodes[rootVal].right = right;
        
        return rootVal;
    }
    
    const root = buildTree([...inorder], [...traversal]);
    return { root, nodes };
}

function getTraversals(tree) {
    const preorder = [];
    const inorder = [];
    const postorder = [];
    const levelorder = [];

    function traverse(node) {
        if (!node) return;
        preorder.push(node);
        traverse(tree.nodes[node].left);
        inorder.push(node);
        traverse(tree.nodes[node].right);
        postorder.push(node);
    }

    traverse(tree.root);

    // Level order (BFS)
    const queue = [tree.root];
    while (queue.length) {
        const node = queue.shift();
        levelorder.push(node);
        if (tree.nodes[node].left) queue.push(tree.nodes[node].left);
        if (tree.nodes[node].right) queue.push(tree.nodes[node].right);
    }

    return { preorder, inorder, postorder, levelorder };
}

function analyzeTre() {
    if (!currentTree) {
        showMessage('❌ Creați mai întâi un arbore!', 'error');
        return;
    }

    const height = getHeight(currentTree.root, currentTree.nodes);
    const nodeCount = Object.keys(currentTree.nodes).length;
    const leafCount = countLeaves(currentTree.root, currentTree.nodes);
    const isBalanced = checkBalanced(currentTree.root, currentTree.nodes);

    document.getElementById('treeNodeCount').textContent = nodeCount;
    document.getElementById('treeHeight').textContent = height;
    document.getElementById('leafCount').textContent = leafCount;
    document.getElementById('isBalanced').textContent = isBalanced ? 'DA ✓' : 'NU ✗';
    document.getElementById('treeStats').style.display = 'block';

    showMessage('✓ Analiza completă!', 'success');
}

function getHeight(node, nodes) {
    if (!node) return -1;
    const left = getHeight(nodes[node].left, nodes);
    const right = getHeight(nodes[node].right, nodes);
    return Math.max(left, right) + 1;
}

function countLeaves(node, nodes) {
    if (!node) return 0;
    if (!nodes[node].left && !nodes[node].right) return 1;
    return countLeaves(nodes[node].left, nodes) + countLeaves(nodes[node].right, nodes);
}

function checkBalanced(node, nodes) {
    if (!node) return true;
    const leftHeight = getHeight(nodes[node].left, nodes);
    const rightHeight = getHeight(nodes[node].right, nodes);
    if (Math.abs(leftHeight - rightHeight) > 1) return false;
    return checkBalanced(nodes[node].left, nodes) && checkBalanced(nodes[node].right, nodes);
}

function hideTreStats() {
    const statsElement = document.getElementById('treeStats');
    if (statsElement) statsElement.style.display = 'none';
}

function drawTree(tree) {
    const canvas = document.getElementById('treeCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const positions = {};
    const ySpacing = 100;
    const xSpacing = 80;

    function calculatePositions(node, x, y, offset) {
        if (!node) return;
        positions[node] = { x, y };
        if (tree.nodes[node].left) {
            calculatePositions(tree.nodes[node].left, x - offset, y + ySpacing, offset / 2);
        }
        if (tree.nodes[node].right) {
            calculatePositions(tree.nodes[node].right, x + offset, y + ySpacing, offset / 2);
        }
    }

    calculatePositions(tree.root, canvas.width / 2, 30, 100);

    // Draw edges
    ctx.strokeStyle = 'rgba(102, 126, 234, 0.6)';
    ctx.lineWidth = 2;
    Object.keys(tree.nodes).forEach(node => {
        const pos = positions[node];
        if (!pos) return;
        if (tree.nodes[node].left && positions[tree.nodes[node].left]) {
            const leftPos = positions[tree.nodes[node].left];
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.lineTo(leftPos.x, leftPos.y);
            ctx.stroke();
        }
        if (tree.nodes[node].right && positions[tree.nodes[node].right]) {
            const rightPos = positions[tree.nodes[node].right];
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.lineTo(rightPos.x, rightPos.y);
            ctx.stroke();
        }
    });

    // Draw nodes
    Object.keys(positions).forEach(node => {
        const pos = positions[node];
        // Vertex circle
        ctx.fillStyle = 'rgba(118, 75, 162, 0.9)';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 25, 0, 2 * Math.PI);
        ctx.fill();

        // Border
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Text
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node, pos.x, pos.y);
    });
}

function updateTreeInputArea() {
    const method = document.getElementById('method').value;
    let description = '';
    let placeholder = '';
    let example = '';
    switch(method) {
        case 'direct':
            description = 'Introduceți arborele în formatul: rădăcină: copil_stâng, copil_drept; ...';
            placeholder = 'Ex: A: B, C; B: D, E; C: F, G';
            example = '<p><strong>Exemplu:</strong></p><pre>A: B, C; B: D; C: E, F</pre><p>Primul copil este stâng, al doilea drept.</p>';
            break;
        case 'inorder_preorder':
            description = 'Introduceți inorder și preorder separate prin ;';
            placeholder = 'Ex: inorder: D B A E C; preorder: A B D E C';
            example = '<p><strong>Exemplu:</strong></p><pre>inorder: D B A E C; preorder: A B D E C</pre>';
            break;
        case 'inorder_postorder':
            description = 'Introduceți inorder și postorder separate prin ;';
            placeholder = 'Ex: inorder: D B A E C; postorder: D B E C A';
            example = '<p><strong>Exemplu:</strong></p><pre>inorder: D B A E C; postorder: D B E C A</pre>';
            break;
    }
    document.getElementById('description').innerHTML = '<i class="fas fa-info-circle"></i> ' + description;
    document.getElementById('treeInput').placeholder = placeholder;
    document.getElementById('example').innerHTML = example;
}

// ==================== UTILITY FUNCTIONS ====================
function toggleTheme() {
    document.body.classList.toggle('dark');
    const icon = document.querySelector('#themeToggle i');
    if (document.body.classList.contains('dark')) {
        icon.className = 'fas fa-sun';
        localStorage.setItem('theme', 'dark');
    } else {
        icon.className = 'fas fa-moon';
        localStorage.setItem('theme', 'light');
    }
}

function exportCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    const link = document.createElement('a');
    link.download = canvasId + '.png';
    link.href = canvas.toDataURL();
    link.click();
}

function clearCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    clearMessage();
    hideStats();
    hideTreStats();
    if (canvasId === 'graphCanvas') {
        currentGraph = null;
        document.getElementById('algorithms').style.display = 'none';
    } else if (canvasId === 'treeCanvas') {
        currentTree = null;
        document.getElementById('traversals').style.display = 'none';
    }
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
        document.body.classList.add('dark');
        const icon = document.querySelector('#themeToggle i');
        if (icon) icon.className = 'fas fa-sun';
    }

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Initialize examples
    if (document.getElementById('input')) {
        updateInputArea();
    }
    if (document.getElementById('treeInput')) {
        updateTreeInputArea();
    }
});
