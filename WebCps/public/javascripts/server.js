import WebSocket from 'ws';
import SerialPort from 'serialport';
import _variables from './_variables.js';
import protocol from './protocol.js';
import { getBuffer } from './protocol.js'
import { setTimeout } from 'timers';
import EventEmitter from 'events';

const event = new EventEmitter();

var lastBufferArrNumber = null;
const maxRetryWriteCnt = 5;

var mode = null;
var port = null;
var socket = null;
var comport = null;
var bufferArr = new Array;
var receivedData = new Array;


var cnt = 0;
var retryWriteCnt = 0;
var cntAtThisMoment;

var isFinished = false;

//	program cable 특성 상, write data가 read data로 인식 됨.
//	따라서 write data 이후에 실제 read data가 들어왔는지 확인하기 위해 선언한 변수
//	mustBeReadData = true; 임에도 불구하고 ack 신호가 들어오지 않으면 fail 처리 후, rewrite 실행.
var mustBeReadData = false;	


event.on('writePort', () => {
	console.log('--------------------------------------EVENT: writePort');
	writeDataToComport();
});


event.on('nextWritePort', () => {
	console.log('--------------------------------------EVENT: nextWritePort');
	cnt++;
	mustBeReadData = false;
	if (cnt > lastBufferArrNumber)
		event.emit('stopWritePort');
	else
		event.emit('writePort');
	
});

event.on('retryWritePort', () => {
	console.log('--------------------------------------EVENT: retryWritePort');
	mustBeReadData = false;
	retryWriteCnt++;
	if (retryWriteCnt == maxRetryWriteCnt)
		event.emit('stopWritePort');
	else
		event.emit('writePort');
});


event.on('stopWritePort', () => {
	console.log('--------------------------------------EVENT: stopWritePort');
	isFinished = true;
	closeSerialPort()

	console.log(mode);
	if(mode == protocol.readMode)
		sendDataToClient();

	mode = null;
});


//	이 부분 수정 필요
//	write data가 read 될때마다 timeout을 시작하기 때문에 성능 저하 됨
event.on('wait', () => {
	console.log('--------------------------------------EVENT: wait');
	setTimeout(() => {
		console.log(cntAtThisMoment + ' & ' + cnt);
		if (cntAtThisMoment == cnt) {
			console.log(isFinished + ' && ' + mustBeReadData);
			if (isFinished == false && mustBeReadData == true) {
			
				event.emit('retryWritePort');
			}
		}
	}, 1000);
});




module.exports = (server) => {
    const wss = new WebSocket.Server({ server });

	wss.on('connection', (websocket, req) => {
		socket = websocket;
		findSerialPort(websocket);
		

        const ip = req.headers['x-forwared-for'] || req.connection.remoteAddress;
        console.log('-------------connected  ' + ip);

		websocket.on('message', (message) => {
			var msg = JSON.parse(message);

			switch (msg.type) {
				case "read":
					mode = protocol.readMode;
					getReadyReadBuffer();
					comport = msg.data.toString();
					read();
					break;

				case "write":
					mode = protocol.writeMode;
					getReadyWriteBuffer(msg.data);
					write();
					break;

				case "comport":
					comport = msg.data.toString();
					break;

				case "refreshComport":
					findSerialPort();
					break;

				default:
					break;
			}
		});
		
        websocket.on('error', (error) => {
            console.log(error);
		});
		
        websocket.on('close', () => {
            console.log('-------------closed');
        });
	});
};

const read = () => {
	closeSerialPort()
		.then(openSerialPort)
		.then(startRead);
}


const write = () => {
	openSerialPort()
		.then(startWrite);
}


const openSerialPort = () => {
	console.log("openSerialPort()")
	return new Promise((resolve, reject) => {
		port = new SerialPort(comport, {
			baudRate: 38400,
			dataBits: 8,
			parity: 'none',
			stopBits: 1,
			autoOpen: false,
			encoding: 'hex'
		});

		port.on('open', () => {
			console.log('Success open port');
		});

		port.on('data', function (data) {
			analyzeReceivedData(data.toString('hex'));
		});
	
		port.on('close', () => {
			console.log('Success close port');
			port = null;
		});
		
		port.open((err) => {
			console.log('port.open()');
			if (err) {
				console.log('Open Error: ', err.message);
				reject(err);
			}
			else {
				console.log('---------------resolved------PROMISE');
				resolve();
			}
		});
	});
}


const closeSerialPort = () => {
	console.log("closeSerialPort()")
	return new Promise((resolve, reject) => {
		if (port == null)
			resolve();
		
		port.close((err) => {
			if (err) {
				console.log('Close Error on Promise: ', err.message);
				reject(err);
			}
			else {
				console.log('---------------close promise resolved------PROMISE');
				port = null;
				resolve();
			}
		});
	});
}

