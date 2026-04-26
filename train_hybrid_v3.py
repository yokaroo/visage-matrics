import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.models import load_model
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau
import matplotlib.pyplot as plt

print("[INFO] Memulai Operasi Fine-Tuning V3 (Anti-Mata-Sayu)...")

# ==========================================
# 1. DATA AUGMENTATION (VAKSIN ANTI-OVERFIT)
# ==========================================
# Ini yang akan bikin AI kamu cerdas dan gak gampang ketipu
train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=15,           # Putar mata maksimal 15 derajat (kepala miring)
    brightness_range=[0.7, 1.3], # Variasi cahaya (PENTING untuk mata sayu)
    zoom_range=0.1,              # Zoom in/out 10%
    horizontal_flip=True,        # Balik kanan-kiri
    fill_mode='nearest'
)

# Data Ujian (Validasi) TIDAK BOLEH di-augmentasi, murni saja!
val_datagen = ImageDataGenerator(rescale=1./255)

# Tentukan folder dataset kamu (Pastikan path-nya benar!)
TRAIN_DIR = 'Dataset_Hybrid/Train' 
VAL_DIR = 'Dataset_Hybrid/Val'

print("[INFO] Menyiapkan Pipa Data...")
train_generator = train_datagen.flow_from_directory(
    TRAIN_DIR, target_size=(84, 84), batch_size=32, class_mode='binary'
)

val_generator = val_datagen.flow_from_directory(
    VAL_DIR, target_size=(84, 84), batch_size=32, class_mode='binary', shuffle=False
)

# ==========================================
# 2. LOAD MODEL & BEDAH OTAK
# ==========================================
print("\n[INFO] Memuat Model Baseline Juara...")
model = load_model('saved_models/visage_hybrid_baseline.keras')

# Cari base_model (MobileNetV2) secara dinamis
base_model = None
for layer in model.layers:
    # Kita cari layer yang bertipe 'Model' (punya anak/sub-layer di dalamnya)
    if hasattr(layer, 'layers'): 
        base_model = layer
        break

if base_model is None:
    raise ValueError("[ERROR] MobileNetV2 tidak ditemukan di dalam struktur model!")

# Buka gemboknya!
base_model.trainable = True

# Kita buka mulai layer 120 (Sisa ~34 layer untuk belajar anatomi mata)
fine_tune_at = 120
for layer in base_model.layers[:fine_tune_at]:
    layer.trainable = False

print(f"[INFO] Gembok dibuka mulai dari layer ke-{fine_tune_at}!")

# ==========================================
# 3. COMPILE & TRAINING SANGAT HALUS
# ==========================================
# Learning rate SANGAT KECIL agar otak lamanya tidak rusak
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5), 
    loss='binary_crossentropy',
    metrics=['accuracy']
)

# Callbacks (Sistem Keamanan)
checkpoint = ModelCheckpoint('saved_models/visage_V3_AntiSayu.keras', monitor='val_loss', save_best_only=True, verbose=1)
early_stop = EarlyStopping(monitor='val_loss', patience=7, restore_best_weights=True, verbose=1)
reduce_lr = ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3, min_lr=1e-7, verbose=1)

print("\n[INFO] MEMULAI TRAINING V3... Bismillah!")
history = model.fit(
    train_generator,
    epochs=30,
    validation_data=val_generator,
    callbacks=[checkpoint, early_stop, reduce_lr]
)

# ==========================================
# 4. GAMBAR HASILNYA
# ==========================================
plt.figure(figsize=(12, 5))
plt.subplot(1, 2, 1)
plt.plot(history.history['loss'], label='Train Loss', color='blue')
plt.plot(history.history['val_loss'], label='Val Loss', color='orange')
plt.title('V3: Loss Curve (Harusnya Lebih Mepet)')
plt.legend()

plt.subplot(1, 2, 2)
plt.plot(history.history['accuracy'], label='Train Acc', color='blue')
plt.plot(history.history['val_accuracy'], label='Val Acc', color='orange')
plt.title('V3: Accuracy Curve')
plt.legend()

plt.savefig('v3_performance.png')
print("[INFO] Selesai! Grafik disimpan sebagai 'v3_performance.png'")
print("[INFO] Model baru disimpan sebagai 'visage_V3_AntiSayu.keras'")