jQuery(document).ready(function ($) {
    /**
     * Hide Modal
     */

    $(".close", "#View3DModal").click(function () {
        document.getElementById('View3DModal').classList.add("hide");
        /**
         * 
         * remove Modal Content
         */
        const modalBody = document.getElementById('modelContainer');

        modalBody.innerHTML = "";
        document.querySelector("#View3DModal .loadingScreen").style.display = "none";
        document.querySelector("#View3DModal .animationController").style.display = "none";
        document.querySelector("#View3DModal .transform_changer").style.display = "none";
        document.querySelector("#View3DModal .slider_window").style.display = "none";
    });
    document.getElementById("confirmDecodeYes").addEventListener('click', downloadDecodeFile);
    document.getElementById("confirmDecodeNo").addEventListener('click', downloadOriginalFile);
    var encodedfileUrl = '', Gurlarray = [];
    // loadedMeshes = {}, cameras = {};
    var transform_changers = document.getElementsByClassName('transform_changer');
    for(let trcs = 0; trcs < transform_changers.length; trcs++) {
        transform_changers[trcs].addEventListener('click', function() {
            this.classList.toggle('active');
            let targetUrl = this.parentElement.getAttribute("data-url")
            if(this.classList.contains("active")) {
                this.innerHTML = "R";
                transformControls[targetUrl].setMode("rotate");
            } else {
                this.innerHTML = "T"
                transformControls[targetUrl].setMode("translate");
            }
        })
    }
});

var loadedMeshes = {}, meshPlay, cameras = {}, teethInfo = {}, transInfo={}, maxStep = {}, minStep = {}, centerPoint = {}, transformControls = {}, selectedObjectMesh, originalPosition;
var tooth_Matrices = [];
var attach_Matrices = [];
let textContent ;
let new_filename;
let upperSteps, lowerSteps;
let meshnumber;
let maxnumber;



function playMesh(url) {
    var playButtonStatus = document.querySelector('div[data-url="'+ url +'"] .animationController .meshPlayBtn');
    let slider = document.querySelector('div[data-url="'+ url +'"] .animationController .animateSlider');
    playButtonStatus.classList.toggle('active');
    clearInterval(meshPlay);
    meshPlay = null;
    if(playButtonStatus.classList.contains('active')) {
        if(slider.value == slider.max) {
            slider.value = 0;
        }
        meshPlay = setInterval(function() {
            slider.value++;
            if(Number(slider.value) >= Number(slider.max)){
                playButtonStatus.classList.remove('active');
                clearInterval(meshPlay);
                meshPlay = null;
            }
            changeMesh(url)
        }, 400)
    }
}

function open3DModelDialog(url, name) {
    document.querySelector("#View3DModal .camera_controller").style.top = "65%";
    if(document.querySelector('.ps-chat__window-input'))
     document.querySelector('.ps-chat__window-input').focus = false;
    new_filename = name;
    console.log("nameAAA: ", name)
    document.getElementById('View3DModal').classList.remove("hide");
    const baseUrl = `${window.location.protocol}//${window.location.host}/`;
    const modalBody = document.getElementById('modelContainer');
    modalBody.parentElement.setAttribute("data-url", url);
    // Check for the existence of necessary elements
    if (!modalBody) {
        return;
    }
    modalBody.style.height = modalBody.clientWidth / 16 * 9 + "px";
    // Clear any previous content
    modalBody.innerHTML = "";
    /**
     * 
     * @param {*} imageUrl 
     * @returns 3D Model Viewer
     */
    view3DModelR(url, modalBody)
    document.querySelector("#View3DModal .up-btn").setAttribute('onclick', 'changeMesh("'+url+'", event)')
    document.querySelector("#View3DModal .lo-btn").setAttribute('onclick', 'changeMesh("'+url+'", event)')
    document.querySelector("#View3DModal .meshPlayBtn").setAttribute('onclick', 'playMesh("'+url+'", event)')
    document.querySelector("#View3DModal .animateSlider").setAttribute('oninput', 'changeMesh("'+url+'")')
}

function changeMesh(url, event) {
    

    if(event != undefined)
        event.target.classList.toggle('active');
    const meshToChange = loadedMeshes[url]
    let buttonCheck = 0;
    if(document.querySelector('div[data-url="'+ url +'"] .animationController .up-btn').classList.contains('active')) {
        buttonCheck += 2;
    }
    if(document.querySelector('div[data-url="'+ url +'"] .animationController .lo-btn').classList.contains('active')) {
        buttonCheck += 1;
    }
    meshnumber = document.querySelector('div[data-url="'+ url +'"] .animationController .animateSlider').value;
    if(url.slice(-3) == "pac") {
        let savebtn = document.querySelector('div[data-url="'+ url +'"]  #xmlSave')
        savebtn.style.display = "none";
        for (const [filename, mesh] of Object.entries(meshToChange)) {
            mesh.visible = false;
            if(Number(filename.replace(/\D/g, "")) == meshnumber){
                if(buttonCheck == 3) {
                    mesh.visible = true;
                } else if (buttonCheck == 2 && filename.includes("upper")) {
                    mesh.visible = true;
                } else if(buttonCheck == 1 && filename.includes("lower")) {
                    mesh.visible = true;
                }
            }  
        }
        
    }
    if(url.slice(-3) == "gvw" || url.slice(-3) == "zip") {        
        let transInfo4this = transInfo[url];
        console.log("transInfo4this= transInfo[url]: ", transInfo4this );
        maxnumber = document.querySelector('div[data-url="'+ url +'"] .animationController .animateSlider').max;
        
        let transform_changer = document.querySelector('div[data-url="'+ url +'"] .transform_changer');
        let savebtn = document.querySelector('div[data-url="'+ url +'"]  #xmlSave')
        let slider_window = document.querySelector('div[data-url="'+ url +'"] .slider_window');

        if(meshnumber == maxnumber) {
            transform_changer.style.display = "block";
            savebtn.style.display = "block";
            // slider_window.style.display = "block";
        } else {
            transform_changer.style.display = "none";
            savebtn.style.display = "none";
            slider_window.style.display = "none";
            document.querySelector("#View3DModal .camera_controller").style.top = "65%";
            transform_changer.classList.remove('active');
            if(selectedObjectMesh != undefined){
                transformControls[url].detach(selectedObjectMesh);
            }
        }
        
        let meshes4this = loadedMeshes[url], upperTissues = {}, lowerTissues = {};
        
        // Animation for Tissue
        for(let key in meshes4this) {
            let slicedname = key.slice(-17);
            if(slicedname.includes("UpperTissue")){
                upperTissues[`step${slicedname.replace(/\D/g, "")}`] = meshes4this[key]
            }
            if(slicedname.includes("LowerTissue")){
                lowerTissues[`step${slicedname.replace(/\D/g, "")}`] = meshes4this[key]
            }
            meshes4this[key].visible = false;
        }
        // Get last tissue mesh when step number is greater than the length of tissue (In case of upper and lower tissue length is different)
        let upperMesh = (upperTissues[`step${meshnumber}`] != undefined) ? upperTissues[`step${meshnumber}`] : upperTissues[`step${Object.keys(upperTissues).length-1}`];
        let lowerMesh = (lowerTissues[`step${meshnumber}`] != undefined) ? lowerTissues[`step${meshnumber}`] : lowerTissues[`step${Object.keys(lowerTissues).length-1}`];
        let upperteeth = teethInfo[url].filter(item => item.number < 17);
        let lowerteeth = teethInfo[url].filter(item => item.number > 16);
        console.log("teethinfo: ", teethInfo)
        for(let stepn = 0; stepn <= Number(meshnumber); stepn++) {
            if(!transInfo4this[`step${stepn}`]) continue
            let initTransform = transInfo4this[`step${stepn}`];
            for(let stepsub = 0 ; stepsub < initTransform.length; stepsub++) {
                
                let toothNumber2Transform = initTransform[stepsub].toothNumber;
                let tooth2Transform = teethInfo[url].filter(item => item.number == toothNumber2Transform)[0];
                let transMatrixArray, transMatrix4;
                // if(toothNumber2Transform == 4 && stepn == 27) debugger
                if(initTransform[stepsub].ToothTransform != undefined) {
                    transMatrixArray = initTransform[stepsub].ToothTransform;
                    let mesh2Transform = loadedMeshes[url][tooth2Transform.toothName];
                    mesh2Transform.position.set(0, 0, 0);
                    mesh2Transform.rotation.set(0, 0, 0);
                    mesh2Transform.scale.set(1, 1, 1);
                    transMatrix4 = new Matrix4().fromArray(transMatrixArray);
                    transMatrix4.transpose();
                    mesh2Transform.applyMatrix4(transMatrix4);
                    // tooth_Matrices[toothNumber2Transform - 2] = mesh2Transform.matrixWorld
                }
                if(initTransform[stepsub].AttachmentTransform1 != undefined) {
                    transMatrixArray = initTransform[stepsub].AttachmentTransform1;
                    // if (!loadedMeshes[url][tooth2Transform.att1]) continue
                    let mesh2Transform = loadedMeshes[url][tooth2Transform.att1];   
                    // if(toothNumber2Transform == 4 && stepn == 27) debugger
                    mesh2Transform.position.set(0, 0, 0);
                    mesh2Transform.rotation.set(0, 0, 0);
                    mesh2Transform.scale.set(1, 1, 1);
                    transMatrix4 = new Matrix4().fromArray(transMatrixArray);
                    transMatrix4.transpose();
                    // Re-calcuate matrix array since attachment
                    let parentModel = mesh2Transform.parent;
                    // Assume parentModel and childModel are both loaded and you have their original matrices
                    parentModel.updateMatrix(true);
                    // Invert the parent world matrix
                    const invertedParentWorldMatrix = new Matrix4().copy(parentModel.matrixWorld).invert();
                    // if(toothNumber2Transform == 4 && stepn == 27) debugger
                    // Combine the original child matrix with the inverted parent world matrix
                    const correctChildMatrix = new Matrix4().multiplyMatrices(invertedParentWorldMatrix, transMatrix4);
                    // Attach the child to the parent
                    parentModel.add(mesh2Transform);
                    // Apply the corrected matrix to the child
                    mesh2Transform.matrix.copy(correctChildMatrix);
                    mesh2Transform.matrix.decompose(mesh2Transform.position, mesh2Transform.quaternion, mesh2Transform.scale);
                    // mesh2Transform.applyMatrix4(transMatrix4);
                    // mesh2Transform.updateMatrix(true);
                    // if(toothNumber2Transform == 4 && stepn == 27) debugger           
                    
                }
                if(initTransform[stepsub].AttachmentTransform2 != undefined) {
                    transMatrixArray = initTransform[stepsub].AttachmentTransform2;
                    let mesh2Transform = loadedMeshes[url][tooth2Transform.att2];
                    // mesh2Transform.position.set(0, 0, 0);
                    // mesh2Transform.rotation.set(0, 0, 0);
                    // mesh2Transform.scale.set(1, 1, 1);
                    transMatrix4 = new Matrix4().fromArray(transMatrixArray);
                    transMatrix4.transpose();
                    // Re-calcuate matrix array since attachment
                    let parentModel = mesh2Transform.parent;
                    parentModel.updateMatrix(true);
                    const invertedParentWorldMatrix = new Matrix4().copy(parentModel.matrixWorld).invert();
                    const correctChildMatrix = new Matrix4().multiplyMatrices(invertedParentWorldMatrix, transMatrix4);
                    parentModel.add(mesh2Transform);
                    mesh2Transform.matrix.copy(correctChildMatrix);
                    mesh2Transform.matrix.decompose(mesh2Transform.position, mesh2Transform.quaternion, mesh2Transform.scale);
                    // mesh2Transform.applyMatrix4(transMatrix4);
                    // mesh2Transform.updateMatrix(true);
                }

            }
        }
        if(buttonCheck == 3) {
            
            changeDisplayMode(upperteeth, true, url);
            changeDisplayMode(lowerteeth, true, url);
            upperMesh.visible = true;
            lowerMesh.visible = true;
        } else if (buttonCheck == 2) {
            changeDisplayMode(upperteeth, true, url);
            changeDisplayMode(lowerteeth, false, url);
            upperMesh.visible = true;
            lowerMesh.visible = false;
        } else if(buttonCheck == 1) {
            changeDisplayMode(upperteeth, false, url);
            changeDisplayMode(lowerteeth, true, url);
            upperMesh.visible = false;
            lowerMesh.visible = true;
        }
    }
    else {
        let savebtn = document.querySelector('div[data-url="'+ url +'"]  #xmlSave')
        savebtn.style.display = "none";
    }
    console.log("meshnumber: ", meshnumber)
    
    document.querySelector('div[data-url="'+ url +'"] .animationController .currentStep').innerHTML = Number(meshnumber) + 1;
}

function changeDisplayMode(teeth, visible, url) {
    
    for( let ccd = 0; ccd < teeth.length; ccd++) {
        loadedMeshes[url][teeth[ccd].toothName].visible = visible;
        
        
        if(teeth[ccd].att1 != null) {
            loadedMeshes[url][teeth[ccd].att1].visible = visible;
        }
        if(teeth[ccd].att2 != null) {
            loadedMeshes[url][teeth[ccd].att2].visible = visible;
        }
    }
    
    
}

