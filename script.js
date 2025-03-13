/****************************************************
 * GLOBALE VARIABLER
 ****************************************************/
let boxes = [];
let connections = [];
let draggingBox = null;
let offsetX = 0, offsetY = 0;

// Gemmer info om første nodeklik
let selectedNode = null;

// Menu-elementer
let connectionMenu = null;
let relationAInput = null;
let relationBInput = null;
let saveRelationBtn = null;
let deleteConnectionBtn = null;

// Hvilken forbindelse er i fokus
let activeConnection = null;

/****************************************************
 * INIT
 ****************************************************/
window.addEventListener('DOMContentLoaded', init);

function init() {
    // Find menu-elementer
    connectionMenu = document.getElementById('connectionMenu');
    relationAInput = document.getElementById('relationAInput');
    relationBInput = document.getElementById('relationBInput');
    saveRelationBtn = document.getElementById('saveRelationBtn');
    deleteConnectionBtn = document.getElementById('deleteConnectionBtn');

    saveRelationBtn.addEventListener('click', onSaveRelation);
    deleteConnectionBtn.addEventListener('click', onDeleteConnection);

    // "Tilføj klasse"-knap
    document.getElementById('addClassBtn').addEventListener('click', () => {
        createBox({
            title: 'NyKlasse',
            attributes: ['-id:int', '-navn:String'],
            methods: ['+getNavn():String'],
            x: 100,
            y: 100
        });
    });

    // Start med to kasser
    createBox({
        title: 'Klasse 1',
        attributes: ['-id:int', '-data:String'],
        methods: ['+hentData()', '+gemData()'],
        x: 200,
        y: 120
    });
    createBox({
        title: 'Klasse 2',
        attributes: ['-nr:int', '-beskrivelse:String'],
        methods: ['+hentBeskrivelse()'],
        x: 450,
        y: 250
    });

    // Drag & drop solution
    const canvas = document.getElementById('canvas');
    canvas.addEventListener('mousedown', onCanvasMouseDown);
    document.addEventListener('mousemove', onDocumentMouseMove);
    document.addEventListener('mouseup', onDocumentMouseUp);
}

/****************************************************
 * CREATE BOX
 ****************************************************/
function createBox({ title, attributes, methods, x, y }) {
    const canvas = document.getElementById('canvas');

    const boxEl = document.createElement('div');
    boxEl.classList.add('box');
    boxEl.style.left = x + 'px';
    boxEl.style.top = y + 'px';

    // Farvebjælke
    const colorBar = document.createElement('div');
    colorBar.classList.add('colorBar');
    boxEl.appendChild(colorBar);

    // Farve-knap
    const colorBtn = document.createElement('button');
    colorBtn.classList.add('colorButton');
    colorBtn.innerText = 'Farve';
    colorBar.appendChild(colorBtn);

    // Farvemenu
    const colorMenu = document.createElement('div');
    colorMenu.classList.add('colorMenu');
    const colors = ['#ccc', '#ffc107', '#28a745', '#17a2b8', '#dc3545', '#6f42c1'];
    colors.forEach(col => {
        const cBtn = document.createElement('button');
        cBtn.style.background = col;
        cBtn.addEventListener('click', () => {
            colorBar.style.background = col;
            colorMenu.style.display = 'none';
        });
        colorMenu.appendChild(cBtn);
    });
    boxEl.appendChild(colorMenu);

    // Klik på farve-knap => toggle menu
    colorBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        colorMenu.style.display = (colorMenu.style.display === 'block') ? 'none' : 'block';
    });

    // Titel
    const titleEl = document.createElement('div');
    titleEl.classList.add('title');
    titleEl.contentEditable = true;
    titleEl.innerText = title || 'NyKlasse';
    boxEl.appendChild(titleEl);

    // Attributter
    const attrEl = document.createElement('div');
    attrEl.classList.add('attributes');
    (attributes || []).forEach(a => {
        const row = document.createElement('div');
        row.classList.add('attribute-row');
        row.contentEditable = true;
        row.innerText = a;
        attrEl.appendChild(row);
    });
    // + attribut
    const addAttr = document.createElement('div');
    addAttr.classList.add('add-attribute');
    addAttr.innerText = '+ attribut';
    addAttr.addEventListener('click', () => {
        const row = document.createElement('div');
        row.classList.add('attribute-row');
        row.contentEditable = true;
        row.innerText = '-nyAttr:String';
        attrEl.insertBefore(row, addAttr);
    });
    attrEl.appendChild(addAttr);
    boxEl.appendChild(attrEl);

    // Methods
    const methodsEl = document.createElement('div');
    methodsEl.classList.add('methods');
    (methods || []).forEach(m => {
        const row = document.createElement('div');
        row.classList.add('method-row');
        row.contentEditable = true;
        row.innerText = m;
        methodsEl.appendChild(row);
    });
    // + metode
    const addMethod = document.createElement('div');
    addMethod.classList.add('add-method');
    addMethod.innerText = '+ metode';
    addMethod.addEventListener('click', () => {
        const row = document.createElement('div');
        row.classList.add('method-row');
        row.contentEditable = true;
        row.innerText = '+nyMetode()';
        methodsEl.insertBefore(row, addMethod);
    });
    methodsEl.appendChild(addMethod);
    boxEl.appendChild(methodsEl);

    // 4 noder
    const nTop = document.createElement('div');
    nTop.classList.add('node', 'node-top');
    nTop.addEventListener('click', () => onNodeClick(boxObj, 'top'));
    boxEl.appendChild(nTop);

    const nRight = document.createElement('div');
    nRight.classList.add('node', 'node-right');
    nRight.addEventListener('click', () => onNodeClick(boxObj, 'right'));
    boxEl.appendChild(nRight);

    const nBottom = document.createElement('div');
    nBottom.classList.add('node', 'node-bottom');
    nBottom.addEventListener('click', () => onNodeClick(boxObj, 'bottom'));
    boxEl.appendChild(nBottom);

    const nLeft = document.createElement('div');
    nLeft.classList.add('node', 'node-left');
    nLeft.addEventListener('click', () => onNodeClick(boxObj, 'left'));
    boxEl.appendChild(nLeft);

    canvas.appendChild(boxEl);

    // Gem info
    const boxObj = {
        id: 'box-' + Math.random().toString(36).substr(2, 5),
        element: boxEl,
        x, y,
        width: boxEl.offsetWidth,
        height: boxEl.offsetHeight
    };
    boxes.push(boxObj);
}

