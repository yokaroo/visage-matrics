import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout, Input, Rescaling, Resizing, BatchNormalization
from tensorflow.keras.regularizers import l2
from tensorflow.keras.models import Model

def build_visage_model(input_shape=(84, 84, 3)):
    """
    Arsitektur Baseline V2
    :
    Dilengkapi dengan L2 Regularization, Batch Normalization, dan High Dropout.
    """
    inputs = Input(shape=input_shape)
    
    # 1. STANDARISASI
    x = Resizing(96, 96)(inputs)
    x = Rescaling(scale=1./127.5, offset=-1)(x)
    
    # 2. BADAN MOBILENETV2 (TETAP FROZEN UNTUK BASELINE)
    base_model = MobileNetV2(
        input_shape=(96, 96, 3),
        include_top=False, 
        weights='imagenet'
    )
    base_model.trainable = False
        
    x = base_model(x)

    # 3. KEPALA KLASIFIKASI (DENGAN RINTANGAN BERAT)
    x = GlobalAveragePooling2D()(x)
    
    # Tambahan 1: Batch Normalization agar stabil
    x = BatchNormalization()(x)
    
    # Tambahan 2: L2 Regularizer (Pajak Hafalan)
    x = Dense(128, activation='relu', kernel_regularizer=l2(0.01))(x)
    
    # Tambahan 3: Dropout dinaikkan ke 60%
    x = Dropout(0.6)(x) 
    
    predictions = Dense(1, activation='sigmoid')(x)

    model = Model(inputs=inputs, outputs=predictions)

    # Gunakan Learning Rate yang agak lambat untuk Baseline yang berat ini
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.0005), 
        loss='binary_crossentropy', 
        metrics=['accuracy']
    )
    
    return model

if __name__ == "__main__":
    model = build_visage_model()
    model.summary()