function downloadModel(url) {
    Gurlarray = url.split("/")
    if(url.slice(-1) == "x") {
        document.getElementById('rDecodeconfirmModal').classList.remove("hide");
        document.getElementById('rDecodeconfirmModal').classList.add("show");
        encodedfileUrl = url;
    } else {
        const aElem = document.createElement('a');
        aElem.href = url;
        aElem.download = Gurlarray[Gurlarray.length - 1];
        aElem.click();
    }
}

function downloadDecodeFile() {
    const dracoLoaderForDownload = new DRACOLoader();
    dracoLoaderForDownload.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    dracoLoaderForDownload.setDecoderConfig({ type: 'js' });

    dracoLoaderForDownload.load(encodedfileUrl, function(geometry) {
        let material
        if (geometry.attributes.color) {
            material = new MeshStandardMaterial({ vertexColors: true });
        } else {
            material = new MeshStandardMaterial({ color: 0xdddddd });
        }
        const mesh = new Mesh(geometry, material);
        let exporter;
        if(encodedfileUrl.slice(-4, -1) == 'ply') {
            exporter = new PLYExporter();
        } else {
            exporter = new STLExporter();
        }
        const objData = exporter.parse(mesh, {binary: false});
        
        const blob = new Blob([objData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const aEl = document.createElement('a');
        aEl.href = url;
        aEl.download = (Gurlarray[Gurlarray.length - 1]).slice(0, -1);
        aEl.click();
        document.getElementById('rDecodeconfirmModal').classList.remove("show");
        document.getElementById('rDecodeconfirmModal').classList.add("hide");
    })
}

function downloadOriginalFile() {
    const aElem = document.createElement('a');
    aElem.href = encodedfileUrl;
    aElem.download = Gurlarray[Gurlarray.length - 1];
    aElem.click();
    document.getElementById('rDecodeconfirmModal').classList.remove("show");
    document.getElementById('rDecodeconfirmModal').classList.add("hide");
}

// Call the function to execute
function view3DModelR(url, container) {
    let savebtn = document.querySelector('div[data-url="'+ url +'"]  #xmlSave')
    savebtn.style.display = "none";
    const fileBuffers = {};
    let camera, scene, renderer, controls, Gloader, transformControl;
    document.querySelector('#View3DModal').dataset.url = url;
    const stlLoader = new STLLoader();
    const plyLoader = new PLYLoader();
    // Configure and create Draco decoder.
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    dracoLoader.setDecoderConfig({ type: 'js' });
    

    let extension = url.slice(-3);
    if(extension == "ply") {
        Gloader = plyLoader;
    } else if (extension == "stl"){
        Gloader = stlLoader;
    } else {
        Gloader = dracoLoader;
    }
    scene = new Scene();
    scene.background = new Color(0xffffff);

    camera = new OrthographicCamera( container.clientWidth / -10, container.clientWidth / 10, container.clientHeight / 10, container.clientHeight / -10, -500, 1000);
    camera.position.set(0, -70, 30);
    // camera = new PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);

    // Lights
    if (extension == "stl") {
        const keyLight = new DirectionalLight(0xffffff, 2.5);
        keyLight.position.set(-10, 10, 35);
        scene.add(keyLight);

        const fillLight = new DirectionalLight(0xffffff, 2.5);
        fillLight.position.set(20, 10, 25);
        scene.add(fillLight);

        const backLight = new DirectionalLight(0xffffff, 3.5);
        backLight.position.set(2, -65, 30);
        scene.add(backLight);

        const ambientLight = new AmbientLight(0x85E5FF, 0.2);
        scene.add(ambientLight);

        const dbackLight12 = new DirectionalLight(0xffffff, 2.5);
        dbackLight12.position.set(-30, 10, -35);
        scene.add(dbackLight12);

        const dbackLight2 = new DirectionalLight(0xffffff, 2.5);
        dbackLight2.position.set(30, 10, -35);
        scene.add(dbackLight2);

    } else {
        const keyLight = new DirectionalLight(0xffffff, 1.3);
        keyLight.position.set(30, 30, 70);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 4096;
        keyLight.shadow.mapSize.height = 4096;
        keyLight.shadow.bias = -0.0001;
        scene.add(keyLight);
        
        const backLight1 = new DirectionalLight(0xffffff, 1.3);
        backLight1.position.set(0, -100, 30);
        scene.add(backLight1);
        
        const backLight2 = new DirectionalLight(0xffffff, 0.9);
        backLight2.position.set(200, -100, 30);
        scene.add(backLight2);
        
        const backLight3 = new DirectionalLight(0xffffff, 0.9);
        backLight3.position.set(-200, -100, 30);
        scene.add(backLight3);
        
        const backLight4 = new DirectionalLight(0xffffff, 0.9);
        backLight4.position.set(0, 100, -30);
        scene.add(backLight4);
        
        const dbackLight = new DirectionalLight(0xffffff, 0.5);
        dbackLight.position.set(0, 0, -30);
        scene.add(dbackLight);
        
        const ambientLight = new AmbientLight(0x85E5FF, 0.5);
        scene.add(ambientLight);
    }
    async function fetchAndUnzip(url) {
        try {
            // Fetch the .gvw file from the server, just like the zip file
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
            }
    
            // Get the array buffer from the response
            const arrayBuffer = await response.arrayBuffer();
    
            // Initialize JSZip
            const zip = new JSZip();
    
            // Load the array buffer into JSZip
            const contents = await zip.loadAsync(arrayBuffer);
    
            // Process the contents just like with zip files
            for (const filename of Object.keys(contents.files)) {
                const file = contents.files[filename];
    
                // If it's not a directory, get its buffer
                if (!file.dir) {
                    const buffer = await file.async("arraybuffer");
                    fileBuffers[filename] = buffer;
                }
            }
    
        } catch (error) {
            console.error("An error occurred:", error);
        }
    }
    

    renderer = new WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth-4, container.clientHeight);		//Indicate parent div width and height
    renderer.setAnimationLoop(animate);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);


    

    transformControl = new TransformControls(camera, renderer.domElement);
    scene.add(transformControl);
    transformControl.enabled = false;
    transformControl.setSize(1);
    transformControls[url] = transformControl;


    controls = new TrackballControls(camera, renderer.domElement);

        // Optional settings
    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.4;
    controls.noZoom = false; // Allow zooming
    controls.noPan = false;  // Allow panning
    
    let tempModels = []
    // let tempGroup = new Group();
    if(extension == "pac") {
        document.querySelector('div[data-url="'+ url +'"] .loadingScreen').style.display = "flex";
        
        fetchAndUnzip(url)
		.then((result) => {
            loadedMeshes[url] = {}
            const entries = Object.entries(fileBuffers);
            
            for (const [index, [filename, buffer]] of entries.entries()) {
                (async () => {
                    try {
                        const geometry = await new Promise((resolve, reject) => {
                            Gloader.parse(buffer, (parsedGeometry) => {
                                parsedGeometry.computeVertexNormals();
                                resolve(parsedGeometry);
                            });
                        });
            
                        let material;
                        if (geometry.attributes.color) {
                            material = new MeshPhongMaterial({ vertexColors: true, side: DoubleSide });
                        } else {
                            material = new MeshPhongMaterial({ color: 0x7DCBFA, side: DoubleSide });
                        }
            
                        material.reflectivity = 0.7; // Example value for reflectivity

                        // Adding specular highlights
                        material.shininess = 10; // value for shininess
                        material.flatShading = false;
                        material.needsUpdate = true;

                        const mesh = new Mesh(geometry, material);
            
                        geometry.computeBoundingBox();
                        const bbox = geometry.boundingBox;
                        const center = bbox.getCenter(new Vector3());
                        mesh.position.sub(center);
                        mesh.castShadow = true;
                        const height = bbox.max.z - bbox.min.z;
                        
                        let spacing = 2;
                        if (filename.includes("upper")) {
                            mesh.position.z = mesh.position.z + height / 2 - spacing;
                        } else {
                            mesh.position.z = mesh.position.z - height / 2 + spacing;
                        }
            
                        scene.add(mesh);
                        if(filename.replace(/\D/g, "") == 0) {
                            mesh.visible = true;
                        } else {
                            mesh.visible = false;
                        }
                        loadedMeshes[url][filename] = mesh;
                        if (index === entries.length - 1) {
                            //Load Complete Action
                            document.querySelector('div[data-url="'+ url +'"] .animationController').style.display = "block";
                            document.querySelector('div[data-url="'+ url +'"] .loadingScreen').style.display = "none";
                        }
                    } catch (error) {
                        console.error("Error parsing geometry for file:", filename, "Error:", error);
                        return;
                    }
                })();
            }
            
            const mesheslength = Object.keys(fileBuffers).length;
            document.querySelector('div[data-url="'+ url +'"] .animationController .animateSlider').max = Math.floor(mesheslength / 2 - 1);
            document.querySelector('div[data-url="'+ url +'"] .animationController .animateSlider').value = 0;
            document.querySelector('div[data-url="'+ url +'"] .animationController .maxStep').innerHTML = Math.floor(mesheslength / 2 );
            document.querySelector('div[data-url="'+ url +'"] .animationController .currentStep').innerHTML = 1;
            controls.update();
            })
            .catch (error => {

                return;
            })   
    } else if(extension == "zip" || extension == "gvw") {
        // controls = new OrbitControls(camera, renderer.domElement)
        // controls.enableDamping = true;
        document.querySelector('div[data-url="'+ url +'"] .loadingScreen').style.display = "flex";

        // controls.dispose();
        // controls = null;
        // controls = new OrbitControls(camera, renderer.domElement)
		// controls.enableDamping = true;

        // transformControl = new TransformControls(camera, renderer.domElement);
		// scene.add(transformControl);

        renderer.domElement.addEventListener('mousedown', onMouseClick, false);

        
        fetchAndUnzip(url)
		.then((result) => {
            loadedMeshes[url] = {}
            maxStep[url] = 0;
            centerPoint[url] = [0, 0, 0];
            const entries = Object.entries(fileBuffers);            
            // Load mainfest XML file
            let manifestFileName = Object.keys(fileBuffers).filter(key => key.toLowerCase().includes('xml'));
            let textDecorder = new TextDecoder('utf-8');
			textContent = textDecorder.decode(fileBuffers[manifestFileName]);
            let textContent1 = textContent;
			textContent1 = textContent1.replace('/>', '>');
            textContent1 = textContent1 + '</RootNode>';
			var parser = new DOMParser();
			xmlDoc = parser.parseFromString(textContent1, 'text/xml');
			XMLobject = xmlDoc.documentElement.children;

			let collectionArray = Array.from(XMLobject);
            
			upperSteps = collectionArray.filter(item => item.nodeName.toLowerCase() === 'upperstep');
			lowerSteps = collectionArray.filter(item => item.nodeName.toLowerCase() === 'lowerstep');
            
            console.log("collectionArray", collectionArray)
            
            maxStep[url] = upperSteps.length > lowerSteps.length ? upperSteps.length : lowerSteps.length;
            minStep[url] = upperSteps.length < lowerSteps.length ? upperSteps.length : lowerSteps.length;

            teethInfo[url] = [];
            transInfo[url] = {};
            
            let upperinit = upperSteps[0].children;
			for(i = 0; i < upperinit.length; i++) {
				let tooth_stlfilename = upperinit[i].getAttribute('Tooth_STLFile');
				let attr1_stlfilename = upperinit[i].getAttribute('Attachment_STLFile1');
				let attr2_stlfilename = upperinit[i].getAttribute('Attachment_STLFile2');
				let temp = {
					number : upperinit[i].getAttribute('ToothNumber'),
					toothName : tooth_stlfilename.replace(/\\/g, "/"),
					att1 : attr1_stlfilename == null ? null : attr1_stlfilename.replace(/\\/g, "/"),
					att2 : attr2_stlfilename == null ? null : attr2_stlfilename.replace(/\\/g, "/")
				}
				teethInfo[url].push(temp);
			}
			let lowerinit = lowerSteps[0].children;
			for(i = 0; i < lowerinit.length; i++) {
				let tooth_stlfilename = lowerinit[i].getAttribute('Tooth_STLFile');
				let attr1_stlfilename = lowerinit[i].getAttribute('Attachment_STLFile1');
				let attr2_stlfilename = lowerinit[i].getAttribute('Attachment_STLFile2');
				let temp = {
					number : lowerinit[i].getAttribute('ToothNumber'),
					toothName : tooth_stlfilename.replace(/\\/g, "/"),
					att1 : attr1_stlfilename == null ? null : attr1_stlfilename.replace(/\\/g, "/"),
					att2 : attr2_stlfilename == null ? null : attr2_stlfilename.replace(/\\/g, "/")
				}
				teethInfo[url].push(temp);
			}
            
            for(i = 0; i < maxStep[url]; i++) {
				transInfo[url][`step${i}`] = [];
			}
			for(i = 0; i < collectionArray.length; i++) {
				let istep = collectionArray[i].children;
				for(j = 0; j < istep.length; j++) {
					if(istep[j].children.length > 0) {
						let temp = {};
						temp.toothNumber = istep[j].getAttribute('ToothNumber');
						let transfromChildren = istep[j].children;
						for( k = 0; k < transfromChildren.length; k++) {
							temp[transfromChildren[k].nodeName] = [];
							for(matrixcounter = 0; matrixcounter < 16; matrixcounter++) {
								temp[transfromChildren[k].nodeName].push(parseFloat(transfromChildren[k].getAttribute(`m${matrixcounter}`)))
							}
						}
						transInfo[url][`step${istep[j].getAttribute('StepNumber')}`].push(temp);
					}
				}
			}

            console.log(transInfo)
            let flag = 0;
            for (const [index, [filename, buffer]] of entries.entries()) {
                if(index == 0 && filename.includes('.xml')) flag = 1;
                if(!filename.includes('.xml')) {
                        try {
                            let slicedname = filename.split("/").slice(-1)[0];
                            if(filename.slice(-3) == "stl");
                                Gloader = stlLoader;
                            
                            const geometry = Gloader.parse(buffer);

                            let transMatrixArray, transMatrix4;
                            let initTransform = transInfo[url].step0;
                            if(!slicedname.includes('erTissue')) {
                                let toothobj = teethInfo[url].find(item => item.toothName == filename)
                                let attr1obj =  teethInfo[url].find(item => item.att1 == filename)
                                let attr2obj =  teethInfo[url].find(item => item.att2 == filename)
                                if(toothobj != undefined) {
                                    transMatrixArray = (initTransform.find(item => item.toothNumber == toothobj.number)).ToothTransform;
                                }
                                if(attr1obj != undefined) {
                                    transMatrixArray = (initTransform.find(item => item.toothNumber == attr1obj.number)).AttachmentTransform1;
                                }
                                if(attr2obj != undefined) {
                                    transMatrixArray = (initTransform.find(item => item.toothNumber == attr2obj.number)).AttachmentTransform2;
                                }
                                transMatrix4 = new Matrix4().fromArray(transMatrixArray);
                                transMatrix4.transpose();
                            }
                            
                            
                            let material;
                            if (geometry.attributes.color) {
                                material = new MeshPhongMaterial({ vertexColors: true, side: DoubleSide });
                            } else {
                                if (slicedname.includes("attachment")) {
                                    material = new MeshPhysicalMaterial({
                                        color: 0xCE89FE,
                                        side: DoubleSide,
                                        roughness: 0.7,
                                        metalness: 0,
                                        reflectivity: 0.02,
                                        clearcoat: 0.1,
                                    });
                                } else if (slicedname.includes("erTissue")) {
                                    material = new MeshPhysicalMaterial({
                                        color: 0xFF9292, // Softer pink color (less red)
                                        side: DoubleSide,
                                        roughness: 0.55, // A bit rougher to make it less shiny
                                        metalness: 0, // No metallic properties
                                        clearcoat: 0.34, // Lower clearcoat for less gloss
                                        clearcoatRoughness: 0.3, // Subtle gloss without sharp reflections
                                        subsurface: 1, // Subsurface scattering to mimic soft tissue
                                        transmission: 0.3, // Slight translucency to maintain tissue-like softness
                                        thickness: 0.25, // Adjust thickness for tissue depth
                                        ior: 1.35, // Organic tissue-like refraction
                                        reflectivity: 0.25, // Reduced reflectivity for a softer look
                                    });
                                } else {
                                    material = new MeshPhysicalMaterial({
                                        color: 0xFFFDF0, // Slightly off-white, keeping it natural
                                        side: DoubleSide,
                                        roughness: 0.45, // Reduced roughness for more reflection
                                        metalness: 0, // No metallic properties
                                        reflectivity: 0.15, // Increased reflectivity for shinier enamel
                                        clearcoat: 0.4, // Moderate gloss for a more natural enamel look
                                        clearcoatRoughness: 0.3, // Balance clearcoat roughness for soft reflection
                                        transmission: 0.2, // Slight translucency for enamel
                                        ior: 1.4, // Refractive index for tooth enamel
                                    });
                                }
                            }
                
                            // material.reflectivity = 0.7; // Example value for reflectivity
    
                            // Adding specular highlights
                            // material.shininess = 10; // value for shininess
                            material.flatShading = false;
                            material.needsUpdate = true;
    
                            const mesh = new Mesh(geometry, material);
                            geometry.computeBoundingBox();
                            const bbox = geometry.boundingBox;
                            // const teCenter = bbox.getCenter(new Vector3());
                            // mesh.position.sub(teCenter);
                            mesh.userData = {filename: filename};

                            if(!slicedname.includes('erTissue')) {
                                mesh.applyMatrix4(transMatrix4);
                            }
                
                            mesh.castShadow = true;
                
                            tempModels.push(mesh);
                            // tempGroup.add(mesh);
                            

                            scene.add(mesh);
                            
                            if((slicedname.replace(/\D/g, "") != 0) && slicedname.includes('Tissue')) {
                                mesh.visible = false;
                            } 
                            loadedMeshes[url][filename] = mesh;
                            
                            
                            if (index === entries.length - 1 || (index === entries.length - 2 && flag == 0)) {
                                //Load Complete Action
                                document.querySelector('div[data-url="'+ url +'"] .animationController').style.display = "block";
                                document.querySelector('div[data-url="'+ url +'"] .loadingScreen').style.display = "none";
                            } 
                        } catch (error) {
                            console.error("Error parsing geometry for file:", filename, "Error:", error);
                            return;
                        }
                }
            }
            for(const [idx, [filename, buffer]] of entries.entries()) {
                if(filename.includes("attachment"))  {
                    let vattach = teethInfo[url];
                    for(let vatt = 0; vatt < vattach.length; vatt++) {
                        if(vattach[vatt].att1 == filename) {
                            let parentMesh = loadedMeshes[url][vattach[vatt].toothName];
                            let childMesh = loadedMeshes[url][filename]
                            parentMesh.attach(childMesh);
                        }
                    }
                }
            }
            const box = new Box3();
            const tempBox = new Box3();

            tempModels.forEach(model => {
                tempBox.setFromObject(model);
                box.union(tempBox);
            });

            console.log("first")

            // let tempBBox = new Box3().setFromObject(tempGroup);
            // let tempCenter = tempBBox.getCenter(new Vector3());
            // tempGroup.position.sub(tempCenter);

            let tempCenter = box.getCenter(new Vector3());
            camera.lookAt(tempCenter);
            camera.position.set(tempCenter.x, tempCenter.y - 70, tempCenter.z + 30)
            controls.target.copy(tempCenter);
            controls.update();

            centerPoint[url] = [tempCenter.x, tempCenter.y, tempCenter.z]

            document.querySelector('div[data-url="'+ url +'"] .animationController .animateSlider').max = maxStep[url] - 1;
            document.querySelector('div[data-url="'+ url +'"] .animationController .animateSlider').value = 0;
            document.querySelector('div[data-url="'+ url +'"] .animationController .maxStep').innerHTML = maxStep[url];
            document.querySelector('div[data-url="'+ url +'"] .animationController .currentStep').innerHTML = 1;

		})
        .catch (error => {

            return;
        })
    } else {
        // controls = new OrbitControls(camera, renderer.domElement)
        // controls.enableDamping = true;
        Gloader.load(url, function (geometry) {
            geometry.computeVertexNormals();
            let material
            if(extension == "stl") {
                material = new MeshPhongMaterial({ color: 0x2E75B6, side: DoubleSide});
                material.specular = new Color(0x2E75B6);
            }else if (geometry.attributes.color) {
                material = new MeshPhongMaterial({ vertexColors: true, side: DoubleSide });
            } else {
                material = new MeshPhongMaterial({ color: 0x2E75B6, side: DoubleSide });
            }

            // Adjusting environment light
            if(extension == "stl"){
                material.specular = new Color(0x3382C9);
                material.shininess = 5;
            }
			material.reflectivity = 0.1;
			material.metalness = 0;
			material.roughness = 0;
            // material.IOR = 1.2;
            material.flatShading = false;
            // material.needsUpdate = true;
    
            const mesh = new Mesh(geometry, material);
            geometry.computeBoundingBox();
            const bbox = geometry.boundingBox;
            const center = bbox.getCenter(new Vector3());
            mesh.position.sub(center);
            if( extension == 'ply') {
                const box = new Box3().setFromObject(mesh);
                mesh.rotation.z += Math.PI;
                const center = box.getCenter(new Vector3());
                mesh.position.sub(center);
            }
			mesh.castShadow = true;
            console.log("mesh: ", mesh)
            scene.add(mesh);
            controls.update();
        });
    }

    let initialDistance = null;
    let initialZoom = camera.zoom;

    // transformControl.addEventListener('dragging-changed', function (event) {
    //     controls.enabled = !event.value;
    // });

    window.addEventListener('touchmove', function(event) {

        if (event.touches.length === 2) {
            const dx = event.touches[0].pageX - event.touches[1].pageX;
            const dy = event.touches[0].pageY - event.touches[1].pageY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (initialDistance) {
                const zoomFactor = distance / initialDistance;
                camera.zoom = Math.min(Math.max(initialZoom * zoomFactor, controls.minZoom), controls.maxZoom);
                camera.updateProjectionMatrix();
            } else {
                initialDistance = distance;
                initialZoom = camera.zoom;
            }
        }
    }, false);
    
    window.addEventListener('touchend', function(event) {
        if (event.touches.length < 2) {
            initialDistance = null;
            initialZoom = camera.zoom;
        }
    }, false);


    cameras[url] = camera


    window.addEventListener('resize', onWindowResize);

    function onWindowResize() {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(container.clientWidth, container.clientHeight);
    }

    function getFilenameWithoutExtension(filePath) {
        // Get the last part of the path
        const fileName = filePath.split('\\').pop().split('/').pop();
        
        // Remove the extension
        const nameWithoutExtension = fileName.split('.').slice(0, -1).join('.');
        
        return nameWithoutExtension;
    }

    function animate() {
        const timer = Date.now() * 0.0003;
        controls.update();
        renderer.render(scene, camera);
    }

    function init_slider() {
    const moveXSlider = document.querySelector("#View3DModal .slider_window #move_x_slider");
    const moveYSlider = document.querySelector("#View3DModal .slider_window #move_y_slider");
    const moveZSlider = document.querySelector("#View3DModal .slider_window #move_z_slider");
    const rotateXSlider = document.querySelector("#View3DModal .slider_window #rotate_x_slider");
    const rotateYSlider = document.querySelector("#View3DModal .slider_window #rotate_y_slider");
    const rotateZSlider = document.querySelector("#View3DModal .slider_window #rotate_z_slider");

    if (moveXSlider && moveYSlider && moveZSlider && rotateXSlider && rotateYSlider && rotateZSlider) {
        moveXSlider.value = 0;
        moveYSlider.value = 0;
        moveZSlider.value = 0;
        document.querySelector("#View3DModal .slider_window #move_x_slider_value").innerHTML = "0";
        document.querySelector("#View3DModal .slider_window #move_y_slider_value").innerHTML = "0";
        document.querySelector("#View3DModal .slider_window #move_z_slider_value").innerHTML = "0";
        rotateXSlider.value = 0;
        rotateYSlider.value = 0;
        rotateZSlider.value = 0;
        document.querySelector("#View3DModal .slider_window #rotate_x_slider_value").innerHTML = "0";
        document.querySelector("#View3DModal .slider_window #rotate_y_slider_value").innerHTML = "0";
        document.querySelector("#View3DModal .slider_window #rotate_z_slider_value").innerHTML = "0";
    } else {
        console.error("One or more sliders are missing from the DOM.");
    }
}


