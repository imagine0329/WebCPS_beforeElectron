export const home = (req, res) => {
    res.render('home', { title: 'Home' });
};


export const getSerialPort = (req, res) => {
    res.render('serialPort', { title: 'Serial Port' });
};

export const getRadioInfo = (req, res) => {
    res.render('radioInfo', { title: 'Radio Info.' });
};

export const getPage4 = (req, res) => {
    res.render('page_4', { title: 'Page #4' });
};


export const postSerialPort = (req, res) => {
 //   res.sseSetup();
    
   // response = res;
     /*
      * const {
        body: { writeData }
    } = req;
    
    var result = parseInt(writeData);
    var buffer = [0x12, 0x03, result, 0x43, 0x13];
   
    port.write(buffer, function (err) {
        if (err) {
            return console.log('Error on write: ', err.message);
        }
        console.log('Written Data: ', buffer);
    });*/
};
