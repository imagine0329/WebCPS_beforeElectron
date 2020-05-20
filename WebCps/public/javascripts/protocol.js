const START = 0x12;
const END = 0x13;
const PC_TO_RADIO = 0x01;
const RADIO_TO_PC = 0x10;

const NAK = 0x15;
const GENERAL_ACK = 0x06;
const READ_ACK = 0x03;


const READ_MODE = 0x22;
const WRITE_MODE = 0x20;
const READ = 0x02;
const WRITE = 0x01;
const MODEL = 0x74;
const FW_VERSION = 0x70;

const ADDR_BYTE = 4;
const LENGTH_BYTE = 6;


export const getBuffer = (cmd, addr=null, len=null, data=null) => {
	var buffer = new Array();
	var checksum = 0;

	buffer.push(START);
	buffer.push(PC_TO_RADIO);
	buffer.push(cmd);

	if (addr != null) {
		buffer.push(0x00);
		buffer.push(addr);
		buffer.push(0x00);
		buffer.push(len);

		if (cmd == WRITE) {
			buffer.push(data);
		}
	}

	for (var i = 1; i < buffer.length; i++)
		checksum += buffer[i];

	buffer.push(checksum);
	buffer.push(END);

	return buffer;
};

const protocol = {
	START,
	END,
	PC_TO_RADIO,
	RADIO_TO_PC,
	readMode: READ_MODE,
	writeMode: WRITE_MODE,
	read: READ,
	write: WRITE,

	ack: [
		GENERAL_ACK,
		READ_ACK
	]
	
};


export default protocol;