import os
import matplotlib.pyplot as plt
from sklearn.metrics import classification_report, confusion_matrix
import numpy as np

from src.data_loader import load_data
from src.model_builder import build_visage_model
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau

os.makedirs('saved_models', exist_ok=True)

print("\n[INFO] Memuat Dataset Primer (Train, Val, Test Wisnu)...")
# PERUBAHAN 1: Batch size dikembalikan ke 32 (The Sweet Spot!)
train_data, val_data, test_data = load_data(base_dir='Dataset', batch_size=32, img_size=(84, 84))

print("\n[INFO] Merakit Model Baseline (Anti-Overfit)...")
model = build_visage_model(input_shape=(84, 84, 3))

# PERUBAHAN 2: Patience dikembalikan ke setelan stabil (3 dan 10)
reduce_lr = ReduceLROnPlateau(monitor='val_loss', factor=0.2, patience=3, min_lr=1e-6, verbose=1)
early_stop = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True, verbose=1)

# PERUBAHAN 3: Nama Save Model disesuaikan
checkpoint = ModelCheckpoint(
    'saved_models/visage_baseline_bs32.keras', 
    monitor='val_loss', 
    save_best_only=True, 
    verbose=1
)

print("\n[INFO] Mulai Training Baseline (BS=32)... Gaspol!")
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
plt.title("Training vs Validation Loss (BS=32)")
plt.xlabel("Epoch")
plt.ylabel("Loss")
plt.legend()
plt.grid(True)

plt.subplot(1, 2, 2)
plt.plot(epochs_range, acc, label="Train Accuracy", marker='o')
plt.plot(epochs_range, val_acc, label="Validation Accuracy", marker='o')
plt.title("Training vs Validation Accuracy (BS=32)")
plt.xlabel("Epoch")
plt.ylabel("Accuracy")
plt.legend()
plt.grid(True)

plt.tight_layout()
# PERUBAHAN 4: Nama file grafik disesuaikan
plt.savefig("loss_curve_baseline_bs32.png")
print("[INFO] Grafik performa disimpan sebagai 'loss_curve_baseline_bs32.png'")
plt.show()

print("\n[INFO] Ujian Akhir pada Data Test Murni (Wisnu)...")
test_loss, test_acc = model.evaluate(test_data, verbose=1)

print("\n" + "="*50)
print(f"📊 FINAL BASELINE ACCURACY (BS=32) : {test_acc * 100:.2f}%")
print("="*50)

print("\n[INFO] Menghitung Confusion Matrix...")
y_true = []
y_pred = []

for images, labels in test_data:
    preds = model.predict(images, verbose=0)
    y_true.extend(labels.numpy().flatten())
    y_pred.extend((preds > 0.5).astype(int).flatten())

print("\n--- DETAILED CLASSIFICATION REPORT ---")
print(classification_report(y_true, y_pred, target_names=['Awake', 'Sleepy']))