import os
import shutil
import random

random.seed(42)

# 1. KONFIGURASI PATH
PATH_WISNU = "Dataset"              # Dataset Wisnu yang sudah jadi (Baseline)
PATH_KAGGLE = "Data Sekunder"  # Folder Kaggle Murni
OUTPUT_BASE = "Dataset_Hybrid"
CLASSES = ["Awake", "Sleepy"]

# Kuota data Kaggle agar seimbang dengan Wisnu
KAGGLE_TRAIN_LIMIT = 600  # 600 Awake + 600 Sleepy = 1200 (Seimbang dengan 1184 Wisnu)
KAGGLE_VAL_LIMIT = 150    # Untuk validasi
KAGGLE_TEST_LIMIT = 300   # Untuk ujian akhir

if os.path.exists(OUTPUT_BASE):
    shutil.rmtree(OUTPUT_BASE)
    print(f"[INFO] Membersihkan arena Hybrid...")

for split in ["Train", "Val", "Test"]:
    for cls in CLASSES:
        os.makedirs(os.path.join(OUTPUT_BASE, split, cls), exist_ok=True)

# 2. MASUKKAN DATA WISNU (Tuan Rumah)
print("\n[STEP 1] Memasukkan Data Tuan Rumah (Wisnu)...")
for split in ["Train", "Val", "Test"]:
    for cls in CLASSES:
        src = os.path.join(PATH_WISNU, split, cls)
        dst = os.path.join(OUTPUT_BASE, split, cls)
        if os.path.exists(src):
            files = os.listdir(src)
            for f in files:
                shutil.copy(os.path.join(src, f), os.path.join(dst, f"wisnu_{f}"))

# 3. MASUKKAN DATA KAGGLE (Tamu Undangan Terpilih)
print("\n[STEP 2] Memilih Tamu Undangan (Kaggle) secara acak...")
for cls in CLASSES:
    src = os.path.join(PATH_KAGGLE, cls)
    if os.path.exists(src):
        files = os.listdir(src)
        random.shuffle(files) # Acak biar wajahnya bervariasi
        
        # Bagi kuota Kaggle
        train_files = files[:KAGGLE_TRAIN_LIMIT]
        val_files = files[KAGGLE_TRAIN_LIMIT : KAGGLE_TRAIN_LIMIT + KAGGLE_VAL_LIMIT]
        test_files = files[KAGGLE_TRAIN_LIMIT + KAGGLE_VAL_LIMIT : KAGGLE_TRAIN_LIMIT + KAGGLE_VAL_LIMIT + KAGGLE_TEST_LIMIT]
        
        # Copy ke Train
        for f in train_files:
            shutil.copy(os.path.join(src, f), os.path.join(OUTPUT_BASE, "Train", cls, f"kaggle_{f}"))
        # Copy ke Val
        for f in val_files:
            shutil.copy(os.path.join(src, f), os.path.join(OUTPUT_BASE, "Val", cls, f"kaggle_{f}"))
        # Copy ke Test
        for f in test_files:
            shutil.copy(os.path.join(src, f), os.path.join(OUTPUT_BASE, "Test", cls, f"kaggle_{f}"))

# 4. LAPORAN HYBRID
print("\n" + "="*45)
print("📊 ARENA HYBRID: WISNU & KAGGLE (50:50)")
print("="*45)
for split in ["Train", "Val", "Test"]:
    print(f"📂 FOLDER {split.upper()}:")
    for cls in CLASSES:
        c = len(os.listdir(os.path.join(OUTPUT_BASE, split, cls)))
        print(f"   - {cls:<8}: {c} foto")
print("="*45)
print("[INFO] Dataset Hybrid Siap Digunakan!")