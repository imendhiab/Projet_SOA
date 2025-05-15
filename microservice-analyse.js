const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const FormData = require('form-data');

const analyserImage = async (call, callback) => {
  const imageBuffer = call.request.image;
  const filename = `${uuidv4()}.jpg`;
  const filepath = path.join(__dirname, 'uploads', filename);

  try {
    fs.writeFileSync(filepath, imageBuffer);

    const formData = new FormData();
    formData.append('file', fs.createReadStream(filepath));

    const response = await axios.post('http://localhost:5000/predict', formData, {
      headers: formData.getHeaders()
    });

    const prediction = response.data.prediction;

    fs.unlinkSync(filepath);

    callback(null, { prediction: prediction.toString() });

  } catch (error) {
    console.error('Erreur dans l’analyse:', error.message);
    callback({
      code: grpc.status.INTERNAL,
      message: 'Erreur lors de l’analyse de l’image'
    });
  }
};


module.exports = {
  AnalyserImage: analyserImage
};
