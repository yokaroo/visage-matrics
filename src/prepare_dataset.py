import os
import random
import shutil
import tensorflow as tf
from tensorflow.keras.preprocessing.image import load_img, img_to_array, save_img

random.seed(42)

# 1. KONFIGURASI
RAW_BASE = "Data Raw/Raw" 
OUTPUT_BASE = "Dataset"
CLASSES = ["Awake", "Sleepy"]

# Tetap sesuai permintaanmu: 70:20:10
splits = {"Train": 0.7, "Val": 0.2, "Test": 0.1}

if os.path.exists(OUTPUT_BASE):
    shutil.rmtree(OUTPUT_BASE)

for split in splits:
    for cls in CLASSES:
        os.makedirs(os.path.join(OUTPUT_BASE, split, cls), exist_ok=True)

def apply_augment(img, dst_dir, file_name, factor):
    """Fungsi untuk membuat variasi gambar berdasarkan faktor jumlah"""
    # 1. Selalu simpan yang asli
    save_img(os.path.join(dst_dir, f"orig_{file_name}"), img)
    
    if factor > 1:
        # Flip Horizontal
        save_img(os.path.join(dst_dir, f"flip_{file_name}"), tf.image.flip_left_right(img))
    if factor > 2:
        # Brightness Variasi
        save_img(os.path.join(dst_dir, f"br1_{file_name}"), tf.image.adjust_brightness(img, 0.2))
        save_img(os.path.join(dst_dir, f"br2_{file_name}"), tf.image.adjust_brightness(img, -0.2))
    if factor > 4:
        # Contrast & Zoom Dasar
        save_img(os.path.join(dst_dir, f"ct1_{file_name}"), tf.image.adjust_contrast(img, 1.5))
        zoom = tf.image.central_crop(img, central_fraction=0.8)
        save_img(os.path.join(dst_dir, f"zm1_{file_name}"), zoom)
    
    # Kalau faktornya besar (buat Train), kita tambah variasi lebih gila
    if factor > 10:
        for i in range(5):
            # Random Brightness & Saturation tambahan
            res = tf.image.random_brightness(img, max_delta=0.3)
            save_img(os.path.join(dst_dir, f"aug_rand_{i}_{file_name}"), res)
        for i in range(5):
            # Berbagai level zoom
            z = tf.image.central_crop(img, central_fraction=random.uniform(0.7, 0.9))
            save_img(os.path.join(dst_dir, f"aug_zoom_{i}_{file_name}"), z)

for cls in CLASSES:
    src_dir = os.path.join(RAW_BASE, cls)
    image_files = [f for f in os.listdir(src_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    random.shuffle(image_files)

    total = len(image_files)
    train_end = int(total * splits["Train"])
    val_end = train_end + int(total * splits["Val"])

    train_files = image_files[:train_end]
    val_files = image_files[train_end:val_end]
    test_files = image_files[val_end:]

    # PROSES PEMBAGIAN DAN PENAMBAHAN DATA
    # Train: Faktor 15x (Target 1000+)
    # Val: Faktor 5x (Biar agak banyak)
    # Test: Faktor 5x (Biar angkanya mantap)
    
    print(f"[INFO] Memproses Kelas {cls}...")
    
    for f in train_files:
        img = img_to_array(load_img(os.path.join(src_dir, f)))
        apply_augment(img, os.path.join(OUTPUT_BASE, 'Train', cls), f, factor=15)
        
    for f in val_files:
        img = img_to_array(load_img(os.path.join(src_dir, f)))
        apply_augment(img, os.path.join(OUTPUT_BASE, 'Val', cls), f, factor=5)
        
    for f in test_files:
        img = img_to_array(load_img(os.path.join(src_dir, f)))
        apply_augment(img, os.path.join(OUTPUT_BASE, 'Test', cls), f, factor=5)

# ==========================================
# PRINT LAPORAN AKHIR
# ==========================================
print("\n" + "="*45)
print("📊 LAPORAN DATASET (70:20:10 + AUGMENTED)")
print("="*45)
total_final = 0
for split in ["Train", "Val", "Test"]:
    s_count = 0
    print(f"📂 FOLDER {split.upper()}:")
    for cls in CLASSES:
        c = len(os.listdir(os.path.join(OUTPUT_BASE, split, cls)))
        print(f"   - {cls:<8}: {c} foto")
        s_count += c
    print(f"   👉 TOTAL {split}: {s_count}")
    print("-" * 45)
    total_final += s_count
print(f"✅ GRAND TOTAL DATASET: {total_final} FOTO")
print("="*45)