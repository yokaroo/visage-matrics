import os

# --- WAJIB DI BARIS PALING ATAS ---
# Ini memaksa TensorFlow menggunakan Keras 2 agar file .h5 bisa dibaca TF.js
os.environ["TF_USE_LEGACY_KERAS"] = "1"

import matplotlib.pyplot as plt
from sklearn.metrics import classification_report, confusion_matrix
import numpy as np

from src.data_loader import load_data
from src.model_builder import build_visage_model
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau

os.makedirs('saved_models', exist_ok=True)

print("\n[INFO] Memuat Dataset HYBRID (50% Wisnu + 50% Kaggle)...")
# PERUBAHAN 1: Arahkan ke Dataset_Hybrid
train_data, val_data, test_data = load_data(base_dir='Dataset_Hybrid', batch_size=32, img_size=(84, 84))

print("\n[INFO] Merakit Model Anti-Overfit (Edisi Hybrid)...")
model = build_visage_model(input_shape=(84, 84, 3))

# PERUBAHAN 2: Callbacks dengan kesabaran stabil
reduce_lr = ReduceLROnPlateau(monitor='val_loss', factor=0.2, patience=3, min_lr=1e-6, verbose=1)
early_stop = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True, verbose=1)

# PERUBAHAN 3: Hanya ekstensi file ini yang diubah menjadi .h5
checkpoint = ModelCheckpoint(
    'saved_models/visage_hybrid_baseline.h5', 
    monitor='val_loss', 
    save_best_only=True, 
    verbose=1
)

print("\n[INFO] Mulai Training Hybrid (Belajar dari Wisnu dan Ribuan Orang Asing)...")
history = model.fit(
    train_data,
    validation_data=val_data,
    epochs=50, 
    callbacks=[early_stop, checkpoint, reduce_lr]
)

print("\n[INFO] Membuat grafik performa...")
acc = history.history['accuracy']
val_acc = history.history['val_accuracy']
loss = history.history['loss']
val_loss = history.history['val_loss']
epochs_range = range(1, len(acc) + 1)

plt.figure(figsize=(12, 5))
plt.subplot(1, 2, 1)
plt.plot(epochs_range, loss, label="Train Loss", marker='o')
plt.plot(epochs_range, val_loss, label="Validation Loss", marker='o')
plt.title("Hybrid Training: Loss (BS=32)")
plt.xlabel("Epoch")
plt.ylabel("Loss")
plt.legend()
plt.grid(True)

plt.subplot(1, 2, 2)
plt.plot(epochs_range, acc, label="Train Accuracy", marker='o')
plt.plot(epochs_range, val_acc, label="Validation Accuracy", marker='o')
plt.title("Hybrid Training: Accuracy (BS=32)")
plt.xlabel("Epoch")
plt.ylabel("Accuracy")
plt.legend()
plt.grid(True)

plt.tight_layout()
# PERUBAHAN 4: Simpan grafik khusus Hybrid
plt.savefig("loss_curve_hybrid.png")
print("[INFO] Grafik performa disimpan sebagai 'loss_curve_hybrid.png'")
plt.show()

print("\n[INFO] Ujian Akhir pada Data Test Hybrid Murni...")
test_loss, test_acc = model.evaluate(test_data, verbose=1)

print("\n" + "="*50)
print(f"📊 FINAL HYBRID ACCURACY : {test_acc * 100:.2f}%")
print("="*50)

print("\n[INFO] Menghitung Confusion Matrix...")
y_true = []
y_pred = []

for images, labels in test_data:
    preds = model.predict(images, verbose=0)
    y_true.extend(labels.numpy().flatten())
    y_pred.extend((preds > 0.5).astype(int).flatten())

print("\n--- DETAILED CLASSIFICATION REPORT (HYBRID) ---")
print(classification_report(y_true, y_pred, target_names=['Awake', 'Sleepy']))