function extractToothNumber(filename) {
    // First, check for the "tooth" pattern (17-30)
    let match = filename.match(/tooth(\d+)-/);
    
    if (match) {
        return parseInt(match[1], 10);
    }
    
    // Check for the number pattern (2-15), ensuring the number appears after the backslash
    let res = filename.split('/')
    res = res.slice(-1);
    return parseInt(res[0], 10);
}

    function extractAttachNumber(filename) {
        const match = filename.match(/attachment1_(\d+)-/);
        if (match) {
            return parseInt(match[1], 10);
        } else {
            return null; // Return null if no number is found
        }
    }
    function getMatrix() {
        // Check if the selected object is a tooth (doesn't have 'attachment' in its name)
        const isTooth = !selectedObjectMesh.userData.filename.includes('attachment');
        if (isTooth) {
            // Save tooth model's world matrix
            if (!tooth_Matrices) {
                tooth_Matrices = [];
            }
            let toothNumber = extractToothNumber(selectedObjectMesh.userData.filename);
            if(!toothNumber) {
                toothNumber = extractToothNumber1(selectedObjectMesh.userData.filename);
            }
            if(!toothNumber) return 
            selectedObjectMesh.updateMatrixWorld();
            tooth_Matrices[toothNumber - 2] = selectedObjectMesh.matrixWorld.clone();
            // Handle the attachment if it exists
            if (selectedObjectMesh.children[0] && !attach_Matrices[toothNumber - 2]) {
                // Save the **local** matrix of the child relative to the parent (tooth)
                attach_Matrices[toothNumber - 2] = undefined; // Local matrix
            }
        } else {
            selectedObjectMesh.updateMatrixWorld(true);
            let attachmentNumber = extractAttachNumber(selectedObjectMesh.userData.filename);
            if(attachmentNumber == 0) return
            // It's an attachment model, save its local matrix
            attach_Matrices[attachmentNumber - 2] = selectedObjectMesh.matrixWorld.clone();
        }
    
        // Update the world matrix of the selected object
        
    }
      function onMouseClick(event) {
        document.addEventListener('touchstart', function(event) {
            event.preventDefault();
          }, false);
        init_slider();
        document.addEventListener('DOMContentLoaded', function() {
            // Select all input fields, textareas, and contenteditable elements
            var elements = document.querySelectorAll('input, textarea, [contenteditable]');
            
            elements.forEach(function(el) {
                el.addEventListener('focus', function(e) {
                    // Prevent the default focus behavior
                    e.preventDefault();
                    // Immediately blur the element to prevent keyboard from showing
                    el.blur();
                });
                
                // For iOS devices, we need an additional step
                el.addEventListener('touchstart', function(e) {
                    e.preventDefault();
                });
            });
        });
        
        var tagetUrl = event.target.parentElement.parentElement.getAttribute('data-url');
        let transChangerObj = event.target.parentElement.parentElement;
        let rangeslider = transChangerObj.querySelector(".animateSlider");
        if(rangeslider.value == rangeslider.max) {
            document.querySelector("#View3DModal .camera_controller").style.top = "34%";
            document.getElementById('modelContainer').focus();
            let isRotate = transChangerObj.querySelector('.transform_changer').classList.contains('active');
            //             
            var cameraController = cameras[tagetUrl];
            // 
            const mouse = new Vector2();
            mouse.x = (event.offsetX / container.clientWidth) * 2 - 1;
            mouse.y = -(event.offsetY / container.clientHeight) * 2 + 1;

            const raycaster = new Raycaster();
            raycaster.setFromCamera(mouse, cameraController);
            raycaster.params.Points.threshold = 0.1;

            let intersects = raycaster.intersectObjects(tempModels, true);
            intersects = intersects.filter(intersect => intersect.object.visible);
            intersects.sort((a, b) => a.distance - b.distance);
            let temp_objectName = "";
            if (transformControl.dragging) {
                return;
            }
            document.addEventListener('mouseup', (event) => {
                getMatrix();
            });
            
            let originalRotationQuaternion = new Quaternion(); // Store initial rotation as quaternion

            if (intersects.length > 0) {                
                if(intersects[0].object.userData.filename.includes("erTissue")){
                    return;
                }
                selectedObjectMesh = intersects[0].object;
                console.log("world: ", selectedObjectMesh.matrixWorld)
                console.log("local: ", selectedObjectMesh.matrix)
                originalPosition = selectedObjectMesh.position.clone();
                originalRotation = selectedObjectMesh.rotation.clone();
                originalRotationQuaternion.copy(selectedObjectMesh.quaternion);
                if(!selectedObjectMesh.userData.filename.includes("erTissue")) {
                    document.querySelector("#View3DModal .slider_window").style.display = "block";
                    // Store the children
                    console.log(selectedObjectMesh)
                    let flag = 0;
                    document.querySelector("#View3DModal .slider_window #rotate_x_slider").disabled = false;
                    document.querySelector("#View3DModal .slider_window #rotate_y_slider").disabled = false;
                    document.querySelector("#View3DModal .slider_window #rotate_z_slider").disabled = false;
                    if(selectedObjectMesh.userData.filename.includes("attachment")){
                        flag = 1;
                        document.querySelector("#View3DModal .slider_window #rotate_x_slider").disabled = true;
                        document.querySelector("#View3DModal .slider_window #rotate_y_slider").disabled = true;
                        document.querySelector("#View3DModal .slider_window #rotate_z_slider").disabled = true;
                    }
                    init_slider();
                    temp_objectName = selectedObjectMesh.userData.filename;
                    let toothNumber = extractToothNumber(temp_objectName);
                    let attachmentNumber = extractAttachNumber(temp_objectName);
                    // 
                    // 
                    document.querySelector("#View3DModal .slider_window").classList.remove("hide");
                    document.querySelector("#View3DModal .camera_controller").style.top = "34%";
                    document.querySelector("#View3DModal .slider_window #toothNumber").innerHTML = toothNumber;
                    if(!toothNumber) document.querySelector("#View3DModal .slider_window #toothNumber").innerHTML = attachmentNumber;
                    let slider_movement = {
                        x: 0,
                        y: 0,
                        z: 0,
                    }
                    let slider_rotate = {
                        x: 0,
                        y: 0,
                        z: 0,
                    }
                    // Declare temporary variables to hold the slider value and slider_movement.x
                    let accumulatedMovement = { x: 0, y: 0, z: 0 }; // Accumulated movement
                    let accumulateRotate = { x: 0, y: 0, z: 0 }; // Accumulated movement

                    // Event listener for slider movement
                    document.querySelector("#View3DModal .slider_window #move_x_slider").addEventListener('input', (event) => {
                        const value = event.target.value / 1.4; // Get the slider value
                        let clampedValue = value;

                        // Clamp the slider value between -0.5 and 0.5
                        if (value > 0.5) {
                            clampedValue = 0.5;  // Max value
                        } else if (value < -0.5) {
                            clampedValue = -0.5; // Min value
                        }

                        // Apply the relative movement, not absolute
                        if(!selectedObjectMesh.userData.filename.includes("erTissue")) {
                            selectedObjectMesh.translateX(clampedValue - slider_movement.x); // Only move by the delta (difference)
                            // Assuming you have a js object like 'mesh'
                        }
                        slider_movement.x = clampedValue; // Update slider movement value for next frame
                    });

                    // Event listener for when dragging stops (mouseup)
                    document.querySelector("#View3DModal .slider_window #move_x_slider").addEventListener('mouseup', () => {
                        if(!selectedObjectMesh.userData.filename.includes("erTissue")) {
                            accumulatedMovement.x += slider_movement.x;
                        }
                        // Accumulate the movement

                        // Reset slider movement and UI
                        slider_movement.x = 0; 
                        document.querySelector("#View3DModal .slider_window #move_x_slider").value = 0; // Reset the slider UI value to 0

                        // Save the object's position for future movement
                        originalPosition = selectedObjectMesh.position.clone();
                        getMatrix();

                        // Reinitialize slider if needed
                        init_slider(); // Any reinitialization you have
                    });
                    document.querySelector("#View3DModal .slider_window #move_x_slider").addEventListener('touchend', () => {
                        if(!selectedObjectMesh.userData.filename.includes("erTissue")) {
                            accumulatedMovement.x += slider_movement.x;
                        }
                        // Accumulate the movement

                        // Reset slider movement and UI
                        slider_movement.x = 0; 
                        document.querySelector("#View3DModal .slider_window #move_x_slider").value = 0; // Reset the slider UI value to 0
                        getMatrix();
                        // Save the object's position for future movement
                        originalPosition = selectedObjectMesh.position.clone();

                        // Reinitialize slider if needed
                        init_slider(); // Any reinitialization you have
                    });

                    


                    // Event listener for slider movement
                    document.querySelector("#View3DModal .slider_window #move_y_slider").addEventListener('input', (event) => {
                        const value = event.target.value / 1.4; // Get the slider value
                        let clampedValue = value;

                        // Clamp the slider value between -0.5 and 0.5
                        if (value > 0.5) {
                            clampedValue = 0.5;  // Max value
                        } else if (value < -0.5) {
                            clampedValue = -0.5; // Min value
                        }
                        
                        // Apply the relative movement, not absolute
                        if(!selectedObjectMesh.userData.filename.includes("erTissue")) {
                            selectedObjectMesh.translateY(clampedValue - slider_movement.y); // Only move by the delta (difference)
                        }
                        slider_movement.y = clampedValue; // Update slider movement value for next frame
                    });

                    // Event listener for when dragging stops (mouseup)
                    document.querySelector("#View3DModal .slider_window #move_y_slider").addEventListener('mouseup', () => {
                        if(!selectedObjectMesh.userData.filename.includes("erTissue")) 
                            accumulatedMovement.y += slider_movement.y;

                        // Reset slider movement and UI
                        slider_movement.y = 0; 
                        document.querySelector("#View3DModal .slider_window #move_y_slider").value = 0; // Reset the slider UI value to 0
                        getMatrix();
                        // Save the object's position for future movement
                        originalPosition = selectedObjectMesh.position.clone();

                        // Reinitialize slider if needed
                        init_slider(); // Any reinitialization you have
                    });
                    document.querySelector("#View3DModal .slider_window #move_y_slider").addEventListener('touchend', () => {
                        if(!selectedObjectMesh.userData.filename.includes("erTissue")) 
                            accumulatedMovement.y += slider_movement.y;

                        // Reset slider movement and UI
                        slider_movement.y = 0; 
                        document.querySelector("#View3DModal .slider_window #move_y_slider").value = 0; // Reset the slider UI value to 0
                        getMatrix();
                        // Save the object's position for future movement
                        originalPosition = selectedObjectMesh.position.clone();

                        // Reinitialize slider if needed
                        init_slider(); // Any reinitialization you have
                    });


                    
                    // Event listener for slider movement
                    document.querySelector("#View3DModal .slider_window #move_z_slider").addEventListener('input', (event) => {
                        const value = (-1) * event.target.value / 1.4; // Get the slider value
                        let clampedValue = value;

                        // Clamp the slider value between -0.5 and 0.5
                        if (value > 0.5) {
                            clampedValue = 0.5;  // Max value
                        } else if (value < -0.5) {
                            clampedValue = -0.5; // Min value
                        }

                        // Apply the relative movement, not absolute
                        if(!selectedObjectMesh.userData.filename.includes("erTissue")) {
                            selectedObjectMesh.translateZ(clampedValue - slider_movement.z); // Only move by the delta (difference)
                        }
                        
                        slider_movement.z = clampedValue; // Update slider movement value for next frame
                    });

                    // Event listener for when dragging stops (mouseup)
                    document.querySelector("#View3DModal .slider_window #move_z_slider").addEventListener('mouseup', () => {
                        if(selectedObjectMesh.userData.filename.includes("erTissue")) 
                            accumulatedMovement.z += slider_movement.z;

                        // Reset slider movement and UI
                        slider_movement.z = 0; 
                        document.querySelector("#View3DModal .slider_window #move_z_slider").value = 0; // Reset the slider UI value to 0
                        getMatrix();
                        // Save the object's position for future movement
                        originalPosition = selectedObjectMesh.position.clone();

                        // Reinitialize slider if needed
                        init_slider(); // Any reinitialization you have
                    });
                    document.querySelector("#View3DModal .slider_window #move_z_slider").addEventListener('touchend', () => {
                        if(selectedObjectMesh.userData.filename.includes("erTissue")) 
                            accumulatedMovement.z += slider_movement.z;

                        // Reset slider movement and UI
                        slider_movement.z = 0; 
                        document.querySelector("#View3DModal .slider_window #move_z_slider").value = 0; // Reset the slider UI value to 0
                        getMatrix();
                        // Save the object's position for future movement
                        originalPosition = selectedObjectMesh.position.clone();

                        // Reinitialize slider if needed
                        init_slider(); // Any reinitialization you have
                    });

                    let parentModel = selectedObjectMesh.parent;
                    
                    selectedObjectMesh.geometry.computeBoundingBox();
                    let tempbBounding = selectedObjectMesh.geometry.boundingBox;

                    let boxhelper = new Box3Helper(tempbBounding, 0xff0000);
                    // scene.add(boxhelper);
                    let tempBounding = new Box3().setFromObject(selectedObjectMesh);
                    let tempCenterB = tempBounding.getCenter(new Vector3());      



                    // Update the initial quaternion when the object is selected or manipulated

                    // Update the initial quaternion when the object is selected or manipulated
                    transformControl.addEventListener('objectChange', () => {
                        if(selectedObjectMesh.userData.filename.includes("attachment")) return
                        originalRotationQuaternion.copy(selectedObjectMesh.quaternion);
                        init_slider(); // Reset or initialize the slider if needed
                    });

                    document.querySelector("#View3DModal .slider_window #rotate_y_slider").addEventListener('input', (event) => {
                        const value = event.target.value / 1; // Convert to number
                        const angle = value * Math.PI / 180; // Convert degrees to radians

                        // Detach the control to avoid interference during rotation
                        transformControl.detach(selectedObjectMesh);

                        // Create a quaternion for the rotation around the X-axis
                        const rotationX = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), angle);

                        // Apply the rotation relative to the initial quaternion
                        if(!selectedObjectMesh.userData.filename.includes("erTissue")) {
                            selectedObjectMesh.quaternion.copy(originalRotationQuaternion).multiply(rotationX);
                        }
                            

                        // Re-attach the control after rotation
                        transformControl.attach(selectedObjectMesh);
                    });

                    document.querySelector("#View3DModal .slider_window #rotate_y_slider").addEventListener('mouseup', () => {
                        getMatrix();
                        originalRotationQuaternion.copy(selectedObjectMesh.quaternion); // Update the original rotation
                        init_slider(); // Reset or initialize the slider if needed
                    });
                    document.querySelector("#View3DModal .slider_window #rotate_y_slider").addEventListener('touchend', () => {
                        getMatrix();
                        originalRotationQuaternion.copy(selectedObjectMesh.quaternion); // Update the original rotation
                        init_slider(); // Reset or initialize the slider if needed
                    });


                    document.querySelector("#View3DModal .slider_window #rotate_z_slider").addEventListener('input', (event) => {
                        if(selectedObjectMesh.userData.filename.includes("erTissue")) return
                        const value = event.target.value / 1; // Convert to number
                        const angle = value * Math.PI / 180; // Convert degrees to radians

                        // Detach the control to avoid interference during rotation
                        transformControl.detach(selectedObjectMesh);

                        // Create a quaternion for the rotation around the Y-axis
                        const rotationY = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), angle);

                        // Apply the rotation relative to the initial quaternion
                        if(!selectedObjectMesh.userData.filename.includes("erTissue")) {
                            selectedObjectMesh.quaternion.copy(originalRotationQuaternion).multiply(rotationY);
                        }
                        // Re-attach the control after rotation
                        transformControl.attach(selectedObjectMesh);
                    });

                    document.querySelector("#View3DModal .slider_window #rotate_z_slider").addEventListener('mouseup', () => {
                        getMatrix();
                        originalRotationQuaternion.copy(selectedObjectMesh.quaternion); // Update the original rotation
                        init_slider(); // Reset or initialize the slider if needed
                    });
                    document.querySelector("#View3DModal .slider_window #rotate_z_slider").addEventListener('touchend', () => {
                        getMatrix();
                        originalRotationQuaternion.copy(selectedObjectMesh.quaternion); // Update the original rotation
                        init_slider(); // Reset or initialize the slider if needed
                    });

                    document.querySelector("#View3DModal .slider_window #rotate_x_slider").addEventListener('input', (event) => {
                        if(selectedObjectMesh.userData.filename.includes("erTissue")) return
                        const value = event.target.value / 1; // Convert to number
                        const angle = value * Math.PI / 180; // Convert degrees to radians

                        // Detach the control to avoid interference during rotation
                        transformControl.detach(selectedObjectMesh);

                        // Create a quaternion for the rotation around the Z-axis
                        const rotationZ = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), angle);

                        // Apply the rotation relative to the initial quaternion
                        if(!selectedObjectMesh.userData.filename.includes("erTissue")) {
                            selectedObjectMesh.quaternion.copy(originalRotationQuaternion).multiply(rotationZ);
                        }
                        // Re-attach the control after rotation
                        transformControl.attach(selectedObjectMesh);
                    });

                    document.querySelector("#View3DModal .slider_window #rotate_x_slider").addEventListener('mouseup', () => {
                        getMatrix();
                        originalRotationQuaternion.copy(selectedObjectMesh.quaternion); // Update the original rotation
                        init_slider(); // Reset or initialize the slider if needed
                    });
                    document.querySelector("#View3DModal .slider_window #rotate_x_slider").addEventListener('touchend', () => {
                        getMatrix();
                        originalRotationQuaternion.copy(selectedObjectMesh.quaternion); // Update the original rotation
                        init_slider(); // Reset or initialize the slider if needed
                    });
                    
                    transformControl.setSpace('local');
                    transformControl.attach(selectedObjectMesh);
                    transformControl.addEventListener('objectChange', () => {
                        originalPosition = selectedObjectMesh.position.clone();
                        originalRotation = selectedObjectMesh.rotation.clone();
                        init_slider();
                      });
                    let worldPosition = new Vector3();
                    selectedObjectMesh.getWorldPosition(worldPosition);
                    transformControl.position.copy({
                        x: tempCenterB.x - worldPosition.x,
                        y: tempCenterB.y - worldPosition.y,
                        z: tempCenterB.z - worldPosition.z,
                    });
                    
                    transformControl.enabled = true;
                    transformControl.addEventListener('dragging-changed', (event) => {
                        controls.enabled = !event.value;  // Disable controls while dragging, enable after dragging
                    });

                    getMatrix();
                } else {
                    transformControl.addEventListener('dragging-changed', (event) => {
                        controls.enabled = !event.value;  // Disable controls while dragging, enable after dragging
                        // Assuming you have a js object like 'mesh'
                        // 1. Create rotation matrices based on local coordinate angles

                    });
                    
                    transformControl.enabled = true;
                }
            } else {
                // document.querySelector("#View3DModal .slider_window").classList.add("hide");
                transformControl.enabled = true;
                transformControl.addEventListener('dragging-changed', (event) => {
                    controls.enabled = !event.value;  // Disable controls while dragging, enable after dragging
                });

            }
        }
        document.addEventListener('touchstart', function(event) {
            event.preventDefault();
          }, false);
    }
}

