import tensorflow as tf
import os

def load_data(base_dir="Dataset", batch_size=32, img_size=(84, 84)):
    """
    Pipa penyalur data untuk skema 70:20:10.
    Mengambil data dari folder Train, Val, dan Test.
    """
    
    print("\n[INFO] Menghubungkan Pipa ke Folder Dataset...")

    # 1. PIPA TRAIN (70%) - Wajib di-shuffle biar AI gak hafal urutan
    train_ds = tf.keras.utils.image_dataset_from_directory(
        os.path.join(base_dir, 'Train'),
        shuffle=True,
        batch_size=batch_size,
        image_size=img_size,
        label_mode='binary'
    )

    # 2. PIPA VALIDATION (20%) - Buat monitoring saat training
    val_ds = tf.keras.utils.image_dataset_from_directory(
        os.path.join(base_dir, 'Val'),
        shuffle=False,
        batch_size=batch_size,
        image_size=img_size,
        label_mode='binary'
    )

    # 3. PIPA TEST (10%) - Buat ujian akhir (Baseline Result)
    test_ds = tf.keras.utils.image_dataset_from_directory(
        os.path.join(base_dir, 'Test'),
        shuffle=False,
        batch_size=batch_size,
        image_size=img_size,
        label_mode='binary'
    )

    # Optimasi Memori (Prefetching) biar CPU gak nungguin Disk
    AUTOTUNE = tf.data.AUTOTUNE
    train_ds = train_ds.cache().prefetch(buffer_size=AUTOTUNE)
    val_ds = val_ds.cache().prefetch(buffer_size=AUTOTUNE)
    test_ds = test_ds.cache().prefetch(buffer_size=AUTOTUNE)

    return train_ds, val_ds, test_ds

# Test internal kalau file ini dijalankan langsung
if __name__ == "__main__":
    t, v, ts = load_data()
    print(f"\n[SUKSES] Semua pipa terhubung!")
    print(f"Jumlah batch di Train: {len(t)}")
    print(f"Jumlah batch di Val: {len(v)}") 