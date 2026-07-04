import * as ImagePicker from 'expo-image-picker';

export type PickResult = { ok: boolean; dataUri?: string; error?: string };

// Qualité réduite pour garder les images légères (~200-400 Ko en base64),
// vu qu'elles sont stockées directement dans AsyncStorage (voir lib/store.tsx
// -> MAX_IMAGE_B64_LENGTH pour la limite stricte côté « backend »).
const QUALITY = 0.5;

function toDataUri(asset: ImagePicker.ImagePickerAsset): PickResult {
  if (!asset.base64) return { ok: false, error: "Impossible de lire l'image." };
  const mime = asset.mimeType && asset.mimeType.startsWith('image/') ? asset.mimeType : 'image/jpeg';
  return { ok: true, dataUri: `data:${mime};base64,${asset.base64}` };
}

export async function pickFromLibrary(): Promise<PickResult> {
  try {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      return { ok: false, error: "Accès à la galerie refusé. Autorisez-le dans les réglages de l'appareil." };
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: QUALITY,
      base64: true,
    });
    if (result.canceled || !result.assets?.[0]) return { ok: false };
    return toDataUri(result.assets[0]);
  } catch {
    return { ok: false, error: 'Erreur lors de la sélection de la photo.' };
  }
}

export async function pickFromCamera(): Promise<PickResult> {
  try {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== 'granted') {
      return { ok: false, error: "Accès à l'appareil photo refusé. Autorisez-le dans les réglages de l'appareil." };
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: QUALITY,
      base64: true,
    });
    if (result.canceled || !result.assets?.[0]) return { ok: false };
    return toDataUri(result.assets[0]);
  } catch {
    return { ok: false, error: "Erreur lors de la prise de photo." };
  }
}