// Add event listener for the 'dragging-changed' event


function resetOtherSliders(currentSlider) {
    const classNames = [""];
    const sliders = document.querySelectorAll('.custom_slider');  // Select all sliders

    sliders.forEach(slider => {
        if (slider !== currentSlider) {
            slider.value = 0;  // Reset other sliders to 0
            const sliderValueId = slider.id.replace('slider', 'slider_value');
            document.getElementById(sliderValueId).textContent = '0';  // Update the slider value display
        }
    });
}

function setCameraPosition(event) {
    var target = event.target;
    var tagetUrl = target.parentElement.parentElement.getAttribute('data-url');
    var cameraController = cameras[tagetUrl];
    var cameralookAt = [0, 0, 0];
    if(tagetUrl.slice(-3) == "gvw" || tagetUrl.slice(-3) == "zip") {
        cameralookAt = centerPoint[tagetUrl];
    }
    switch (target.classList[0]) {
        case 'rightbtn':
            cameraController.position.set(cameralookAt[0] - 70, cameralookAt[1], cameralookAt[2]);
            cameraController.up.set(0, 0, 1);
            break;
        case 'leftbtn':
            cameraController.position.set(cameralookAt[0] + 70, cameralookAt[1], cameralookAt[2]);
            cameraController.up.set(0, 0, 1);
            break;
        case 'frbtn':
            cameraController.position.set(cameralookAt[0], cameralookAt[1] - 70, cameralookAt[2]);
            cameraController.up.set(0, 0, 1);
            break;
        case 'upbtn':
            cameraController.position.set(cameralookAt[0], cameralookAt[1], cameralookAt[2] - 70);
            cameraController.up.set(0, -1, 0);
            break;
        case 'downbtn':
            cameraController.position.set(cameralookAt[0], cameralookAt[1], cameralookAt[2] + 70);
            cameraController.up.set(0, 1, 0);
            break;
        default:
            break;
    }
    cameraController.lookAt(cameralookAt[0], cameralookAt[1], cameralookAt[2]);


}