const getReadyReadBuffer = () => {
	bufferArr.splice(0, bufferArr.length);

	bufferArr.push(getBuffer(protocol.readMode));
	bufferArr.push(getBuffer(protocol.read, 0x24, 1));
	bufferArr.push(getBuffer(protocol.read, 0x24, 2));
}

const getReadyWriteBuffer = (data) => {
	bufferArr.splice(0, bufferArr.length);

	bufferArr.push(getBuffer(protocol.writeMode));

	var temp = data[0] + (data[1] << 1);
	bufferArr.push(getBuffer(protocol.write, 0x24, 1, temp));
}


const startRead = async () => {
	console.log("startRead()");

	lastBufferArrNumber = 2;
	initVariables();

	event.emit('writePort');
}


const startWrite = async () => {
	console.log("startWrite()");

	lastBufferArrNumber = 1;
	initVariables();

	event.emit('writePort');
}



const writeDataToComport = () => {
	console.log('bufferArr[' + cnt + '] = ' + bufferArr[cnt]);
	return new Promise((resolve, reject) => {
		port.write(bufferArr[cnt], (err) => {
			console.log('port.write()');
			if (err) {
				console.log("Error on write : " + err.message);
				reject(err);
			}
			else {
				console.log("Success port writing");
				resolve();
			}
		});
	});
}



const analyzeReceivedData = (data) => {
	console.log("analyzeReceivedData()");
//	return new Promise((resolve, reject) => {

		var buffer = [];
		for (var i = 0; i < data.length; i += 2)
			buffer.push(parseInt(data.substr(i, 2), 16));

		console.log("analyzed :  " + buffer);

		if (buffer[0] == protocol.START && buffer[1] == protocol.RADIO_TO_PC) {
			mustBeReadData = false;
			if (checkAck(buffer) && checkChecksum(buffer)) {
				saveValue(buffer);
				//resolve();
				event.emit('nextWritePort');
			}
			else {
				//reject();
				event.emit('retryWritePort');
			}
		}
		else if (buffer[1] == protocol.PC_TO_RADIO) {
			console.log(mustBeReadData);
			if (mustBeReadData)
				event.emit('retryWritePort');
			else {
				mustBeReadData = true;
				cntAtThisMoment = cnt;
				event.emit('wait');
			}
		}
		else
			event.emit('retryWritePort');
//	});
}


const saveValue = (buffer) => {
	if (buffer[2] == protocol.ack[1]) {
		var addr = buffer[4];
		var len = buffer[6];
		var tempBuffer = new Array;

		for (var i = 0; i < len; i++) {
			tempBuffer.push(buffer[7 + i]);
		}

		receivedData.push(tempBuffer);
	}
}


const sendDataToClient = () => {
	sendMsgToClient('value', receivedData);
}


const checkAck = (buffer) => {
	switch (buffer[2]) {
		case protocol.ack[0]:	// general
			break;

		case protocol.ack[1]:	// read
			break;

		default:
			return false;
	}

	return true;
}

const checkChecksum = (buffer) => {
	var len;
	switch (buffer[2]) {
		case protocol.ack[0]:	// general
			len = 2;
			break;

		case protocol.ack[1]:	// read
			len = 6 + buffer[6];
			break;

		default:
			return false;
	}
	var checksum = 0;
	for (var i = 0; i < len; i++) {
		checksum += buffer[i + 1];
	}

	console.log('CHECKSUM : ' + checksum + ' & buffer[checksum] = ' + buffer[len + 1]);

	if (buffer[len + 1] == checksum)
		return true;
	else
		return false;
}


const wait = (ms) => {
	return new Promise((resolve, reject) => {
		 setTimeout(() => {
			resolve();
		}, ms)
	});
}

const sendMsgToClient = (type, data) => {
	var msg = {
		type: type,
		data: data
	};

	console.log('send.msg.type : ' + msg.type);
	console.log('send.msg.data : ' + msg.data);
	socket.send(JSON.stringify(msg));
}

const findSerialPort = async () => {
	var portsList = [];
	await SerialPort.list().then(ports => {
		console.log("-----------------COM PORT LIST-----------------");
		ports.forEach(function (port) {
			portsList.push(port.path);
			console.log("PATH :  " + port.path);
			console.log("ID :  " + port.pnpId);
			console.log("Manufacturer :  " + port.manufacturer);
			console.log("-----------------------------------------------");
		});
	});

	sendMsgToClient('refreshComport', portsList.toString('dec'));
}

const initVariables = () => {
	if (mode == protocol.readMode)
		lastBufferArrNumber = 2;
	else if (mode == protocol.writeMode)
		lastBufferArrNumber = 1;

	receivedData = [];
	retryWriteCnt = 0;
	cnt = 0;
	isFinished = false;
}