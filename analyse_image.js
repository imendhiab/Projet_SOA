const express = require("express");
const multer = require("multer");
const Jimp = require("jimp");
const fs = require("fs");
const TFLiteModel = require("tflite-node").TFLiteModel;

const app = express();
const port = 4000;
const cors = require('cors');
app.use(cors()); 

// Charge modèle
const modelBuffer = fs.readFileSync("model.tflite");
const model = new TFLiteModel(modelBuffer);

// Middleware
const upload = multer({ storage: multer.memoryStorage() });

app.post("/predict", upload.single("image"), async (req, res) => {
  try {
    const buffer = req.file.buffer;

    // Prétraitement image
    const image = await Jimp.read(buffer);
    image.resize(224, 224); // selon le modèle
    image.grayscale();
    const input = new Float32Array(224 * 224);

    for (let y = 0; y < 224; y++) {
      for (let x = 0; x < 224; x++) {
        const idx = y * 224 + x;
        const pixel = Jimp.intToRGBA(image.getPixelColor(x, y));
        input[idx] = pixel.r / 255.0; // image en niveaux de gris
      }
    }

    // Exécution
    model.resizeInputTensor(0, [1, 224, 224, 1]);
    model.setInputTensorData(0, input);
    model.invoke();
    const output = model.getOutputTensorData(0);

    const prediction = output[0] > 0.5 ? "fatigué" : "repos";
    res.json({ prediction, score: output[0] });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la prédiction" });
  }
});

app.listen(port, () => {
  console.log(`Fatigue service démarré sur le port ${port}`);
});
