from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from PIL import Image
import io
import tensorflow as tf

app = Flask(__name__)
CORS(app) 

# Charger le modèle
interpreter = tf.lite.Interpreter(model_path="model/model.tflite")
interpreter.allocate_tensors()

# Obtenir les détails d'entrée/sortie
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()
expected_height = input_details[0]['shape'][1]
expected_width = input_details[0]['shape'][2]

# Seuil de fatigue
FATIGUE_THRESHOLD = 0.4 # Seuil à ajuster selon votre modèle

def predict_image(image):
    """Prétraitement et prédiction"""
    image = image.resize((expected_width, expected_height))
    image = np.array(image) / 255.0
    image = np.expand_dims(image, axis=0).astype(np.float32)
    
    interpreter.set_tensor(input_details[0]['index'], image)
    interpreter.invoke()
    return interpreter.get_tensor(output_details[0]['index'])[0][0]  # Score de fatigue

@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'Aucun fichier fourni'}), 400
        
    file = request.files['file']
    if not file.filename:
        return jsonify({'error': 'Nom de fichier vide'}), 400
    
    try:
        image = Image.open(io.BytesIO(file.read()))
        if image.mode != 'RGB':
            image = image.convert('RGB')
            
        score = predict_image(image)
        
        # Détermination de l'état de fatigue
        fatigue_state = "fatigué" if score > FATIGUE_THRESHOLD else "non fatigué"
        
        return jsonify({
            'score': float(score),
            'state': fatigue_state,
            'threshold': FATIGUE_THRESHOLD,
            'message': 'Analyse terminée avec succès'
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'message': "Erreur de traitement"
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)