/****************************************************
 * onNodeClick => forbinde 2 noder
 ****************************************************/
function onNodeClick(boxObj, side) {
    // Luk menu, hvis åben
    hideConnectionMenu();

    if (!selectedNode) {
        // Første klik
        selectedNode = { boxId: boxObj.id, side };
    } else {
        // Andet klik => opret forbindelse
        if (selectedNode.boxId !== boxObj.id || selectedNode.side !== side) {
            addConnection(selectedNode.boxId, selectedNode.side, boxObj.id, side);
        }
        selectedNode = null;
    }
}

/****************************************************
 * addConnection => opret polyline + to labels
 ****************************************************/
function addConnection(boxIdA, sideA, boxIdB, sideB) {
    const svg = document.getElementById('connectionLayer');

    // polyline
    const pline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    pline.setAttribute('fill', 'none');
    pline.setAttribute('stroke', '#000');
    pline.setAttribute('stroke-width', '2');
    pline.setAttribute('pointer-events', 'stroke'); // klikbart
    svg.appendChild(pline);

    // labelA
    const labelA = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    labelA.setAttribute('fill', 'red');
    labelA.setAttribute('font-size', '12');
    labelA.setAttribute('pointer-events', 'all');
    svg.appendChild(labelA);

    // labelB
    const labelB = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    labelB.setAttribute('fill', 'red');
    labelB.setAttribute('font-size', '12');
    labelB.setAttribute('pointer-events', 'all');
    svg.appendChild(labelB);

    // Klik på linjen eller label => vis menu
    const conn = {
        boxA: boxIdA, sideA,
        boxB: boxIdB, sideB,
        poly: pline,
        labelA, labelB,
        relationA: '', // Tekst fra kasse A
        relationB: ''  // Tekst fra kasse B
    };
    pline.addEventListener('click', (e) => {
        e.stopPropagation();
        onConnectionClick(conn, e.pageX, e.pageY);
    });
    labelA.addEventListener('click', (e) => {
        e.stopPropagation();
        onConnectionClick(conn, e.pageX, e.pageY);
    });
    labelB.addEventListener('click', (e) => {
        e.stopPropagation();
        onConnectionClick(conn, e.pageX, e.pageY);
    });

    connections.push(conn);
    updateConnections();
}

/****************************************************
 * onConnectionClick => vis menu
 ****************************************************/
function onConnectionClick(conn, clickX, clickY) {
    activeConnection = conn;
    // Sæt inputfelter
    relationAInput.value = conn.relationA || '';
    relationBInput.value = conn.relationB || '';
    // Vis menu
    connectionMenu.style.display = 'block';
    connectionMenu.style.left = clickX + 'px';
    connectionMenu.style.top = clickY + 'px';
}

/****************************************************
 * onSaveRelation => gem relation
 ****************************************************/
function onSaveRelation() {
    if (!activeConnection) return;
    activeConnection.relationA = relationAInput.value;
    activeConnection.relationB = relationBInput.value;
    hideConnectionMenu();
    updateConnections();
}

/****************************************************
 * onDeleteConnection => slet forbindelse
 ****************************************************/
function onDeleteConnection() {
    if (!activeConnection) return;
    if (activeConnection.poly) activeConnection.poly.remove();
    if (activeConnection.labelA) activeConnection.labelA.remove();
    if (activeConnection.labelB) activeConnection.labelB.remove();

    connections = connections.filter(c => c !== activeConnection);
    hideConnectionMenu();
}

/****************************************************
 * hideConnectionMenu => luk menu
 ****************************************************/
function hideConnectionMenu() {
    connectionMenu.style.display = 'none';
    activeConnection = null;
}

/****************************************************
 * DRAG & DROP
 ****************************************************/