function saveNewInfo(event){
    let targetUrl = event.target.parentElement.dataset.url;
    // Access the world transformation matrix

    // Load mainfest XML file
    // 
    // maxStep[targetUrl] = upperSteps.length > lowerSteps.length ? upperSteps.length : lowerSteps.length;
    // minStep[targetUrl] = upperSteps.length < lowerSteps.length ? upperSteps.length : lowerSteps.length;

    // teethInfo[targetUrl] = [];
    // transInfo[targetUrl] = {};

    // let upperinit = upperSteps[0].children;
    // for(i = 0; i < upperinit.length; i++) {
    //     let tooth_stlfilename = upperinit[i].getAttribute('Tooth_STLFile');
    //     let attr1_stlfilename = upperinit[i].getAttribute('Attachment_STLFile1');
    //     let attr2_stlfilename = upperinit[i].getAttribute('Attachment_STLFile2');
    //     let temp = {
    //         number : upperinit[i].getAttribute('ToothNumber'),
    //         toothName : tooth_stlfilename.replace(/\\/g, "/"),
    //         att1 : attr1_stlfilename == null ? null : attr1_stlfilename.replace(/\\/g, "/"),
    //         att2 : attr2_stlfilename == null ? null : attr2_stlfilename.replace(/\\/g, "/")
    //     }
    //     teethInfo[targetUrl].push(temp);
    // }
    // let lowerinit = lowerSteps[0].children;
    // for(i = 0; i < lowerinit.length; i++) {
    //     let tooth_stlfilename = lowerinit[i].getAttribute('Tooth_STLFile');
    //     let attr1_stlfilename = lowerinit[i].getAttribute('Attachment_STLFile1');
    //     let attr2_stlfilename = lowerinit[i].getAttribute('Attachment_STLFile2');
    //     let temp = {
    //         number : lowerinit[i].getAttribute('ToothNumber'),
    //         toothName : tooth_stlfilename.replace(/\\/g, "/"),
    //         att1 : attr1_stlfilename == null ? null : attr1_stlfilename.replace(/\\/g, "/"),
    //         att2 : attr2_stlfilename == null ? null : attr2_stlfilename.replace(/\\/g, "/")
    //     }
    //     teethInfo[targetUrl].push(temp);
    // }

    // for(i = 0; i < maxStep[targetUrl]; i++) {
    //     transInfo[targetUrl][`step${i}`] = [];
    // }
    // for(i = 0; i < collectionArray.length; i++) {
    //     let istep = collectionArray[i].children;
    //     for(j = 0; j < istep.length; j++) {
    //         if(istep[j].children.length > 0) {
    //             let temp = {};
    //             temp.toothNumber = istep[j].getAttribute('ToothNumber');
    //             let transfromChildren = istep[j].children;
    //             for( k = 0; k < transfromChildren.length; k++) {
    //                 temp[transfromChildren[k].nodeName] = [];
    //                 for(matrixcounter = 0; matrixcounter < 16; matrixcounter++) {
    //                     temp[transfromChildren[k].nodeName].push(parseFloat(transfromChildren[k].getAttribute(`m${matrixcounter}`)))
    //                 }
    //             }
    //             transInfo[targetUrl][`step${istep[j].getAttribute('StepNumber')}`].push(temp);
    //         }
    //     }
    // }
    // 

    // // Model URLs (example)
    // let modelUrls = ["model1.stl", "model2.stl"];

    // Accumulating matrices across all steps
    // 
    // for (let toothNumber = 0; toothNumber < 28; toothNumber++){
    //     tooth_accumulatedTransforms[toothNumber] = [];
    //     attach_accumulatedTransforms[toothNumber] = [];
    //     
    //     let tooth_accumulatedMatrix = transInfo[targetUrl]["step0"][toothNumber]["ToothTransform"];  // Start with the first step's matrix
    //     let attach_accumulatedMatrix = transInfo[targetUrl]["step0"][toothNumber]["AttachmentTransform1"];
    //     for ( let [step, value] of Object.entries(transInfo[targetUrl])) {
            
    //         if(!tooth_accumulatedMatrix) continue
    //         if(!transInfo[targetUrl][step][toothNumber]) continue
    //         if(!transInfo[targetUrl][step][toothNumber]["ToothTransform"]) transInfo[targetUrl][step][toothNumber]["ToothTransform"] = unit_matrix; 
    //         tooth_accumulatedMatrix = multiplyMatrices(tooth_accumulatedMatrix, transInfo[targetUrl][step][toothNumber]["ToothTransform"]);
    //         if(!attach_accumulatedMatrix ) continue
    //         if(!transInfo[targetUrl][step][toothNumber]) continue
    //         if(!transInfo[targetUrl][step][toothNumber]["AttachmentTransform1"]) transInfo[targetUrl][step][toothNumber]["AttachmentTransform1"] = unit_matrix;
    //         attach_accumulatedMatrix = multiplyMatrices(attach_accumulatedMatrix, transInfo[targetUrl][step][toothNumber]["AttachmentTransform1"]);
    //         
    //         
    //     }
    //     if (!tooth_accumulatedMatrix) tooth_accumulatedMatrix = unit_matrix;
    //     if (!attach_accumulatedMatrix) attach_accumulatedMatrix = unit_matrix;
    //     tooth_accumulatedTransforms[toothNumber].push(tooth_accumulatedMatrix);
    //     attach_accumulatedTransforms[toothNumber].push(attach_accumulatedMatrix);
    // }
   
    // Create and download the XML file
    let xmlContent = generateXML(tooth_Matrices, attach_Matrices, textContent);
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    console.log("name", new_filename)
    new_filename = new_filename.split('.')[0];
    link.download = `${new_filename}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    function transposeMatrix4x4(matrix) {
        // Ensure matrix is a 1D array with 16 elements
        if (matrix.length !== 16) {
            throw new Error("Matrix must have exactly 16 elements.");
        }
    
        const transposed = [];
    
        // Perform the transpose operation
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                transposed[col * 4 + row] = matrix[row * 4 + col];
            }
        }
    
        return transposed;
    }
    function inverseMatrix4x4(m) {
        const inv = [];
        const det = 
              m[0] * (m[5] * (m[10] * m[15] - m[11] * m[14]) - 
                      m[6] * (m[9] * m[15] - m[11] * m[13]) + 
                      m[7] * (m[9] * m[14] - m[10] * m[13])) -
            m[1] * (m[4] * (m[10] * m[15] - m[11] * m[14]) - 
                     m[6] * (m[8] * m[15] - m[11] * m[12]) + 
                     m[7] * (m[8] * m[14] - m[10] * m[12])) +
            m[2] * (m[4] * (m[9] * m[15] - m[11] * m[13]) - 
                     m[5] * (m[8] * m[15] - m[11] * m[12]) + 
                     m[7] * (m[8] * m[13] - m[9] * m[12])) -
            m[3] * (m[4] * (m[9] * m[14] - m[10] * m[13]) - 
                     m[5] * (m[8] * m[14] - m[10] * m[12]) + 
                     m[6] * (m[8] * m[13] - m[9] * m[12]));
    
        if (det === 0) {
            throw new Error("Matrix is not invertible.");
        }
    
        const invDet = 1.0 / det;
    
        inv[0] = invDet * (m[5] * (m[10] * m[15] - m[11] * m[14]) - m[6] * (m[9] * m[15] - m[11] * m[13]) + m[7] * (m[9] * m[14] - m[10] * m[13]));
        inv[1] = invDet * -(m[1] * (m[10] * m[15] - m[11] * m[14]) - m[2] * (m[9] * m[15] - m[11] * m[13]) + m[3] * (m[9] * m[14] - m[10] * m[13]));
        inv[2] = invDet * (m[1] * (m[6] * m[15] - m[7] * m[14]) - m[2] * (m[5] * m[15] - m[7] * m[13]) + m[3] * (m[5] * m[14] - m[6] * m[13]));
        inv[3] = invDet * -(m[1] * (m[6] * m[11] - m[7] * m[10]) - m[2] * (m[5] * m[11] - m[7] * m[9]) + m[3] * (m[5] * m[10] - m[6] * m[9]));
    
        inv[4] = invDet * -(m[4] * (m[10] * m[15] - m[11] * m[14]) - m[6] * (m[8] * m[15] - m[11] * m[12]) + m[7] * (m[8] * m[14] - m[10] * m[12]));
        inv[5] = invDet * (m[0] * (m[10] * m[15] - m[11] * m[14]) - m[2] * (m[8] * m[15] - m[11] * m[12]) + m[3] * (m[8] * m[14] - m[10] * m[12]));
        inv[6] = invDet * -(m[0] * (m[6] * m[15] - m[7] * m[14]) - m[2] * (m[4] * m[15] - m[7] * m[12]) + m[3] * (m[4] * m[14] - m[6] * m[12]));
        inv[7] = invDet * (m[0] * (m[6] * m[11] - m[7] * m[10]) - m[2] * (m[4] * m[11] - m[7] * m[8]) + m[3] * (m[4] * m[10] - m[6] * m[8]));
    
        inv[8] = invDet * (m[4] * (m[9] * m[15] - m[11] * m[13]) - m[5] * (m[8] * m[15] - m[11] * m[12]) + m[7] * (m[8] * m[13] - m[9] * m[12]));
        inv[9] = invDet * -(m[0] * (m[9] * m[15] - m[11] * m[13]) - m[1] * (m[8] * m[15] - m[11] * m[12]) + m[3] * (m[8] * m[13] - m[9] * m[12]));
        inv[10] = invDet * (m[0] * (m[5] * m[15] - m[7] * m[13]) - m[1] * (m[4] * m[15] - m[7] * m[12]) + m[3] * (m[4] * m[13] - m[5] * m[12]));
        inv[11] = invDet * -(m[0] * (m[5] * m[11] - m[7] * m[9]) - m[1] * (m[4] * m[11] - m[7] * m[8]) + m[3] * (m[4] * m[9] - m[5] * m[8]));
    
        inv[12] = invDet * -(m[4] * (m[9] * m[14] - m[10] * m[13]) - m[5] * (m[8] * m[14] - m[10] * m[12]) + m[6] * (m[8] * m[13] - m[9] * m[12]));
        inv[13] = invDet * (m[0] * (m[9] * m[14] - m[10] * m[13]) - m[1] * (m[8] * m[14] - m[10] * m[12]) + m[2] * (m[8] * m[13] - m[9] * m[12]));
        inv[14] = invDet * -(m[0] * (m[5] * m[14] - m[6] * m[13]) - m[1] * (m[4] * m[14] - m[6] * m[12]) + m[2] * (m[4] * m[13] - m[5] * m[12]));
        inv[15] = invDet * (m[0] * (m[5] * m[10] - m[6] * m[9]) - m[1] * (m[4] * m[10] - m[6] * m[8]) + m[2] * (m[4] * m[9] - m[5] * m[8]));
    
        return inv;
    }
    
    function multiplyMatrix4x4(a, b) {
        const result = new Array(16);
    
        result[0] = a[0] * b[0] + a[1] * b[4] + a[2] * b[8] + a[3] * b[12];
        result[1] = a[0] * b[1] + a[1] * b[5] + a[2] * b[9] + a[3] * b[13];
        result[2] = a[0] * b[2] + a[1] * b[6] + a[2] * b[10] + a[3] * b[14];
        result[3] = a[0] * b[3] + a[1] * b[7] + a[2] * b[11] + a[3] * b[15];
    
        result[4] = a[4] * b[0] + a[5] * b[4] + a[6] * b[8] + a[7] * b[12];
        result[5] = a[4] * b[1] + a[5] * b[5] + a[6] * b[9] + a[7] * b[13];
        result[6] = a[4] * b[2] + a[5] * b[6] + a[6] * b[10] + a[7] * b[14];
        result[7] = a[4] * b[3] + a[5] * b[7] + a[6] * b[11] + a[7] * b[15];
    
        result[8] = a[8] * b[0] + a[9] * b[4] + a[10] * b[8] + a[11] * b[12];
        result[9] = a[8] * b[1] + a[9] * b[5] + a[10] * b[9] + a[11] * b[13];
        result[10] = a[8] * b[2] + a[9] * b[6] + a[10] * b[10] + a[11] * b[14];
        result[11] = a[8] * b[3] + a[9] * b[7] + a[10] * b[11] + a[11] * b[15];
    
        result[12] = a[12] * b[0] + a[13] * b[4] + a[14] * b[8] + a[15] * b[12];
        result[13] = a[12] * b[1] + a[13] * b[5] + a[14] * b[9] + a[15] * b[13];
        result[14] = a[12] * b[2] + a[13] * b[6] + a[14] * b[10] + a[15] * b[14];
        result[15] = a[12] * b[3] + a[13] * b[7] + a[14] * b[11] + a[15] * b[15];
    
        return result;
    }
    

    // Function to multiply two 4x4 matrices (used for accumulating transformations)
    // function multiplyMatrices(m1, m2) {
    //     let result = new Array(16).fill(0);
    //     for (let i = 0; i < 4; i++) {
    //         for (let j = 0; j < 4; j++) {
    //             for (let k = 0; k < 4; k++) {
    //                 result[i * 4 + j] += m1[i * 4 + k] * m2[k * 4 + j];
    //             }
    //         }
    //     }
    //     return result;
    // }

    // function generateIdentityMatrix1D() {
    //     return [
    //       1, 0, 0, 0,
    //       0, 1, 0, 0,
    //       0, 0, 1, 0,
    //       0, 0, 0, 1
    //     ];
    //   }
    
    // Function to extract matrix from a transform object
   // Function to generate XML content from accumulated matrices
    function generateXML(tooth_Matrices, attach_Matrices, prevXml) {
        console.log("upperSteps", upperSteps.length)
        console.log("lowerSteps", lowerSteps.length)
        // textContent += `<UpperStep>\n`;
        // // Iterate through accumulated transforms and letruct XML structure
        // for (let toothNumber = 0; toothNumber < 14; toothNumber++) {
        //     if(!attach_Matrices[toothNumber]) {
        //         let tooth_matrix = tooth_Matrices[toothNumber].elements;
        //         tooth_matrix = transposeMatrix4x4(tooth_matrix);
        //         textContent += `
        //         <ToothInStep Attachment_STLFile1="DrMartin50568_ModelFiles/attachment1_${toothNumber + 2}-0.stl" Tooth_STLFile="DrMartin50568_ModelFiles/${toothNumber + 2}-0.stl" StepNumber="0" ToothNumber="${toothNumber + 2}">
        //             <ToothTransform 
        //                 m0="${tooth_matrix[0]}" m1="${tooth_matrix[1]}" m2="${tooth_matrix[2]}" m3="${tooth_matrix[3]}" 
        //                 m4="${tooth_matrix[4]}" m5="${tooth_matrix[5]}" m6="${tooth_matrix[6]}" m7="${tooth_matrix[7]}" 
        //                 m8="${tooth_matrix[8]}" m9="${tooth_matrix[9]}" m10="${tooth_matrix[10]}" m11="${tooth_matrix[11]}" 
        //                 m12="${tooth_matrix[12]}" m13="${tooth_matrix[13]}" m14="${tooth_matrix[14]}" m15="${tooth_matrix[15]}" />
        //         </ToothInStep>\n`;
        //     }  else {
        //         let tooth_matrix = tooth_Matrices[toothNumber].elements;
        //         tooth_matrix = transposeMatrix4x4(tooth_matrix);
        //         let attach_matrix = attach_Matrices[toothNumber].elements;
        //         attach_matrix = transposeMatrix4x4(attach_matrix);
        //         textContent += `
        //         <ToothInStep Attachment_STLFile1="DrMartin50568_ModelFiles/attachment1_${toothNumber + 2}-0.stl" Tooth_STLFile="DrMartin50568_ModelFiles/${toothNumber + 2}-0.stl" StepNumber="0" ToothNumber="${toothNumber + 2 }">
        //             <ToothTransform 
        //                 m0="${tooth_matrix[0]}" m1="${tooth_matrix[1]}" m2="${tooth_matrix[2]}" m3="${tooth_matrix[3]}" 
        //                 m4="${tooth_matrix[4]}" m5="${tooth_matrix[5]}" m6="${tooth_matrix[6]}" m7="${tooth_matrix[7]}" 
        //                 m8="${tooth_matrix[8]}" m9="${tooth_matrix[9]}" m10="${tooth_matrix[10]}" m11="${tooth_matrix[11]}" 
        //                 m12="${tooth_matrix[12]}" m13="${tooth_matrix[13]}" m14="${tooth_matrix[14]}" m15="${tooth_matrix[15]}" />
        //             <AttachmentTransform1 
        //                 m0="${attach_matrix[0]}" m1="${attach_matrix[1]}" m2="${attach_matrix[2]}" m3="${attach_matrix[3]}" 
        //                 m4="${attach_matrix[4]}" m5="${attach_matrix[5]}" m6="${attach_matrix[6]}" m7="${attach_matrix[7]}" 
        //                 m8="${attach_matrix[8]}" m9="${attach_matrix[9]}" m10="${attach_matrix[10]}" m11="${attach_matrix[11]}" 
        //                 m12="${attach_matrix[12]}" m13="${attach_matrix[13]}" m14="${attach_matrix[14]}" m15="${attach_matrix[15]}" />
        //         </ToothInStep>\n`;
        //     }  
        // }
        // textContent += `</UpperStep>\n`;
        // Store the new content in a separate variable
        let newContent = `<UpperStep>\n`;
        // Iterate through accumulated transforms and letruct XML structure
        for (let toothNumber = 0; toothNumber < 14; toothNumber++) {
            if(!attach_Matrices[toothNumber]) {
                if(!tooth_Matrices[toothNumber]) continue
                let tooth_matrix = tooth_Matrices[toothNumber].elements;
                tooth_matrix = transposeMatrix4x4(tooth_matrix);
                newContent += `
                <ToothInStep Attachment_STLFile1="DrMartin50568_ModelFiles/attachment1_${toothNumber + 2}-0.stl" Tooth_STLFile="DrMartin50568_ModelFiles/${toothNumber + 2}-0.stl" StepNumber="${lowerSteps.length}" ToothNumber="${toothNumber + 2}">
                    <ToothTransform 
                        m0="${tooth_matrix[0]}" m1="${tooth_matrix[1]}" m2="${tooth_matrix[2]}" m3="${tooth_matrix[3]}" 
                        m4="${tooth_matrix[4]}" m5="${tooth_matrix[5]}" m6="${tooth_matrix[6]}" m7="${tooth_matrix[7]}" 
                        m8="${tooth_matrix[8]}" m9="${tooth_matrix[9]}" m10="${tooth_matrix[10]}" m11="${tooth_matrix[11]}" 
                        m12="${tooth_matrix[12]}" m13="${tooth_matrix[13]}" m14="${tooth_matrix[14]}" m15="${tooth_matrix[15]}" />
                </ToothInStep>\n`;
            }  else {
                if(!tooth_Matrices[toothNumber]){
                    let attach_matrix = attach_Matrices[toothNumber].elements;
                    attach_matrix = transposeMatrix4x4(attach_matrix);
                    newContent += `
                        <ToothInStep Attachment_STLFile1="DrMartin50568_ModelFiles/attachment1_${toothNumber + 2}-0.stl" Tooth_STLFile="DrMartin50568_ModelFiles/${toothNumber + 2}-0.stl" StepNumber="${lowerSteps.length}" ToothNumber="${toothNumber + 2 }">
                            <AttachmentTransform1 
                                m0="${attach_matrix[0]}" m1="${attach_matrix[1]}" m2="${attach_matrix[2]}" m3="${attach_matrix[3]}" 
                                m4="${attach_matrix[4]}" m5="${attach_matrix[5]}" m6="${attach_matrix[6]}" m7="${attach_matrix[7]}" 
                                m8="${attach_matrix[8]}" m9="${attach_matrix[9]}" m10="${attach_matrix[10]}" m11="${attach_matrix[11]}" 
                                m12="${attach_matrix[12]}" m13="${attach_matrix[13]}" m14="${attach_matrix[14]}" m15="${attach_matrix[15]}" />
                        </ToothInStep>\n`;
                    continue
                }
                let tooth_matrix = tooth_Matrices[toothNumber].elements;
                tooth_matrix = transposeMatrix4x4(tooth_matrix);
                let attach_matrix = attach_Matrices[toothNumber].elements;
                attach_matrix = transposeMatrix4x4(attach_matrix);
                // let tooth_matrix = tooth_Matrices[toothNumber].elements;
                // tooth_matrix = transposeMatrix4x4(tooth_matrix);
                // let inverse_tooth_matrix = inverseMatrix4x4(tooth_matrix);
                // let attach_matrix = attach_Matrices[toothNumber].elements;
                // attach_matrix = transposeMatrix4x4(attach_matrix);
                // attach_matrix = multiplyMatrix4x4(inverse_tooth_matrix, attach_matrix);
                newContent += `
                <ToothInStep Attachment_STLFile1="DrMartin50568_ModelFiles/attachment1_${toothNumber + 2}-0.stl" Tooth_STLFile="DrMartin50568_ModelFiles/${toothNumber + 2}-0.stl" StepNumber="${lowerSteps.length}" ToothNumber="${toothNumber + 2 }">
                    <ToothTransform 
                        m0="${tooth_matrix[0]}" m1="${tooth_matrix[1]}" m2="${tooth_matrix[2]}" m3="${tooth_matrix[3]}" 
                        m4="${tooth_matrix[4]}" m5="${tooth_matrix[5]}" m6="${tooth_matrix[6]}" m7="${tooth_matrix[7]}" 
                        m8="${tooth_matrix[8]}" m9="${tooth_matrix[9]}" m10="${tooth_matrix[10]}" m11="${tooth_matrix[11]}" 
                        m12="${tooth_matrix[12]}" m13="${tooth_matrix[13]}" m14="${tooth_matrix[14]}" m15="${tooth_matrix[15]}" />
                    <AttachmentTransform1 
                          m0="${attach_matrix[0]}" m1="${attach_matrix[1]}" m2="${attach_matrix[2]}" m3="${attach_matrix[3]}" 
                          m4="${attach_matrix[4]}" m5="${attach_matrix[5]}" m6="${attach_matrix[6]}" m7="${attach_matrix[7]}" 
                          m8="${attach_matrix[8]}" m9="${attach_matrix[9]}" m10="${attach_matrix[10]}" m11="${attach_matrix[11]}" 
                          m12="${attach_matrix[12]}" m13="${attach_matrix[13]}" m14="${attach_matrix[14]}" m15="${attach_matrix[15]}" />
                </ToothInStep>\n`;
            }  
        }
        newContent += `</UpperStep>\n`;

        // Find the last occurrence of </UpperStep> in textContent
        let lastUpperStepIndex = prevXml.lastIndexOf('</UpperStep>');

        if (lastUpperStepIndex !== -1) {
            // Insert the new content after the last </UpperStep>
            prevXml = prevXml.slice(0, lastUpperStepIndex + 12) + '\n' + newContent + prevXml.slice(lastUpperStepIndex + 12);
        } else {
            // If </UpperStep> is not found, append the new content to the end
            prevXml += newContent;
        }
        prevXml += `<LowerStep>\n`;
        // Iterate through accumulated transforms and letruct XML structure
        for (let toothNumber = 15; toothNumber <= 28; toothNumber++) {
            if(!attach_Matrices[toothNumber]) {
                if(!tooth_Matrices[toothNumber]) continue
                let tooth_matrix = tooth_Matrices[toothNumber].elements;
                tooth_matrix = transposeMatrix4x4(tooth_matrix);
                prevXml += `
                <ToothInStep Attachment_STLFile1="DrMartin50568_ModelFiles/attachment1_${toothNumber + 2}-0.stl" Tooth_STLFile="DrMartin50568_ModelFiles/tooth${toothNumber + 2}-0.stl" StepNumber="${lowerSteps.length}" ToothNumber="${toothNumber + 2}">
                    <ToothTransform 
                        m0="${tooth_matrix[0]}" m1="${tooth_matrix[1]}" m2="${tooth_matrix[2]}" m3="${tooth_matrix[3]}" 
                        m4="${tooth_matrix[4]}" m5="${tooth_matrix[5]}" m6="${tooth_matrix[6]}" m7="${tooth_matrix[7]}" 
                        m8="${tooth_matrix[8]}" m9="${tooth_matrix[9]}" m10="${tooth_matrix[10]}" m11="${tooth_matrix[11]}" 
                        m12="${tooth_matrix[12]}" m13="${tooth_matrix[13]}" m14="${tooth_matrix[14]}" m15="${tooth_matrix[15]}" />
                    
                    </ToothInStep>\n`;
            }  else {
                if(!tooth_Matrices[toothNumber]){
                    let attach_matrix = attach_Matrices[toothNumber].elements;
                    attach_matrix = transposeMatrix4x4(attach_matrix);
                    prevXml += `
                        <ToothInStep Attachment_STLFile1="DrMartin50568_ModelFiles/attachment1_${toothNumber + 2}-0.stl" Tooth_STLFile="DrMartin50568_ModelFiles/${toothNumber + 2}-0.stl" StepNumber="${lowerSteps.length}" ToothNumber="${toothNumber + 2 }">
                            <AttachmentTransform1 
                                m0="${attach_matrix[0]}" m1="${attach_matrix[1]}" m2="${attach_matrix[2]}" m3="${attach_matrix[3]}" 
                                m4="${attach_matrix[4]}" m5="${attach_matrix[5]}" m6="${attach_matrix[6]}" m7="${attach_matrix[7]}" 
                                m8="${attach_matrix[8]}" m9="${attach_matrix[9]}" m10="${attach_matrix[10]}" m11="${attach_matrix[11]}" 
                                m12="${attach_matrix[12]}" m13="${attach_matrix[13]}" m14="${attach_matrix[14]}" m15="${attach_matrix[15]}" />
                        </ToothInStep>\n`;
                    continue
                }
                let tooth_matrix = tooth_Matrices[toothNumber].elements;
                tooth_matrix = transposeMatrix4x4(tooth_matrix);
                let attach_matrix = attach_Matrices[toothNumber].elements;
                attach_matrix = transposeMatrix4x4(attach_matrix);
                prevXml += `
                <ToothInStep Attachment_STLFile1="DrMartin50568_ModelFiles/attachment1_${toothNumber + 2}-0.stl" Tooth_STLFile="DrMartin50568_ModelFiles/tooth${toothNumber + 2}-0.stl" StepNumber="${lowerSteps.length}" ToothNumber="${toothNumber + 2 }">
                    <ToothTransform 
                        m0="${tooth_matrix[0]}" m1="${tooth_matrix[1]}" m2="${tooth_matrix[2]}" m3="${tooth_matrix[3]}" 
                        m4="${tooth_matrix[4]}" m5="${tooth_matrix[5]}" m6="${tooth_matrix[6]}" m7="${tooth_matrix[7]}" 
                        m8="${tooth_matrix[8]}" m9="${tooth_matrix[9]}" m10="${tooth_matrix[10]}" m11="${tooth_matrix[11]}" 
                        m12="${tooth_matrix[12]}" m13="${tooth_matrix[13]}" m14="${tooth_matrix[14]}" m15="${tooth_matrix[15]}" />
                    <AttachmentTransform1 
                        m0="${attach_matrix[0]}" m1="${attach_matrix[1]}" m2="${attach_matrix[2]}" m3="${attach_matrix[3]}" 
                        m4="${attach_matrix[4]}" m5="${attach_matrix[5]}" m6="${attach_matrix[6]}" m7="${attach_matrix[7]}" 
                        m8="${attach_matrix[8]}" m9="${attach_matrix[9]}" m10="${attach_matrix[10]}" m11="${attach_matrix[11]}" 
                        m12="${attach_matrix[12]}" m13="${attach_matrix[13]}" m14="${attach_matrix[14]}" m15="${attach_matrix[15]}" />
                </ToothInStep>\n`;
            }  
        }
        prevXml += `</LowerStep>\n`;
        return prevXml;
    }    

    // function generateXML(tooth_Matrices, attach_Matrices, textContent) {
    //     console.log("upperSteps", upperSteps.length)
    //     console.log("lowerSteps", lowerSteps.length)
    //     // textContent += `<UpperStep>\n`;
    //     // // Iterate through accumulated transforms and letruct XML structure
    //     // for (let toothNumber = 0; toothNumber < 14; toothNumber++) {
    //     //     if(!attach_Matrices[toothNumber]) {
    //     //         let tooth_matrix = tooth_Matrices[toothNumber].elements;
    //     //         tooth_matrix = transposeMatrix4x4(tooth_matrix);
    //     //         textContent += `
    //     //         <ToothInStep Attachment_STLFile1="DrMartin50568_ModelFiles/attachment1_${toothNumber + 2}-0.stl" Tooth_STLFile="DrMartin50568_ModelFiles/${toothNumber + 2}-0.stl" StepNumber="0" ToothNumber="${toothNumber + 2}">
    //     //             <ToothTransform 
    //     //                 m0="${tooth_matrix[0]}" m1="${tooth_matrix[1]}" m2="${tooth_matrix[2]}" m3="${tooth_matrix[3]}" 
    //     //                 m4="${tooth_matrix[4]}" m5="${tooth_matrix[5]}" m6="${tooth_matrix[6]}" m7="${tooth_matrix[7]}" 
    //     //                 m8="${tooth_matrix[8]}" m9="${tooth_matrix[9]}" m10="${tooth_matrix[10]}" m11="${tooth_matrix[11]}" 
    //     //                 m12="${tooth_matrix[12]}" m13="${tooth_matrix[13]}" m14="${tooth_matrix[14]}" m15="${tooth_matrix[15]}" />
    //     //         </ToothInStep>\n`;
    //     //     }  else {
    //     //         let tooth_matrix = tooth_Matrices[toothNumber].elements;
    //     //         tooth_matrix = transposeMatrix4x4(tooth_matrix);
    //     //         let attach_matrix = attach_Matrices[toothNumber].elements;
    //     //         attach_matrix = transposeMatrix4x4(attach_matrix);
    //     //         textContent += `
    //     //         <ToothInStep Attachment_STLFile1="DrMartin50568_ModelFiles/attachment1_${toothNumber + 2}-0.stl" Tooth_STLFile="DrMartin50568_ModelFiles/${toothNumber + 2}-0.stl" StepNumber="0" ToothNumber="${toothNumber + 2 }">
    //     //             <ToothTransform 
    //     //                 m0="${tooth_matrix[0]}" m1="${tooth_matrix[1]}" m2="${tooth_matrix[2]}" m3="${tooth_matrix[3]}" 
    //     //                 m4="${tooth_matrix[4]}" m5="${tooth_matrix[5]}" m6="${tooth_matrix[6]}" m7="${tooth_matrix[7]}" 
    //     //                 m8="${tooth_matrix[8]}" m9="${tooth_matrix[9]}" m10="${tooth_matrix[10]}" m11="${tooth_matrix[11]}" 
    //     //                 m12="${tooth_matrix[12]}" m13="${tooth_matrix[13]}" m14="${tooth_matrix[14]}" m15="${tooth_matrix[15]}" />
    //     //             <AttachmentTransform1 
    //     //                 m0="${attach_matrix[0]}" m1="${attach_matrix[1]}" m2="${attach_matrix[2]}" m3="${attach_matrix[3]}" 
    //     //                 m4="${attach_matrix[4]}" m5="${attach_matrix[5]}" m6="${attach_matrix[6]}" m7="${attach_matrix[7]}" 
    //     //                 m8="${attach_matrix[8]}" m9="${attach_matrix[9]}" m10="${attach_matrix[10]}" m11="${attach_matrix[11]}" 
    //     //                 m12="${attach_matrix[12]}" m13="${attach_matrix[13]}" m14="${attach_matrix[14]}" m15="${attach_matrix[15]}" />
    //     //         </ToothInStep>\n`;
    //     //     }  
    //     // }
    //     // textContent += `</UpperStep>\n`;
    //     // Store the new content in a separate variable
    //     let newContent = `<UpperStep>\n`;
    //     // Iterate through accumulated transforms and letruct XML structure
    //     for (let toothNumber = 0; toothNumber < 14; toothNumber++) {
    //         if(!attach_Matrices[toothNumber]) {
    //             let tooth_matrix = tooth_Matrices[toothNumber].elements;
    //             tooth_matrix = transposeMatrix4x4(tooth_matrix);
    //             newContent += `
    //             <ToothInStep Attachment_STLFile1="DrMartin50568_ModelFiles/attachment1_${toothNumber + 2}-0.stl" Tooth_STLFile="DrMartin50568_ModelFiles/${toothNumber + 2}-0.stl" StepNumber="${upperSteps.length}" ToothNumber="${toothNumber + 2}">
    //                 <ToothTransform 
    //                     m0="${tooth_matrix[0]}" m1="${tooth_matrix[1]}" m2="${tooth_matrix[2]}" m3="${tooth_matrix[3]}" 
    //                     m4="${tooth_matrix[4]}" m5="${tooth_matrix[5]}" m6="${tooth_matrix[6]}" m7="${tooth_matrix[7]}" 
    //                     m8="${tooth_matrix[8]}" m9="${tooth_matrix[9]}" m10="${tooth_matrix[10]}" m11="${tooth_matrix[11]}" 
    //                     m12="${tooth_matrix[12]}" m13="${tooth_matrix[13]}" m14="${tooth_matrix[14]}" m15="${tooth_matrix[15]}" />
    //             </ToothInStep>\n`;
    //         }  else {
    //             let tooth_matrix = tooth_Matrices[toothNumber].elements;
    //             tooth_matrix = transposeMatrix4x4(tooth_matrix);
    //             let attach_matrix = attach_Matrices[toothNumber].elements;
    //             attach_matrix = transposeMatrix4x4(attach_matrix);
    //             // let tooth_matrix = tooth_Matrices[toothNumber].elements;
    //             // tooth_matrix = transposeMatrix4x4(tooth_matrix);
    //             // let inverse_tooth_matrix = inverseMatrix4x4(tooth_matrix);
    //             // let attach_matrix = attach_Matrices[toothNumber].elements;
    //             // attach_matrix = transposeMatrix4x4(attach_matrix);
    //             // attach_matrix = multiplyMatrix4x4(inverse_tooth_matrix, attach_matrix);
    //             newContent += `
    //             <ToothInStep Attachment_STLFile1="DrMartin50568_ModelFiles/attachment1_${toothNumber + 2}-0.stl" Tooth_STLFile="DrMartin50568_ModelFiles/${toothNumber + 2}-0.stl" StepNumber="${upperSteps.length}" ToothNumber="${toothNumber + 2 }">
    //                 <ToothTransform 
    //                     m0="${tooth_matrix[0]}" m1="${tooth_matrix[1]}" m2="${tooth_matrix[2]}" m3="${tooth_matrix[3]}" 
    //                     m4="${tooth_matrix[4]}" m5="${tooth_matrix[5]}" m6="${tooth_matrix[6]}" m7="${tooth_matrix[7]}" 
    //                     m8="${tooth_matrix[8]}" m9="${tooth_matrix[9]}" m10="${tooth_matrix[10]}" m11="${tooth_matrix[11]}" 
    //                     m12="${tooth_matrix[12]}" m13="${tooth_matrix[13]}" m14="${tooth_matrix[14]}" m15="${tooth_matrix[15]}" />
    //                 <AttachmentTransform1 
    //                     m0="${attach_matrix[0]}" m1="${attach_matrix[1]}" m2="${attach_matrix[2]}" m3="${attach_matrix[3]}" 
    //                     m4="${attach_matrix[4]}" m5="${attach_matrix[5]}" m6="${attach_matrix[6]}" m7="${attach_matrix[7]}" 
    //                     m8="${attach_matrix[8]}" m9="${attach_matrix[9]}" m10="${attach_matrix[10]}" m11="${attach_matrix[11]}" 
    //                     m12="${attach_matrix[12]}" m13="${attach_matrix[13]}" m14="${attach_matrix[14]}" m15="${attach_matrix[15]}" />
    //             </ToothInStep>\n`;
    //         }  
    //     }
    //     newContent += `</UpperStep>\n`;

    //     // Find the last occurrence of </UpperStep> in textContent
    //     let lastUpperStepIndex = textContent.lastIndexOf('</UpperStep>');

    //     if (lastUpperStepIndex !== -1) {
    //         // Insert the new content after the last </UpperStep>
    //         textContent = textContent.slice(0, lastUpperStepIndex + 12) + '\n' + newContent + textContent.slice(lastUpperStepIndex + 12);
    //     } else {
    //         // If </UpperStep> is not found, append the new content to the end
    //         textContent += newContent;
    //     }
    //     textContent += `<LowerStep>\n`;
    //     // Iterate through accumulated transforms and letruct XML structure
    //     for (let toothNumber = 15; toothNumber <= 28; toothNumber++) {
    //         if(!attach_Matrices[toothNumber]) {
    //             let tooth_matrix = tooth_Matrices[toothNumber].elements;
    //             tooth_matrix = transposeMatrix4x4(tooth_matrix);
    //             textContent += `
    //             <ToothInStep Attachment_STLFile1="DrMartin50568_ModelFiles/attachment1_${toothNumber + 2}-0.stl" Tooth_STLFile="DrMartin50568_ModelFiles/tooth${toothNumber + 2}-0.stl" StepNumber="${lowerSteps.length}" ToothNumber="${toothNumber + 2}">
    //                 <ToothTransform 
    //                     m0="${tooth_matrix[0]}" m1="${tooth_matrix[1]}" m2="${tooth_matrix[2]}" m3="${tooth_matrix[3]}" 
    //                     m4="${tooth_matrix[4]}" m5="${tooth_matrix[5]}" m6="${tooth_matrix[6]}" m7="${tooth_matrix[7]}" 
    //                     m8="${tooth_matrix[8]}" m9="${tooth_matrix[9]}" m10="${tooth_matrix[10]}" m11="${tooth_matrix[11]}" 
    //                     m12="${tooth_matrix[12]}" m13="${tooth_matrix[13]}" m14="${tooth_matrix[14]}" m15="${tooth_matrix[15]}" />
    //             </ToothInStep>\n`;
    //         }  else {
    //             let tooth_matrix = tooth_Matrices[toothNumber].elements;
    //             tooth_matrix = transposeMatrix4x4(tooth_matrix);
    //             let attach_matrix = attach_Matrices[toothNumber].elements;
    //             attach_matrix = transposeMatrix4x4(attach_matrix);
    //             textContent += `
    //             <ToothInStep Attachment_STLFile1="DrMartin50568_ModelFiles/attachment1_${toothNumber + 2}-0.stl" Tooth_STLFile="DrMartin50568_ModelFiles/tooth${toothNumber + 2}-0.stl" StepNumber="${lowerSteps.length}" ToothNumber="${toothNumber + 2 }">
    //                 <ToothTransform 
    //                     m0="${tooth_matrix[0]}" m1="${tooth_matrix[1]}" m2="${tooth_matrix[2]}" m3="${tooth_matrix[3]}" 
    //                     m4="${tooth_matrix[4]}" m5="${tooth_matrix[5]}" m6="${tooth_matrix[6]}" m7="${tooth_matrix[7]}" 
    //                     m8="${tooth_matrix[8]}" m9="${tooth_matrix[9]}" m10="${tooth_matrix[10]}" m11="${tooth_matrix[11]}" 
    //                     m12="${tooth_matrix[12]}" m13="${tooth_matrix[13]}" m14="${tooth_matrix[14]}" m15="${tooth_matrix[15]}" />
    //                 <AttachmentTransform1 
    //                     m0="${attach_matrix[0]}" m1="${attach_matrix[1]}" m2="${attach_matrix[2]}" m3="${attach_matrix[3]}" 
    //                     m4="${attach_matrix[4]}" m5="${attach_matrix[5]}" m6="${attach_matrix[6]}" m7="${attach_matrix[7]}" 
    //                     m8="${attach_matrix[8]}" m9="${attach_matrix[9]}" m10="${attach_matrix[10]}" m11="${attach_matrix[11]}" 
    //                     m12="${attach_matrix[12]}" m13="${attach_matrix[13]}" m14="${attach_matrix[14]}" m15="${attach_matrix[15]}" />
    //             </ToothInStep>\n`;
    //         }  
    //     }
    //     textContent += `</LowerStep>\n`;
    //     return textContent;
    // }

    // processZipAndCreateXml(targetUrl);

    // async function fetchZip(url) {
    //     const response = await fetch(url);
    //     const blob = await response.blob();
    //     return blob;
    // }

    // async function unzipBlob(blob) {
    //     const jszip = new JSZip();
    //     const zip = await jszip.loadAsync(blob);
    //     return zip;
    // }

    // async function extractXmlFiles(zip) {
    //     const xmlFiles = {};
    //     for (const filename of Object.keys(zip.files)) {
    //         if (filename.endsWith('.xml')) {
    //             const file = zip.files[filename];
    //             const content = await file.async('text');
    //             xmlFiles[filename] = content;
    //         }
    //     }
    //     return xmlFiles;
    // }

    // function parseXml(xmlString) {
    //     const tmpString = xmlString;
    //     const parser = new DOMParser();
    //     const doc = parser.parseFromString(tmpString, 'text/xml');
        
    //     // Check if parsing failed by detecting <parsererror>
    //     const parserError = doc.querySelector('parsererror');
    //     if (parserError) {
    //         console.error('XML Parsing Error:', parserError.textContent);
    //         return null;  // Or handle the error as needed
    //     }
    
    //     return doc;
    // }

    // function getTransformData(doc) {
    //     const transforms = {};
    //     const toothNodes = doc.querySelectorAll('ToothInStep');

    //     toothNodes.forEach(toothNode => {
    //         const stepNumber = toothNode.getAttribute('StepNumber');
    //         const toothNumber = toothNode.getAttribute('ToothNumber');
    //         const toothTransform = toothNode.querySelector('ToothTransform');
    //         const attachmentTransform = toothNode.querySelector('AttachmentTransform1');

    //         if (toothTransform) {
    //             transforms[`${stepNumber}-${toothNumber}`] = {
    //                 toothTransform: Array.from(toothTransform.attributes).reduce((acc, attr) => {
    //                     acc[attr.name] = parseFloat(attr.value);
    //                     return acc;
    //                 }, {}),
    //                 attachmentTransform: Array.from(attachmentTransform.attributes).reduce((acc, attr) => {
    //                     acc[attr.name] = parseFloat(attr.value);
    //                     return acc;
    //                 }, {})
    //             };
    //         }
    //     });

    //     return transforms;
    // }

    // function computeAggregatedTransform(transforms) {
    //     // Implement aggregation logic here based on the requirement
    //     // For simplicity, returning the transforms directly
    //     return transforms;
    // }

    // function createXmlContent(transforms) {
    //     let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<Root>\n';
    //     Object.keys(transforms).forEach(key => {
    //         const { toothTransform, attachmentTransform } = transforms[key];
    //         xmlContent += `<ToothInStep StepNumber="${key.split('-')[0]}" ToothNumber="${key.split('-')[1]}">\n`;
    //         xmlContent += `<ToothTransform ${Object.entries(toothTransform).map(([k, v]) => `${k}="${v}"`).join(' ')} />\n`;
    //         xmlContent += `<AttachmentTransform1 ${Object.entries(attachmentTransform).map(([k, v]) => `${k}="${v}"`).join(' ')} />\n`;
    //         xmlContent += `</ToothInStep>\n`;
    //     });
    //     xmlContent += '</Root>';
    //     return xmlContent;
    // }

    // function downloadFile(filename, content) {
    //     const blob = new Blob([content], { type: 'application/xml' });
    //     const link = document.createElement('a');
    //     link.href = URL.createObjectURL(blob);
    //     link.download = filename;
    //     link.click();
    // }

    // async function processZipAndCreateXml(url) {
    //     try {
    //         const zipBlob = await fetchZip(url);
    //         const zip = await unzipBlob(zipBlob);
    //         const xmlFiles = await extractXmlFiles(zip);

    //         // Assuming there's one XML file to process
    //         const xmlFileName = Object.keys(xmlFiles)[0];
            
    //         
    //         
            
    //         const xmlString = xmlFiles[xmlFileName];

    //         


    //         const doc = parseXml(xmlString);

    //         

    //         const transforms = getTransformData(doc);

    //         

    //         const aggregatedTransforms = computeAggregatedTransform(transforms);
    //         const newXmlContent = createXmlContent(aggregatedTransforms);

    //         downloadFile('new_transforms.xml', newXmlContent);
    //     } catch (error) {
    //         console.error('Error processing ZIP file:', error);
    //     }
    // }

    // Call the function to start processing


}