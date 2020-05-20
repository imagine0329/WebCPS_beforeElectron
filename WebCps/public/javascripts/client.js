const btn_write = document.getElementById("btn_write");
const btn_read = document.getElementById("btn_read");
const btn_refreshComport = document.getElementById("btn_refreshComport");
const select_comport = document.getElementById("select_comport");


window.onload = function () {
	changeColorOfTitle();

	btn_write.addEventListener("click", function () {
		write();
	});
	
    btn_read.addEventListener("click", function () {
		read();
	});

	
    btn_refreshComport.addEventListener("click", function () {
		refreshComport();
	});
};


const changeColorOfTitle = () => {
	var title = window.location.pathname;
	title = title.replace("/", "");
	var page = document.getElementById(title);
	page.style.color = "dodgerblue";
	page.style.fontWeight = 1000;
};


var webSocket = new WebSocket("ws://localhost:4000/serial-port");
webSocket.onopen = function () {
    console.log('success to connect');
};


webSocket.onmessage = function (event) {
	var msg = JSON.parse(event.data);
	const readData = msg.data;
	console.log('get.message : ' + msg.type);
	console.log('get.data : ' + msg.data);
	

	switch (msg.type) {
		case "refreshComport":
			var ports = readData.toString('string');
			ports = ports.split(',');
			
			for (var i in ports) {
				var op = document.createElement('option');
				op.appendChild(document.createTextNode(ports[i]));
				op.value = ports[i];
				select_comport.appendChild(op);
			}
			break;

		case "read":
			for (var bytes = [], c = 0; c < readData.length; c += 2)
				bytes.push(parseInt(readData.substr(c, 2), 16));

			for (var i = 0; i < readData.length / 2; i++) {
				document.getElementById("network").innerHTML += bytes[i].toString(16) + "&nbsp;&nbsp;";
			}
			document.getElementById("network").innerHTML += "<br />";
			break;

		case "value":
			if(readData != null)
				analyzeReceivedData(readData);

			break;

		default:
			break;
	}
};

const write = () => {
	console.log("--------------write--------------");
		
	sendMsgToServer('comport', getComportNumber());
	sendMsgToServer('write', getDataFromHtml());
}

const read = () => {
	console.log("--------------read-------------------");

	sendMsgToServer('read', getComportNumber());
}

const refreshComport = () => {
	console.log("--------------refreshComport-------------------");
	for (var i = 1; i < select_comport.options.length; i++) {
		select_comport.options[i] = null;
	}
	select_comport.options.length = 1;

	sendMsgToServer('refreshComport', null);
}

const analyzeReceivedData = (buffer) => {
	document.getElementById("check_rangeCheck").checked = buffer[0] & 0x01;
	document.getElementById("check_scan").checked = buffer[0] & 0x02;
}

const analyzeData = (buffer) => {

}

const getDataFromHtml = () => {
	var data = new Array;

	data.push(document.getElementById("check_rangeCheck").checked);
	data.push(document.getElementById("check_scan").checked);

//	data[0] = document.getElementById("check_rangeCheck").getAttribute("checked");
//	data[1] = document.getElementById("check_scan").getAttribute("checked");

	return data;
}

const setDataIntoHtml = (data) => {

}

const sendDataToServer = (buffer) => {

}

const sendMsgToServer = (type, data) => {
	var msg = {
		type: type,
		data: data
	};

	console.log('send.msg.type : ' + msg.type);
	console.log('send.msg.data : ' + msg.data);

	webSocket.send(JSON.stringify(msg));
}

const getComportNumber = () => {
	return select_comport.options[select_comport.selectedIndex].text;
}