function onCanvasMouseDown(e) {
    // Luk menu hvis klikket på tomt canvas
    if (e.target.id === 'canvas') {
        hideConnectionMenu();
    }

    const colorBar = e.target.closest('.colorBar');
    if (colorBar) {
        const boxEl = colorBar.parentElement;
        const boxObj = boxes.find(b => b.element === boxEl);
        if (boxObj) {
            draggingBox = boxObj;
            const canvasRect = document.getElementById('canvas').getBoundingClientRect();
            offsetX = e.clientX - canvasRect.left - boxObj.x;
            offsetY = e.clientY - canvasRect.top - boxObj.y;
        }
    }
}

function onDocumentMouseMove(e) {
    if (draggingBox) {
        moveBox(e);
    }
}

function onDocumentMouseUp() {
    if (draggingBox) {
        draggingBox.width = draggingBox.element.offsetWidth;
        draggingBox.height = draggingBox.element.offsetHeight;
    }
    draggingBox = null;
}

/****************************************************
 * moveBox
 ****************************************************/
function moveBox(e) {
    const canvas = document.getElementById('canvas');
    const rect = canvas.getBoundingClientRect();
    const boxObj = draggingBox;

    let newX = e.clientX - rect.left - offsetX;
    let newY = e.clientY - rect.top - offsetY;

    newX = Math.max(0, Math.min(newX, canvas.offsetWidth - boxObj.width));
    newY = Math.max(0, Math.min(newY, canvas.offsetHeight - boxObj.height));

    boxObj.element.style.left = newX + 'px';
    boxObj.element.style.top = newY + 'px';
    boxObj.x = newX;
    boxObj.y = newY;

    updateConnections();
}

/****************************************************
 * updateConnections => Z-form + 2 labels
 ****************************************************/
function updateConnections() {
    connections.forEach(conn => {
        const boxA = boxes.find(b => b.id === conn.boxA);
        const boxB = boxes.find(b => b.id === conn.boxB);
        if (!boxA || !boxB) return;

        const pA = getNodeCenter(boxA, conn.sideA);
        const pB = getNodeCenter(boxB, conn.sideB);

        // Lav en Z-form
        const pts = getSegments(pA, conn.sideA, pB, conn.sideB);
        const pathStr = pts.map(p => p.join(',')).join(' ');
        conn.poly.setAttribute('points', pathStr);

        // Placér labelA ved midtpunktet mellem p1 og p1Out
        // Placér labelB ved midtpunktet mellem p2 og p2In
        // => vi antager 5 punkter: [p1, p1Out, mid, p2In, p2]
        // p1 = pts[0], p1Out = pts[1], p2In = pts[3], p2 = pts[4]

        if (pts.length === 5) {
            const p1 = pts[0];
            const p1Out = pts[1];
            const p2In = pts[3];
            const p2_ = pts[4];

            const midA = midpoint(p1, p1Out);
            conn.labelA.setAttribute('x', midA.x);
            conn.labelA.setAttribute('y', midA.y);
            conn.labelA.textContent = conn.relationA || '';

            const midB = midpoint(p2In, p2_);
            conn.labelB.setAttribute('x', midB.x);
            conn.labelB.setAttribute('y', midB.y);
            conn.labelB.textContent = conn.relationB || '';
        }
    });
}

/****************************************************
 * getNodeCenter
 ****************************************************/
function getNodeCenter(boxObj, side) {
    const nodeEl = boxObj.element.querySelector(`.node-${side}`);
    if (!nodeEl) return { x: boxObj.x, y: boxObj.y };

    const boxRect = boxObj.element.getBoundingClientRect();
    const nodeRect = nodeEl.getBoundingClientRect();
    const canvasRect = document.getElementById('canvas').getBoundingClientRect();

    const x = (nodeRect.left - canvasRect.left) + (nodeRect.width / 2);
    const y = (nodeRect.top - canvasRect.top) + (nodeRect.height / 2);
    return { x, y };
}

/****************************************************
 * getSegments => Z-form
 ****************************************************/
function getSegments(p1, sideA, p2, sideB) {
    const offset = 20;
    let p1Out = { x: p1.x, y: p1.y };
    if (sideA === 'left') p1Out.x -= offset;
    if (sideA === 'right') p1Out.x += offset;
    if (sideA === 'top') p1Out.y -= offset;
    if (sideA === 'bottom') p1Out.y += offset;

    let p2In = { x: p2.x, y: p2.y };
    if (sideB === 'left') p2In.x -= offset;
    if (sideB === 'right') p2In.x += offset;
    if (sideB === 'top') p2In.y -= offset;
    if (sideB === 'bottom') p2In.y += offset;

    const mid = [p2In.x, p1Out.y];

    return [
        [p1.x, p1.y],
        [p1Out.x, p1Out.y],
        mid,
        [p2In.x, p2In.y],
        [p2.x, p2.y]
    ];
}

/****************************************************
 * midpoint => finder midtpunktet mellem to punkter
 ****************************************************/
function midpoint(a, b) {
    return {
        x: (a[0] + b[0]) / 2,
        y: (a[1] + b[1]) / 2
    };
}