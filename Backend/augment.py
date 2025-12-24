import cv2
import albumentations as A
import os

# -----------------------------
# Configuration
# -----------------------------
PEOPLE = ["person1","person2","person3","person4","person5","person6","person7","person8"]
IMG_NUMBER = 2                   # Only img1 of each person
OUTPUT_DIR = "augmented_dataset_single"
AUG_PER_IMAGE = 3                 # Number of augmented images per person

os.makedirs(OUTPUT_DIR, exist_ok=True)

# -----------------------------
# Albumentations augmentation pipeline (safe for face recognition)
# -----------------------------
transform = A.Compose([
    A.HorizontalFlip(p=0.5),
    A.Affine(translate_percent=0.05, scale=(0.9,1.1), rotate=(-15,15), p=0.7),
    A.RandomBrightnessContrast(brightness_limit=0.2, contrast_limit=0.2, p=0.5),
    A.HueSaturationValue(hue_shift_limit=15, sat_shift_limit=20, val_shift_limit=15, p=0.3)
])

# -----------------------------
# Loop through each person
# -----------------------------
for person in PEOPLE:
    img_path = f"dataset/{person}_img{IMG_NUMBER}.jpeg"
    img = cv2.imread(img_path)
    
    if img is None:
        print(f"⚠️ Image not found: {img_path}, skipping...")
        continue
    
    # Convert to RGB for Albumentations
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    base_name = f"{person}_img{IMG_NUMBER}"
    
    
    # Generate augmented images
    for i in range(AUG_PER_IMAGE):
        augmented = transform(image=img_rgb)["image"]
        aug_name = f"{base_name}_aug{i+1}.jpg"
        cv2.imwrite(os.path.join(OUTPUT_DIR, aug_name), cv2.cvtColor(augmented, cv2.COLOR_RGB2BGR))
    
    print(f"✅ Generated {AUG_PER_IMAGE} augmentations for {img_path}")

print("✅ All augmentations completed!")
