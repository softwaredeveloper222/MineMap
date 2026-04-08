import ImageLogo from '@/assets/images/ImageLogo.svg';
import { useThemeColor } from '@/hooks/useThemeColor';
import * as ImagePicker from 'expo-image-picker';
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View, type ViewProps } from 'react-native';
import { Dialog, IconButton, Portal, Button as PortalButton } from "react-native-paper";

export type ImageSelectorProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  disabled?: boolean;
  label?: string;
  image?: string;
  customComponent?: boolean;
  onChangeImage?: (url: string[]) => void;
  onChangeLatestImage?: (url: string) => void;
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const IMAGE_SIZE = (SCREEN_WIDTH - 60) / 6; // 6 columns with margin

export const ImageSelector = forwardRef(({
  style,
  lightColor,
  darkColor,
  onChangeImage,
  onChangeLatestImage,
  image,
  customComponent,
  ...otherProps
}: ImageSelectorProps, ref) => {

  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [latestSelectedImage, setLatestSelectedImage] = useState<string>();
  const [visible, setVisible] = useState(false);

  useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  // Expose resetImages to parent via ref
  useImperativeHandle(ref, () => ({
    resetImages: () => {
      setSelectedImages([]);
      onChangeImage?.([]);
    }
  }));

  const removeImage = (uri: string) => {
    const updated = selectedImages.filter(img => img !== uri);
    setSelectedImages(updated);
    onChangeImage?.(updated);
  };

  const pickImage = async (fromType: string) => {
    setVisible(false);

    if (fromType === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera permissions!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        const newImages = [...selectedImages, ...result.assets.map(a => a.uri)];
        const newImage = result.assets[0].uri;
        setSelectedImages(newImages);
        setLatestSelectedImage(newImage);
        onChangeImage?.(newImages);
        onChangeLatestImage?.(newImage);
      }

    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need media library permissions!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        allowsMultipleSelection: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImages = [...selectedImages, ...result.assets.map(a => a.uri)];
        const newImage = result.assets[0].uri;
        setLatestSelectedImage(newImage);
        setSelectedImages(newImages);
        onChangeImage?.(newImages);
        onChangeLatestImage?.(newImage);
      }
    }
  };

  return (
    <View>
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.button, style]}
        onPress={() => setVisible(true)}
        {...otherProps}
      >
        {customComponent === false && <View style={{ flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%' }}>
          {(!selectedImages || selectedImages.length === 0) && (
            <View style={{ width: '100%', height: '100%', padding: 30, justifyContent: 'center', alignItems: 'center' }}>
              <ImageLogo width={70} height={70} style={{ margin: 10 }} />
              <Text style={{ color: '#1AC7A1', borderBottomWidth: 1, borderBottomColor: '#1AC7A1', marginBottom: 7 }}>
                Click to upload
              </Text>
              <Text>Maximum file size 50MB</Text>
            </View>
          )}

          {selectedImages && selectedImages.length > 0 && (
            <FlatList
              data={selectedImages}
              keyExtractor={(item, idx) => item + idx}
              renderItem={({ item }) => (
                <View style={styles.imageWrapper}>
                  <Image source={{ uri: item }} style={styles.selectedImage} />
                  <IconButton
                    icon="close"
                    size={16}
                    style={styles.removeButton}
                    onPress={() => removeImage(item)}
                  />
                </View>
              )}
              numColumns={6}
              contentContainerStyle={styles.gridContainer}
            />
          )}
        </View>}
      </TouchableOpacity>

      <Portal>
        <Dialog visible={visible} onDismiss={() => setVisible(false)}>
          <Dialog.Title>Select Image</Dialog.Title>
          <Dialog.Content>
            <PortalButton mode="outlined" onPress={() => pickImage('camera')} style={styles.dialogButton}>
              📷 Camera
            </PortalButton>
            <PortalButton mode="outlined" onPress={() => pickImage('gallery')} style={styles.dialogButton}>
              🖼️ Gallery
            </PortalButton>
          </Dialog.Content>
          <Dialog.Actions>
            <PortalButton onPress={() => setVisible(false)}>Cancel</PortalButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
});

const styles = StyleSheet.create({
  button: {
    width: '100%',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    maxHeight: 170
  },
  dialogButton: { marginVertical: 5 },
  gridContainer: { justifyContent: 'flex-start' },
  selectedImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
  },
  imageWrapper: { position: 'relative', margin: 5 }
});
